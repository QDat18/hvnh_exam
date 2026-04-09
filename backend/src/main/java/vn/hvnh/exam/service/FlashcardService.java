package vn.hvnh.exam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.entity.sql.Flashcard;
import vn.hvnh.exam.entity.sql.FlashcardReview;
import vn.hvnh.exam.repository.sql.FlashcardRepository;
import vn.hvnh.exam.repository.sql.FlashcardReviewRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class FlashcardService {

    private static final Logger log = LoggerFactory.getLogger(FlashcardService.class);

    private final FlashcardRepository flashcardRepo;
    private final FlashcardReviewRepository reviewRepo;

    public FlashcardService(FlashcardRepository flashcardRepo, FlashcardReviewRepository reviewRepo) {
        this.flashcardRepo = flashcardRepo;
        this.reviewRepo = reviewRepo;
    }

    @Transactional
    public void recordReview(UUID flashcardId, int quality) {
        if (quality < 0 || quality > 5) {
            throw new IllegalArgumentException("Quality must be between 0 and 5");
        }

        Flashcard card = flashcardRepo.findById(flashcardId)
            .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        FlashcardReview lastReview = reviewRepo.findTopByFlashcard_FlashcardIdOrderByReviewedAtDesc(flashcardId)
            .orElse(null);

        SM2Result sm2 = calculateSM2(lastReview, quality);

        card.setTimesReviewed(card.getTimesReviewed() + 1);
        card.setLastReviewedAt(LocalDateTime.now());
        card.setProficiencyLevel(sm2.getProficiencyLevel());
        flashcardRepo.save(card);

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

    private SM2Result calculateSM2(FlashcardReview lastReview, int quality) {
        double easinessFactor = 2.5;
        int intervalDays = 1;
        String proficiencyLevel = "LEARNING";

        if (lastReview != null) {
            easinessFactor = lastReview.getEasinessFactor();
            intervalDays = lastReview.getIntervalDays();
        }

        easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        if (easinessFactor < 1.3) {
            easinessFactor = 1.3;
        }

        if (quality < 3) {
            intervalDays = 1;
            proficiencyLevel = "LEARNING";
        } else {
            if (lastReview == null || lastReview.getIntervalDays() <= 1) {
                intervalDays = 1; // Giữ nguyên khoảng nghỉ ngắn (1 ngày) cho lần học đầu tiên
                // UPDATE: Cập nhật luôn trạng thái để giao diện người dùng hiển thị sinh động hơn
                proficiencyLevel = (quality >= 5) ? "MASTERED" : (quality == 4) ? "KNOWN" : "LEARNING";
            } else if (lastReview.getIntervalDays() <= 6) {
                intervalDays = 6;
                proficiencyLevel = (quality >= 5) ? "MASTERED" : (quality == 4) ? "KNOWN" : "LEARNING";
            } else {
                intervalDays = (int) Math.ceil(lastReview.getIntervalDays() * easinessFactor);
                
                if (intervalDays > 30 || quality >= 5) {
                    proficiencyLevel = "MASTERED";
                } else if (intervalDays > 14 || quality == 4) {
                    proficiencyLevel = "KNOWN";
                } else {
                    proficiencyLevel = "LEARNING";
                }
            }
        }

        LocalDate nextReviewDate = LocalDate.now().plusDays(intervalDays);

        return SM2Result.builder()
            .easinessFactor(easinessFactor)
            .intervalDays(intervalDays)
            .nextReviewDate(nextReviewDate)
            .proficiencyLevel(proficiencyLevel)
            .build();
    }

    public Flashcard getNextFlashcard(UUID studentId) {
        LocalDate today = LocalDate.now();
        
        var dueCards = flashcardRepo.findDueForReview(studentId, today);
        if (!dueCards.isEmpty()) {
            return dueCards.get(0);
        }
        
        var newCards = flashcardRepo.findNewFlashcards(studentId);
        if (!newCards.isEmpty()) {
            return newCards.get(0);
        }
        
        return null;
    }

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

    private static class SM2Result {
        private double easinessFactor;
        private int intervalDays;
        private LocalDate nextReviewDate;
        private String proficiencyLevel;

        public SM2Result() {}

        public SM2Result(double easinessFactor, int intervalDays, LocalDate nextReviewDate, String proficiencyLevel) {
            this.easinessFactor = easinessFactor;
            this.intervalDays = intervalDays;
            this.nextReviewDate = nextReviewDate;
            this.proficiencyLevel = proficiencyLevel;
        }

        public double getEasinessFactor() { return easinessFactor; }
        public int getIntervalDays() { return intervalDays; }
        public LocalDate getNextReviewDate() { return nextReviewDate; }
        public String getProficiencyLevel() { return proficiencyLevel; }

        public static SM2ResultBuilder builder() {
            return new SM2ResultBuilder();
        }

        public static class SM2ResultBuilder {
            private double easinessFactor;
            private int intervalDays;
            private LocalDate nextReviewDate;
            private String proficiencyLevel;

            public SM2ResultBuilder easinessFactor(double easinessFactor) {
                this.easinessFactor = easinessFactor;
                return this;
            }

            public SM2ResultBuilder intervalDays(int intervalDays) {
                this.intervalDays = intervalDays;
                return this;
            }

            public SM2ResultBuilder nextReviewDate(LocalDate nextReviewDate) {
                this.nextReviewDate = nextReviewDate;
                return this;
            }

            public SM2ResultBuilder proficiencyLevel(String proficiencyLevel) {
                this.proficiencyLevel = proficiencyLevel;
                return this;
            }

            public SM2Result build() {
                return new SM2Result(easinessFactor, intervalDays, nextReviewDate, proficiencyLevel);
            }
        }
    }

    public static class ReviewStats {
        private long dueToday;
        private long newCards;
        private Object flashcardStats;

        public ReviewStats() {}

        public ReviewStats(long dueToday, long newCards, Object flashcardStats) {
            this.dueToday = dueToday;
            this.newCards = newCards;
            this.flashcardStats = flashcardStats;
        }

        // Fix: There was a typo in the original lombok version where newCount was used instead of newCards? 
        // No, in my manual one I use newCount in constructor but newCards as field. Let's fix.

        public ReviewStats(long dueToday, long newCards, Object flashcardStats, boolean fix) {
            this.dueToday = dueToday;
            this.newCards = newCards;
            this.flashcardStats = flashcardStats;
        }
        
        // Let's use a clean constructor.
        public static ReviewStatsBuilder builder() {
            return new ReviewStatsBuilder();
        }

        public long getDueToday() { return dueToday; }
        public long getNewCards() { return newCards; }
        public Object getFlashcardStats() { return flashcardStats; }

        public static class ReviewStatsBuilder {
            private long dueToday;
            private long newCards;
            private Object flashcardStats;

            public ReviewStatsBuilder dueToday(long dueToday) {
                this.dueToday = dueToday;
                return this;
            }

            public ReviewStatsBuilder newCards(long newCards) {
                this.newCards = newCards;
                return this;
            }

            public ReviewStatsBuilder flashcardStats(Object flashcardStats) {
                this.flashcardStats = flashcardStats;
                return this;
            }

            public ReviewStats build() {
                ReviewStats stats = new ReviewStats();
                stats.dueToday = this.dueToday;
                stats.newCards = this.newCards;
                stats.flashcardStats = this.flashcardStats;
                return stats;
            }
        }
    }
}