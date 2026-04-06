package vn.hvnh.exam.dto;

public class SubjectPerformance {
    private String subjectName;
    private Long sessionsCount;
    private Double averageScore;
    private Long questionsAttempted;

    public SubjectPerformance() {}

    public SubjectPerformance(String subjectName, Long sessionsCount, Double averageScore, Long questionsAttempted) {
        this.subjectName = subjectName;
        this.sessionsCount = sessionsCount;
        this.averageScore = averageScore;
        this.questionsAttempted = questionsAttempted;
    }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public Long getSessionsCount() { return sessionsCount; }
    public void setSessionsCount(Long sessionsCount) { this.sessionsCount = sessionsCount; }

    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }

    public Long getQuestionsAttempted() { return questionsAttempted; }
    public void setQuestionsAttempted(Long questionsAttempted) { this.questionsAttempted = questionsAttempted; }

    public static SubjectPerformanceBuilder builder() {
        return new SubjectPerformanceBuilder();
    }

    public static class SubjectPerformanceBuilder {
        private String subjectName;
        private Long sessionsCount;
        private Double averageScore;
        private Long questionsAttempted;

        SubjectPerformanceBuilder() {}

        public SubjectPerformanceBuilder subjectName(String subjectName) {
            this.subjectName = subjectName;
            return this;
        }

        public SubjectPerformanceBuilder sessionsCount(Long sessionsCount) {
            this.sessionsCount = sessionsCount;
            return this;
        }

        public SubjectPerformanceBuilder averageScore(Double averageScore) {
            this.averageScore = averageScore;
            return this;
        }

        public SubjectPerformanceBuilder questionsAttempted(Long questionsAttempted) {
            this.questionsAttempted = questionsAttempted;
            return this;
        }

        public SubjectPerformance build() {
            return new SubjectPerformance(subjectName, sessionsCount, averageScore, questionsAttempted);
        }
    }
}