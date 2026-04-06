package vn.hvnh.exam.dto;

import vn.hvnh.exam.common.UserRole;

public class RegisterRequest {
    private String maSV;
    private String fullName;
    private String email;
    private String password;
    private UserRole role;

    public RegisterRequest() {}

    public RegisterRequest(String maSV, String fullName, String email, String password, UserRole role) {
        this.maSV = maSV;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public String getMaSV() { return maSV; }
    public void setMaSV(String maSV) { this.maSV = maSV; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
}