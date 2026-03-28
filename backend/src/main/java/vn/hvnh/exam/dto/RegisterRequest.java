package vn.hvnh.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.hvnh.exam.common.UserRole;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String maSV;

    // Họ tên là bắt buộc
    private String fullName;

    private String email;

    private String password;

    private UserRole role;
}