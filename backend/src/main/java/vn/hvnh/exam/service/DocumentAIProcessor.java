package vn.hvnh.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAIProcessor {

    private final StudentDocumentRepository documentRepo;
    private final FlashcardRepository flashcardRepo;
    private final LLMIntegrationService llmService;
    private final ObjectMapper objectMapper;

    /**
     * Main entry point - upload and process document
     */
    @Transactional
    public StudentDocument uploadAndProcess(
        MultipartFile file,
        UUID studentId,
        UUID subjectId,
        String documentType,
        boolean enableAI
    ) {
        try {
            // Validate
            validateFile(file);
            
            // Create document record
            StudentDocument doc = createDocumentRecord(file, studentId, subjectId, documentType, enableAI);
            
            // Trigger async processing
            processAsync(file, doc);
            
            return doc;
            
        } catch (Exception e) {
            log.error("Error uploading document", e);
            throw new RuntimeException("Failed to upload document: " + e.getMessage());
        }
    }

    /**
     * Async processing
     */
    @Async
    public void processAsync(MultipartFile file, StudentDocument doc) {
        try {
            byte[] fileBytes = file.getBytes();
            
            // Extract text (ĐÃ NÂNG CẤP: Bóc tách có đánh dấu trang)
            String extractedText = extractTextFromBytes(fileBytes, doc.getFileType());
            log.info("📄 Extracted {} characters from {}", extractedText.length(), doc.getDocumentTitle());
            
            // LƯU TOÀN BỘ TEXT VÀO DATABASE ĐỂ SAU NÀY LÀM QUIZ
            doc.setExtractedText(extractedText);
            documentRepo.save(doc); // Lưu tạm text trước khi gọi AI cho an toàn

            if (extractedText.length() < 100) {
                throw new RuntimeException("Document too short");
            }
            
            // AI processing cho Flashcards
            if (doc.getIsAiEnabled()) {
                int flashcardsCreated = generateAndSaveFlashcards(extractedText, doc);
                log.info("✅ Created {} flashcards", flashcardsCreated);
            }
            
            // Mark completed
            doc.setProcessingStatus("COMPLETED");
            doc.setProcessedAt(LocalDateTime.now());
            documentRepo.save(doc);
            
        } catch (Exception e) {
            log.error("❌ Async processing failed", e);
            doc.setProcessingStatus("FAILED");
            documentRepo.save(doc);
        }
    }

    private StudentDocument createDocumentRecord(
        MultipartFile file,
        UUID studentId,
        UUID subjectId,
        String documentType,
        boolean enableAI
    ) {
        StudentDocument doc = new StudentDocument();
        doc.setStudentId(studentId);
        doc.setSubjectId(subjectId);
        doc.setDocumentTitle(file.getOriginalFilename());
        doc.setDocumentType(documentType);
        doc.setFileType(getFileExtension(file.getOriginalFilename()));
        doc.setFileSizeMb((double) file.getSize() / (1024.0 * 1024.0));
        doc.setProcessingStatus("PROCESSING");
        doc.setIsAiEnabled(enableAI);
        doc.setUploadedAt(LocalDateTime.now());
        
        return documentRepo.save(doc);
    }

    private String extractTextFromBytes(byte[] bytes, String fileType) throws IOException {
        if ("pdf".equalsIgnoreCase(fileType)) {
            return extractTextFromPDF(bytes);
        } else if ("txt".equalsIgnoreCase(fileType)) {
            return new String(bytes);
        } else {
            throw new RuntimeException("Unsupported file type: " + fileType);
        }
    }

    // 🔥 NÂNG CẤP CỐT LÕI: ĐỌC TỪNG TRANG VÀ ĐÁNH DẤU
    private String extractTextFromPDF(byte[] pdfBytes) throws IOException {
        StringBuilder extractedText = new StringBuilder();
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            int totalPages = document.getNumberOfPages();
            
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);
                
                // Chỉ lấy những trang có chữ (bỏ qua trang trống) để tiết kiệm token
                if (pageText != null && !pageText.trim().isEmpty()) {
                    extractedText.append("\n[TRANG ").append(i).append("]\n");
                    extractedText.append(pageText.trim()).append("\n");
                }
            }
        }
        return extractedText.toString();
    }

    private int generateAndSaveFlashcards(String documentText, StudentDocument doc) {
        try {
            // Chia text thành các chunk 8000 ký tự, mỗi chunk tạo ~7 flashcard
            // Tổng 30000 ký tự → ~3-4 chunk → ~20-28 flashcard chất lượng
            List<String> chunks = splitIntoChunks(documentText, 8000);
            log.info("📄 Split into {} chunks for flashcard generation", chunks.size());

            int totalSaved = 0;
            int chunkNum = 0;
            for (String chunk : chunks) {
                chunkNum++;
                log.info("📤 Processing chunk {}/{}...", chunkNum, chunks.size());
                String prompt = buildBloomFlashcardPrompt(chunk, chunkNum, chunks.size());
                String aiResponse = llmService.callAI(prompt);
                List<FlashcardDTO> flashcardDTOs = parseFlashcardsFromAI(aiResponse);

                for (FlashcardDTO dto : flashcardDTOs) {
                    try {
                        if (dto.getFront() == null || dto.getFront().isBlank()) continue;
                        if (dto.getBack() == null || dto.getBack().isBlank()) continue;

                        Flashcard card = new Flashcard();
                        card.setStudentId(doc.getStudentId());
                        card.setStudentDocumentId(doc.getStudentDocId());
                        card.setSubjectId(doc.getSubjectId());
                        card.setFrontText(dto.getFront());
                        card.setBackText(dto.getBack());
                        card.setSourceReference(dto.getSource());
                        card.setDifficulty(normalizeDifficulty(dto.getDifficulty()));
                        card.setBloomLevel(normalizeBloomLevel(dto.getBloomLevel()));
                        card.setProficiencyLevel("NEW");
                        card.setTimesReviewed(0);
                        card.setCreatedBy("AI");
                        card.setCreatedAt(LocalDateTime.now());
                        flashcardRepo.save(card);
                        totalSaved++;
                    } catch (Exception e) {
                        log.warn("Failed to save flashcard: {}", e.getMessage());
                    }
                }
            }

            log.info("✅ Total flashcards saved: {}", totalSaved);
            return totalSaved;

        } catch (Exception e) {
            log.error("Error generating flashcards", e);
            return 0;
        }
    }

    /**
     * Chia text thành các chunk, ưu tiên cắt tại ranh giới đoạn văn [TRANG X]
     */
    private List<String> splitIntoChunks(String text, int maxChars) {
        List<String> chunks = new ArrayList<>();
        if (text.length() <= maxChars) {
            chunks.add(text);
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + maxChars, text.length());

            // Tìm điểm cắt tốt nhất: tại [TRANG X] gần nhất trước end
            if (end < text.length()) {
                int pageMarker = text.lastIndexOf("\n[TRANG ", end);
                if (pageMarker > start + maxChars / 2) {
                    end = pageMarker; // Cắt ngay trước [TRANG X]
                } else {
                    // Fallback: cắt tại dòng mới gần nhất
                    int newLine = text.lastIndexOf('\n', end);
                    if (newLine > start) end = newLine;
                }
            }

            chunks.add(text.substring(start, end).trim());
            start = end;
        }
        return chunks;
    }

    /**
     * Prompt chuẩn Bloom Taxonomy — tạo flashcard theo 3 tầng nhận thức
     */
    private String buildBloomFlashcardPrompt(String chunk, int chunkNum, int totalChunks) {
        return String.format("""
            Bạn là giáo sư đại học xuất sắc, chuyên gia về phương pháp giảng dạy tích cực.
            Đây là phần %d/%d của tài liệu học (đã đánh dấu [TRANG X] ở mỗi trang).

            NHIỆM VỤ: Tạo 7 flashcard chất lượng cao theo Bloom Taxonomy:
            - 3 thẻ MỨC NHỚ (difficulty: EASY) — Định nghĩa, khái niệm, công thức cơ bản
            - 3 thẻ MỨC HIỂU/VẬN DỤNG (difficulty: MEDIUM) — So sánh, giải thích tại sao, ví dụ thực tế
            - 1 thẻ MỨC PHÂN TÍCH (difficulty: HARD) — Tình huống, đánh giá, suy luận nâng cao

            QUY TẮC BẮT BUỘC:
            1. front: Câu hỏi ngắn gọn, kích thích tư duy (KHÔNG phải câu hỏi Yes/No)
            2. back: Trả lời đầy đủ, có thể kèm ví dụ minh họa ngắn
            3. source: Ghi chính xác "Trang X" (số trang từ thẻ [TRANG X] gần nhất)
            4. difficulty: Phải là một trong: "EASY", "MEDIUM", "HARD"
            5. bloomLevel: Phải là một trong: "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE"
            6. KHÔNG tạo thẻ trùng lặp hoặc quá hiển nhiên

            CHỈ TRẢ VỀ JSON ARRAY, KHÔNG có text thừa:
            [
              {
                "front": "...",
                "back": "...",
                "source": "Trang X",
                "difficulty": "EASY",
                "bloomLevel": "REMEMBER"
              }
            ]

            TÀI LIỆU:
            %s
            """, chunkNum, totalChunks, chunk);
    }

    private String normalizeDifficulty(String raw) {
        if (raw == null) return "MEDIUM";
        return switch (raw.toUpperCase().trim()) {
            case "EASY", "DỄ", "DE" -> "EASY";
            case "HARD", "KHÓ", "KHO", "DIFFICULT" -> "HARD";
            default -> "MEDIUM";
        };
    }

    private String normalizeBloomLevel(String raw) {
        if (raw == null) return "REMEMBER";
        return switch (raw.toUpperCase().trim()) {
            case "UNDERSTAND", "THÔNG HIỂU" -> "UNDERSTAND";
            case "APPLY", "VẬN DỤNG" -> "APPLY";
            case "ANALYZE", "ANALYSE", "PHÂN TÍCH" -> "ANALYZE";
            case "EVALUATE", "ĐÁNH GIÁ" -> "EVALUATE";
            case "CREATE", "SÁNG TẠO" -> "CREATE";
            default -> "REMEMBER";
        };
    }

    // 🔥 Cập nhật lại luật chơi cho Flashcard để nó đọc cái cờ [TRANG X]
    private String buildFlashcardPrompt(String text) {
        return """
            Bạn là một giáo sư đại học. Tạo 20 flashcards từ tài liệu (đã được đánh dấu [TRANG X] ở mỗi trang).
            Lưu ý rằng: - Mỗi flashcard phải có 'front' (câu hỏi ngắn), 'back' (giải thích chi tiết), và 'source' (trích xuất chính xác số trang từ cờ [TRANG X]).
            Format JSON Array:
            [
              {
                "front": "Câu hỏi ngắn",
                "back": "Giải thích chi tiết",
                "source": "Trang X"
              }
            ]
            
            Luật: Trường 'source' phải trích xuất chính xác con số từ thẻ [TRANG X] của đoạn văn chứa kiến thức (VD: 'Trang 5').
            
            Tài liệu:
            """ + text;
    }

    private List<FlashcardDTO> parseFlashcardsFromAI(String jsonResponse) {
        try {
            String cleaned = cleanJSONResponse(jsonResponse);
            return objectMapper.readValue(cleaned, new TypeReference<List<FlashcardDTO>>() {});
        } catch (Exception e) {
            log.error("Failed to parse flashcards", e);
            return new ArrayList<>();
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new RuntimeException("File is empty");
        if (file.getSize() > 50 * 1024 * 1024) throw new RuntimeException("File too large");
        String fileType = getFileExtension(file.getOriginalFilename());
        List<String> allowed = Arrays.asList("pdf", "txt");
        if (!allowed.contains(fileType.toLowerCase())) {
            throw new RuntimeException("Unsupported file type: " + fileType);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "unknown";
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    private String cleanJSONResponse(String response) {
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
        else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length() - 3);
        // Extract JSON array if surrounded by other text
        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');
        if (start != -1 && end != -1 && start < end) {
            cleaned = cleaned.substring(start, end + 1);
        }
        return cleaned.trim();
    }

    public static class FlashcardDTO {
        private String front;
        private String back;
        private String source;
        private String difficulty;
        private String bloomLevel;

        public String getFront() { return front; }
        public void setFront(String front) { this.front = front; }
        public String getBack() { return back; }
        public void setBack(String back) { this.back = back; }
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getBloomLevel() { return bloomLevel; }
        public void setBloomLevel(String bloomLevel) { this.bloomLevel = bloomLevel; }
    }
}