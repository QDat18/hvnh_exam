package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "knowledge_objectives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeObjective {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "objective_id")
    private UUID objectiveId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(name = "objective_code")
    private String objectiveCode;

    @Column(name = "objective_name", nullable = false)
    private String objectiveName;

    @Column(name = "importance_level")
    private String importanceLevel;
}