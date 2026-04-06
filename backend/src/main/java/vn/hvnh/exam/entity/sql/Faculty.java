package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "faculties", schema = "public")
public class Faculty {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "faculty_id")
    private UUID id;
    
    @Column(name = "faculty_code", unique = true, nullable = false)
    private String facultyCode;
    
    @Column(name = "faculty_name", nullable = false)
    private String facultyName;
    
    @Column(name = "faculty_admin_id")
    private UUID facultyAdminId;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Faculty() {}

    public Faculty(UUID id, String facultyCode, String facultyName, UUID facultyAdminId, String description, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.facultyCode = facultyCode;
        this.facultyName = facultyName;
        this.facultyAdminId = facultyAdminId;
        this.description = description;
        this.isActive = (isActive == null) ? true : isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFacultyCode() { return facultyCode; }
    public void setFacultyCode(String facultyCode) { this.facultyCode = facultyCode; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public UUID getFacultyAdminId() { return facultyAdminId; }
    public void setFacultyAdminId(UUID facultyAdminId) { this.facultyAdminId = facultyAdminId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Manual Builder
    public static FacultyBuilder builder() {
        return new FacultyBuilder();
    }

    public static class FacultyBuilder {
        private UUID id;
        private String facultyCode;
        private String facultyName;
        private UUID facultyAdminId;
        private String description;
        private Boolean isActive = true;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public FacultyBuilder id(UUID id) { this.id = id; return this; }
        public FacultyBuilder facultyCode(String facultyCode) { this.facultyCode = facultyCode; return this; }
        public FacultyBuilder facultyName(String facultyName) { this.facultyName = facultyName; return this; }
        public FacultyBuilder facultyAdminId(UUID id) { this.facultyAdminId = id; return this; }
        public FacultyBuilder description(String description) { this.description = description; return this; }
        public FacultyBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public FacultyBuilder createdAt(LocalDateTime date) { this.createdAt = date; return this; }
        public FacultyBuilder updatedAt(LocalDateTime date) { this.updatedAt = date; return this; }

        public Faculty build() {
            return new Faculty(id, facultyCode, facultyName, facultyAdminId, description, isActive, createdAt, updatedAt);
        }
    }
}