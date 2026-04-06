package vn.hvnh.exam.dto;

import java.util.List;

public class StudentAnalyticsResponse {
    private PracticeStatistics practiceStats;
    private FlashcardStatistics flashcardStats;
    private List<SubjectPerformance> subjectPerformance;
    private List<PerformanceTrend> trends;

    public StudentAnalyticsResponse() {}

    public StudentAnalyticsResponse(PracticeStatistics practiceStats, FlashcardStatistics flashcardStats, List<SubjectPerformance> subjectPerformance, List<PerformanceTrend> trends) {
        this.practiceStats = practiceStats;
        this.flashcardStats = flashcardStats;
        this.subjectPerformance = subjectPerformance;
        this.trends = trends;
    }

    public PracticeStatistics getPracticeStats() { return practiceStats; }
    public void setPracticeStats(PracticeStatistics practiceStats) { this.practiceStats = practiceStats; }

    public FlashcardStatistics getFlashcardStats() { return flashcardStats; }
    public void setFlashcardStats(FlashcardStatistics flashcardStats) { this.flashcardStats = flashcardStats; }

    public List<SubjectPerformance> getSubjectPerformance() { return subjectPerformance; }
    public void setSubjectPerformance(List<SubjectPerformance> subjectPerformance) { this.subjectPerformance = subjectPerformance; }

    public List<PerformanceTrend> getTrends() { return trends; }
    public void setTrends(List<PerformanceTrend> trends) { this.trends = trends; }

    public static StudentAnalyticsResponseBuilder builder() {
        return new StudentAnalyticsResponseBuilder();
    }

    public static class StudentAnalyticsResponseBuilder {
        private PracticeStatistics practiceStats;
        private FlashcardStatistics flashcardStats;
        private List<SubjectPerformance> subjectPerformance;
        private List<PerformanceTrend> trends;

        StudentAnalyticsResponseBuilder() {}

        public StudentAnalyticsResponseBuilder practiceStats(PracticeStatistics practiceStats) {
            this.practiceStats = practiceStats;
            return this;
        }

        public StudentAnalyticsResponseBuilder flashcardStats(FlashcardStatistics flashcardStats) {
            this.flashcardStats = flashcardStats;
            return this;
        }

        public StudentAnalyticsResponseBuilder subjectPerformance(List<SubjectPerformance> subjectPerformance) {
            this.subjectPerformance = subjectPerformance;
            return this;
        }

        public StudentAnalyticsResponseBuilder trends(List<PerformanceTrend> trends) {
            this.trends = trends;
            return this;
        }

        public StudentAnalyticsResponse build() {
            return new StudentAnalyticsResponse(practiceStats, flashcardStats, subjectPerformance, trends);
        }
    }
}