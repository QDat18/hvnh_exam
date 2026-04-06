package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "classes")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Classes {
    
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "class_id", updatable = false, nullable = false)
    private UUID id;
    
    @Column(name = "class_code", unique = true, nullable = false, length = 50)
    private String classCode;
    
    @Column(name = "class_name", nullable = false)
    private String className;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;
    
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;
    
    @Column(name = "semester")
    private Integer semester;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_teacher_id")
    private User advisorTeacher;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "max_students")
    private Integer maxStudents = 50;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    public Classes() {}

    public Classes(UUID id, String classCode, String className, Faculty faculty, String academicYear, Integer semester, User advisorTeacher, String description, Integer maxStudents, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt, User createdBy) {
        this.id = id;
        this.classCode = classCode;
        this.className = className;
        this.faculty = faculty;
        this.academicYear = academicYear;
        this.semester = semester;
        this.advisorTeacher = advisorTeacher;
        this.description = description;
        this.maxStudents = (maxStudents == null) ? 50 : maxStudents;
        this.isActive = (isActive == null) ? true : isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public Faculty getFaculty() { return faculty; }
    public void setFaculty(Faculty faculty) { this.faculty = faculty; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public User getAdvisorTeacher() { return advisorTeacher; }
    public void setAdvisorTeacher(User advisorTeacher) { this.advisorTeacher = advisorTeacher; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (maxStudents == null) {
            maxStudents = 50;
        }
        if (isActive == null) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Manual Builder
    public static ClassesBuilder builder() {
        return new ClassesBuilder();
    }

    public static class ClassesBuilder {
        private UUID id;
        private String classCode;
        private String className;
        private Faculty faculty;
        private String academicYear;
        private Integer semester;
        private User advisorTeacher;
        private String description;
        private Integer maxStudents = 50;
        private Boolean isActive = true;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private User createdBy;

        public ClassesBuilder id(UUID id) { this.id = id; return this; }
        public ClassesBuilder classCode(String classCode) { this.classCode = classCode; return this; }
        public ClassesBuilder className(String className) { this.className = className; return this; }
        public ClassesBuilder faculty(Faculty faculty) { this.faculty = faculty; return this; }
        public ClassesBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public ClassesBuilder semester(Integer semester) { this.semester = semester; return this; }
        public ClassesBuilder advisorTeacher(User advisorTeacher) { this.advisorTeacher = advisorTeacher; return this; }
        public ClassesBuilder description(String description) { this.description = description; return this; }
        public ClassesBuilder maxStudents(Integer maxStudents) { this.maxStudents = maxStudents; return this; }
        public ClassesBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public ClassesBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ClassesBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public ClassesBuilder createdBy(User createdBy) { this.createdBy = createdBy; return this; }

        public Classes build() {
            return new Classes(id, classCode, className, faculty, academicYear, semester, advisorTeacher, description, maxStudents, isActive, createdAt, updatedAt, createdBy);
        }
    }
}