package vn.hvnh.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.hvnh.exam.entity.sql.User;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private UUID id;
    private String email;
    private String fullName;
    
    // 🔥 SỬA: Để là String cho khớp với Entity User
    private String role; 
    
    private String avatarUrl;
    private boolean isFirstLogin; // Thêm trường này để Frontend biết đường chuyển hướng

    private UUID facultyId;
    private String facultyName;
    
    private UUID departmentId;
    private String departmentName;

    public static UserProfileDto fromEntity(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole()) // Cả 2 đều là String -> Hết lỗi
                .avatarUrl(user.getAvatarUrl())
                .isFirstLogin(user.getIsFirstLogin())
                .facultyId(user.getFaculty() != null ? user.getFaculty().getId() : null)
                .facultyName(user.getFaculty() != null ? user.getFaculty().getFacultyName() : "")
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getDepartmentName() : "")
                .build();
    }
}