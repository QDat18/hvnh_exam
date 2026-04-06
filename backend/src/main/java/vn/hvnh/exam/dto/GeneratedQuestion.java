package vn.hvnh.exam.dto;

import java.util.List;

public class GeneratedQuestion {
    private String questionText;
    private List<String> options;
    private String correctAnswer;
    private String difficulty;
    private String sourcePage;
    private String sourceChapter;

    public GeneratedQuestion() {}

    public GeneratedQuestion(String questionText, List<String> options, String correctAnswer, String difficulty, String sourcePage, String sourceChapter) {
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.difficulty = difficulty;
        this.sourcePage = sourcePage;
        this.sourceChapter = sourceChapter;
    }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getSourcePage() { return sourcePage; }
    public void setSourcePage(String sourcePage) { this.sourcePage = sourcePage; }

    public String getSourceChapter() { return sourceChapter; }
    public void setSourceChapter(String sourceChapter) { this.sourceChapter = sourceChapter; }

    public static GeneratedQuestionBuilder builder() {
        return new GeneratedQuestionBuilder();
    }

    public static class GeneratedQuestionBuilder {
        private String questionText;
        private List<String> options;
        private String correctAnswer;
        private String difficulty;
        private String sourcePage;
        private String sourceChapter;

        GeneratedQuestionBuilder() {}

        public GeneratedQuestionBuilder questionText(String questionText) {
            this.questionText = questionText;
            return this;
        }

        public GeneratedQuestionBuilder options(List<String> options) {
            this.options = options;
            return this;
        }

        public GeneratedQuestionBuilder correctAnswer(String correctAnswer) {
            this.correctAnswer = correctAnswer;
            return this;
        }

        public GeneratedQuestionBuilder difficulty(String difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public GeneratedQuestionBuilder sourcePage(String sourcePage) {
            this.sourcePage = sourcePage;
            return this;
        }

        public GeneratedQuestionBuilder sourceChapter(String sourceChapter) {
            this.sourceChapter = sourceChapter;
            return this;
        }

        public GeneratedQuestion build() {
            return new GeneratedQuestion(questionText, options, correctAnswer, difficulty, sourcePage, sourceChapter);
        }
    }
}