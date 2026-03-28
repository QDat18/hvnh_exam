package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.dto.*;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PracticeSessionService {

    private final PracticeSessionRepository sessionRepo;
    private final QuestionRepository questionRepo;
    private final SubjectRepository subjectRepo;

    @Transactional
    public PracticeSessionResponse generatePracticeSession(
        UUID studentId,
        UUID subjectId,
        int numQuestions,
        Map<String, Integer> difficultyDistribution,
        String mode
    ) {
        log.info("Generating practice session: student={}, subject={}, questions={}", 
            studentId, subjectId, numQuestions);

        Subject subject = subjectRepo.findById(subjectId)
            .orElseThrow(() -> new RuntimeException("Subject not found"));

        List<Question> questions;
        if ("RANDOM".equals(mode)) {
            questions = questionRepo.findRandomBySubject(subjectId, numQuestions);
        } else {
            questions = questionRepo.findRandomBySubject(subjectId, numQuestions);
        }

        if (questions.isEmpty()) {
            throw new RuntimeException("No questions available for this subject");
        }

        PracticeSession session = PracticeSession.builder()
            .studentId(studentId)
            .subjectId(subjectId)
            .sessionType("RANDOM_QUIZ")
            // FIX: Don't use .sourceType() in builder, set it manually after
            .totalQuestions(questions.size())
            .correctAnswers(0)
            .score(0.0)
            .timeSpentSeconds(0)
            .startedAt(LocalDateTime.now())
            .build();
        
        // Set sourceType manually
        session.setSourceType("SYSTEM_BANK");
        session = sessionRepo.save(session);

        return PracticeSessionResponse.builder()
            .sessionId(session.getSessionId())
            .questions(questions)
            .totalQuestions(questions.size())
            .subject(subject)
            .startedAt(session.getStartedAt())
            .build();
    }

    @Transactional
    public PracticeResultResponse submitPracticeSession(
        UUID studentId,
        UUID sessionId,
        Map<UUID, String> answers
    ) {
        log.info("Submitting practice session: {}", sessionId);

        PracticeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getStudentId().equals(studentId)) {
            throw new RuntimeException("Unauthorized access to session");
        }

        if (session.getCompletedAt() != null) {
            throw new RuntimeException("Session already completed");
        }

        int correctCount = 0;
        List<QuestionResult> results = new ArrayList<>();

        for (Map.Entry<UUID, String> entry : answers.entrySet()) {
            UUID questionId = entry.getKey();
            String selectedAnswer = entry.getValue();

            Question question = questionRepo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));

            // FIX: Get correct answer from question's answers
            String correctAnswer = getCorrectAnswerFromQuestion(question);
            boolean isCorrect = correctAnswer != null && correctAnswer.equals(selectedAnswer);
            
            if (isCorrect) {
                correctCount++;
            }

            results.add(QuestionResult.builder()
                .question(question)
                .selectedAnswer(selectedAnswer)
                .correctAnswer(correctAnswer)
                .isCorrect(isCorrect)
                .build());
        }

        double score = (double) correctCount / session.getTotalQuestions() * 10.0;
        long timeSpent = java.time.Duration.between(
            session.getStartedAt(), 
            LocalDateTime.now()
        ).getSeconds();

        session.setCorrectAnswers(correctCount);
        session.setScore(score);
        session.setTimeSpentSeconds((int) timeSpent);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepo.save(session);

        log.info("Session completed: score={}/10, correct={}/{}", 
            score, correctCount, session.getTotalQuestions());

        return PracticeResultResponse.builder()
            .sessionId(sessionId)
            .totalQuestions(session.getTotalQuestions())
            .correctAnswers(correctCount)
            .score(score)
            .timeSpentSeconds((int) timeSpent)
            .results(results)
            .completedAt(session.getCompletedAt())
            .build();
    }

    /**
     * Helper method to get correct answer from Question entity
     * NOTE: You need to add this logic based on your Question entity structure
     */
    private String getCorrectAnswerFromQuestion(Question question) {
        // OPTION 1: If Question has correctAnswer field
        // return question.getCorrectAnswer();
        
        // OPTION 2: If Question has Answer entities with isCorrect flag
        if (question.getAnswers() != null && !question.getAnswers().isEmpty()) {
            return question.getAnswers().stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                .findFirst()
                .map(answer -> answer.getAnswerLabel())
                .orElse(null);
        }
        
        return null;
    }

    public PracticeStatsResponse getStatistics(UUID studentId, UUID subjectId) {
        Object stats = sessionRepo.getPracticeStats(studentId);
        Double avgScore = sessionRepo.getAverageScoreBySubject(studentId, subjectId);
        Double bestScore = sessionRepo.getBestScoreBySubject(studentId, subjectId);
        
        return PracticeStatsResponse.builder()
            .overallStats(stats)
            .averageScore(avgScore != null ? avgScore : 0.0)
            .bestScore(bestScore != null ? bestScore : 0.0)
            .build();
    }
}