package vn.hvnh.exam.entity.sql;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "question_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}