package vn.hvnh.exam.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class QuizFromDocumentResponse {
    private UUID quizId;
    private UUID documentId;
    private List<GeneratedQuestion> questions;
    private Integer totalQuestions;
    private LocalDateTime generatedAt;

    public QuizFromDocumentResponse() {}

    public QuizFromDocumentResponse(UUID quizId, UUID documentId, List<GeneratedQuestion> questions, Integer totalQuestions, LocalDateTime generatedAt) {
        this.quizId = quizId;
        this.documentId = documentId;
        this.questions = questions;
        this.totalQuestions = totalQuestions;
        this.generatedAt = generatedAt;
    }

    public UUID getQuizId() { return quizId; }
    public void setQuizId(UUID quizId) { this.quizId = quizId; }

    public UUID getDocumentId() { return documentId; }
    public void setDocumentId(UUID documentId) { this.documentId = documentId; }

    public List<GeneratedQuestion> getQuestions() { return questions; }
    public void setQuestions(List<GeneratedQuestion> questions) { this.questions = questions; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public static QuizFromDocumentResponseBuilder builder() {
        return new QuizFromDocumentResponseBuilder();
    }

    public static class QuizFromDocumentResponseBuilder {
        private UUID quizId;
        private UUID documentId;
        private List<GeneratedQuestion> questions;
        private Integer totalQuestions;
        private LocalDateTime generatedAt;

        QuizFromDocumentResponseBuilder() {}

        public QuizFromDocumentResponseBuilder quizId(UUID quizId) {
            this.quizId = quizId;
            return this;
        }

        public QuizFromDocumentResponseBuilder documentId(UUID documentId) {
            this.documentId = documentId;
            return this;
        }

        public QuizFromDocumentResponseBuilder questions(List<GeneratedQuestion> questions) {
            this.questions = questions;
            return this;
        }

        public QuizFromDocumentResponseBuilder totalQuestions(Integer totalQuestions) {
            this.totalQuestions = totalQuestions;
            return this;
        }

        public QuizFromDocumentResponseBuilder generatedAt(LocalDateTime generatedAt) {
            this.generatedAt = generatedAt;
            return this;
        }

        public QuizFromDocumentResponse build() {
            return new QuizFromDocumentResponse(quizId, documentId, questions, totalQuestions, generatedAt);
        }
    }
}