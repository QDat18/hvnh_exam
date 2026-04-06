package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attempt_answers")
public class AttemptAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "attempt_answer_id")
    private UUID attemptAnswerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id")
    private UserAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_answer_id")
    private Answer selectedAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    public AttemptAnswer() {}

    public AttemptAnswer(UUID attemptAnswerId, UserAttempt attempt, Question question, Answer selectedAnswer, Boolean isCorrect, LocalDateTime answeredAt) {
        this.attemptAnswerId = attemptAnswerId;
        this.attempt = attempt;
        this.question = question;
        this.selectedAnswer = selectedAnswer;
        this.isCorrect = isCorrect;
        this.answeredAt = answeredAt;
    }

    // Manual getters and setters
    public UUID getAttemptAnswerId() { return attemptAnswerId; }
    public void setAttemptAnswerId(UUID attemptAnswerId) { this.attemptAnswerId = attemptAnswerId; }

    public UserAttempt getAttempt() { return attempt; }
    public void setAttempt(UserAttempt attempt) { this.attempt = attempt; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public Answer getSelectedAnswer() { return selectedAnswer; }
    public void setSelectedAnswer(Answer selectedAnswer) { this.selectedAnswer = selectedAnswer; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public LocalDateTime getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(LocalDateTime answeredAt) { this.answeredAt = answeredAt; }

    // Manual Builder
    public static AttemptAnswerBuilder builder() {
        return new AttemptAnswerBuilder();
    }

    public static class AttemptAnswerBuilder {
        private UUID attemptAnswerId;
        private UserAttempt attempt;
        private Question question;
        private Answer selectedAnswer;
        private Boolean isCorrect;
        private LocalDateTime answeredAt;

        public AttemptAnswerBuilder attemptAnswerId(UUID attemptAnswerId) { this.attemptAnswerId = attemptAnswerId; return this; }
        public AttemptAnswerBuilder attempt(UserAttempt attempt) { this.attempt = attempt; return this; }
        public AttemptAnswerBuilder question(Question question) { this.question = question; return this; }
        public AttemptAnswerBuilder selectedAnswer(Answer selectedAnswer) { this.selectedAnswer = selectedAnswer; return this; }
        public AttemptAnswerBuilder isCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; return this; }
        public AttemptAnswerBuilder answeredAt(LocalDateTime answeredAt) { this.answeredAt = answeredAt; return this; }

        public AttemptAnswer build() {
            return new AttemptAnswer(attemptAnswerId, attempt, question, selectedAnswer, isCorrect, answeredAt);
        }
    }
}