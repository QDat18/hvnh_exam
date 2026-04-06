package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "class_students")
public class ClassStudent {
    
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Classes classEntity;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
    
    @Column(name = "enrollment_date")
    private LocalDate enrollmentDate;
    
    @Column(name = "status", length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, TRANSFERRED, GRADUATED
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    public ClassStudent() {}

    public ClassStudent(UUID id, Classes classEntity, User student, LocalDate enrollmentDate, String status, LocalDateTime createdAt, User createdBy) {
        this.id = id;
        this.classEntity = classEntity;
        this.student = student;
        this.enrollmentDate = enrollmentDate;
        this.status = status;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Classes getClassEntity() { return classEntity; }
    public void setClassEntity(Classes classEntity) { this.classEntity = classEntity; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public LocalDate getEnrollmentDate() { return enrollmentDate; }
    public void setEnrollmentDate(LocalDate enrollmentDate) { this.enrollmentDate = enrollmentDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (enrollmentDate == null) {
            enrollmentDate = LocalDate.now();
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }

    // Manual Builder
    public static ClassStudentBuilder builder() {
        return new ClassStudentBuilder();
    }

    public static class ClassStudentBuilder {
        private UUID id;
        private Classes classEntity;
        private User student;
        private LocalDate enrollmentDate;
        private String status = "ACTIVE";
        private LocalDateTime createdAt;
        private User createdBy;

        public ClassStudentBuilder id(UUID id) { this.id = id; return this; }
        public ClassStudentBuilder classEntity(Classes classEntity) { this.classEntity = classEntity; return this; }
        public ClassStudentBuilder student(User student) { this.student = student; return this; }
        public ClassStudentBuilder enrollmentDate(LocalDate enrollmentDate) { this.enrollmentDate = enrollmentDate; return this; }
        public ClassStudentBuilder status(String status) { this.status = status; return this; }
        public ClassStudentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ClassStudentBuilder createdBy(User createdBy) { this.createdBy = createdBy; return this; }

        public ClassStudent build() {
            return new ClassStudent(id, classEntity, student, enrollmentDate, status, createdAt, createdBy);
        }
    }
}