package vn.hvnh.exam.dto;

import vn.hvnh.exam.common.UserRole;

public class AuthResponse {
    private String token;
    private String fullName;
    private UserRole role;
    private boolean isFirstLogin;

    public AuthResponse() {}

    public AuthResponse(String token, String fullName, UserRole role, boolean isFirstLogin) {
        this.token = token;
        this.fullName = fullName;
        this.role = role;
        this.isFirstLogin = isFirstLogin;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public boolean isFirstLogin() { return isFirstLogin; }
    public void setFirstLogin(boolean firstLogin) { isFirstLogin = firstLogin; }
}