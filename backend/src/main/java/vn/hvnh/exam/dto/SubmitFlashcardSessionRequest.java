package vn.hvnh.exam.dto;

import java.util.*;

public class SubmitFlashcardSessionRequest {
    private UUID documentId; // Optional -> If studying by document
    private UUID subjectId;  // Optional -> If studying by subject
    private int totalCards;
    private int knownCards; // Rating >= 4
    private int learningCards; // Rating <= 3
    private int timeSpentSeconds;
    private List<CardReview> reviews;

    public SubmitFlashcardSessionRequest() {}

    public SubmitFlashcardSessionRequest(UUID documentId, UUID subjectId, int totalCards, int knownCards, int learningCards, int timeSpentSeconds, List<CardReview> reviews) {
        this.documentId = documentId;
        this.subjectId = subjectId;
        this.totalCards = totalCards;
        this.knownCards = knownCards;
        this.learningCards = learningCards;
        this.timeSpentSeconds = timeSpentSeconds;
        this.reviews = reviews;
    }

    public UUID getDocumentId() { return documentId; }
    public UUID getSubjectId() { return subjectId; }
    public int getTotalCards() { return totalCards; }
    public int getKnownCards() { return knownCards; }
    public int getLearningCards() { return learningCards; }
    public int getTimeSpentSeconds() { return timeSpentSeconds; }
    public List<CardReview> getReviews() { return reviews; }

    public void setDocumentId(UUID id) { this.documentId = id; }
    public void setSubjectId(UUID id) { this.subjectId = id; }
    public void setTotalCards(int n) { this.totalCards = n; }
    public void setKnownCards(int n) { this.knownCards = n; }
    public void setLearningCards(int n) { this.learningCards = n; }
    public void setTimeSpentSeconds(int n) { this.timeSpentSeconds = n; }
    public void setReviews(List<CardReview> reviews) { this.reviews = reviews; }

    public static class CardReview {
        private UUID flashcardId;
        private int quality;
        
        public CardReview() {}
        public CardReview(UUID flashcardId, int quality) {
            this.flashcardId = flashcardId;
            this.quality = quality;
        }
        
        public UUID getFlashcardId() { return flashcardId; }
        public void setFlashcardId(UUID id) { this.flashcardId = id; }
        public int getQuality() { return quality; }
        public void setQuality(int q) { this.quality = q; }
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID documentId;
        private UUID subjectId;
        private int totalCards;
        private int knownCards;
        private int learningCards;
        private int timeSpentSeconds;
        private List<CardReview> reviews;

        public Builder documentId(UUID id) { this.documentId = id; return this; }
        public Builder subjectId(UUID id) { this.subjectId = id; return this; }
        public Builder totalCards(int n) { this.totalCards = n; return this; }
        public Builder knownCards(int n) { this.knownCards = n; return this; }
        public Builder learningCards(int n) { this.learningCards = n; return this; }
        public Builder timeSpentSeconds(int n) { this.timeSpentSeconds = n; return this; }
        public Builder reviews(List<CardReview> reviews) { this.reviews = reviews; return this; }

        public SubmitFlashcardSessionRequest build() {
            return new SubmitFlashcardSessionRequest(documentId, subjectId, totalCards, knownCards, learningCards, timeSpentSeconds, reviews);
        }
    }
}
