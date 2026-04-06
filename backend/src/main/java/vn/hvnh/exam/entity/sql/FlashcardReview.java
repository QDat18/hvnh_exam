package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcard_reviews")
public class FlashcardReview {
    
    @Id
    @GeneratedValue
    @Column(name = "review_id")
    private UUID reviewId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id")
    private Flashcard flashcard;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "quality")
    private Integer quality; // 0-5
    
    @Column(name = "easiness_factor")
    private Double easinessFactor;
    
    @Column(name = "interval_days")
    private Integer intervalDays;
    
    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;
    
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public FlashcardReview() {}

    public FlashcardReview(UUID reviewId, Flashcard flashcard, UUID studentId, Integer quality, Double easinessFactor, Integer intervalDays, LocalDate nextReviewDate, LocalDateTime reviewedAt) {
        this.reviewId = reviewId;
        this.flashcard = flashcard;
        this.studentId = studentId;
        this.quality = quality;
        this.easinessFactor = easinessFactor;
        this.intervalDays = intervalDays;
        this.nextReviewDate = nextReviewDate;
        this.reviewedAt = reviewedAt;
    }

    // Getters and Setters
    public UUID getReviewId() { return reviewId; }
    public void setReviewId(UUID reviewId) { this.reviewId = reviewId; }

    public Flashcard getFlashcard() { return flashcard; }
    public void setFlashcard(Flashcard flashcard) { this.flashcard = flashcard; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public Integer getQuality() { return quality; }
    public void setQuality(Integer quality) { this.quality = quality; }

    public Double getEasinessFactor() { return easinessFactor; }
    public void setEasinessFactor(Double easinessFactor) { this.easinessFactor = easinessFactor; }

    public Integer getIntervalDays() { return intervalDays; }
    public void setIntervalDays(Integer intervalDays) { this.intervalDays = intervalDays; }

    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate nextReviewDate) { this.nextReviewDate = nextReviewDate; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    // Manual Builder
    public static FlashcardReviewBuilder builder() {
        return new FlashcardReviewBuilder();
    }

    public static class FlashcardReviewBuilder {
        private UUID reviewId;
        private Flashcard flashcard;
        private UUID studentId;
        private Integer quality;
        private Double easinessFactor;
        private Integer intervalDays;
        private LocalDate nextReviewDate;
        private LocalDateTime reviewedAt;

        public FlashcardReviewBuilder reviewId(UUID id) { this.reviewId = id; return this; }
        public FlashcardReviewBuilder flashcard(Flashcard flashcard) { this.flashcard = flashcard; return this; }
        public FlashcardReviewBuilder studentId(UUID id) { this.studentId = id; return this; }
        public FlashcardReviewBuilder quality(Integer quality) { this.quality = quality; return this; }
        public FlashcardReviewBuilder easinessFactor(Double factor) { this.easinessFactor = factor; return this; }
        public FlashcardReviewBuilder intervalDays(Integer days) { this.intervalDays = days; return this; }
        public FlashcardReviewBuilder nextReviewDate(LocalDate date) { this.nextReviewDate = date; return this; }
        public FlashcardReviewBuilder reviewedAt(LocalDateTime date) { this.reviewedAt = date; return this; }

        public FlashcardReview build() {
            return new FlashcardReview(reviewId, flashcard, studentId, quality, easinessFactor, intervalDays, nextReviewDate, reviewedAt);
        }
    }
}