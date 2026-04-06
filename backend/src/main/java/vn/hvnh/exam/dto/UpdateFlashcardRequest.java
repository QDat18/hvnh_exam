package vn.hvnh.exam.dto;

public class UpdateFlashcardRequest {
    private String frontText;
    private String backText;
    private String difficulty; // EASY, MEDIUM, HARD

    public UpdateFlashcardRequest() {}

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }
    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
}
