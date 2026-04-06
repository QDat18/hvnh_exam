package vn.hvnh.exam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.dto.RegisterRequest;
import vn.hvnh.exam.dto.UserProfileDto;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;
import vn.hvnh.exam.service.AuthService;
import vn.hvnh.exam.dto.AuthResponse; // Tận dụng DTO này để trả về info user

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public UserController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    // ========================================================================
    // 1. LẤY THÔNG TIN USER HIỆN TẠI (Frontend gọi ngay sau khi Login Supabase)
    // ========================================================================
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Dùng hàm fromEntity đã sửa ở trên để convert
        return ResponseEntity.ok(UserProfileDto.fromEntity(user));
    }


    // ========================================================================
    // 2. ADMIN: TẠO SINH VIÊN
    // ========================================================================
    @PostMapping("/create-student")
    public ResponseEntity<?> createStudent(@RequestBody RegisterRequest request) {
        try {
            authService.createStudentByAdmin(request);
            return ResponseEntity.ok("Tạo sinh viên thành công trên Supabase & Database!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========================================================================
    // 3. USER: XÁC NHẬN ĐÃ ĐỔI MẬT KHẨU THÀNH CÔNG
    // ========================================================================
    @PostMapping("/confirm-changed-password")
    public ResponseEntity<?> confirmChangePass(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            authService.confirmFirstLoginCompleted(userDetails.getUsername());
            return ResponseEntity.ok("Trạng thái tài khoản đã cập nhật: Đã hoàn tất đổi mật khẩu lần đầu.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========================================================================
    // 4. USER: CẬP NHẬT AVATAR
    // ========================================================================
    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Vui lòng chọn ảnh."));
            }
            // Create dir if not exists
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads", "avatars").toAbsolutePath();
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            // Generate unique filename
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            // Add a unique timestamp / UUID to prevent conflicts
            String newFileName = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path filePath = uploadPath.resolve(newFileName);
            // Save file to "uploads/avatars"
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            // Update user in DB
            String email = userDetails.getUsername();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));
            
            // Generate public URL matching WebConfig addResourceHandlers
            String fileUrl = "/uploads/avatars/" + newFileName;
            user.setAvatarUrl(fileUrl);
            userRepository.save(user);
            // Return new UserProfileDto
            return ResponseEntity.ok(UserProfileDto.fromEntity(user));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Lỗi server: " + e.getMessage()));
        }
    }
}