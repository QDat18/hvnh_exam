package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.common.AttemptStatus;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.ExamMode;
import vn.hvnh.exam.dto.ExamStartRequest;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final UserAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final ChapterRepository chapterRepository;
    private final ExamMatrixHelper matrixHelper;

    @Transactional
    public Map<String, Object> startExam(ExamStartRequest request) {
        // 1. Lấy User & Subject
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Subject subject = subjectRepository.findById(request.getSubjectId()).orElseThrow(() -> new RuntimeException("Subject not found"));

        List<Question> examQuestions = new ArrayList<>();
        List<Chapter> targetChapters = new ArrayList<>();

        // 2. Xác định danh sách chương cần lấy câu hỏi
        if (request.getMode() == ExamMode.BY_CHAPTER) {
            if (request.getChapterIds() == null || request.getChapterIds().isEmpty()) {
                throw new RuntimeException("Vui lòng chọn ít nhất 1 chương!");
            }
            targetChapters = chapterRepository.findAllById(request.getChapterIds());
        } else {
            // COMPREHENSIVE: Lấy tất cả chương của môn học
            targetChapters = chapterRepository.findBySubject_IdOrderByOrderIndexAsc(subject.getId());
        }

        // 3. Tính toán Ma trận phân bổ
        double easyRate = request.getEasyPercent() / 100.0;
        double mediumRate = request.getMediumPercent() / 100.0;
        double hardRate = request.getHardPercent() / 100.0;

        Map<UUID, Map<DifficultyLevel, Integer>> matrix = matrixHelper.calculateMatrix(
                request.getTotalQuestions(), 
                targetChapters, 
                easyRate, mediumRate, hardRate
        );

        // 4. Truy vấn câu hỏi theo Ma trận (Đã fix truyền đủ 4 tham số)
        for (Chapter chapter : targetChapters) {
            Map<DifficultyLevel, Integer> dist = matrix.get(chapter.getChapterId());

            if (dist != null) {
                // 🔥 SỬA: Thêm subject.getId() vào đầu tất cả các hàm bốc đề
                
                // Lấy câu Dễ
                if (dist.get(DifficultyLevel.EASY) > 0) {
                    examQuestions.addAll(questionRepository.findByChapterAndDifficulty(
                            subject.getId(), chapter.getChapterId(), DifficultyLevel.EASY, dist.get(DifficultyLevel.EASY)));
                }
                
                // Lấy câu TB
                if (dist.get(DifficultyLevel.MEDIUM) > 0) {
                    examQuestions.addAll(questionRepository.findByChapterAndDifficulty(
                            subject.getId(), chapter.getChapterId(), DifficultyLevel.MEDIUM, dist.get(DifficultyLevel.MEDIUM)));
                }
                
                // Lấy câu Khó
                if (dist.get(DifficultyLevel.HARD) > 0) {
                    examQuestions.addAll(questionRepository.findByChapterAndDifficulty(
                            subject.getId(), chapter.getChapterId(), DifficultyLevel.HARD, dist.get(DifficultyLevel.HARD)));
                }
            }
        }

        // 5. Fallback: Nếu thiếu câu, lấy bù ngẫu nhiên trong môn học đó
        if (examQuestions.size() < request.getTotalQuestions()) {
            int missing = request.getTotalQuestions() - examQuestions.size();
            List<Question> backups = questionRepository.findRandomBySubject(subject.getId(), missing * 2);
            for (Question q : backups) {
                if (examQuestions.size() >= request.getTotalQuestions()) break;
                if (!examQuestions.contains(q)) {
                    examQuestions.add(q);
                }
            }
        }
        
        // Trộn lần cuối cho khách quan
        Collections.shuffle(examQuestions);

        // 6. Lưu Lượt thi
        UserAttempt attempt = UserAttempt.builder()
                .user(user)
                .subject(subject)
                .examMode(request.getMode())
                .status(AttemptStatus.IN_PROGRESS)
                .score(0.0)
                .startTime(java.time.LocalDateTime.now()) // Đảm bảo có thời gian bắt đầu
                .build();
        UserAttempt savedAttempt = attemptRepository.save(attempt);

        // 7. Trả về Response
        Map<String, Object> response = new HashMap<>();
        response.put("attemptId", savedAttempt.getAttemptId());
        response.put("questions", examQuestions);
        response.put("total", examQuestions.size());
        
        return response;
    }
}