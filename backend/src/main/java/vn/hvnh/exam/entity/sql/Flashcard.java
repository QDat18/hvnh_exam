package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {
    
    @Id
    @GeneratedValue
    @Column(name = "flashcard_id")
    private UUID flashcardId;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "student_document_id")
    private UUID studentDocumentId;
    
    @Column(name = "subject_id")
    private UUID subjectId;
    
    @Column(name = "front_content", nullable = false, columnDefinition = "TEXT")
    private String frontText;
    
    @Column(name = "back_content", nullable = false, columnDefinition = "TEXT")
    private String backText;
    
    @Column(name = "source_page")
    private Integer sourcePage;
    
    @Column(name = "source_reference")
    private String sourceReference;
    
    @Column(name = "difficulty", length = 20)
    @Builder.Default
    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD

    @Column(name = "bloom_level", length = 20)
    @Builder.Default
    private String bloomLevel = "REMEMBER"; // REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
    
    @Column(name = "proficiency_level", length = 20)
    @Builder.Default
    private String proficiencyLevel = "NEW"; // NEW, LEARNING, KNOWN, MASTERED
    
    @Column(name = "times_reviewed")
    @Builder.Default
    private Integer timesReviewed = 0;
    
    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;
    
    @Column(name = "created_by", length = 20)
    @Builder.Default
    private String createdBy = "MANUAL"; // MANUAL, AI
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}