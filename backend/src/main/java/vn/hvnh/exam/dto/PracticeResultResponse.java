package vn.hvnh.exam.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PracticeResultResponse {
    private UUID sessionId;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double score;
    private Integer timeSpentSeconds;
    private List<QuestionResult> results;
    private LocalDateTime completedAt;

    public PracticeResultResponse() {}

    public PracticeResultResponse(UUID sessionId, Integer totalQuestions, Integer correctAnswers, Double score, Integer timeSpentSeconds, List<QuestionResult> results, LocalDateTime completedAt) {
        this.sessionId = sessionId;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.score = score;
        this.timeSpentSeconds = timeSpentSeconds;
        this.results = results;
        this.completedAt = completedAt;
    }

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public List<QuestionResult> getResults() { return results; }
    public void setResults(List<QuestionResult> results) { this.results = results; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID sessionId;
        private Integer totalQuestions;
        private Integer correctAnswers;
        private Double score;
        private Integer timeSpentSeconds;
        private List<QuestionResult> results;
        private LocalDateTime completedAt;

        public Builder sessionId(UUID sessionId) { this.sessionId = sessionId; return this; }
        public Builder totalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; return this; }
        public Builder correctAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; return this; }
        public Builder score(Double score) { this.score = score; return this; }
        public Builder timeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; return this; }
        public Builder results(List<QuestionResult> results) { this.results = results; return this; }
        public Builder completedAt(LocalDateTime completedAt) { this.completedAt = completedAt; return this; }

        public PracticeResultResponse build() {
            return new PracticeResultResponse(sessionId, totalQuestions, correctAnswers, score, timeSpentSeconds, results, completedAt);
        }
    }
}