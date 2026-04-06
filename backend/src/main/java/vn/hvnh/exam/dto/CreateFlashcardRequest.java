package vn.hvnh.exam.dto;

import java.util.UUID;

public class CreateFlashcardRequest {
    private UUID studentDocumentId;
    private UUID subjectId;
    private String frontText;
    private String backText;
    private String difficulty; // EASY, MEDIUM, HARD

    public CreateFlashcardRequest() {}

    public UUID getStudentDocumentId() { return studentDocumentId; }
    public void setStudentDocumentId(UUID studentDocumentId) { this.studentDocumentId = studentDocumentId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }
    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}
