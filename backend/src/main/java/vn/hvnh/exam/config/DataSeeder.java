// package vn.hvnh.exam.config;

// import lombok.RequiredArgsConstructor;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Component;
// import vn.hvnh.exam.common.UserRole;
// import vn.hvnh.exam.common.UserStatus;
// import vn.hvnh.exam.entity.sql.User;
// import vn.hvnh.exam.repository.sql.UserRepository;

// import java.util.List;

// @Component
// @RequiredArgsConstructor
// public class DataSeeder implements CommandLineRunner {

//     private final UserRepository userRepository;
//     private final PasswordEncoder passwordEncoder;

//     @Override
//     public void run(String... args) throws Exception {
//         // Tạo danh sách 3 user mẫu
//         createOrUpdateUser("admin@hvnh.edu.vn", "Admin Hệ Thống", UserRole.ADMIN);
//         createOrUpdateUser("teacher@hvnh.edu.vn", "Giảng Viên Test", UserRole.TEACHER);
//         createOrUpdateUser("student@hvnh.edu.vn", "Sinh Viên Test", UserRole.STUDENT);
//     }

//     private void createOrUpdateUser(String email, String fullName, UserRole role) {
//         User user = userRepository.findByEmail(email).orElse(null);
//         String rawPassword = "123456"; // Mật khẩu chung cho tất cả

//         if (user == null) {
//             user = User.builder()
//                     .email(email)
//                     .fullName(fullName)
//                     .role(role)
//                     .status(UserStatus.ACTIVE)
//                     .build();
//         }

//         // Luôn reset lại mật khẩu về 123456 để tránh bị quên hoặc lỗi hash
//         user.setPasswordHash(passwordEncoder.encode(rawPassword));
//         userRepository.save(user);

//         System.out.println("✅ USER OK: " + email + " | Role: " + role + " | Pass: " + rawPassword);
//     }
// }