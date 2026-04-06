package vn.hvnh.exam.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class QuestionTemplateDTO {
    private UUID subjectId;
    private UUID chapterId;
    private String questionPattern;
    private String formulaCorrect;
    private List<String> formulasDistractors;
    private Map<String, List<Integer>> variableRanges;
    private String explanationTemplate;

    public QuestionTemplateDTO() {}

    public QuestionTemplateDTO(UUID subjectId, UUID chapterId, String questionPattern, String formulaCorrect, List<String> formulasDistractors, Map<String, List<Integer>> variableRanges, String explanationTemplate) {
        this.subjectId = subjectId;
        this.chapterId = chapterId;
        this.questionPattern = questionPattern;
        this.formulaCorrect = formulaCorrect;
        this.formulasDistractors = formulasDistractors;
        this.variableRanges = variableRanges;
        this.explanationTemplate = explanationTemplate;
    }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public UUID getChapterId() { return chapterId; }
    public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }

    public String getQuestionPattern() { return questionPattern; }
    public void setQuestionPattern(String questionPattern) { this.questionPattern = questionPattern; }

    public String getFormulaCorrect() { return formulaCorrect; }
    public void setFormulaCorrect(String formulaCorrect) { this.formulaCorrect = formulaCorrect; }

    public List<String> getFormulasDistractors() { return formulasDistractors; }
    public void setFormulasDistractors(List<String> formulasDistractors) { this.formulasDistractors = formulasDistractors; }

    public Map<String, List<Integer>> getVariableRanges() { return variableRanges; }
    public void setVariableRanges(Map<String, List<Integer>> variableRanges) { this.variableRanges = variableRanges; }

    public String getExplanationTemplate() { return explanationTemplate; }
    public void setExplanationTemplate(String explanationTemplate) { this.explanationTemplate = explanationTemplate; }
}