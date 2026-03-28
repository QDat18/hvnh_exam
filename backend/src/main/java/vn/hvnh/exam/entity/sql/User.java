package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import vn.hvnh.exam.entity.sql.Department;
import vn.hvnh.exam.entity.sql.Faculty;

import java.time.LocalDateTime;
import java.util.UUID;

import java.time.LocalDate;
@Entity
@Table(name = "users", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id
    @Column(name = "user_id")
    private UUID id;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "role")
    private String role; 

    @Column(name = "is_first_login")
    private Boolean isFirstLogin;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "status")
    private String status;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "student_id", unique = true, length = 20)
    private String studentId;

    @Column(name = "gender", length = 10)
    private String gender; // Giới tính (Nam / Nữ)

    @Column(name = "phone_number", length = 15)
    private String phoneNumber; // Số điện thoại

    @Column(name = "address", columnDefinition = "TEXT")
    private String address; // Địa chỉ (Quê quán)

    /**
     * Mật khẩu mặc định được tạo tự động
     * Format: Hvnh@{year}{4-digit-random}
     * VD: Hvnh@20241234
     * Được hiển thị 1 lần duy nhất khi tạo account
     */
    @Column(name = "default_password", length = 255)
    private String defaultPassword;
    @Builder.Default
    @Column(name = "password_changed")
    private Boolean passwordChanged = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}