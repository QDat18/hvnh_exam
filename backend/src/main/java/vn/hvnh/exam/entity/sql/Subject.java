package vn.hvnh.exam.entity.sql;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.hvnh.exam.common.SubjectGroup;

@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO) // Postgres tự sinh UUID_V4
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

    // Mối quan hệ N-1 với bảng Departments
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (credits == null) credits = 3;
        // 🔥 ĐỔI THÀNH ENUM
        if (subjectGroup == null) subjectGroup = SubjectGroup.THEORY; 
        if (examType == null) examType = "MULTIPLE_CHOICE";
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    
}