package vn.hvnh.exam.dto;

public class FlashcardStatistics {
    private Long totalCards;
    private Long newCards;
    private Long learningCards;
    private Long knownCards;
    private Long masteredCards;
    private Double averageReviews;

    public FlashcardStatistics() {}

    public FlashcardStatistics(Long totalCards, Long newCards, Long learningCards, Long knownCards, Long masteredCards, Double averageReviews) {
        this.totalCards = totalCards;
        this.newCards = newCards;
        this.learningCards = learningCards;
        this.knownCards = knownCards;
        this.masteredCards = masteredCards;
        this.averageReviews = averageReviews;
    }

    public Long getTotalCards() { return totalCards; }
    public void setTotalCards(Long totalCards) { this.totalCards = totalCards; }

    public Long getNewCards() { return newCards; }
    public void setNewCards(Long newCards) { this.newCards = newCards; }

    public Long getLearningCards() { return learningCards; }
    public void setLearningCards(Long learningCards) { this.learningCards = learningCards; }

    public Long getKnownCards() { return knownCards; }
    public void setKnownCards(Long knownCards) { this.knownCards = knownCards; }

    public Long getMasteredCards() { return masteredCards; }
    public void setMasteredCards(Long masteredCards) { this.masteredCards = masteredCards; }

    public Double getAverageReviews() { return averageReviews; }
    public void setAverageReviews(Double averageReviews) { this.averageReviews = averageReviews; }

    public static FlashcardStatisticsBuilder builder() {
        return new FlashcardStatisticsBuilder();
    }

    public static class FlashcardStatisticsBuilder {
        private Long totalCards;
        private Long newCards;
        private Long learningCards;
        private Long knownCards;
        private Long masteredCards;
        private Double averageReviews;

        FlashcardStatisticsBuilder() {}

        public FlashcardStatisticsBuilder totalCards(Long totalCards) {
            this.totalCards = totalCards;
            return this;
        }

        public FlashcardStatisticsBuilder newCards(Long newCards) {
            this.newCards = newCards;
            return this;
        }

        public FlashcardStatisticsBuilder learningCards(Long learningCards) {
            this.learningCards = learningCards;
            return this;
        }

        public FlashcardStatisticsBuilder knownCards(Long knownCards) {
            this.knownCards = knownCards;
            return this;
        }

        public FlashcardStatisticsBuilder masteredCards(Long masteredCards) {
            this.masteredCards = masteredCards;
            return this;
        }

        public FlashcardStatisticsBuilder averageReviews(Double averageReviews) {
            this.averageReviews = averageReviews;
            return this;
        }

        public FlashcardStatistics build() {
            return new FlashcardStatistics(totalCards, newCards, learningCards, knownCards, masteredCards, averageReviews);
        }
    }
}