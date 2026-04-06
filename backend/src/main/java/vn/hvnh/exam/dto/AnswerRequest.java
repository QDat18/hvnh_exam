package vn.hvnh.exam.dto;

public class AnswerRequest {
    private String answerText;
    private Boolean isCorrect;
    private String answerLabel;

    public AnswerRequest() {}

    public AnswerRequest(String answerText, Boolean isCorrect, String answerLabel) {
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.answerLabel = answerLabel;
    }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public String getAnswerLabel() { return answerLabel; }
    public void setAnswerLabel(String answerLabel) { this.answerLabel = answerLabel; }
}