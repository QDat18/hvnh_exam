package vn.hvnh.exam.dto;

import java.util.List;

public class AIRecommendationsResponse {
    private List<Recommendation> recommendations;
    private List<String> weakAreas;
    private List<String> strongAreas;
    private Double recentMastery;

    public AIRecommendationsResponse() {}

    public AIRecommendationsResponse(List<Recommendation> recommendations, List<String> weakAreas, List<String> strongAreas, Double recentMastery) {
        this.recommendations = recommendations;
        this.weakAreas = weakAreas;
        this.strongAreas = strongAreas;
        this.recentMastery = recentMastery;
    }

    public List<Recommendation> getRecommendations() { return recommendations; }
    public void setRecommendations(List<Recommendation> recommendations) { this.recommendations = recommendations; }

    public List<String> getWeakAreas() { return weakAreas; }
    public void setWeakAreas(List<String> weakAreas) { this.weakAreas = weakAreas; }

    public List<String> getStrongAreas() { return strongAreas; }
    public void setStrongAreas(List<String> strongAreas) { this.strongAreas = strongAreas; }

    public Double getRecentMastery() { return recentMastery; }
    public void setRecentMastery(Double recentMastery) { this.recentMastery = recentMastery; }

    public static AIRecommendationsResponseBuilder builder() {
        return new AIRecommendationsResponseBuilder();
    }

    public static class AIRecommendationsResponseBuilder {
        private List<Recommendation> recommendations;
        private List<String> weakAreas;
        private List<String> strongAreas;
        private Double recentMastery;

        AIRecommendationsResponseBuilder() {}

        public AIRecommendationsResponseBuilder recommendations(List<Recommendation> recommendations) {
            this.recommendations = recommendations;
            return this;
        }

        public AIRecommendationsResponseBuilder weakAreas(List<String> weakAreas) {
            this.weakAreas = weakAreas;
            return this;
        }

        public AIRecommendationsResponseBuilder strongAreas(List<String> strongAreas) {
            this.strongAreas = strongAreas;
            return this;
        }

        public AIRecommendationsResponseBuilder recentMastery(Double recentMastery) {
            this.recentMastery = recentMastery;
            return this;
        }

        public AIRecommendationsResponse build() {
            return new AIRecommendationsResponse(recommendations, weakAreas, strongAreas, recentMastery);
        }
    }
}
