package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.Flashcard;

public class FlashcardReviewResponse {
    private String message;
    private Flashcard nextFlashcard;
    private Long remainingCount;

    public FlashcardReviewResponse() {}

    public FlashcardReviewResponse(String message, Flashcard nextFlashcard, Long remainingCount) {
        this.message = message;
        this.nextFlashcard = nextFlashcard;
        this.remainingCount = remainingCount;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Flashcard getNextFlashcard() { return nextFlashcard; }
    public void setNextFlashcard(Flashcard nextFlashcard) { this.nextFlashcard = nextFlashcard; }

    public Long getRemainingCount() { return remainingCount; }
    public void setRemainingCount(Long remainingCount) { this.remainingCount = remainingCount; }

    public static FlashcardReviewResponseBuilder builder() {
        return new FlashcardReviewResponseBuilder();
    }

    public static class FlashcardReviewResponseBuilder {
        private String message;
        private Flashcard nextFlashcard;
        private Long remainingCount;

        FlashcardReviewResponseBuilder() {}

        public FlashcardReviewResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public FlashcardReviewResponseBuilder nextFlashcard(Flashcard nextFlashcard) {
            this.nextFlashcard = nextFlashcard;
            return this;
        }

        public FlashcardReviewResponseBuilder remainingCount(Long remainingCount) {
            this.remainingCount = remainingCount;
            return this;
        }

        public FlashcardReviewResponse build() {
            return new FlashcardReviewResponse(message, nextFlashcard, remainingCount);
        }
    }
}