package vn.hvnh.exam.dto;

import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType;

import java.util.List;
import java.util.UUID;

public class QuestionRequest {
    private UUID subjectId;
    private UUID chapterId; 
    private UUID objectiveId; 
    private String questionText;
    private BloomLevel bloomLevel;       
    private DifficultyLevel difficultyLevel; 
    private QuestionType questionType;
    private String explanation;
    private List<AnswerRequest> answers;

    public QuestionRequest() {}

    public QuestionRequest(UUID subjectId, UUID chapterId, UUID objectiveId, String questionText, BloomLevel bloomLevel, DifficultyLevel difficultyLevel, QuestionType questionType, String explanation, List<AnswerRequest> answers) {
        this.subjectId = subjectId;
        this.chapterId = chapterId;
        this.objectiveId = objectiveId;
        this.questionText = questionText;
        this.bloomLevel = bloomLevel;
        this.difficultyLevel = difficultyLevel;
        this.questionType = questionType;
        this.explanation = explanation;
        this.answers = answers;
    }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public UUID getChapterId() { return chapterId; }
    public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }

    public UUID getObjectiveId() { return objectiveId; }
    public void setObjectiveId(UUID objectiveId) { this.objectiveId = objectiveId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public BloomLevel getBloomLevel() { return bloomLevel; }
    public void setBloomLevel(BloomLevel bloomLevel) { this.bloomLevel = bloomLevel; }

    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public List<AnswerRequest> getAnswers() { return answers; }
    public void setAnswers(List<AnswerRequest> answers) { this.answers = answers; }
}