package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.User;

import java.util.UUID;

public class UserProfileDto {
    private UUID id;
    private String email;
    private String fullName;
    private String role; 
    private String avatarUrl;
    private boolean isFirstLogin; 
    private UUID facultyId;
    private String facultyName;
    private UUID departmentId;
    private String departmentName;

    public UserProfileDto() {}

    public UserProfileDto(UUID id, String email, String fullName, String role, String avatarUrl, boolean isFirstLogin, UUID facultyId, String facultyName, UUID departmentId, String departmentName) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.avatarUrl = avatarUrl;
        this.isFirstLogin = isFirstLogin;
        this.facultyId = facultyId;
        this.facultyName = facultyName;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public boolean isFirstLogin() { return isFirstLogin; }
    public void setFirstLogin(boolean firstLogin) { isFirstLogin = firstLogin; }

    public UUID getFacultyId() { return facultyId; }
    public void setFacultyId(UUID facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public static UserProfileDto fromEntity(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setFirstLogin(user.getIsFirstLogin());
        dto.setFacultyId(user.getFaculty() != null ? user.getFaculty().getId() : null);
        dto.setFacultyName(user.getFaculty() != null ? user.getFaculty().getFacultyName() : "");
        dto.setDepartmentId(user.getDepartment() != null ? user.getDepartment().getId() : null);
        dto.setDepartmentName(user.getDepartment() != null ? user.getDepartment().getDepartmentName() : "");
        return dto;
    }

    // Builder
    public static class UserProfileDtoBuilder {
        private UUID id;
        private String email;
        private String fullName;
        private String role;
        private String avatarUrl;
        private boolean isFirstLogin;
        private UUID facultyId;
        private String facultyName;
        private UUID departmentId;
        private String departmentName;

        UserProfileDtoBuilder() {}

        public UserProfileDtoBuilder id(UUID id) { this.id = id; return this; }
        public UserProfileDtoBuilder email(String email) { this.email = email; return this; }
        public UserProfileDtoBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UserProfileDtoBuilder role(String role) { this.role = role; return this; }
        public UserProfileDtoBuilder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public UserProfileDtoBuilder isFirstLogin(boolean isFirstLogin) { this.isFirstLogin = isFirstLogin; return this; }
        public UserProfileDtoBuilder facultyId(UUID facultyId) { this.facultyId = facultyId; return this; }
        public UserProfileDtoBuilder facultyName(String facultyName) { this.facultyName = facultyName; return this; }
        public UserProfileDtoBuilder departmentId(UUID departmentId) { this.departmentId = departmentId; return this; }
        public UserProfileDtoBuilder departmentName(String departmentName) { this.departmentName = departmentName; return this; }

        public UserProfileDto build() {
            return new UserProfileDto(id, email, fullName, role, avatarUrl, isFirstLogin, facultyId, facultyName, departmentId, departmentName);
        }
    }

    public static UserProfileDtoBuilder builder() {
        return new UserProfileDtoBuilder();
    }
}