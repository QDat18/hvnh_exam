package vn.hvnh.exam.entity.sql;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import vn.hvnh.exam.common.SubjectGroup;

@Entity
@Table(name = "subjects")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "subject_id")
    private UUID id;

    @Column(name = "subject_code", nullable = false, unique = true, length = 50)
    private String subjectCode;

    @Column(name = "subject_name", nullable = false, length = 255)
    private String subjectName;

    @Column(name = "credits")
    private Integer credits;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "subject_group", columnDefinition = "subject_group")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM) 
    private SubjectGroup subjectGroup;

    @Column(name = "exam_type", length = 50)
    private String examType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Subject() {}

    public Subject(UUID id, String subjectCode, String subjectName, Integer credits, String description, Boolean isActive, SubjectGroup subjectGroup, String examType, Department department, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.credits = (credits == null) ? 3 : credits;
        this.description = description;
        this.isActive = (isActive == null) ? true : isActive;
        this.subjectGroup = (subjectGroup == null) ? SubjectGroup.THEORY : subjectGroup;
        this.examType = (examType == null) ? "MULTIPLE_CHOICE" : examType;
        this.department = department;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public SubjectGroup getSubjectGroup() { return subjectGroup; }
    public void setSubjectGroup(SubjectGroup subjectGroup) { this.subjectGroup = subjectGroup; }
    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (credits == null) credits = 3;
        if (subjectGroup == null) subjectGroup = SubjectGroup.THEORY; 
        if (examType == null) examType = "MULTIPLE_CHOICE";
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Manual Builder
    public static SubjectBuilder builder() {
        return new SubjectBuilder();
    }

    public static class SubjectBuilder {
        private UUID id;
        private String subjectCode;
        private String subjectName;
        private Integer credits;
        private String description;
        private Boolean isActive;
        private SubjectGroup subjectGroup;
        private String examType;
        private Department department;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public SubjectBuilder id(UUID id) { this.id = id; return this; }
        public SubjectBuilder subjectCode(String subjectCode) { this.subjectCode = subjectCode; return this; }
        public SubjectBuilder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public SubjectBuilder credits(Integer credits) { this.credits = credits; return this; }
        public SubjectBuilder description(String description) { this.description = description; return this; }
        public SubjectBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public SubjectBuilder subjectGroup(SubjectGroup subjectGroup) { this.subjectGroup = subjectGroup; return this; }
        public SubjectBuilder examType(String examType) { this.examType = examType; return this; }
        public SubjectBuilder department(Department department) { this.department = department; return this; }
        public SubjectBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public SubjectBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Subject build() {
            return new Subject(id, subjectCode, subjectName, credits, description, isActive, subjectGroup, examType, department, createdAt, updatedAt);
        }
    }
}