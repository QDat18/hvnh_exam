package vn.hvnh.exam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.dto.GoogleLoginRequest;
import vn.hvnh.exam.dto.LoginRequest;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;
import vn.hvnh.exam.security.JwtTokenProvider;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AuthController(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    /**
     * Endpoint: POST /api/auth/login
     * Email/Password login (original)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 1. Tìm user trong database bằng email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found in database"));

        // 2. Tạo JWT token từ backend
        String backendToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());

        // 3. Chuẩn bị response
        Map<String, Object> response = new HashMap<>();
        response.put("token", backendToken);
        response.put("user", buildUserResponse(user));

        System.out.println("✅ [AUTH] Generated backend token for: " + user.getEmail() + " (Role: " + user.getRole() + ")");

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint: POST /api/auth/google-login
     * Google OAuth login - Auto create user if not exists
     */
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            System.out.println("🔐 [GOOGLE AUTH] Processing Google login for: " + request.getEmail());

            // 1. Validate email domain
            if (!request.getEmail().endsWith("@hvnh.edu.vn")) {
                System.err.println("❌ [GOOGLE AUTH] Invalid domain: " + request.getEmail());
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Chỉ chấp nhận email thuộc domain @hvnh.edu.vn"));
            }

            // 2. Find or create user
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseGet(() -> {
                        System.out.println("👤 [GOOGLE AUTH] Creating new user: " + request.getEmail());
                        return createUserFromGoogle(request);
                    });

            // 3. Update user info from Google (Chỉ cập nhật nếu DB hiện tại đang trống để KHÔNG đè dữ liệu user đã tự sửa)
            boolean updated = false;
            
            if (request.getFullName() != null && user.getFullName() == null) {
                user.setFullName(request.getFullName());
                updated = true;
            }
            
            if (request.getAvatarUrl() != null && user.getAvatarUrl() == null) {
                user.setAvatarUrl(request.getAvatarUrl());
                updated = true;
            }
            
            if (updated) {
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
                System.out.println("📝 [GOOGLE AUTH] Updated missing user info for: " + request.getEmail());
            }

            // 4. Tạo JWT token
            String backendToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());

            // 5. Chuẩn bị response
            Map<String, Object> response = new HashMap<>();
            response.put("token", backendToken);
            response.put("user", buildUserResponse(user));

            System.out.println("✅ [GOOGLE AUTH] Login successful for: " + user.getEmail() + " (Role: " + user.getRole() + ")");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ [GOOGLE AUTH] Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Endpoint: GET /api/auth/validate
     * Kiểm tra token có hợp lệ không
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            String email = jwtTokenProvider.getEmailFromToken(token);

            if (email != null && !jwtTokenProvider.isTokenExpired(token)) {
                return ResponseEntity.ok(Map.of("valid", true, "email", email));
            } else {
                return ResponseEntity.status(401).body("Token expired or invalid");
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid token: " + e.getMessage());
        }
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Tạo user mới từ Google OAuth
     */
    private User createUserFromGoogle(GoogleLoginRequest request) {
        User newUser = new User();
        newUser.setId(UUID.randomUUID());
        newUser.setEmail(request.getEmail());
        newUser.setFullName(request.getFullName() != null ? request.getFullName() : extractNameFromEmail(request.getEmail()));
        newUser.setAvatarUrl(request.getAvatarUrl());
        
        // Determine role based on email pattern (customize as needed)
        String role = determineRoleFromEmail(request.getEmail());
        newUser.setRole(role);
        
        newUser.setStatus("ACTIVE");
        newUser.setIsFirstLogin(true); // Lần đầu đăng nhập
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(newUser);
    }

    /**
     * Xác định role dựa trên email
     * Customize logic này theo quy tắc của trường
     */
    private String determineRoleFromEmail(String email) {
        // Ví dụ logic:
        // - admin@hvnh.edu.vn → ADMIN
        // - gv.* → TEACHER (giảng viên)
        // - Còn lại → STUDENT
        
        if (email.equals("admin@hvnh.edu.vn")) {
            return "ADMIN";
        }
        
        if (email.startsWith("gv.") || email.startsWith("teacher.")) {
            return "TEACHER";
        }
        
        // Default: STUDENT
        return "STUDENT";
    }

    /**
     * Extract name from email
     * Example: john.doe@hvnh.edu.vn → John Doe
     */
    private String extractNameFromEmail(String email) {
        String localPart = email.split("@")[0];
        
        // Replace dots and underscores with spaces
        String name = localPart.replace(".", " ").replace("_", " ");
        
        // Capitalize first letter of each word
        String[] words = name.split(" ");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1).toLowerCase())
                      .append(" ");
            }
        }
        
        return result.toString().trim();
    }

    /**
     * Build user response object
     */
    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId().toString());
        userMap.put("email", user.getEmail());
        userMap.put("fullName", user.getFullName());
        userMap.put("role", user.getRole());
        userMap.put("isFirstLogin", user.getIsFirstLogin());
        userMap.put("avatarUrl", user.getAvatarUrl());
        
        // 🔥 ĐÃ FIX: LẤY ĐÚNG TÊN KHOA VÀ BỘ MÔN ĐỂ TRẢ VỀ FRONTEND
        if (user.getFaculty() != null) {
            userMap.put("facultyId", user.getFaculty().getId().toString());
            userMap.put("facultyName", user.getFaculty().getFacultyName());
        } else {
            userMap.put("facultyName", ""); // Trả về rỗng thay vì null để Frontend dễ xử lý
        }
        
        if (user.getDepartment() != null) {
            userMap.put("departmentId", user.getDepartment().getId().toString());
            userMap.put("departmentName", user.getDepartment().getDepartmentName());
        } else {
            userMap.put("departmentName", ""); 
        }
        
        return userMap;
    }
}