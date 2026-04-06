package vn.hvnh.exam.dto;

public class PracticeStatsResponse {
    private Object overallStats;
    private Double averageScore;
    private Double bestScore;

    public PracticeStatsResponse() {}

    public PracticeStatsResponse(Object overallStats, Double averageScore, Double bestScore) {
        this.overallStats = overallStats;
        this.averageScore = averageScore;
        this.bestScore = bestScore;
    }

    public Object getOverallStats() { return overallStats; }
    public void setOverallStats(Object overallStats) { this.overallStats = overallStats; }
    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
    public Double getBestScore() { return bestScore; }
    public void setBestScore(Double bestScore) { this.bestScore = bestScore; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Object overallStats;
        private Double averageScore;
        private Double bestScore;

        public Builder overallStats(Object overallStats) { this.overallStats = overallStats; return this; }
        public Builder averageScore(Double averageScore) { this.averageScore = averageScore; return this; }
        public Builder bestScore(Double bestScore) { this.bestScore = bestScore; return this; }

        public PracticeStatsResponse build() {
            return new PracticeStatsResponse(overallStats, averageScore, bestScore);
        }
    }
}