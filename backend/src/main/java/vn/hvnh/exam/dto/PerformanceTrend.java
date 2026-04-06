package vn.hvnh.exam.dto;

import java.time.LocalDateTime;

public class PerformanceTrend {
    private LocalDateTime date;
    private Double score;
    private Integer sessionsCount;

    public PerformanceTrend() {}

    public PerformanceTrend(LocalDateTime date, Double score, Integer sessionsCount) {
        this.date = date;
        this.score = score;
        this.sessionsCount = sessionsCount;
    }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Integer getSessionsCount() { return sessionsCount; }
    public void setSessionsCount(Integer sessionsCount) { this.sessionsCount = sessionsCount; }

    public static PerformanceTrendBuilder builder() {
        return new PerformanceTrendBuilder();
    }

    public static class PerformanceTrendBuilder {
        private LocalDateTime date;
        private Double score;
        private Integer sessionsCount;

        PerformanceTrendBuilder() {}

        public PerformanceTrendBuilder date(LocalDateTime date) {
            this.date = date;
            return this;
        }

        public PerformanceTrendBuilder score(Double score) {
            this.score = score;
            return this;
        }

        public PerformanceTrendBuilder sessionsCount(Integer sessionsCount) {
            this.sessionsCount = sessionsCount;
            return this;
        }

        public PerformanceTrend build() {
            return new PerformanceTrend(date, score, sessionsCount);
        }
    }
}