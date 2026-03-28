package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.entity.sql.Flashcard;
import vn.hvnh.exam.entity.sql.FlashcardReview;
import vn.hvnh.exam.repository.sql.FlashcardRepository;
import vn.hvnh.exam.repository.sql.FlashcardReviewRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Flashcard Service with SM-2 Spaced Repetition Algorithm
 * 
 * Quality Ratings (0-5):
 * 0 - Complete blackout
 * 1 - Incorrect response, correct answer seemed familiar
 * 2 - Incorrect response, correct answer seemed easy to recall
 * 3 - Correct response, but required significant difficulty
 * 4 - Correct response, after some hesitation
 * 5 - Perfect response
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardService {

    private final FlashcardRepository flashcardRepo;
    private final FlashcardReviewRepository reviewRepo;

    /**
     * Record flashcard review with SM-2 algorithm
     */
    @Transactional
    public void recordReview(UUID flashcardId, int quality) {
        if (quality < 0 || quality > 5) {
            throw new IllegalArgumentException("Quality must be between 0 and 5");
        }

        // Get flashcard
        Flashcard card = flashcardRepo.findById(flashcardId)
            .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        // Get last review (if any)
        FlashcardReview lastReview = reviewRepo.findTopByFlashcard_FlashcardIdOrderByReviewedAtDesc(flashcardId)
            .orElse(null);

        // Calculate new parameters using SM-2
        SM2Result sm2 = calculateSM2(lastReview, quality);

        // Update flashcard
        card.setTimesReviewed(card.getTimesReviewed() + 1);
        card.setLastReviewedAt(LocalDateTime.now());
        card.setProficiencyLevel(sm2.getProficiencyLevel());
        flashcardRepo.save(card);

        // Save review record
        FlashcardReview review = FlashcardReview.builder()
            .flashcard(card)
            .studentId(card.getStudentId())
            .quality(quality)
            .easinessFactor(sm2.getEasinessFactor())
            .intervalDays(sm2.getIntervalDays())
            .nextReviewDate(sm2.getNextReviewDate())
            .reviewedAt(LocalDateTime.now())
            .build();

        reviewRepo.save(review);

        log.info("📝 Flashcard reviewed: {} | Quality: {} | Next review: {} | Proficiency: {}", 
            flashcardId, quality, sm2.getNextReviewDate(), sm2.getProficiencyLevel());
    }

    /**
     * SM-2 Algorithm Implementation
     * Based on SuperMemo 2 algorithm
     */
    private SM2Result calculateSM2(FlashcardReview lastReview, int quality) {
        // Default values for new cards
        double easinessFactor = 2.5;
        int intervalDays = 1;
        String proficiencyLevel = "LEARNING";

        // If this is not the first review, use previous values
        if (lastReview != null) {
            easinessFactor = lastReview.getEasinessFactor();
            intervalDays = lastReview.getIntervalDays();
        }

        // Calculate new easiness factor
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        // Easiness factor should not fall below 1.3
        if (easinessFactor < 1.3) {
            easinessFactor = 1.3;
        }

        // Calculate interval
        if (quality < 3) {
            // Failed - reset to beginning
            intervalDays = 1;
            proficiencyLevel = "LEARNING";
        } else {
            // Passed - calculate next interval
            if (lastReview == null || lastReview.getIntervalDays() <= 1) {
                // First successful repetition
                intervalDays = 1;
                proficiencyLevel = "LEARNING";
            } else if (lastReview.getIntervalDays() <= 6) {
                // Second successful repetition
                intervalDays = 6;
                proficiencyLevel = "LEARNING";
            } else {
                // Subsequent repetitions
                intervalDays = (int) Math.ceil(lastReview.getIntervalDays() * easinessFactor);
                
                // Determine proficiency level based on interval
                if (intervalDays > 30) {
                    proficiencyLevel = "MASTERED";
                } else if (intervalDays > 14) {
                    proficiencyLevel = "KNOWN";
                } else {
                    proficiencyLevel = "LEARNING";
                }
            }
        }

        // Calculate next review date
        LocalDate nextReviewDate = LocalDate.now().plusDays(intervalDays);

        return SM2Result.builder()
            .easinessFactor(easinessFactor)
            .intervalDays(intervalDays)
            .nextReviewDate(nextReviewDate)
            .proficiencyLevel(proficiencyLevel)
            .build();
    }

    /**
     * Get next flashcard to review
     */
    public Flashcard getNextFlashcard(UUID studentId) {
        LocalDate today = LocalDate.now();
        
        // First, get due cards
        var dueCards = flashcardRepo.findDueForReview(studentId, today);
        if (!dueCards.isEmpty()) {
            return dueCards.get(0);
        }
        
        // If no due cards, get new cards
        var newCards = flashcardRepo.findNewFlashcards(studentId);
        if (!newCards.isEmpty()) {
            return newCards.get(0);
        }
        
        // No cards to review
        return null;
    }

    /**
     * Get review statistics
     */
    public ReviewStats getReviewStats(UUID studentId) {
        LocalDate today = LocalDate.now();
        
        long dueCount = flashcardRepo.countDueForReview(studentId, today);
        long newCount = flashcardRepo.countNewCards(studentId);
        Object flashcardStats = flashcardRepo.getFlashcardStats(studentId);
        
        return ReviewStats.builder()
            .dueToday(dueCount)
            .newCards(newCount)
            .flashcardStats(flashcardStats)
            .build();
    }

    /**
     * SM-2 Result DTO
     */
    @lombok.Builder
    @lombok.Data
    private static class SM2Result {
        private double easinessFactor;
        private int intervalDays;
        private LocalDate nextReviewDate;
        private String proficiencyLevel;
    }

    /**
     * Review Statistics DTO
     */
    @lombok.Builder
    @lombok.Data
    public static class ReviewStats {
        private long dueToday;
        private long newCards;
        private Object flashcardStats;
    }
}