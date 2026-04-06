package vn.hvnh.exam.entity.sql;

import java.time.LocalDateTime; 
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType;

@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "question_id")
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable=true)
    private Chapter chapter;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    private DifficultyLevel difficultyLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "bloom_level")
    private BloomLevel bloomLevel;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference 
    private List<Answer> answers; 

    @Column(name = "is_active")
    @ColumnDefault("true")
    private Boolean isActive = true;

    @Column(name = "is_verified")
    @ColumnDefault("false")
    private Boolean isVerified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType = QuestionType.MCQ_SINGLE;

    @Column(name = "topic")
    private String topic; 

    @Column(name = "tags")
    private String tags; 

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation; 

    @Column(name = "usage_count")
    @ColumnDefault("0")
    private Integer usageCount = 0; 

    public Question() {}

    public Question(UUID questionId, Subject subject, Chapter chapter, String questionText, DifficultyLevel difficultyLevel, BloomLevel bloomLevel, List<Answer> answers, Boolean isActive, Boolean isVerified, LocalDateTime createdAt, QuestionType questionType, String topic, String tags, String explanation, Integer usageCount) {
        this.questionId = questionId;
        this.subject = subject;
        this.chapter = chapter;
        this.questionText = questionText;
        this.difficultyLevel = difficultyLevel;
        this.bloomLevel = bloomLevel;
        this.answers = answers;
        this.isActive = isActive;
        this.isVerified = isVerified;
        this.createdAt = createdAt;
        this.questionType = questionType;
        this.topic = topic;
        this.tags = tags;
        this.explanation = explanation;
        this.usageCount = usageCount;
    }

    public vn.hvnh.exam.entity.sql.Answer getCorrectAnswer() {
        if (this.answers == null) return null;

        return this.answers.stream()
                .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                .findFirst()
                .orElse(null);
    }

    // Getters and Setters
    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }
    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }
    public Chapter getChapter() { return chapter; }
    public void setChapter(Chapter chapter) { this.chapter = chapter; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public BloomLevel getBloomLevel() { return bloomLevel; }
    public void setBloomLevel(BloomLevel bloomLevel) { this.bloomLevel = bloomLevel; }
    public List<Answer> getAnswers() { return answers; }
    public void setAnswers(List<Answer> answers) { this.answers = answers; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }

    // Manual Builder
    public static QuestionBuilder builder() {
        return new QuestionBuilder();
    }

    public static class QuestionBuilder {
        private UUID questionId;
        private Subject subject;
        private Chapter chapter;
        private String questionText;
        private DifficultyLevel difficultyLevel;
        private BloomLevel bloomLevel;
        private List<Answer> answers;
        private Boolean isActive = true;
        private Boolean isVerified = false;
        private LocalDateTime createdAt;
        private QuestionType questionType = QuestionType.MCQ_SINGLE;
        private String topic;
        private String tags;
        private String explanation;
        private Integer usageCount = 0;

        public QuestionBuilder questionId(UUID questionId) { this.questionId = questionId; return this; }
        public QuestionBuilder subject(Subject subject) { this.subject = subject; return this; }
        public QuestionBuilder chapter(Chapter chapter) { this.chapter = chapter; return this; }
        public QuestionBuilder questionText(String questionText) { this.questionText = questionText; return this; }
        public QuestionBuilder difficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; return this; }
        public QuestionBuilder bloomLevel(BloomLevel bloomLevel) { this.bloomLevel = bloomLevel; return this; }
        public QuestionBuilder answers(List<Answer> answers) { this.answers = answers; return this; }
        public QuestionBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public QuestionBuilder isVerified(Boolean isVerified) { this.isVerified = isVerified; return this; }
        public QuestionBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public QuestionBuilder questionType(QuestionType questionType) { this.questionType = questionType; return this; }
        public QuestionBuilder topic(String topic) { this.topic = topic; return this; }
        public QuestionBuilder tags(String tags) { this.tags = tags; return this; }
        public QuestionBuilder explanation(String explanation) { this.explanation = explanation; return this; }
        public QuestionBuilder usageCount(Integer usageCount) { this.usageCount = usageCount; return this; }

        public Question build() {
            return new Question(questionId, subject, chapter, questionText, difficultyLevel, bloomLevel, answers, isActive, isVerified, createdAt, questionType, topic, tags, explanation, usageCount);
        }
    }
}