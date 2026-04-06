package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcards")
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
    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD

    @Column(name = "bloom_level", length = 20)
    private String bloomLevel = "REMEMBER"; // REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
    
    @Column(name = "proficiency_level", length = 20)
    private String proficiencyLevel = "NEW"; // NEW, LEARNING, KNOWN, MASTERED
    
    @Column(name = "times_reviewed")
    private Integer timesReviewed = 0;
    
    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;
    
    @Column(name = "created_by", length = 20)
    private String createdBy = "MANUAL"; // MANUAL, AI
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Flashcard() {}

    public Flashcard(UUID flashcardId, UUID studentId, UUID studentDocumentId, UUID subjectId, String frontText, String backText, Integer sourcePage, String sourceReference, String difficulty, String bloomLevel, String proficiencyLevel, Integer timesReviewed, LocalDateTime lastReviewedAt, String createdBy, LocalDateTime createdAt) {
        this.flashcardId = flashcardId;
        this.studentId = studentId;
        this.studentDocumentId = studentDocumentId;
        this.subjectId = subjectId;
        this.frontText = frontText;
        this.backText = backText;
        this.sourcePage = sourcePage;
        this.sourceReference = sourceReference;
        this.difficulty = (difficulty == null) ? "MEDIUM" : difficulty;
        this.bloomLevel = (bloomLevel == null) ? "REMEMBER" : bloomLevel;
        this.proficiencyLevel = (proficiencyLevel == null) ? "NEW" : proficiencyLevel;
        this.timesReviewed = (timesReviewed == null) ? 0 : timesReviewed;
        this.lastReviewedAt = lastReviewedAt;
        this.createdBy = (createdBy == null) ? "MANUAL" : createdBy;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getFlashcardId() { return flashcardId; }
    public void setFlashcardId(UUID flashcardId) { this.flashcardId = flashcardId; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public UUID getStudentDocumentId() { return studentDocumentId; }
    public void setStudentDocumentId(UUID studentDocumentId) { this.studentDocumentId = studentDocumentId; }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }

    public Integer getSourcePage() { return sourcePage; }
    public void setSourcePage(Integer sourcePage) { this.sourcePage = sourcePage; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getBloomLevel() { return bloomLevel; }
    public void setBloomLevel(String bloomLevel) { this.bloomLevel = bloomLevel; }

    public String getProficiencyLevel() { return proficiencyLevel; }
    public void setProficiencyLevel(String proficiencyLevel) { this.proficiencyLevel = proficiencyLevel; }

    public Integer getTimesReviewed() { return timesReviewed; }
    public void setTimesReviewed(Integer timesReviewed) { this.timesReviewed = timesReviewed; }

    public LocalDateTime getLastReviewedAt() { return lastReviewedAt; }
    public void setLastReviewedAt(LocalDateTime lastReviewedAt) { this.lastReviewedAt = lastReviewedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Manual Builder
    public static FlashcardBuilder builder() {
        return new FlashcardBuilder();
    }

    public static class FlashcardBuilder {
        private UUID flashcardId;
        private UUID studentId;
        private UUID studentDocumentId;
        private UUID subjectId;
        private String frontText;
        private String backText;
        private Integer sourcePage;
        private String sourceReference;
        private String difficulty = "MEDIUM";
        private String bloomLevel = "REMEMBER";
        private String proficiencyLevel = "NEW";
        private Integer timesReviewed = 0;
        private LocalDateTime lastReviewedAt;
        private String createdBy = "MANUAL";
        private LocalDateTime createdAt;

        public FlashcardBuilder flashcardId(UUID id) { this.flashcardId = id; return this; }
        public FlashcardBuilder studentId(UUID id) { this.studentId = id; return this; }
        public FlashcardBuilder studentDocumentId(UUID id) { this.studentDocumentId = id; return this; }
        public FlashcardBuilder subjectId(UUID id) { this.subjectId = id; return this; }
        public FlashcardBuilder frontText(String text) { this.frontText = text; return this; }
        public FlashcardBuilder backText(String text) { this.backText = text; return this; }
        public FlashcardBuilder sourcePage(Integer page) { this.sourcePage = page; return this; }
        public FlashcardBuilder sourceReference(String ref) { this.sourceReference = ref; return this; }
        public FlashcardBuilder difficulty(String diff) { this.difficulty = diff; return this; }
        public FlashcardBuilder bloomLevel(String bloom) { this.bloomLevel = bloom; return this; }
        public FlashcardBuilder proficiencyLevel(String prof) { this.proficiencyLevel = prof; return this; }
        public FlashcardBuilder timesReviewed(Integer times) { this.timesReviewed = times; return this; }
        public FlashcardBuilder lastReviewedAt(LocalDateTime date) { this.lastReviewedAt = date; return this; }
        public FlashcardBuilder createdBy(String creator) { this.createdBy = creator; return this; }
        public FlashcardBuilder createdAt(LocalDateTime date) { this.createdAt = date; return this; }

        public Flashcard build() {
            return new Flashcard(flashcardId, studentId, studentDocumentId, subjectId, frontText, backText, sourcePage, sourceReference, difficulty, bloomLevel, proficiencyLevel, timesReviewed, lastReviewedAt, createdBy, createdAt);
        }
    }
}