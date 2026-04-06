package vn.hvnh.exam.entity.sql;
import jakarta.persistence.*;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "question_templates")
public class QuestionTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "template_id")
    private UUID templateId;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @Column(name = "question_pattern", nullable = false, columnDefinition = "text")
    private String questionPattern;

    @Column(name = "formula_correct", nullable = false)
    private String formulaCorrect;

    // Lưu JSON String: ["ct_sai_1", "ct_sai_2"]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "formulas_distractors", columnDefinition = "jsonb")
    private String formulasDistractors;

    // Lưu JSON String: {"a": [1, 10], "x": [1, 5]}
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variable_ranges", columnDefinition = "jsonb")
    private String variableRanges;

    @Column(name = "explanation_template", columnDefinition = "text")
    private String explanationTemplate;

    public QuestionTemplate() {}

    public QuestionTemplate(UUID templateId, Subject subject, Chapter chapter, String questionPattern, String formulaCorrect, String formulasDistractors, String variableRanges, String explanationTemplate) {
        this.templateId = templateId;
        this.subject = subject;
        this.chapter = chapter;
        this.questionPattern = questionPattern;
        this.formulaCorrect = formulaCorrect;
        this.formulasDistractors = formulasDistractors;
        this.variableRanges = variableRanges;
        this.explanationTemplate = explanationTemplate;
    }

    public UUID getTemplateId() { return templateId; }
    public void setTemplateId(UUID templateId) { this.templateId = templateId; }
    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }
    public Chapter getChapter() { return chapter; }
    public void setChapter(Chapter chapter) { this.chapter = chapter; }
    public String getQuestionPattern() { return questionPattern; }
    public void setQuestionPattern(String questionPattern) { this.questionPattern = questionPattern; }
    public String getFormulaCorrect() { return formulaCorrect; }
    public void setFormulaCorrect(String formulaCorrect) { this.formulaCorrect = formulaCorrect; }
    public String getFormulasDistractors() { return formulasDistractors; }
    public void setFormulasDistractors(String formulasDistractors) { this.formulasDistractors = formulasDistractors; }
    public String getVariableRanges() { return variableRanges; }
    public void setVariableRanges(String variableRanges) { this.variableRanges = variableRanges; }
    public String getExplanationTemplate() { return explanationTemplate; }
    public void setExplanationTemplate(String explanationTemplate) { this.explanationTemplate = explanationTemplate; }

    public static QuestionTemplateBuilder builder() {
        return new QuestionTemplateBuilder();
    }

    public static class QuestionTemplateBuilder {
        private UUID templateId;
        private Subject subject;
        private Chapter chapter;
        private String questionPattern;
        private String formulaCorrect;
        private String formulasDistractors;
        private String variableRanges;
        private String explanationTemplate;

        public QuestionTemplateBuilder templateId(UUID templateId) { this.templateId = templateId; return this; }
        public QuestionTemplateBuilder subject(Subject subject) { this.subject = subject; return this; }
        public QuestionTemplateBuilder chapter(Chapter chapter) { this.chapter = chapter; return this; }
        public QuestionTemplateBuilder questionPattern(String questionPattern) { this.questionPattern = questionPattern; return this; }
        public QuestionTemplateBuilder formulaCorrect(String formulaCorrect) { this.formulaCorrect = formulaCorrect; return this; }
        public QuestionTemplateBuilder formulasDistractors(String formulasDistractors) { this.formulasDistractors = formulasDistractors; return this; }
        public QuestionTemplateBuilder variableRanges(String variableRanges) { this.variableRanges = variableRanges; return this; }
        public QuestionTemplateBuilder explanationTemplate(String explanationTemplate) { this.explanationTemplate = explanationTemplate; return this; }

        public QuestionTemplate build() {
            return new QuestionTemplate(templateId, subject, chapter, questionPattern, formulaCorrect, formulasDistractors, variableRanges, explanationTemplate);
        }
    }
}