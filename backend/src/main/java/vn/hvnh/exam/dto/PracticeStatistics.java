package vn.hvnh.exam.dto;

public class PracticeStatistics {
    private Long totalSessions;
    private Long completedSessions;
    private Double averageScore;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Long totalTimeMinutes;

    public PracticeStatistics() {}

    public PracticeStatistics(Long totalSessions, Long completedSessions, Double averageScore, Integer totalQuestions, Integer correctAnswers, Long totalTimeMinutes) {
        this.totalSessions = totalSessions;
        this.completedSessions = completedSessions;
        this.averageScore = averageScore;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.totalTimeMinutes = totalTimeMinutes;
    }

    public Long getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Long totalSessions) { this.totalSessions = totalSessions; }

    public Long getCompletedSessions() { return completedSessions; }
    public void setCompletedSessions(Long completedSessions) { this.completedSessions = completedSessions; }

    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; }

    public Long getTotalTimeMinutes() { return totalTimeMinutes; }
    public void setTotalTimeMinutes(Long totalTimeMinutes) { this.totalTimeMinutes = totalTimeMinutes; }

    public static PracticeStatisticsBuilder builder() {
        return new PracticeStatisticsBuilder();
    }

    public static class PracticeStatisticsBuilder {
        private Long totalSessions;
        private Long completedSessions;
        private Double averageScore;
        private Integer totalQuestions;
        private Integer correctAnswers;
        private Long totalTimeMinutes;

        PracticeStatisticsBuilder() {}

        public PracticeStatisticsBuilder totalSessions(Long totalSessions) {
            this.totalSessions = totalSessions;
            return this;
        }

        public PracticeStatisticsBuilder completedSessions(Long completedSessions) {
            this.completedSessions = completedSessions;
            return this;
        }

        public PracticeStatisticsBuilder averageScore(Double averageScore) {
            this.averageScore = averageScore;
            return this;
        }

        public PracticeStatisticsBuilder totalQuestions(Integer totalQuestions) {
            this.totalQuestions = totalQuestions;
            return this;
        }

        public PracticeStatisticsBuilder correctAnswers(Integer correctAnswers) {
            this.correctAnswers = correctAnswers;
            return this;
        }

        public PracticeStatisticsBuilder totalTimeMinutes(Long totalTimeMinutes) {
            this.totalTimeMinutes = totalTimeMinutes;
            return this;
        }

        public PracticeStatistics build() {
            return new PracticeStatistics(totalSessions, completedSessions, averageScore, totalQuestions, correctAnswers, totalTimeMinutes);
        }
    }
}