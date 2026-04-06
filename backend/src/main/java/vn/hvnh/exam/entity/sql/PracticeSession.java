package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "practice_sessions")
public class PracticeSession {
    
    @Id
    @GeneratedValue
    @Column(name = "session_id")
    private UUID sessionId;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "subject_id")
    private UUID subjectId;
    
    @Column(name = "session_type", length = 50)
    private String sessionType; // RANDOM_QUIZ, CHAPTER_PRACTICE, AI_GENERATED, FLASHCARD
    
    @Column(name = "source_type", length = 50)
    private String sourceType; // SYSTEM_BANK, STUDENT_DOCUMENT
    
    @Column(name = "student_document_id")
    private UUID studentDocumentId;
    
    @Column(name = "total_questions")
    private Integer totalQuestions;
    
    @Column(name = "correct_answers")
    private Integer correctAnswers = 0;
    
    @Column(name = "score")
    private Double score = 0.0;
    
    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds = 0;
    
    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public PracticeSession() {}

    public PracticeSession(UUID sessionId, UUID studentId, UUID subjectId, String sessionType, String sourceType, UUID studentDocumentId, Integer totalQuestions, Integer correctAnswers, Double score, Integer timeSpentSeconds, LocalDateTime startedAt, LocalDateTime completedAt) {
        this.sessionId = sessionId;
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.sessionType = sessionType;
        this.sourceType = sourceType;
        this.studentDocumentId = studentDocumentId;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = (correctAnswers == null) ? 0 : correctAnswers;
        this.score = (score == null) ? 0.0 : score;
        this.timeSpentSeconds = (timeSpentSeconds == null) ? 0 : timeSpentSeconds;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
    }

    // Getters and Setters
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public UUID getStudentDocumentId() { return studentDocumentId; }
    public void setStudentDocumentId(UUID studentDocumentId) { this.studentDocumentId = studentDocumentId; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    // Manual Builder
    public static PracticeSessionBuilder builder() {
        return new PracticeSessionBuilder();
    }

    public static class PracticeSessionBuilder {
        private UUID sessionId;
        private UUID studentId;
        private UUID subjectId;
        private String sessionType;
        private String sourceType;
        private UUID studentDocumentId;
        private Integer totalQuestions;
        private Integer correctAnswers = 0;
        private Double score = 0.0;
        private Integer timeSpentSeconds = 0;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;

        public PracticeSessionBuilder sessionId(UUID id) { this.sessionId = id; return this; }
        public PracticeSessionBuilder studentId(UUID id) { this.studentId = id; return this; }
        public PracticeSessionBuilder subjectId(UUID id) { this.subjectId = id; return this; }
        public PracticeSessionBuilder sessionType(String type) { this.sessionType = type; return this; }
        public PracticeSessionBuilder sourceType(String type) { this.sourceType = type; return this; }
        public PracticeSessionBuilder studentDocumentId(UUID id) { this.studentDocumentId = id; return this; }
        public PracticeSessionBuilder totalQuestions(Integer total) { this.totalQuestions = total; return this; }
        public PracticeSessionBuilder correctAnswers(Integer correct) { this.correctAnswers = correct; return this; }
        public PracticeSessionBuilder score(Double score) { this.score = score; return this; }
        public PracticeSessionBuilder timeSpentSeconds(Integer seconds) { this.timeSpentSeconds = seconds; return this; }
        public PracticeSessionBuilder startedAt(LocalDateTime date) { this.startedAt = date; return this; }
        public PracticeSessionBuilder completedAt(LocalDateTime date) { this.completedAt = date; return this; }

        public PracticeSession build() {
            return new PracticeSession(sessionId, studentId, subjectId, sessionType, sourceType, studentDocumentId, totalQuestions, correctAnswers, score, timeSpentSeconds, startedAt, completedAt);
        }
    }
}