package vn.hvnh.exam.dto;

import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType;
import vn.hvnh.exam.entity.sql.Question;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class QuestionResponse {
    private UUID questionId;
    private String questionText;
    private DifficultyLevel difficultyLevel;
    private BloomLevel bloomLevel;
    private QuestionType questionType;
    private String explanation;
    private Integer usageCount;
    private LocalDateTime createdAt;
    private UUID subjectId;
    private String subjectName;
    private UUID chapterId;
    private String chapterName;
    private Integer chapterNumber;
    private List<AnswerResponse> answers;

    public QuestionResponse() {}

    public QuestionResponse(UUID questionId, String questionText, DifficultyLevel difficultyLevel, BloomLevel bloomLevel, QuestionType questionType, String explanation, Integer usageCount, LocalDateTime createdAt, UUID subjectId, String subjectName, UUID chapterId, String chapterName, Integer chapterNumber, List<AnswerResponse> answers) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.difficultyLevel = difficultyLevel;
        this.bloomLevel = bloomLevel;
        this.questionType = questionType;
        this.explanation = explanation;
        this.usageCount = usageCount;
        this.createdAt = createdAt;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.chapterId = chapterId;
        this.chapterName = chapterName;
        this.chapterNumber = chapterNumber;
        this.answers = answers;
    }

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public BloomLevel getBloomLevel() { return bloomLevel; }
    public void setBloomLevel(BloomLevel bloomLevel) { this.bloomLevel = bloomLevel; }

    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public UUID getChapterId() { return chapterId; }
    public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }

    public String getChapterName() { return chapterName; }
    public void setChapterName(String chapterName) { this.chapterName = chapterName; }

    public Integer getChapterNumber() { return chapterNumber; }
    public void setChapterNumber(Integer chapterNumber) { this.chapterNumber = chapterNumber; }

    public List<AnswerResponse> getAnswers() { return answers; }
    public void setAnswers(List<AnswerResponse> answers) { this.answers = answers; }

    public static QuestionResponse fromEntity(Question question) {
        if (question == null) return null;
        
        QuestionResponse response = new QuestionResponse();
        response.setQuestionId(question.getQuestionId());
        response.setQuestionText(question.getQuestionText());
        response.setDifficultyLevel(question.getDifficultyLevel());
        response.setBloomLevel(question.getBloomLevel());
        response.setQuestionType(question.getQuestionType());
        response.setExplanation(question.getExplanation());
        response.setUsageCount(question.getUsageCount());
        response.setCreatedAt(question.getCreatedAt());
        
        if (question.getSubject() != null) {
            response.setSubjectId(question.getSubject().getId());
            response.setSubjectName(question.getSubject().getSubjectName());
        }
        
        if (question.getChapter() != null) {
            response.setChapterId(question.getChapter().getChapterId());
            response.setChapterName(question.getChapter().getChapterName());
            response.setChapterNumber(question.getChapter().getChapterNumber());
        }
        
        if (question.getAnswers() != null) {
            response.setAnswers(question.getAnswers().stream()
                    .map(AnswerResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }

    // Builder
    public static class QuestionResponseBuilder {
        private UUID questionId;
        private String questionText;
        private DifficultyLevel difficultyLevel;
        private BloomLevel bloomLevel;
        private QuestionType questionType;
        private String explanation;
        private Integer usageCount;
        private LocalDateTime createdAt;
        private UUID subjectId;
        private String subjectName;
        private UUID chapterId;
        private String chapterName;
        private Integer chapterNumber;
        private List<AnswerResponse> answers;

        QuestionResponseBuilder() {}

        public QuestionResponseBuilder questionId(UUID questionId) { this.questionId = questionId; return this; }
        public QuestionResponseBuilder questionText(String questionText) { this.questionText = questionText; return this; }
        public QuestionResponseBuilder difficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; return this; }
        public QuestionResponseBuilder bloomLevel(BloomLevel bloomLevel) { this.bloomLevel = bloomLevel; return this; }
        public QuestionResponseBuilder questionType(QuestionType questionType) { this.questionType = questionType; return this; }
        public QuestionResponseBuilder explanation(String explanation) { this.explanation = explanation; return this; }
        public QuestionResponseBuilder usageCount(Integer usageCount) { this.usageCount = usageCount; return this; }
        public QuestionResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public QuestionResponseBuilder subjectId(UUID subjectId) { this.subjectId = subjectId; return this; }
        public QuestionResponseBuilder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public QuestionResponseBuilder chapterId(UUID chapterId) { this.chapterId = chapterId; return this; }
        public QuestionResponseBuilder chapterName(String chapterName) { this.chapterName = chapterName; return this; }
        public QuestionResponseBuilder chapterNumber(Integer chapterNumber) { this.chapterNumber = chapterNumber; return this; }
        public QuestionResponseBuilder answers(List<AnswerResponse> answers) { this.answers = answers; return this; }

        public QuestionResponse build() {
            return new QuestionResponse(questionId, questionText, difficultyLevel, bloomLevel, questionType, explanation, usageCount, createdAt, subjectId, subjectName, chapterId, chapterName, chapterNumber, answers);
        }
    }

    public static QuestionResponseBuilder builder() {
        return new QuestionResponseBuilder();
    }
}