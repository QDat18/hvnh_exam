package vn.hvnh.exam.dto;

import java.util.UUID;

public class SubmitFlashcardSessionResponse {
    private UUID sessionId;
    private int totalCards;
    private int knownCards;
    private int learningCards;
    private double score;
    private int timeSpentSeconds;

    public SubmitFlashcardSessionResponse() {}

    public SubmitFlashcardSessionResponse(UUID sessionId, int totalCards, int knownCards, int learningCards, double score, int timeSpentSeconds) {
        this.sessionId = sessionId;
        this.totalCards = totalCards;
        this.knownCards = knownCards;
        this.learningCards = learningCards;
        this.score = score;
        this.timeSpentSeconds = timeSpentSeconds;
    }

    public UUID getSessionId() { return sessionId; }
    public int getTotalCards() { return totalCards; }
    public int getKnownCards() { return knownCards; }
    public int getLearningCards() { return learningCards; }
    public double getScore() { return score; }
    public int getTimeSpentSeconds() { return timeSpentSeconds; }

    public void setSessionId(UUID id) { this.sessionId = id; }
    public void setTotalCards(int n) { this.totalCards = n; }
    public void setKnownCards(int n) { this.knownCards = n; }
    public void setLearningCards(int n) { this.learningCards = n; }
    public void setScore(double s) { this.score = s; }
    public void setTimeSpentSeconds(int n) { this.timeSpentSeconds = n; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID sessionId;
        private int totalCards;
        private int knownCards;
        private int learningCards;
        private double score;
        private int timeSpentSeconds;

        public Builder sessionId(UUID id) { this.sessionId = id; return this; }
        public Builder totalCards(int n) { this.totalCards = n; return this; }
        public Builder knownCards(int n) { this.knownCards = n; return this; }
        public Builder learningCards(int n) { this.learningCards = n; return this; }
        public Builder score(double s) { this.score = s; return this; }
        public Builder timeSpentSeconds(int n) { this.timeSpentSeconds = n; return this; }

        public SubmitFlashcardSessionResponse build() {
            return new SubmitFlashcardSessionResponse(sessionId, totalCards, knownCards, learningCards, score, timeSpentSeconds);
        }
    }
}
