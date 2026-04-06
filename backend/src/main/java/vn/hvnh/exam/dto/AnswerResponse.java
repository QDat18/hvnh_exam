package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.Answer;
import java.util.UUID;

public class AnswerResponse {
    private UUID answerId;
    private String answerText;
    private Boolean isCorrect;
    private String answerLabel;

    public AnswerResponse() {}

    public AnswerResponse(UUID answerId, String answerText, Boolean isCorrect, String answerLabel) {
        this.answerId = answerId;
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.answerLabel = answerLabel;
    }

    public UUID getAnswerId() { return answerId; }
    public void setAnswerId(UUID answerId) { this.answerId = answerId; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public String getAnswerLabel() { return answerLabel; }
    public void setAnswerLabel(String answerLabel) { this.answerLabel = answerLabel; }

    public static AnswerResponse fromEntity(Answer answer) {
        if (answer == null) return null;
        return new AnswerResponse(
                answer.getAnswerId(),
                answer.getAnswerText(),
                answer.getIsCorrect(),
                answer.getAnswerLabel()
        );
    }

    public static AnswerResponseBuilder builder() {
        return new AnswerResponseBuilder();
    }

    public static class AnswerResponseBuilder {
        private UUID answerId;
        private String answerText;
        private Boolean isCorrect;
        private String answerLabel;

        AnswerResponseBuilder() {}

        public AnswerResponseBuilder answerId(UUID answerId) {
            this.answerId = answerId;
            return this;
        }

        public AnswerResponseBuilder answerText(String answerText) {
            this.answerText = answerText;
            return this;
        }

        public AnswerResponseBuilder isCorrect(Boolean isCorrect) {
            this.isCorrect = isCorrect;
            return this;
        }

        public AnswerResponseBuilder answerLabel(String answerLabel) {
            this.answerLabel = answerLabel;
            return this;
        }

        public AnswerResponse build() {
            return new AnswerResponse(answerId, answerText, isCorrect, answerLabel);
        }
    }
}