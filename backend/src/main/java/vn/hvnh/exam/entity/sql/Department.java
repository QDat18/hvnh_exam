package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "department_id")
    private UUID id;

    @Column(name = "department_name", nullable = false)
    private String departmentName; // Tên bộ môn

    // Liên kết N-1: Nhiều bộ môn thuộc 1 Khoa
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Department() {}

    public Department(UUID id, String departmentName, Faculty faculty, LocalDateTime createdAt) {
        this.id = id;
        this.departmentName = departmentName;
        this.faculty = faculty;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Faculty getFaculty() { return faculty; }
    public void setFaculty(Faculty faculty) { this.faculty = faculty; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Manual Builder
    public static DepartmentBuilder builder() {
        return new DepartmentBuilder();
    }

    public static class DepartmentBuilder {
        private UUID id;
        private String departmentName;
        private Faculty faculty;
        private LocalDateTime createdAt;

        public DepartmentBuilder id(UUID id) { this.id = id; return this; }
        public DepartmentBuilder departmentName(String departmentName) { this.departmentName = departmentName; return this; }
        public DepartmentBuilder faculty(Faculty faculty) { this.faculty = faculty; return this; }
        public DepartmentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Department build() {
            return new Department(id, departmentName, faculty, createdAt);
        }
    }
}