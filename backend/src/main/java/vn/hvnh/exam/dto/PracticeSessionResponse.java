package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.Question;
import vn.hvnh.exam.entity.sql.Subject;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PracticeSessionResponse {
    private UUID sessionId;
    private List<Question> questions;
    private Integer totalQuestions;
    private Subject subject;
    private LocalDateTime startedAt;

    public PracticeSessionResponse() {}

    public PracticeSessionResponse(UUID sessionId, List<Question> questions, Integer totalQuestions, Subject subject, LocalDateTime startedAt) {
        this.sessionId = sessionId;
        this.questions = questions;
        this.totalQuestions = totalQuestions;
        this.subject = subject;
        this.startedAt = startedAt;
    }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID sessionId;
        private List<Question> questions;
        private Integer totalQuestions;
        private Subject subject;
        private LocalDateTime startedAt;

        public Builder sessionId(UUID sessionId) { this.sessionId = sessionId; return this; }
        public Builder questions(List<Question> questions) { this.questions = questions; return this; }
        public Builder totalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; return this; }
        public Builder subject(Subject subject) { this.subject = subject; return this; }
        public Builder startedAt(LocalDateTime startedAt) { this.startedAt = startedAt; return this; }

        public PracticeSessionResponse build() {
            return new PracticeSessionResponse(sessionId, questions, totalQuestions, subject, startedAt);
        }
    }
}
