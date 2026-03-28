package vn.hvnh.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import vn.hvnh.exam.common.UserRole;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String fullName;
    private UserRole role;
    private boolean isFirstLogin;
}