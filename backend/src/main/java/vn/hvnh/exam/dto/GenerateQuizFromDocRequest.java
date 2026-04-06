package vn.hvnh.exam.dto;

import java.util.List;
import java.util.Map;

public class GenerateQuizFromDocRequest {
    private Integer numQuestions = 20;
    private List<String> chapters;
    private Map<String, Integer> difficultyDistribution;

    public GenerateQuizFromDocRequest() {}

    public GenerateQuizFromDocRequest(Integer numQuestions, List<String> chapters, Map<String, Integer> difficultyDistribution) {
        this.numQuestions = numQuestions;
        this.chapters = chapters;
        this.difficultyDistribution = difficultyDistribution;
    }

    public Integer getNumQuestions() { return numQuestions; }
    public void setNumQuestions(Integer numQuestions) { this.numQuestions = numQuestions; }

    public List<String> getChapters() { return chapters; }
    public void setChapters(List<String> chapters) { this.chapters = chapters; }

    public Map<String, Integer> getDifficultyDistribution() { return difficultyDistribution; }
    public void setDifficultyDistribution(Map<String, Integer> difficultyDistribution) { this.difficultyDistribution = difficultyDistribution; }

    public static GenerateQuizFromDocRequestBuilder builder() {
        return new GenerateQuizFromDocRequestBuilder();
    }

    public static class GenerateQuizFromDocRequestBuilder {
        private Integer numQuestions = 20;
        private List<String> chapters;
        private Map<String, Integer> difficultyDistribution;

        GenerateQuizFromDocRequestBuilder() {}

        public GenerateQuizFromDocRequestBuilder numQuestions(Integer numQuestions) {
            this.numQuestions = numQuestions;
            return this;
        }

        public GenerateQuizFromDocRequestBuilder chapters(List<String> chapters) {
            this.chapters = chapters;
            return this;
        }

        public GenerateQuizFromDocRequestBuilder difficultyDistribution(Map<String, Integer> difficultyDistribution) {
            this.difficultyDistribution = difficultyDistribution;
            return this;
        }

        public GenerateQuizFromDocRequest build() {
            return new GenerateQuizFromDocRequest(numQuestions, chapters, difficultyDistribution);
        }
    }
}