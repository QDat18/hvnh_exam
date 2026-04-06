package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

@Entity
@Table(name = "users", schema = "public")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements UserDetails {
    
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
    private String gender;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "default_password", length = 255)
    private String defaultPassword;

    @Column(name = "password_changed")
    private Boolean passwordChanged = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    public User() {}

    public User(UUID id, String email, String fullName, LocalDate dateOfBirth, String role, Boolean isFirstLogin, Faculty faculty, Department department, String status, String avatarUrl, LocalDateTime createdAt, LocalDateTime updatedAt, String studentId, String gender, String phoneNumber, String address, String defaultPassword, Boolean passwordChanged, User createdBy) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.role = role;
        this.isFirstLogin = isFirstLogin;
        this.faculty = faculty;
        this.department = department;
        this.status = status;
        this.avatarUrl = avatarUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.studentId = studentId;
        this.gender = gender;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.defaultPassword = defaultPassword;
        this.passwordChanged = (passwordChanged == null) ? false : passwordChanged;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Boolean getIsFirstLogin() { return isFirstLogin; }
    public void setIsFirstLogin(Boolean isFirstLogin) { this.isFirstLogin = isFirstLogin; }
    public Faculty getFaculty() { return faculty; }
    public void setFaculty(Faculty faculty) { this.faculty = faculty; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDefaultPassword() { return defaultPassword; }
    public void setDefaultPassword(String defaultPassword) { this.defaultPassword = defaultPassword; }
    public Boolean getPasswordChanged() { return passwordChanged; }
    public void setPasswordChanged(Boolean passwordChanged) { this.passwordChanged = passwordChanged; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        return defaultPassword != null ? defaultPassword : "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"INACTIVE".equals(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // Builder
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private UUID id;
        private String email;
        private String fullName;
        private LocalDate dateOfBirth;
        private String role;
        private Boolean isFirstLogin;
        private Faculty faculty;
        private Department department;
        private String status;
        private String avatarUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String studentId;
        private String gender;
        private String phoneNumber;
        private String address;
        private String defaultPassword;
        private Boolean passwordChanged = false;
        private User createdBy;

        public UserBuilder id(UUID id) { this.id = id; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UserBuilder dateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; return this; }
        public UserBuilder role(String role) { this.role = role; return this; }
        public UserBuilder isFirstLogin(Boolean isFirstLogin) { this.isFirstLogin = isFirstLogin; return this; }
        public UserBuilder faculty(Faculty faculty) { this.faculty = faculty; return this; }
        public UserBuilder department(Department department) { this.department = department; return this; }
        public UserBuilder status(String status) { this.status = status; return this; }
        public UserBuilder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public UserBuilder studentId(String studentId) { this.studentId = studentId; return this; }
        public UserBuilder gender(String gender) { this.gender = gender; return this; }
        public UserBuilder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public UserBuilder address(String address) { this.address = address; return this; }
        public UserBuilder defaultPassword(String defaultPassword) { this.defaultPassword = defaultPassword; return this; }
        public UserBuilder passwordChanged(Boolean passwordChanged) { this.passwordChanged = passwordChanged; return this; }
        public UserBuilder createdBy(User createdBy) { this.createdBy = createdBy; return this; }

        public User build() {
            return new User(id, email, fullName, dateOfBirth, role, isFirstLogin, faculty, department, status, avatarUrl, createdAt, updatedAt, studentId, gender, phoneNumber, address, defaultPassword, passwordChanged, createdBy);
        }
    }
}