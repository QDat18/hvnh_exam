package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.hvnh.exam.dto.QuestionRequest;
import vn.hvnh.exam.dto.ExamMatrixRequest;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType;
import vn.hvnh.exam.common.BloomLevel;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;

    @Transactional
    public Question createQuestion(QuestionRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));

        Chapter chapter = null;
        if (request.getChapterId() != null) {
            chapter = chapterRepository.findById(request.getChapterId()).orElse(null);
        }

        Question question = Question.builder()
                .subject(subject)
                .chapter(chapter) 
                .questionText(request.getQuestionText())
                .difficultyLevel(request.getDifficultyLevel())
                .bloomLevel(request.getBloomLevel())
                .questionType(request.getQuestionType() != null ? request.getQuestionType() : QuestionType.MCQ_SINGLE)
                .explanation(request.getExplanation())
                .usageCount(0)
                .isActive(true)
                .isVerified(false) 
                .build();

        List<Answer> answerList = new ArrayList<>();
        char currentLabel = 'A';

        if (request.getAnswers() != null) {
            for (var ansDto : request.getAnswers()) {
                String label = (ansDto.getAnswerLabel() != null && !ansDto.getAnswerLabel().trim().isEmpty())
                        ? ansDto.getAnswerLabel() : String.valueOf(currentLabel);

                answerList.add(Answer.builder()
                        .answerText(ansDto.getAnswerText())
                        .isCorrect(ansDto.getIsCorrect())
                        .answerLabel(label)
                        .question(question)
                        .build());
                currentLabel++;
            }
        }
        question.setAnswers(answerList);
        return questionRepository.save(question);
    }

    public List<Question> getQuestionsByChapter(UUID chapterId) {
        return questionRepository.findByChapter_ChapterId(chapterId);
    }
    
    public List<Question> getQuestionsBySubject(UUID subjectId) {
        return questionRepository.findBySubject_Id(subjectId);
    }

    @Transactional(readOnly = true)
    public Page<Question> getQuestionsBySubjectPaginated(UUID subjectId, Pageable pageable) {
        return questionRepository.findBySubject_Id(subjectId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Question> getQuestionsBySubjectFiltered(
            UUID subjectId, String difficulty, String bloom, String type, String keyword, Pageable pageable) {
        return questionRepository.searchQuestions(subjectId, null, difficulty, keyword, pageable);
    }

    @Transactional
    public void deleteQuestion(UUID id) {
        questionRepository.deleteById(id);
    }

    @Transactional
    public Question updateQuestion(UUID id, QuestionRequest request) {
        Question existing = questionRepository.findById(id).orElseThrow();
        existing.setQuestionText(request.getQuestionText());
        existing.setDifficultyLevel(request.getDifficultyLevel());
        existing.setBloomLevel(request.getBloomLevel());
        existing.setQuestionType(request.getQuestionType());
        existing.setExplanation(request.getExplanation());

        if (request.getChapterId() != null) {
            existing.setChapter(chapterRepository.findById(request.getChapterId()).orElse(null));
        }

        existing.getAnswers().clear();
        char currentLabel = 'A';
        for (var ansDto : request.getAnswers()) {
            existing.getAnswers().add(Answer.builder()
                    .answerText(ansDto.getAnswerText())
                    .isCorrect(ansDto.getIsCorrect())
                    .answerLabel(String.valueOf(currentLabel++))
                    .question(existing)
                    .build());
        }
        return questionRepository.save(existing);
    }

    @Transactional
    public void importFromExcel(MultipartFile file, UUID subjectId, UUID chapterId) throws IOException {
        Subject subject = subjectRepository.findById(subjectId).orElseThrow();
        Chapter chapter = (chapterId != null) ? chapterRepository.findById(chapterId).orElse(null) : null;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || row.getCell(0) == null) continue;

                try {
                    Question question = Question.builder()
                            .subject(subject)
                            .chapter(chapter)
                            .questionText(getCellValue(row.getCell(0)))
                            .questionType(QuestionType.valueOf(getCellValue(row.getCell(1)).toUpperCase()))
                            .difficultyLevel(DifficultyLevel.valueOf(getCellValue(row.getCell(2)).toUpperCase()))
                            .bloomLevel(BloomLevel.valueOf(getCellValue(row.getCell(3)).toUpperCase()))
                            .explanation(getCellValue(row.getCell(4)))
                            .isActive(true).isVerified(false).usageCount(0)
                            .answers(new ArrayList<>())
                            .build();

                    String correctLabel = getCellValue(row.getCell(9)).toUpperCase();
                    char label = 'A';
                    for (int col = 5; col <= 8; col++) {
                        String ansText = getCellValue(row.getCell(col));
                        if (ansText.isEmpty()) continue;
                        question.getAnswers().add(Answer.builder()
                                .answerText(ansText).answerLabel(String.valueOf(label))
                                .isCorrect(String.valueOf(label).equals(correctLabel))
                                .question(question).build());
                        label++;
                    }
                    questionRepository.save(question);
                } catch (Exception ignored) {}
            }
        }
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }

    @Transactional(readOnly = true)
    public byte[] exportToExcel(UUID subjectId) throws IOException {
        List<Question> questions = getQuestionsBySubject(subjectId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("NganHangCauHoi");
            Row header = sheet.createRow(0);
            String[] columns = {"Nội dung", "Loại", "Độ khó", "Bloom", "Giải thích", "A", "B", "C", "D", "Đúng"};
            for (int i = 0; i < columns.length; i++) header.createCell(i).setCellValue(columns[i]);

            int rowIdx = 1;
            for (Question q : questions) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(q.getQuestionText());
                row.createCell(1).setCellValue(q.getQuestionType().name());
                row.createCell(2).setCellValue(q.getDifficultyLevel().name());
                row.createCell(3).setCellValue(q.getBloomLevel().name());
                row.createCell(4).setCellValue(q.getExplanation());
                for (int i = 0; i < q.getAnswers().size() && i < 4; i++) {
                    row.createCell(5 + i).setCellValue(q.getAnswers().get(i).getAnswerText());
                    if (Boolean.TRUE.equals(q.getAnswers().get(i).getIsCorrect())) row.createCell(9).setCellValue(q.getAnswers().get(i).getAnswerLabel());
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==============================================================================
    // 🔥 FIX LỖI BỐC ĐỀ: Sử dụng hàm findByChapterAndDifficulty từ Repository
    // ==============================================================================
    @Transactional(readOnly = true)
    public List<Question> generateExamFromMatrix(ExamMatrixRequest request) {
        List<Question> finalExam = new ArrayList<>();
        UUID subjectId = request.getSubjectId();

        if (subjectId == null) throw new RuntimeException("Thiếu SubjectId để bốc đề");

        for (var matrix : request.getMatrices()) {
            if (matrix.getEasyCount() == 0 && matrix.getMediumCount() == 0 && matrix.getHardCount() == 0) continue;

            // 1. Bốc câu Dễ
            if (matrix.getEasyCount() > 0) {
                List<Question> easy = questionRepository.findByChapterAndDifficulty(
                        subjectId, matrix.getChapterId(), DifficultyLevel.EASY, matrix.getEasyCount());
                if (easy.size() < matrix.getEasyCount()) 
                    throw new RuntimeException("Kho không đủ câu hỏi DỄ! (Yêu cầu: " + matrix.getEasyCount() + ", Có: " + easy.size() + ")");
                finalExam.addAll(easy);
            }

            // 2. Bốc câu Trung bình
            if (matrix.getMediumCount() > 0) {
                List<Question> medium = questionRepository.findByChapterAndDifficulty(
                        subjectId, matrix.getChapterId(), DifficultyLevel.MEDIUM, matrix.getMediumCount());
                if (medium.size() < matrix.getMediumCount()) 
                    throw new RuntimeException("Kho không đủ câu hỏi TRUNG BÌNH! (Yêu cầu: " + matrix.getMediumCount() + ", Có: " + medium.size() + ")");
                finalExam.addAll(medium);
            }

            // 3. Bốc câu Khó
            if (matrix.getHardCount() > 0) {
                List<Question> hard = questionRepository.findByChapterAndDifficulty(
                        subjectId, matrix.getChapterId(), DifficultyLevel.HARD, matrix.getHardCount());
                if (hard.size() < matrix.getHardCount()) 
                    throw new RuntimeException("Kho không đủ câu hỏi KHÓ! (Yêu cầu: " + matrix.getHardCount() + ", Có: " + hard.size() + ")");
                finalExam.addAll(hard);
            }
        }

        Collections.shuffle(finalExam);
        return finalExam;
    }
}