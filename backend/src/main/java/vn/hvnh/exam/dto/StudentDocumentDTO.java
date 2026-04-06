package vn.hvnh.exam.dto;

import java.util.UUID;

public class StudentDocumentDTO {
    private UUID documentId;
    private String fileName;
    private String processingStatus;
    private String uploaderRole;
    private String fileUrl;
    private Integer flashcardCount;

    public StudentDocumentDTO() {}

    public StudentDocumentDTO(UUID documentId, String fileName, String processingStatus, String uploaderRole, String fileUrl, Integer flashcardCount) {
        this.documentId = documentId;
        this.fileName = fileName;
        this.processingStatus = processingStatus;
        this.uploaderRole = uploaderRole;
        this.fileUrl = fileUrl;
        this.flashcardCount = flashcardCount;
    }

    // Manual Getters & Setters
    public UUID getDocumentId() { return documentId; }
    public void setDocumentId(UUID documentId) { this.documentId = documentId; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }
    
    public String getUploaderRole() { return uploaderRole; }
    public void setUploaderRole(String uploaderRole) { this.uploaderRole = uploaderRole; }
    
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    
    public Integer getFlashcardCount() { return flashcardCount; }
    public void setFlashcardCount(Integer flashcardCount) { this.flashcardCount = flashcardCount; }

    // Static Builder for convenience (mimicking Lombok's @Builder)
    public static StudentDocumentDTOBuilder builder() {
        return new StudentDocumentDTOBuilder();
    }

    public static class StudentDocumentDTOBuilder {
        private UUID documentId;
        private String fileName;
        private String processingStatus;
        private String uploaderRole;
        private String fileUrl;
        private Integer flashcardCount;

        public StudentDocumentDTOBuilder documentId(UUID documentId) { this.documentId = documentId; return this; }
        public StudentDocumentDTOBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public StudentDocumentDTOBuilder processingStatus(String processingStatus) { this.processingStatus = processingStatus; return this; }
        public StudentDocumentDTOBuilder uploaderRole(String uploaderRole) { this.uploaderRole = uploaderRole; return this; }
        public StudentDocumentDTOBuilder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public StudentDocumentDTOBuilder flashcardCount(Integer flashcardCount) { this.flashcardCount = flashcardCount; return this; }

        public StudentDocumentDTO build() {
            return new StudentDocumentDTO(documentId, fileName, processingStatus, uploaderRole, fileUrl, flashcardCount);
        }
    }
}
