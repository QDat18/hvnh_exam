package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "class_students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    
    @Builder.Default
    @Column(name = "status", length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, TRANSFERRED, GRADUATED
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
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
}