package vn.hvnh.exam.service;

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

@Service
public class ExamService {

    private final UserAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final ChapterRepository chapterRepository;
    private final ExamMatrixHelper matrixHelper;
    private final CurrentUserService currentUserService;

    public ExamService(UserAttemptRepository attemptRepository, QuestionRepository questionRepository, SubjectRepository subjectRepository, UserRepository userRepository, ChapterRepository chapterRepository, ExamMatrixHelper matrixHelper, CurrentUserService currentUserService) {
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.chapterRepository = chapterRepository;
        this.matrixHelper = matrixHelper;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public Map<String, Object> startExam(ExamStartRequest request) {
        User user = currentUserService.getCurrentUser();
        if (user == null) throw new RuntimeException("Tài khoản chưa được xác thực!");
        Subject subject = subjectRepository.findById(request.getSubjectId()).orElseThrow(() -> new RuntimeException("Subject not found"));

        List<Question> examQuestions = new ArrayList<>();
        List<Chapter> targetChapters = new ArrayList<>();

        if (request.getMode() == ExamMode.BY_CHAPTER) {
            if (request.getChapterIds() == null || request.getChapterIds().isEmpty()) {
                throw new RuntimeException("Vui lòng chọn ít nhất 1 chương!");
            }
            targetChapters = chapterRepository.findAllById(request.getChapterIds());
        } else {
            targetChapters = chapterRepository.findBySubject_IdOrderByOrderIndexAsc(subject.getId());
        }

        double easyRate = request.getEasyPercent() / 100.0;
        double mediumRate = request.getMediumPercent() / 100.0;
        double hardRate = request.getHardPercent() / 100.0;

        Map<UUID, Map<DifficultyLevel, Integer>> matrix = matrixHelper.calculateMatrix(
                request.getTotalQuestions(), 
                targetChapters, 
                easyRate, mediumRate, hardRate
        );

        for (Chapter chapter : targetChapters) {
            Map<DifficultyLevel, Integer> dist = matrix.get(chapter.getChapterId());

            if (dist != null) {
                if (dist.get(DifficultyLevel.EASY) > 0) {
                    examQuestions.addAll(questionRepository.findByChapterAndDifficulty(
                            subject.getId(), chapter.getChapterId(), DifficultyLevel.EASY, dist.get(DifficultyLevel.EASY)));
                }
                
                if (dist.get(DifficultyLevel.MEDIUM) > 0) {
                    examQuestions.addAll(questionRepository.findByChapterAndDifficulty(
                            subject.getId(), chapter.getChapterId(), DifficultyLevel.MEDIUM, dist.get(DifficultyLevel.MEDIUM)));
                }
                
                if (dist.get(DifficultyLevel.HARD) > 0) {
                    examQuestions.addAll(questionRepository.findByChapterAndDifficulty(
                            subject.getId(), chapter.getChapterId(), DifficultyLevel.HARD, dist.get(DifficultyLevel.HARD)));
                }
            }
        }

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
        
        Collections.shuffle(examQuestions);

        UserAttempt attempt = UserAttempt.builder()
                .user(user)
                .subject(subject)
                .examMode(request.getMode())
                .status(AttemptStatus.IN_PROGRESS)
                .score(0.0)
                .startTime(java.time.LocalDateTime.now())
                .build();
        UserAttempt savedAttempt = attemptRepository.save(attempt);

        Map<String, Object> response = new HashMap<>();
        response.put("attemptId", savedAttempt.getAttemptId());
        response.put("questions", examQuestions);
        response.put("total", examQuestions.size());
        
        return response;
    }
}