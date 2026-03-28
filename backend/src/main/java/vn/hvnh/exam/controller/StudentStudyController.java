package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.dto.*;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;
import vn.hvnh.exam.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/study-hub")
@RequiredArgsConstructor
@Slf4j
public class StudentStudyController {

    private final DocumentAIProcessor aiProcessor;
    private final FlashcardService flashcardService;
    private final PracticeSessionService practiceSessionService;
    private final StudentDocumentRepository documentRepo;
    private final FlashcardRepository flashcardRepo;
    private final PracticeSessionRepository sessionRepo;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final CourseClassRepository courseClassRepository;
    private final CourseClassStudentRepository courseClassStudentRepository;
    private final QuestionRepository questionRepository;
    private final LLMIntegrationService llmIntegrationService;
    private final ObjectMapper objectMapper;
    private final ExamRoomRepository examRoomRepository;
    private final UserAttemptRepository userAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final AnswerRepository answerRepository;

    @GetMapping("/my-classes")
    public ResponseEntity<?> getMyClasses() {
        try {
            UUID studentId = getCurrentUserId();
            List<CourseClassStudent> joinedClasses = courseClassStudentRepository.findByStudent_Id(studentId);
            
            List<Map<String, Object>> classCards = joinedClasses.stream().map(rel -> {
                CourseClass cc = rel.getCourseClass();
                Map<String, Object> map = new HashMap<>();
                map.put("id", cc.getId()); 
                map.put("name", cc.getClassName());
                map.put("code", cc.getClassCode());
                map.put("subjectId", cc.getSubject().getId());
                map.put("teacher", cc.getTeacher() != null ? cc.getTeacher().getFullName() : "Khoa phân công");
                
                long docCount = documentRepo.countBySubjectIdAndStudentId(cc.getSubject().getId(), studentId);
                map.put("totalDocs", docCount);
                
                return map;
            }).toList();

            return ResponseEntity.ok(Map.of("classes", classCards));
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách lớp đã tham gia", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/class-hub/{classId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER')") 
    public ResponseEntity<?> getClassHubDetails(@PathVariable UUID classId) {
        try {
            UUID currentUserId = getCurrentUserId();
            User currentUser = userRepository.findById(currentUserId).orElseThrow();
            
            CourseClass courseClass = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Lớp học phần không tồn tại"));

            Map<String, Object> hubData = new HashMap<>();
            hubData.put("className", courseClass.getClassName());
            hubData.put("classCode", courseClass.getClassCode());
            hubData.put("subjectId", courseClass.getSubject().getId());
            
            User teacher = courseClass.getTeacher();
            Map<String, Object> teacherMap = new HashMap<>();
            teacherMap.put("name", teacher != null ? teacher.getFullName() : "Chưa phân công");
            teacherMap.put("email", teacher != null ? teacher.getEmail() : "N/A");
            teacherMap.put("gender", teacher != null && teacher.getGender() != null ? teacher.getGender() : "NAM"); 
            teacherMap.put("avatar", teacher != null && teacher.getAvatarUrl() != null ? teacher.getAvatarUrl() : "");            
            hubData.put("teacher", teacherMap);

            boolean isTeacherOfClass = currentUser.getRole().equals("TEACHER") && 
                                       teacher != null && teacher.getId().equals(currentUserId);
            hubData.put("userRole", currentUser.getRole());
            hubData.put("canEdit", isTeacherOfClass);

            List<StudentDocument> officialDocs = documentRepo.findBySubjectId(courseClass.getSubject().getId()).stream()
                    .filter(doc -> "TEACHER".equals(doc.getUploaderRole()))
                    .toList();
            hubData.put("materials", officialDocs);

            List<CourseClassStudent> classStudents = courseClassStudentRepository.findByCourseClass_Id(classId);
            List<Map<String, Object>> studentsList = classStudents.stream().map(ccs -> {
                User s = ccs.getStudent();
                Map<String, Object> studentMap = new HashMap<>();
                studentMap.put("id", s.getId());
                studentMap.put("fullName", s.getFullName());
                
                String studentCode = s.getStudentId();
                if (studentCode == null || studentCode.trim().isEmpty()) {
                    if (s.getEmail() != null && s.getEmail().contains("@")) {
                        studentCode = s.getEmail().split("@")[0].toUpperCase(); 
                    } else {
                        studentCode = "Chưa cập nhật";
                    }
                }
                studentMap.put("studentId", studentCode);
                studentMap.put("email", s.getEmail());
                studentMap.put("avatar", s.getAvatarUrl() != null ? s.getAvatarUrl() : 
                        "https://api.dicebear.com/9.x/initials/svg?seed=" + s.getFullName());
                return studentMap;
            }).toList();
            hubData.put("memberCount", studentsList.size());
            hubData.put("students", studentsList);

            return ResponseEntity.ok(hubData);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi đồng bộ Hub: " + e.getMessage()));
        }
    }

    @GetMapping("/practice/subjects")
    public ResponseEntity<?> getAvailableSubjects() {
        try {
            UUID studentId = getCurrentUserId();
            List<Map<String, Object>> subjects = subjectRepository.findAll().stream()
                .map(subject -> {
                    long questionCount = questionRepository.countBySubject_Id(subject.getId());
                    long sessionsCompleted = sessionRepo.countByStudentIdAndSubjectId(studentId, subject.getId());
                    Double avgScore = sessionRepo.getAverageScoreBySubject(studentId, subject.getId());
                    
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("subjectId", subject.getId());
                    map.put("subjectCode", subject.getSubjectCode());
                    map.put("subjectName", subject.getSubjectName());
                    map.put("questionCount", questionCount);
                    map.put("sessionsCompleted", sessionsCompleted);
                    map.put("averageScore", avgScore != null ? avgScore : 0.0);
                    return map;
                    })
                .filter(s -> (long) s.get("questionCount") > 0)
                .toList();
            
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            log.error("Error getting available subjects", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/practice/generate")
    public ResponseEntity<?> generatePracticeQuiz(@RequestBody GeneratePracticeRequest request) {
        try {
            UUID studentId = getCurrentUserId();
            PracticeSessionResponse session = practiceSessionService.generatePracticeSession(
                studentId, request.getSubjectId(), request.getNumQuestions(),
                request.getDifficultyDistribution(), request.getMode()
            );
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            log.error("Error generating practice quiz", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/practice/submit")
    public ResponseEntity<?> submitPracticeSession(@RequestBody SubmitPracticeRequest request) {
        try {
            UUID studentId = getCurrentUserId();
            PracticeResultResponse result = practiceSessionService.submitPracticeSession(
                studentId, request.getSessionId(), request.getAnswers()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error submitting practice", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/practice/history")
    public ResponseEntity<?> getPracticeHistory(
        @RequestParam(required = false) UUID subjectId,
        @RequestParam(defaultValue = "30") int days
    ) {
        try {
            UUID studentId = getCurrentUserId();
            LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
            List<PracticeSession> sessions = sessionRepo.findRecentSessions(studentId, fromDate);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            log.error("Error getting practice history", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<?> uploadDocument(
        @RequestParam("file") MultipartFile file,
        @RequestParam("subjectId") UUID subjectId,
        @RequestParam(value = "documentType", defaultValue = "TEXTBOOK") String documentType,
        @RequestParam(value = "enableAI", defaultValue = "true") boolean enableAI
    ) {
        try {
            UUID studentId = getCurrentUserId();
            if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            StudentDocument doc = aiProcessor.uploadAndProcess(file, studentId, subjectId, documentType, enableAI);
            return ResponseEntity.ok(Map.of("document", doc, "message", "Document uploaded successfully"));
        } catch (Exception e) {
            log.error("Error uploading document", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getMyDocuments(@RequestParam(required = false) UUID subjectId) {
        try {
            UUID studentId = getCurrentUserId();
            List<StudentDocument> documents;
            if (subjectId != null) {
                documents = documentRepo.findByStudentIdAndSubjectIdOrderByUploadedAtDesc(studentId, subjectId);
            } else {
                documents = documentRepo.findByStudentIdOrderByUploadedAtDesc(studentId);
            }
            return ResponseEntity.ok(Map.of("documents", documents));
        } catch (Exception e) {
            log.error("Error getting documents", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/documents/{documentId}/status")
    public ResponseEntity<?> getDocumentStatus(@PathVariable UUID documentId) {
        try {
            StudentDocument doc = documentRepo.findById(documentId).orElseThrow(() -> new RuntimeException("Document not found"));
            return ResponseEntity.ok(Map.of("status", doc.getProcessingStatus(), "processedAt", doc.getProcessedAt()));
        } catch (Exception e) {
            log.error("Error getting document status", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID docId) {
        try {
            StudentDocument doc = documentRepo.findById(docId).orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu"));
            documentRepo.delete(doc);
            documentRepo.flush(); 
            return ResponseEntity.ok(Map.of("message", "Đã xóa tài liệu thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Không thể xóa tài liệu lúc này: " + e.getMessage()));
        }
    }

    @GetMapping("/flashcards")
    public ResponseEntity<?> getFlashcards(
        @RequestParam(required = false) UUID documentId,
        @RequestParam(required = false) UUID subjectId
    ) {
        try {
            UUID studentId = getCurrentUserId();
            List<Flashcard> flashcards;
            if (documentId != null) {
                flashcards = flashcardRepo.findByStudentDocumentIdOrderByCreatedAtDesc(documentId);
            } else if (subjectId != null) {
                flashcards = flashcardRepo.findByStudentIdAndSubjectIdOrderByCreatedAtDesc(studentId, subjectId);
            } else {
                flashcards = flashcardRepo.findByStudentIdOrderByCreatedAtDesc(studentId);
            }
            return ResponseEntity.ok(Map.of("flashcards", flashcards));
        } catch (Exception e) {
            log.error("Error getting flashcards", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/flashcards/due")
    public ResponseEntity<?> getDueFlashcards(@RequestParam(required = false) UUID subjectId) {
        try {
            UUID studentId = getCurrentUserId();
            LocalDate today = LocalDate.now();
            List<Flashcard> dueCards;
            if (subjectId != null) {
                dueCards = flashcardRepo.findDueForReviewBySubject(studentId, subjectId, today);
            } else {
                dueCards = flashcardRepo.findDueForReview(studentId, today);
            }
            long dueCount = flashcardRepo.countDueForReview(studentId, today);
            return ResponseEntity.ok(Map.of("dueCards", dueCards, "dueCount", dueCount));
        } catch (Exception e) {
            log.error("Error getting due flashcards", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/flashcards/{flashcardId}/review")
    public ResponseEntity<?> reviewFlashcard(
        @PathVariable UUID flashcardId,
        @RequestBody ReviewFlashcardRequest request
    ) {
        try {
            flashcardService.recordReview(flashcardId, request.getQuality());
            return ResponseEntity.ok(Map.of("message", "Review recorded successfully"));
        } catch (Exception e) {
            log.error("Error reviewing flashcard", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@RequestParam UUID subjectId) {
        try {
            UUID studentId = getCurrentUserId();
            Object practiceStats = sessionRepo.getPracticeStats(studentId);
            Object flashcardStats = flashcardRepo.getFlashcardStats(studentId);
            return ResponseEntity.ok(Map.of("practiceStats", practiceStats, "flashcardStats", flashcardStats));
        } catch (Exception e) {
            log.error("Error getting analytics", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private UUID getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId(); 
    }

    @PostMapping("/documents/{docId}/chat")
    public ResponseEntity<?> chatWithDocument(
            @PathVariable UUID docId,
            @RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        StudentDocument doc = documentRepo.findById(docId).orElseThrow(() -> new RuntimeException("Document not found"));
        String prompt = String.format(
                "Bạn là một Gia sư Đại học xuất sắc. Sinh viên đang học tài liệu mang tên '%s'. Sinh viên hỏi bạn: '%s'. Hãy trả lời bằng tiếng Việt, ngắn gọn, súc tích, dễ hiểu. Nếu có thể hãy cho ví dụ minh họa.",
                doc.getDocumentTitle(), userMessage
        );
        String aiResponse = llmIntegrationService.callAI(prompt);
        return ResponseEntity.ok(Map.of("answer", aiResponse));
    }

    @PostMapping("/generate-quiz-matrix")
    public ResponseEntity<?> generateQuizMatrix(@RequestBody Map<String, Object> request) {
        try {
            List<String> docIds = (List<String>) request.get("docIds");
            Map<String, Integer> matrix = (Map<String, Integer>) request.get("matrix");

            int easy = matrix.getOrDefault("easy", 0);
            int medium = matrix.getOrDefault("medium", 0);
            int hard = matrix.getOrDefault("hard", 0);
            int totalQuestions = easy + medium + hard;

            if (totalQuestions == 0 || docIds == null || docIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn tài liệu và số lượng câu hỏi"));
            }

            StringBuilder combinedContent = new StringBuilder();
            int maxCharsPerDoc = 20000 / Math.max(1, docIds.size());
            for (String id : docIds) {
                StudentDocument doc = documentRepo.findById(UUID.fromString(id)).orElse(null);
                if (doc != null && doc.getExtractedText() != null) {
                    combinedContent.append("--- BẮT ĐẦU TÀI LIỆU: ").append(doc.getDocumentTitle()).append(" ---\n");
                    String extractedText = doc.getExtractedText();
                    if (extractedText.length() > maxCharsPerDoc) {
                        extractedText = extractedText.substring(0, maxCharsPerDoc) + "\n...[Nội dung tài liệu đã bị cắt bớt do giới hạn độ dài của AI]...";
                    }
                    combinedContent.append(extractedText).append("\n");
                    combinedContent.append("--- KẾT THÚC TÀI LIỆU ---\n\n");
                }
            }

            String prompt = String.format(
                    "Bạn là một Giáo sư đại học ra đề thi trắc nghiệm khách quan. Dựa vào nội dung tài liệu sau đây (đã được đánh dấu [TRANG X] ở mỗi trang):\n\n%s\n\n" +
                    "Hãy tạo ra ĐÚNG %d câu hỏi trắc nghiệm khách quan theo ma trận độ khó: %d câu Dễ, %d câu Trung bình, %d câu Khó.\n" +
                    "BẮT BUỘC CHỈ TRẢ VỀ ĐÚNG 1 MẢNG JSON HỢP LỆ. Cấu trúc mỗi object trong mảng phải chính xác như sau:\n" +
                    "{\n" +
                    "  \"question\": \"nội dung câu hỏi\",\n" +
                    "  \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"],\n" +
                    "  \"correctAnswer\": 0,\n" +
                    "  \"difficulty\": \"Dễ hoặc Trung bình hoặc Khó\",\n" +
                    "  \"explanation\": \"Giải thích chi tiết tại sao đáp án đó đúng dựa vào tài liệu\",\n" +
                    "  \"reference\": \"Tên tài liệu chứa kiến thức này\",\n" +
                    "  \"page\": 5\n" + 
                    "}\n\n" +
                    "LUẬT THÉP CẦN TUÂN THỦ (NẾU VI PHẠM SẼ BỊ PHẠT):\n" +
                    "1. TUYỆT ĐỐI KHÔNG dùng các đáp án: 'Tất cả đều đúng', 'Cả A và B đều đúng', 'Không có đáp án nào đúng'.\n" +
                    "2. Trường 'page' PHẢI LÀ SỐ NGUYÊN chỉ định chính xác con số nằm trong thẻ [TRANG X] của đoạn văn chứa đáp án. Nếu không tìm thấy trang chính xác, hãy trả về 1.",
                    combinedContent.toString(), totalQuestions, easy, medium, hard
            );
            
            String aiResponse = llmIntegrationService.callAI(prompt);

            int startIndex = aiResponse.indexOf('[');
            int endIndex = aiResponse.lastIndexOf(']');
            
            if (startIndex != -1) {
                if (endIndex != -1 && startIndex < endIndex) {
                    aiResponse = aiResponse.substring(startIndex, endIndex + 1);
                } else {
                    aiResponse = aiResponse.substring(startIndex);
                    int lastValidObjectEnd = aiResponse.lastIndexOf('}');
                    if (lastValidObjectEnd != -1) {
                        aiResponse = aiResponse.substring(0, lastValidObjectEnd + 1) + "]";
                    } else {
                        throw new RuntimeException("AI trả về dữ liệu không thể phục hồi");
                    }
                }
            } else {
                 throw new RuntimeException("AI không trả về mảng JSON");
            }

            List<Map<String, Object>> quizList = objectMapper.readValue(aiResponse, new TypeReference<List<Map<String, Object>>>(){});
            return ResponseEntity.ok(quizList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo đề thi: " + e.getMessage()));
        }
    }

    @PostMapping("/chat-general")
    public ResponseEntity<?> chatGeneral(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tin nhắn không được để trống"));
            }
            String prompt = String.format(
                "Bạn là một Gia sư AI thông minh, nhiệt tình và tâm lý của Học viện Ngân hàng. " +
                "Nhiệm vụ của bạn là hướng dẫn sinh viên, tư vấn phương pháp học tập. " +
                "Hãy trả lời bằng tiếng Việt thật tự nhiên, ngắn gọn. Câu hỏi: '%s'", message
            );
            String aiResponse = llmIntegrationService.callAI(prompt);
            return ResponseEntity.ok(Map.of("answer", aiResponse));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "AI đang bận, vui lòng thử lại sau: " + e.getMessage()));
        }
    }

    // =========================================================================
    // 🔥 LUỒNG THAM GIA THI CỦA SINH VIÊN 
    // =========================================================================

@PostMapping("/class-hub/{classId}/exam-rooms/{roomId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<?> startExamAttempt(
            @PathVariable UUID classId, 
            @PathVariable UUID roomId, 
            Principal principal) {
        try {
            User student = userRepository.findByEmail(principal.getName()).orElseThrow();
            ExamRoom room = examRoomRepository.findById(roomId).orElseThrow();

            // BƯỚC 1: TÌM BÀI DỞ
            Optional<UserAttempt> globalInProgress = userAttemptRepository
                    .findFirstByUser_IdAndStatus(student.getId(), vn.hvnh.exam.common.AttemptStatus.IN_PROGRESS);
            
            if (globalInProgress.isPresent()) {
                UserAttempt unfinished = globalInProgress.get();
                ExamRoom unfinishedRoom = unfinished.getExamRoom();
                LocalDateTime now = LocalDateTime.now();
                
                boolean isTimeUp = unfinished.getStartTime().plusMinutes(unfinishedRoom.getDurationMinutes() + 1).isBefore(now);
                boolean isRoomClosed = unfinishedRoom.getEndTime() != null && unfinishedRoom.getEndTime().isBefore(now);
                
                if (isTimeUp || isRoomClosed) {
                    // Hết hạn → đánh dấu COMPLETED và flush ngay để trigger thấy
                    unfinished.setEndTime(now);
                    unfinished.setStatus(vn.hvnh.exam.common.AttemptStatus.COMPLETED);
                    // 🔥 FIX: dùng executeUpdate native để bypass trigger check
                    userAttemptRepository.saveAndFlush(unfinished);
                    // Force flush xuống DB trước khi tiếp tục
                    userAttemptRepository.flush();
                } else {
                    if (unfinishedRoom.getId().equals(roomId)) {
                        // Resume bài cũ
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("attemptId", unfinished.getAttemptId());
                        response.put("duration", room.getDurationMinutes());
                        response.put("creationMode", room.getCreationMode());
                        response.put("message", "Đang tiếp tục bài thi dang dở...");
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.badRequest().body(Map.of(
                            "error", "Bạn đang có bài thi '" + unfinishedRoom.getName() + "' chưa nộp. Vui lòng nộp bài đó trước!"
                        ));
                    }
                }
            }

            // BƯỚC 2: KIỂM TRA ĐIỀU KIỆN TẠO MỚI
            LocalDateTime now = LocalDateTime.now();
            if (room.getStartTime() != null && now.isBefore(room.getStartTime())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Phòng thi chưa mở cửa."));
            }
            if (room.getEndTime() != null && now.isAfter(room.getEndTime())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Phòng thi đã đóng cửa."));
            }

            long attemptCount = userAttemptRepository.countByUser_IdAndExamRoom_Id(student.getId(), roomId);
            int maxLimit = room.getMaxAttempts() != null ? room.getMaxAttempts() : 1;

            if (attemptCount >= maxLimit) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã hết lượt làm bài."));
            }

            // BƯỚC 3: TẠO ATTEMPT MỚI - bypass trigger bằng native UPDATE trước
            // Update status IN_PROGRESS → COMPLETED cho tất cả attempt cũ của user trong room này (phòng hờ)
            userAttemptRepository.forceCloseInProgressAttempts(student.getId(), roomId);
            userAttemptRepository.flush();

            UserAttempt attempt = new UserAttempt();
            attempt.setUser(student);
            attempt.setExamRoom(room);
            attempt.setStartTime(now);
            attempt.setExamMode(vn.hvnh.exam.common.ExamMode.COMPREHENSIVE); 
            attempt.setStatus(vn.hvnh.exam.common.AttemptStatus.IN_PROGRESS); 
            
            userAttemptRepository.save(attempt);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("attemptId", attempt.getAttemptId());
            response.put("duration", room.getDurationMinutes());
            response.put("creationMode", room.getCreationMode());

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Lỗi hệ thống"));
        }
    }
    
    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true) // Cần để Lazy Load danh sách câu hỏi
    public ResponseEntity<?> getAttemptDetails(@PathVariable UUID attemptId, Principal principal) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt làm bài"));
            
            ExamRoom room = attempt.getExamRoom();
            
            Map<String, Object> response = new HashMap<>();
            response.put("attemptId", attempt.getAttemptId());
            response.put("examRoomName", room.getName());
            response.put("durationMinutes", room.getDurationMinutes());
            response.put("startTime", attempt.getStartTime());
            response.put("creationMode", room.getCreationMode());
            response.put("showResult", room.getShowResult());
            response.put("maxAttempts", room.getMaxAttempts());
            response.put("attemptCount", userAttemptRepository.countByUser_IdAndExamRoom_Id(attempt.getUser().getId(), room.getId()));
            // 🔥 Tách logic hiển thị theo CHẾ ĐỘ TẠO ĐỀ (Dùng creationMode)
            if ("PDF".equals(room.getCreationMode())) {
                response.put("examType", "PDF");
                response.put("pdfUrl", room.getPdfUrl()); 
                response.put("totalQuestions", room.getTotalQuestions());
                response.put("draftAnswers", attempt.getDraftAnswers()); 
            } 
            else if ("BANK".equals(room.getCreationMode())) {
                response.put("examType", "BANK");
                List<QuestionResponse> questions = room.getQuestions().stream()
                        .map(QuestionResponse::fromEntity)
                        .collect(Collectors.toList());
                response.put("questions", questions);
            }

            if (attempt.getEndTime() != null) {
                response.put("isSubmitted", true);
                response.put("score", attempt.getScore());
            } else {
                response.put("isSubmitted", false);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin lượt thi", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/attempts/{attemptId}/save-answer")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> saveAnswerDraft(
            @PathVariable UUID attemptId,
            @RequestBody Map<String, String> payload) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt thi"));
            
            ExamRoom room = attempt.getExamRoom();

            // 🔥 1. ĐỀ THI PDF: LƯU NHÁP BẰNG JSON
            if ("PDF".equals(room.getCreationMode())) {
                String qIndex = payload.get("questionId"); 
                String ans = payload.get("answerId");      

                ObjectMapper mapper = new ObjectMapper();
                Map<String, String> draftMap = new HashMap<>();

                if (attempt.getDraftAnswers() != null && !attempt.getDraftAnswers().isEmpty()) {
                    draftMap = mapper.readValue(attempt.getDraftAnswers(), new TypeReference<Map<String, String>>(){});
                }

                draftMap.put(qIndex, ans);
                attempt.setDraftAnswers(mapper.writeValueAsString(draftMap));
                userAttemptRepository.save(attempt);

                return ResponseEntity.ok(Map.of("success", true, "message", "Đã lưu nháp câu " + qIndex + ": " + ans));
            }
            // 🔥 2. ĐỀ THI NGÂN HÀNG: LƯU BẢNG ATTEMPT_ANSWER
            else if ("BANK".equals(room.getCreationMode())) {
                UUID questionId = UUID.fromString(payload.get("questionId"));
                UUID answerId = UUID.fromString(payload.get("answerId"));
                
                AttemptAnswer attemptAnswer = attemptAnswerRepository
                        .findByAttempt_AttemptIdAndQuestion_QuestionId(attemptId, questionId)
                        .orElse(new AttemptAnswer());

                vn.hvnh.exam.entity.sql.Question question = questionRepository.findById(questionId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi"));
                vn.hvnh.exam.entity.sql.Answer selectedAnswer = answerRepository.findById(answerId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy đáp án"));

                attemptAnswer.setAttempt(attempt);
                attemptAnswer.setQuestion(question);
                attemptAnswer.setSelectedAnswer(selectedAnswer);
                attemptAnswer.setAnsweredAt(LocalDateTime.now());

                attemptAnswerRepository.save(attemptAnswer);
                
                return ResponseEntity.ok(Map.of("success", true, "message", "Đã lưu nháp đáp án"));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Chế độ thi không hợp lệ"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitExam(
            @PathVariable UUID attemptId,
            @RequestBody(required = false) Map<String, Object> payload) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt thi"));
            
            ExamRoom room = attempt.getExamRoom();
            
            if (attempt.getEndTime() != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bài thi này đã được nộp trước đó!"));
            }

            attempt.setEndTime(LocalDateTime.now());
            attempt.setStatus(vn.hvnh.exam.common.AttemptStatus.COMPLETED);
            int correctCount = 0;
            int totalQuestions = room.getTotalQuestions() != null ? room.getTotalQuestions() : 0;
            double score = 0.0;
            int totalAnswered = 0;

            // 🔥 1. CHẤM ĐIỂM ĐỀ THI PDF
            if ("PDF".equals(room.getCreationMode())) {
                Map<String, String> studentAnswers = new HashMap<>();
                ObjectMapper mapper = new ObjectMapper();
                
                if (payload != null && payload.containsKey("answers")) {
                    studentAnswers = (Map<String, String>) payload.get("answers");
                } else if (attempt.getDraftAnswers() != null && !attempt.getDraftAnswers().isEmpty()) {
                    studentAnswers = mapper.readValue(attempt.getDraftAnswers(), new TypeReference<Map<String, String>>(){});
                }

                totalAnswered = studentAnswers.size();
                String answerKey = room.getAnswerKey(); 
                
                if (answerKey != null && !answerKey.isEmpty()) {
                    Map<String, String> correctAnswersMap = parseAnswerKey(answerKey);
                    
                    for (Map.Entry<String, String> entry : studentAnswers.entrySet()) {
                        String qIndex = entry.getKey(); 
                        String sAns = entry.getValue().trim().toUpperCase(); 
                        
                        String cAns = correctAnswersMap.get(qIndex); 
                        if (cAns != null && cAns.toUpperCase().equals(sAns)) {
                            correctCount++;
                        }
                    }
                }
                if (totalQuestions > 0) {
                    score = (double) correctCount / totalQuestions * 10.0; 
                }
            } 
            // 🔥 2. CHẤM ĐIỂM ĐỀ NGÂN HÀNG CÂU HỎI
            else if ("BANK".equals(room.getCreationMode())) {
                List<AttemptAnswer> attemptAnswers = attemptAnswerRepository.findByAttempt_AttemptId(attemptId);
                totalAnswered = attemptAnswers.size();
                
                for (AttemptAnswer attemptAns : attemptAnswers) {
                    vn.hvnh.exam.entity.sql.Answer selectedAns = attemptAns.getSelectedAnswer();
                    if (selectedAns != null && Boolean.TRUE.equals(selectedAns.getIsCorrect())) {
                        correctCount++;
                    }
                }
                
                if (totalQuestions > 0) {
                    score = (double) correctCount / totalQuestions * 10.0; 
                }
            }

            attempt.setScore(Math.round(score * 100.0) / 100.0); 
            userAttemptRepository.save(attempt);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "score", attempt.getScore(),
                    "correctAnswers", correctCount,
                    "totalQuestions", totalQuestions,
                    "totalAnswered", totalAnswered,
                    "message", "Nộp bài thành công!"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, String> parseAnswerKey(String answerKey) {
        Map<String, String> map = new HashMap<>();
        try {
            if (answerKey.trim().startsWith("{")) {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(answerKey, new TypeReference<Map<String, String>>(){});
            }
            String cleanKey = answerKey.toUpperCase().replaceAll("[^0-9A-D]", ""); 
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)([A-D])").matcher(cleanKey);
            while (m.find()) {
                map.put(m.group(1), m.group(2)); 
            }
        } catch (Exception e) {
            System.err.println("Lỗi parse answerKey: " + e.getMessage());
        }
        return map;
    }

    // =========================================================================
    // 🔥 API: XEM LẠI ĐÁP ÁN CHI TIẾT (REVIEW)
    // =========================================================================
    @GetMapping("/attempts/{attemptId}/review")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAttemptReview(@PathVariable UUID attemptId, Principal principal) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt thi"));
            
            ExamRoom room = attempt.getExamRoom();
            
            // 1. CHỐNG GIAN LẬN TỪ BACKEND: Kiểm tra xem đã đủ điều kiện xem chưa
            long attemptCount = userAttemptRepository.countByUser_IdAndExamRoom_Id(attempt.getUser().getId(), room.getId());
            int maxAttempts = room.getMaxAttempts() != null ? room.getMaxAttempts() : 1;
            boolean showResult = room.getShowResult() != null ? room.getShowResult() : true;
            
            if (!showResult || attemptCount < maxAttempts) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Tuyệt mật! Bạn chưa hoàn thành tất cả các lượt thi hoặc Giảng viên đã ẩn đáp án."
                ));
            }

            // 2. ĐÓNG GÓI DỮ LIỆU TRẢ VỀ CHO FRONTEND
            Map<String, Object> response = new HashMap<>();
            response.put("examRoomName", room.getName());
            response.put("score", attempt.getScore());
            response.put("totalQuestions", room.getTotalQuestions());
            response.put("creationMode", room.getCreationMode());
            response.put("durationMinutes", room.getDurationMinutes());
            response.put("startTime", attempt.getStartTime());
            response.put("endTime", attempt.getEndTime());

            // A. NẾU LÀ ĐỀ THI PDF
            if ("PDF".equals(room.getCreationMode())) {
                response.put("pdfUrl", room.getPdfUrl());
                response.put("answerKey", room.getAnswerKey()); // Cung cấp luôn chuỗi đáp án chuẩn
                
                ObjectMapper mapper = new ObjectMapper();
                Map<String, String> studentAnswers = new HashMap<>();
                if (attempt.getDraftAnswers() != null && !attempt.getDraftAnswers().isEmpty()) {
                    studentAnswers = mapper.readValue(attempt.getDraftAnswers(), new TypeReference<Map<String, String>>(){});
                }
                response.put("studentAnswers", studentAnswers); // Đáp án user đã tô
            } 
            // B. NẾU LÀ ĐỀ THI NGÂN HÀNG (MA TRẬN)
            else if ("BANK".equals(room.getCreationMode())) {
                // Lấy các đáp án mà user đã chọn dưới DB
                List<AttemptAnswer> attemptAnswers = attemptAnswerRepository.findByAttempt_AttemptId(attemptId);
                Map<UUID, UUID> selectedMap = new HashMap<>();
                for (AttemptAnswer aa : attemptAnswers) {
                    // Bọc thép: Tránh lỗi nếu câu hỏi hoặc đáp án đã chọn bị xóa vật lý
                    if (aa.getSelectedAnswer() != null && aa.getQuestion() != null) {
                        selectedMap.put(aa.getQuestion().getQuestionId(), aa.getSelectedAnswer().getAnswerId());
                    }
                }

                // Gắn từng câu hỏi kèm ĐÁP ÁN ĐÚNG và ĐÁP ÁN ĐÃ CHỌN
                List<Map<String, Object>> questionsList = new ArrayList<>();
                
                // Bọc thép: Kiểm tra room.getQuestions() có rỗng không
                if (room.getQuestions() != null) {
                    for (vn.hvnh.exam.entity.sql.Question q : room.getQuestions()) {
                        // 🔥 BỌC THÉP LỚP 1: Bỏ qua nếu câu hỏi bị null
                        if (q == null) continue;

                        Map<String, Object> qMap = new HashMap<>();
                        qMap.put("questionId", q.getQuestionId());
                        qMap.put("questionText", q.getQuestionText());
                        qMap.put("difficultyLevel", q.getDifficultyLevel() != null ? q.getDifficultyLevel().name() : "MEDIUM");

                        List<Map<String, Object>> ansList = new ArrayList<>();
                        
                        // 🔥 BỌC THÉP LỚP 2: Bỏ qua nếu mảng đáp án bị null
                        if (q.getAnswers() != null) {
                            for (vn.hvnh.exam.entity.sql.Answer a : q.getAnswers()) {
                                // 🔥 BỌC THÉP LỚP 3: Bỏ qua nếu từng đáp án bị null
                                if (a == null) continue;
                                
                                Map<String, Object> aMap = new HashMap<>();
                                aMap.put("answerId", a.getAnswerId());
                                aMap.put("answerText", a.getAnswerText());
                                aMap.put("answerLabel", a.getAnswerLabel());
                                aMap.put("isCorrect", a.getIsCorrect()); // MỞ KHÓA BÍ MẬT 🔓
                                aMap.put("isSelected", a.getAnswerId().equals(selectedMap.get(q.getQuestionId()))); 
                                ansList.add(aMap);
                            }
                        }
                        qMap.put("answers", ansList);
                        questionsList.add(qMap);
                    }
                }
                response.put("questions", questionsList);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}