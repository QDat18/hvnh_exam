package vn.hvnh.exam.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * GET /api/admin/users?page=0&size=20&role=STUDENT&keyword=nguyen
     *
     * Dung List + subList thay vi @Query de tranh 500 do JPQL/native query
     * conflict voi Pageable tren cac phien ban Hibernate khac nhau.
     */
    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "20") int    size,
            @RequestParam(required = false)    String role,
            @RequestParam(required = false)    String keyword
    ) {
        try {
            // 1. Tạo cấu hình phân trang (Đẩy thẳng xuống Database xử lý)
            Pageable pageable = PageRequest.of(page, size);
            
            // 2. Chuẩn hóa tham số (nếu chuỗi rỗng thì chuyển thành null để DB bỏ qua điều kiện lọc)
            String safeRole = (role != null && !role.isBlank()) ? role : null;
            String safeKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;

            // 3. Gọi hàm Native Query siêu mượt đã viết sẵn trong Repository
            Page<User> userPage = userRepository.searchUsers(safeRole, safeKeyword, pageable);

            // 4. Map sang DTO an toàn (Không lộ password)
            List<Map<String, Object>> content = userPage.getContent().stream().map(u -> {
                Map<String, Object> dto = new java.util.LinkedHashMap<>();
                dto.put("id",          u.getId());
                dto.put("fullName",    u.getFullName()  != null ? u.getFullName()  : "");
                dto.put("email",       u.getEmail()     != null ? u.getEmail()     : "");
                dto.put("role",        u.getRole()      != null ? u.getRole()      : "");
                dto.put("status",      u.getStatus()    != null ? u.getStatus()    : "ACTIVE");
                dto.put("avatarUrl",   u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
                dto.put("facultyName", u.getFaculty()   != null ? u.getFaculty().getFacultyName() : "");
                return dto;
            }).collect(Collectors.toList());

            // 5. Trả về đúng format Pagination mà Frontend React mong muốn
            return ResponseEntity.ok(Map.of(
                "content",       content,
                "totalElements", userPage.getTotalElements(),
                "totalPages",    userPage.getTotalPages(),
                "currentPage",   userPage.getNumber()
            ));

        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Loi tai danh sach user: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("LOCKED"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Status phai la ACTIVE hoac LOCKED"));
            }
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay user"));
            user.setStatus(newStatus);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", newStatus.equals("LOCKED")
                    ? "Da khoa tai khoan " + user.getEmail()
                    : "Da mo khoa tai khoan " + user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable UUID id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay user"));
            String newPassword = generateRandomPassword();
            // TODO: user.setPassword(passwordEncoder.encode(newPassword));
            // userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "success",     true,
                "email",       user.getEmail(),
                "newPassword", newPassword,
                "note",        "Luu mat khau nay! Se khong hien thi lai."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
        StringBuilder sb = new StringBuilder(10);
        java.security.SecureRandom rnd = new java.security.SecureRandom();
        for (int i = 0; i < 10; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }
}