package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.Question;

public class QuestionResult {
    private Question question;
    private String selectedAnswer;
    private String correctAnswer;
    private Boolean isCorrect;

    public QuestionResult() {}

    public QuestionResult(Question question, String selectedAnswer, String correctAnswer, Boolean isCorrect) {
        this.question = question;
        this.selectedAnswer = selectedAnswer;
        this.correctAnswer = correctAnswer;
        this.isCorrect = isCorrect;
    }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public String getSelectedAnswer() { return selectedAnswer; }
    public void setSelectedAnswer(String selectedAnswer) { this.selectedAnswer = selectedAnswer; }
    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Question question;
        private String selectedAnswer;
        private String correctAnswer;
        private Boolean isCorrect;

        public Builder question(Question question) { this.question = question; return this; }
        public Builder selectedAnswer(String selectedAnswer) { this.selectedAnswer = selectedAnswer; return this; }
        public Builder correctAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; return this; }
        public Builder isCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; return this; }

        public QuestionResult build() {
            return new QuestionResult(question, selectedAnswer, correctAnswer, isCorrect);
        }
    }
}