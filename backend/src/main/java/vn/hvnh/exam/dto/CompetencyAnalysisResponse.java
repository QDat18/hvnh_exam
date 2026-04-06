package vn.hvnh.exam.dto;

import java.util.List;

public class CompetencyAnalysisResponse {
    private String studentName;
    private Double overallScore;
    private String competencyLevel; // EXCELLENT, GOOD, AVERAGE, NEEDS_IMPROVEMENT
    private List<SubjectAnalysis> subjectAnalysis;
    private List<String> strengths;
    private List<String> weaknesses;
    private String aiRecommendation;
    private Integer totalQuestionsAnswered;
    private Integer totalFlascardsReviewed;
    private Double averageAccuracy;
    private Integer currentStreak;

    public CompetencyAnalysisResponse() {}

    public CompetencyAnalysisResponse(String studentName, Double overallScore, String competencyLevel, List<SubjectAnalysis> subjectAnalysis, List<String> strengths, List<String> weaknesses, String aiRecommendation, Integer totalQuestionsAnswered, Integer totalFlascardsReviewed, Double averageAccuracy, Integer currentStreak) {
        this.studentName = studentName;
        this.overallScore = overallScore;
        this.competencyLevel = competencyLevel;
        this.subjectAnalysis = subjectAnalysis;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.aiRecommendation = aiRecommendation;
        this.totalQuestionsAnswered = totalQuestionsAnswered;
        this.totalFlascardsReviewed = totalFlascardsReviewed;
        this.averageAccuracy = averageAccuracy;
        this.currentStreak = currentStreak;
    }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }

    public String getCompetencyLevel() { return competencyLevel; }
    public void setCompetencyLevel(String competencyLevel) { this.competencyLevel = competencyLevel; }

    public List<SubjectAnalysis> getSubjectAnalysis() { return subjectAnalysis; }
    public void setSubjectAnalysis(List<SubjectAnalysis> subjectAnalysis) { this.subjectAnalysis = subjectAnalysis; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public List<String> getWeaknesses() { return weaknesses; }
    public void setWeaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; }

    public String getAiRecommendation() { return aiRecommendation; }
    public void setAiRecommendation(String aiRecommendation) { this.aiRecommendation = aiRecommendation; }

    public Integer getTotalQuestionsAnswered() { return totalQuestionsAnswered; }
    public void setTotalQuestionsAnswered(Integer totalQuestionsAnswered) { this.totalQuestionsAnswered = totalQuestionsAnswered; }

    public Integer getTotalFlascardsReviewed() { return totalFlascardsReviewed; }
    public void setTotalFlascardsReviewed(Integer totalFlascardsReviewed) { this.totalFlascardsReviewed = totalFlascardsReviewed; }

    public Double getAverageAccuracy() { return averageAccuracy; }
    public void setAverageAccuracy(Double averageAccuracy) { this.averageAccuracy = averageAccuracy; }

    public Integer getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }

    public static class SubjectAnalysis {
        private String subjectName;
        private Double accuracy;
        private Integer questionsAttempted;
        private String performanceLevel; // MASTERY, PROFICIENT, DEVELOPING, BEGINNING
        private List<String> topicStrengths;
        private List<String> topicsToImprove;

        public SubjectAnalysis() {}

        public SubjectAnalysis(String subjectName, Double accuracy, Integer questionsAttempted, String performanceLevel, List<String> topicStrengths, List<String> topicsToImprove) {
            this.subjectName = subjectName;
            this.accuracy = accuracy;
            this.questionsAttempted = questionsAttempted;
            this.performanceLevel = performanceLevel;
            this.topicStrengths = topicStrengths;
            this.topicsToImprove = topicsToImprove;
        }

        public String getSubjectName() { return subjectName; }
        public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

        public Double getAccuracy() { return accuracy; }
        public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

        public Integer getQuestionsAttempted() { return questionsAttempted; }
        public void setQuestionsAttempted(Integer questionsAttempted) { this.questionsAttempted = questionsAttempted; }

        public String getPerformanceLevel() { return performanceLevel; }
        public void setPerformanceLevel(String performanceLevel) { this.performanceLevel = performanceLevel; }

        public List<String> getTopicStrengths() { return topicStrengths; }
        public void setTopicStrengths(List<String> topicStrengths) { this.topicStrengths = topicStrengths; }

        public List<String> getTopicsToImprove() { return topicsToImprove; }
        public void setTopicsToImprove(List<String> topicsToImprove) { this.topicsToImprove = topicsToImprove; }
    }
}
