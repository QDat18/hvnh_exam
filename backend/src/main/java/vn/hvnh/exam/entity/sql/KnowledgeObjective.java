package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "knowledge_objectives")
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

    public KnowledgeObjective() {}

    public KnowledgeObjective(UUID objectiveId, Chapter chapter, String objectiveCode, String objectiveName, String importanceLevel) {
        this.objectiveId = objectiveId;
        this.chapter = chapter;
        this.objectiveCode = objectiveCode;
        this.objectiveName = objectiveName;
        this.importanceLevel = importanceLevel;
    }

    public UUID getObjectiveId() { return objectiveId; }
    public void setObjectiveId(UUID objectiveId) { this.objectiveId = objectiveId; }
    public Chapter getChapter() { return chapter; }
    public void setChapter(Chapter chapter) { this.chapter = chapter; }
    public String getObjectiveCode() { return objectiveCode; }
    public void setObjectiveCode(String objectiveCode) { this.objectiveCode = objectiveCode; }
    public String getObjectiveName() { return objectiveName; }
    public void setObjectiveName(String objectiveName) { this.objectiveName = objectiveName; }
    public String getImportanceLevel() { return importanceLevel; }
    public void setImportanceLevel(String importanceLevel) { this.importanceLevel = importanceLevel; }

    public static KnowledgeObjectiveBuilder builder() {
        return new KnowledgeObjectiveBuilder();
    }

    public static class KnowledgeObjectiveBuilder {
        private UUID objectiveId;
        private Chapter chapter;
        private String objectiveCode;
        private String objectiveName;
        private String importanceLevel;

        public KnowledgeObjectiveBuilder objectiveId(UUID objectiveId) { this.objectiveId = objectiveId; return this; }
        public KnowledgeObjectiveBuilder chapter(Chapter chapter) { this.chapter = chapter; return this; }
        public KnowledgeObjectiveBuilder objectiveCode(String objectiveCode) { this.objectiveCode = objectiveCode; return this; }
        public KnowledgeObjectiveBuilder objectiveName(String objectiveName) { this.objectiveName = objectiveName; return this; }
        public KnowledgeObjectiveBuilder importanceLevel(String importanceLevel) { this.importanceLevel = importanceLevel; return this; }

        public KnowledgeObjective build() {
            return new KnowledgeObjective(objectiveId, chapter, objectiveCode, objectiveName, importanceLevel);
        }
    }
}