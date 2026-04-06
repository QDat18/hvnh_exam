package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import java.security.SecureRandom;

@Entity
@Table(name = "course_classes")
public class CourseClass {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "course_class_id")
    private UUID id;

    @Column(name = "class_code", nullable = false, unique = true, length = 50)
    private String classCode;

    @Column(name = "class_name", nullable = false, length = 255)
    private String className;

    @Column(name = "semester", nullable = false, length = 20)
    private String semester;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(name = "join_code", unique = true, length = 10)
    private String joinCode;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public CourseClass() {}

    public CourseClass(UUID id, String classCode, String className, String semester, String academicYear, Subject subject, User teacher, String joinCode, Integer maxStudents, String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.classCode = classCode;
        this.className = className;
        this.semester = semester;
        this.academicYear = academicYear;
        this.subject = subject;
        this.teacher = teacher;
        this.joinCode = joinCode;
        this.maxStudents = (maxStudents == null) ? 60 : maxStudents;
        this.status = (status == null) ? "ACTIVE" : status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        
        if (this.joinCode == null || this.joinCode.isEmpty()) {
            this.joinCode = generateJoinCode(6);
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public User getTeacher() { return teacher; }
    public void setTeacher(User teacher) { this.teacher = teacher; }

    public String getJoinCode() { return joinCode; }
    public void setJoinCode(String joinCode) { this.joinCode = joinCode; }

    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (maxStudents == null) maxStudents = 60;

        if (joinCode == null || joinCode.isEmpty()) {
            this.joinCode = generateJoinCode(6);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private String generateJoinCode(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(characters.charAt(random.nextInt(characters.length())));
        }
        return sb.toString();
    }

    // Manual Builder
    public static CourseClassBuilder builder() {
        return new CourseClassBuilder();
    }

    public static class CourseClassBuilder {
        private UUID id;
        private String classCode;
        private String className;
        private String semester;
        private String academicYear;
        private Subject subject;
        private User teacher;
        private String joinCode;
        private Integer maxStudents = 60;
        private String status = "ACTIVE";
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CourseClassBuilder id(UUID id) { this.id = id; return this; }
        public CourseClassBuilder classCode(String classCode) { this.classCode = classCode; return this; }
        public CourseClassBuilder className(String className) { this.className = className; return this; }
        public CourseClassBuilder semester(String semester) { this.semester = semester; return this; }
        public CourseClassBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public CourseClassBuilder subject(Subject subject) { this.subject = subject; return this; }
        public CourseClassBuilder teacher(User teacher) { this.teacher = teacher; return this; }
        public CourseClassBuilder joinCode(String joinCode) { this.joinCode = joinCode; return this; }
        public CourseClassBuilder maxStudents(Integer maxStudents) { this.maxStudents = maxStudents; return this; }
        public CourseClassBuilder status(String status) { this.status = status; return this; }
        public CourseClassBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CourseClassBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public CourseClass build() {
            return new CourseClass(id, classCode, className, semester, academicYear, subject, teacher, joinCode, maxStudents, status, createdAt, updatedAt);
        }
    }
}