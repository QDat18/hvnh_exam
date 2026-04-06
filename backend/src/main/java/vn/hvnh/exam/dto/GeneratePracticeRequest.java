package vn.hvnh.exam.dto;

import java.util.*;

public class GeneratePracticeRequest {
    private UUID subjectId;
    private Integer numQuestions = 20;
    private Map<String, Integer> difficultyDistribution; // {"easy": 40, "medium": 40, "hard": 20}
    private String mode = "RANDOM"; // RANDOM, BY_CHAPTER, BY_WEAK_AREAS
    private List<UUID> chapterIds;

    public GeneratePracticeRequest() {}

    public GeneratePracticeRequest(UUID subjectId, Integer numQuestions, Map<String, Integer> difficultyDistribution, String mode, List<UUID> chapterIds) {
        this.subjectId = subjectId;
        this.numQuestions = numQuestions != null ? numQuestions : 20;
        this.difficultyDistribution = difficultyDistribution;
        this.mode = mode != null ? mode : "RANDOM";
        this.chapterIds = chapterIds;
    }

    // Manual getters to bypass Lombok failures
    public UUID getSubjectId() { return subjectId; }
    public Integer getNumQuestions() { return numQuestions; }
    public Map<String, Integer> getDifficultyDistribution() { return difficultyDistribution; }
    public String getMode() { return mode; }
    public List<UUID> getChapterIds() { return chapterIds; }
    public List<UUID> getDocIds() { return new ArrayList<>(); }

    public void setSubjectId(UUID id) { this.subjectId = id; }
    public void setNumQuestions(Integer n) { this.numQuestions = n; }
    public void setDifficultyDistribution(Map<String, Integer> dist) { this.difficultyDistribution = dist; }
    public void setMode(String mode) { this.mode = mode; }
    public void setChapterIds(List<UUID> ids) { this.chapterIds = ids; }

    public static GeneratePracticeRequestBuilder builder() {
        return new GeneratePracticeRequestBuilder();
    }

    public static class GeneratePracticeRequestBuilder {
        private UUID subjectId;
        private Integer numQuestions = 20;
        private Map<String, Integer> difficultyDistribution;
        private String mode = "RANDOM";
        private List<UUID> chapterIds;

        public GeneratePracticeRequestBuilder subjectId(UUID id) { this.subjectId = id; return this; }
        public GeneratePracticeRequestBuilder numQuestions(Integer n) { this.numQuestions = n; return this; }
        public GeneratePracticeRequestBuilder difficultyDistribution(Map<String, Integer> dist) { this.difficultyDistribution = dist; return this; }
        public GeneratePracticeRequestBuilder mode(String mode) { this.mode = mode; return this; }
        public GeneratePracticeRequestBuilder chapterIds(List<UUID> ids) { this.chapterIds = ids; return this; }

        public GeneratePracticeRequest build() {
            return new GeneratePracticeRequest(subjectId, numQuestions, difficultyDistribution, mode, chapterIds);
        }
    }
}


