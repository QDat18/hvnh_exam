package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcard_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}