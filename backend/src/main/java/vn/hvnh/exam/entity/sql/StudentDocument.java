package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_documents")
public class StudentDocument {
    
    @Id
    @GeneratedValue
    @Column(name = "student_doc_id")
    private UUID studentDocId;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "subject_id")
    private UUID subjectId;
    
    @Column(name = "document_type", length = 50)
    private String documentType; // TEXTBOOK, SLIDE, SYLLABUS, NOTE
    
    @Column(name = "document_title", length = 500)
    private String documentTitle;
    
    @Column(name = "file_url", length = 1000)
    private String fileUrl;
    
    @Column(name = "file_type", length = 20)
    private String fileType; // pdf, docx, pptx
    
    @Column(name = "file_size_mb")
    private Double fileSizeMb;
    
    @Column(name = "total_pages")
    private Integer totalPages;
    
    @Column(name = "processing_status", length = 20)
    private String processingStatus = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED
    
    @Column(name = "is_indexed")
    private Boolean isIndexed = false;
    
    @Column(name = "is_ai_enabled")
    private Boolean isAiEnabled = true;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "uploader_role")
    private String uploaderRole;

    @Transient
    private Long flashcardCount;

    public StudentDocument() {}

    // Getters and Setters
    public UUID getStudentDocId() { return studentDocId; }
    public void setStudentDocId(UUID studentDocId) { this.studentDocId = studentDocId; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getDocumentTitle() { return documentTitle; }
    public void setDocumentTitle(String documentTitle) { this.documentTitle = documentTitle; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public Double getFileSizeMb() { return fileSizeMb; }
    public void setFileSizeMb(Double fileSizeMb) { this.fileSizeMb = fileSizeMb; }
    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }
    public Boolean getIsIndexed() { return isIndexed; }
    public void setIsIndexed(Boolean isIndexed) { this.isIndexed = isIndexed; }
    public Boolean getIsAiEnabled() { return isAiEnabled; }
    public void setIsAiEnabled(Boolean isAiEnabled) { this.isAiEnabled = isAiEnabled; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }
    public String getUploaderRole() { return uploaderRole; }
    public void setUploaderRole(String uploaderRole) { this.uploaderRole = uploaderRole; }

    public Long getFlashcardCount() { return flashcardCount; }
    public void setFlashcardCount(Long flashcardCount) { this.flashcardCount = flashcardCount; }

    public static class StudentDocumentBuilder {
        private StudentDocument doc = new StudentDocument();
        public StudentDocumentBuilder studentDocId(UUID id) { doc.studentDocId = id; return this; }
        public StudentDocumentBuilder studentId(UUID id) { doc.studentId = id; return this; }
        public StudentDocumentBuilder subjectId(UUID id) { doc.subjectId = id; return this; }
        public StudentDocumentBuilder documentType(String type) { doc.documentType = type; return this; }
        public StudentDocumentBuilder documentTitle(String title) { doc.documentTitle = title; return this; }
        public StudentDocumentBuilder isAiEnabled(Boolean enabled) { doc.isAiEnabled = enabled; return this; }
        public StudentDocument build() { return doc; }
    }
    public static StudentDocumentBuilder builder() { return new StudentDocumentBuilder(); }
}