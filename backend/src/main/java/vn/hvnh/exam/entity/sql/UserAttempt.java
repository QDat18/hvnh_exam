package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import vn.hvnh.exam.common.AttemptStatus;
import vn.hvnh.exam.common.ExamMode;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_attempts")
public class UserAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "attempt_id")
    private UUID attemptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_room_id")
    private ExamRoom examRoom;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_mode", columnDefinition = "exam_mode")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ExamMode examMode;

    @Column(name = "score", columnDefinition="numeric")
    private Double score;

    @CreationTimestamp
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(columnDefinition = "TEXT")
    private String draftAnswers;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "attempt_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private AttemptStatus status;

    @Column(name = "user_answers", columnDefinition = "text")
    private String userAnswers;

    public UserAttempt() {}

    public UserAttempt(UUID attemptId, User user, Subject subject, ExamRoom examRoom, ExamMode examMode, Double score, LocalDateTime startTime, LocalDateTime endTime, String draftAnswers, AttemptStatus status, String userAnswers) {
        this.attemptId = attemptId;
        this.user = user;
        this.subject = subject;
        this.examRoom = examRoom;
        this.examMode = examMode;
        this.score = score;
        this.startTime = startTime;
        this.endTime = endTime;
        this.draftAnswers = draftAnswers;
        this.status = status;
        this.userAnswers = userAnswers;
    }

    // Manual getters and setters
    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public ExamRoom getExamRoom() { return examRoom; }
    public void setExamRoom(ExamRoom examRoom) { this.examRoom = examRoom; }

    public ExamMode getExamMode() { return examMode; }
    public void setExamMode(ExamMode examMode) { this.examMode = examMode; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getDraftAnswers() { return draftAnswers; }
    public void setDraftAnswers(String draftAnswers) { this.draftAnswers = draftAnswers; }

    public AttemptStatus getStatus() { return status; }
    public void setStatus(AttemptStatus status) { this.status = status; }

    public String getUserAnswers() { return userAnswers; }
    public void setUserAnswers(String userAnswers) { this.userAnswers = userAnswers; }

    // Manual Builder
    public static UserAttemptBuilder builder() {
        return new UserAttemptBuilder();
    }

    public static class UserAttemptBuilder {
        private UUID attemptId;
        private User user;
        private Subject subject;
        private ExamRoom examRoom;
        private ExamMode examMode;
        private Double score;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String draftAnswers;
        private AttemptStatus status;
        private String userAnswers;

        public UserAttemptBuilder attemptId(UUID attemptId) { this.attemptId = attemptId; return this; }
        public UserAttemptBuilder user(User user) { this.user = user; return this; }
        public UserAttemptBuilder subject(Subject subject) { this.subject = subject; return this; }
        public UserAttemptBuilder examRoom(ExamRoom examRoom) { this.examRoom = examRoom; return this; }
        public UserAttemptBuilder examMode(ExamMode examMode) { this.examMode = examMode; return this; }
        public UserAttemptBuilder score(Double score) { this.score = score; return this; }
        public UserAttemptBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public UserAttemptBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public UserAttemptBuilder draftAnswers(String draftAnswers) { this.draftAnswers = draftAnswers; return this; }
        public UserAttemptBuilder status(AttemptStatus status) { this.status = status; return this; }
        public UserAttemptBuilder userAnswers(String userAnswers) { this.userAnswers = userAnswers; return this; }

        public UserAttempt build() {
            return new UserAttempt(attemptId, user, subject, examRoom, examMode, score, startTime, endTime, draftAnswers, status, userAnswers);
        }
    }
}