package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "course_class_students", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"course_class_id", "student_id"})
})
public class CourseClassStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_class_id", nullable = false)
    private CourseClass courseClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "status", length = 20)
    private String status;

    public CourseClassStudent() {}

    public CourseClassStudent(UUID id, CourseClass courseClass, User student, LocalDateTime joinedAt, String status) {
        this.id = id;
        this.courseClass = courseClass;
        this.student = student;
        this.joinedAt = joinedAt;
        this.status = (status == null) ? "ACTIVE" : status;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public CourseClass getCourseClass() { return courseClass; }
    public void setCourseClass(CourseClass courseClass) { this.courseClass = courseClass; }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }

    // Manual Builder
    public static CourseClassStudentBuilder builder() {
        return new CourseClassStudentBuilder();
    }

    public static class CourseClassStudentBuilder {
        private UUID id;
        private CourseClass courseClass;
        private User student;
        private LocalDateTime joinedAt;
        private String status = "ACTIVE";

        public CourseClassStudentBuilder id(UUID id) { this.id = id; return this; }
        public CourseClassStudentBuilder courseClass(CourseClass courseClass) { this.courseClass = courseClass; return this; }
        public CourseClassStudentBuilder student(User student) { this.student = student; return this; }
        public CourseClassStudentBuilder joinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; return this; }
        public CourseClassStudentBuilder status(String status) { this.status = status; return this; }

        public CourseClassStudent build() {
            return new CourseClassStudent(id, courseClass, student, joinedAt, status);
        }
    }
}