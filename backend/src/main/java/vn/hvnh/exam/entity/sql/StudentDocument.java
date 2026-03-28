package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Builder.Default
    private String processingStatus = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED
    
    @Column(name = "is_indexed")
    @Builder.Default
    private Boolean isIndexed = false;
    
    @Column(name = "is_ai_enabled")
    @Builder.Default
    private Boolean isAiEnabled = true;
    
    @Column(name = "is_active")
    @Builder.Default
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

    public String getUploaderRole() {
        return uploaderRole;
    }

    public void setUploaderRole(String uploaderRole) {
        this.uploaderRole = uploaderRole;
    }
    // Bác nhớ thêm Getter/Setter cho nó (hoặc nếu dùng @Data của Lombok thì không cần viết thêm hàm getExtractedText() nữa)
    public String getExtractedText() {
        return extractedText;
    }
    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }
}