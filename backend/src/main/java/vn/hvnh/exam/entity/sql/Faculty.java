package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "faculties", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    
    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}