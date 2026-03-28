package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.hvnh.exam.entity.sql.Flashcard;
import vn.hvnh.exam.entity.sql.FlashcardReview;

import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface FlashcardReviewRepository extends JpaRepository<FlashcardReview, UUID> {
    
    Optional<FlashcardReview> findTopByFlashcard_FlashcardIdOrderByReviewedAtDesc(UUID flashcard_Id);

    // 1. Đếm số thẻ cần ôn tập
    @Query("SELECT COUNT(DISTINCT f) FROM Flashcard f LEFT JOIN FlashcardReview fr ON f = fr.flashcard AND fr.reviewedAt = (SELECT MAX(fr2.reviewedAt) FROM FlashcardReview fr2 WHERE fr2.flashcard = f) WHERE f.studentId = :studentId AND (fr.nextReviewDate IS NULL OR fr.nextReviewDate <= :today)")
    long countDueForReview(@Param("studentId") UUID studentId, @Param("today") LocalDate today);

}