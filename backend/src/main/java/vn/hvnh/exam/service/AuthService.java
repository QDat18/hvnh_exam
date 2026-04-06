package vn.hvnh.exam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vn.hvnh.exam.common.UserRole;
import vn.hvnh.exam.dto.RegisterRequest;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key.service-role-key}")
    private String serviceRoleKey;

    private final RestClient restClient = RestClient.create();

    // =========================================================================
    // 1. ADMIN TAO SINH VIEN (CHUAN SUPABASE)
    // =========================================================================
    public void createStudentByAdmin(RegisterRequest request) {

        String email = request.getMaSV().trim() + "@hvnh.edu.vn";

        // 1. Check local DB
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Sinh vien da ton tai trong he thong");
        }

        // 2. Tao user ben Supabase Auth (ADMIN API)
        Map<String, Object> body = Map.of(
            "email", email,
            "password", UUID.randomUUID().toString(), // Random pass, SV se reset sau
            "email_confirm", true,
            "user_metadata", Map.of(
                "full_name", request.getFullName(),
                "role", "STUDENT"
            )
        );

        Map response;
        try {
            response = restClient.post()
                .uri(supabaseUrl + "/auth/v1/admin/users")
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Loi tao user tren Supabase: " + e.getMessage());
        }

        // 3. Lay UUID do Supabase tao
        String authUserId = (String) response.get("id");
        if (authUserId == null) {
            throw new RuntimeException("Supabase khong tra ve user id");
        }

        // 4. Luu user noi bo (UUID PHAI TRUNG auth.users.id)
        User user = User.builder()
            .id(UUID.fromString(authUserId))
            .email(email)
            .fullName(request.getFullName())
            
            // Fix: Chuyen Enum sang String
            .role(UserRole.STUDENT.name()) 
            .status("ACTIVE") 
            
            .isFirstLogin(true)
            .build();

        userRepository.save(user);
    }

    // =========================================================================
    // 2. HAM LOGIN / SYNC USER
    // =========================================================================
    public User createOrUpdateUser(String email, String userId, String fullName) {
        UUID uuid = UUID.fromString(userId);

        return userRepository.findById(uuid)
                .map(existingUser -> {
                    if (existingUser.getFullName() == null && fullName != null) {
                        existingUser.setFullName(fullName);
                        return userRepository.save(existingUser);
                    }
                    return existingUser;
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .id(uuid)
                            .email(email)
                            .fullName(fullName)
                            .role("STUDENT") // Mac dinh la Student
                            .status("ACTIVE")
                            .isFirstLogin(true)
                            .build();
                    return userRepository.save(newUser);
                });
    }

    // =========================================================================
    // 3. XAC NHAN DA DOI MAT KHAU LAN DAU
    // =========================================================================
    public void confirmFirstLoginCompleted(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        // FIX: setIsFirstLogin instead of setFirstLogin
        user.setIsFirstLogin(false);
        userRepository.save(user);
    }

    // =========================================================================
    // 4. ADMIN RESET PASSWORD
    // =========================================================================
    public void resetPasswordByAdmin(UUID userId) {
        // 1. Danh dau can doi pass lai
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User khong ton tai"));

        // FIX: setIsFirstLogin instead of setFirstLogin
        user.setIsFirstLogin(true);
        userRepository.save(user);

        // 2. Gui link reset password qua Supabase
        try {
            restClient.post()
                .uri(supabaseUrl + "/auth/v1/admin/users/" + userId + "/invite")
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", user.getEmail())) // Body bat buoc
                .retrieve()
                .toBodilessEntity();
        } catch (Exception e) {
            // Log error nhung khong chan flow
            System.err.println("Gui email reset that bai: " + e.getMessage());
        }
    }
}