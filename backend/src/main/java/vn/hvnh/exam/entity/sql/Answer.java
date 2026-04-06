package vn.hvnh.exam.entity.sql;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "answers")
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "answer_id")
    private UUID answerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    @JsonBackReference
    private Question question;

    @Column(name = "answer_text", nullable = false, columnDefinition = "text")
    private String answerText;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "answer_label", columnDefinition = "bpchar(1)") 
    private String answerLabel;

    public Answer() {}

    public Answer(UUID answerId, Question question, String answerText, Boolean isCorrect, String answerLabel) {
        this.answerId = answerId;
        this.question = question;
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.answerLabel = answerLabel;
    }

    // Getters and Setters
    public UUID getAnswerId() { return answerId; }
    public void setAnswerId(UUID answerId) { this.answerId = answerId; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    public String getAnswerLabel() { return answerLabel; }
    public void setAnswerLabel(String answerLabel) { this.answerLabel = answerLabel; }

    // Manual Builder
    public static AnswerBuilder builder() {
        return new AnswerBuilder();
    }

    public static class AnswerBuilder {
        private UUID answerId;
        private Question question;
        private String answerText;
        private Boolean isCorrect;
        private String answerLabel;

        public AnswerBuilder answerId(UUID answerId) { this.answerId = answerId; return this; }
        public AnswerBuilder question(Question question) { this.question = question; return this; }
        public AnswerBuilder answerText(String answerText) { this.answerText = answerText; return this; }
        public AnswerBuilder isCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; return this; }
        public AnswerBuilder answerLabel(String answerLabel) { this.answerLabel = answerLabel; return this; }

        public Answer build() {
            return new Answer(answerId, question, answerText, isCorrect, answerLabel);
        }
    }
}