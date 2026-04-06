package vn.hvnh.exam.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vn.hvnh.exam.common.UserRole;
import vn.hvnh.exam.common.UserStatus;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        createOrUpdateUser("admin@hvnh.edu.vn", "Admin Hệ Thống", UserRole.ADMIN);
        createOrUpdateUser("teacher@hvnh.edu.vn", "Giảng Viên Test", UserRole.TEACHER);
        createOrUpdateUser("student@hvnh.edu.vn", "Sinh Viên Test", UserRole.STUDENT);
    }

    private void createOrUpdateUser(String email, String fullName, UserRole role) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .fullName(fullName)
                    .role(role.name())
                    .status(UserStatus.ACTIVE.name())
                    .isFirstLogin(false)
                    .build();
            userRepository.save(user);
            System.out.println("✅ USER CREATED: " + email + " | Role: " + role);
        } else {
            System.out.println("ℹ️ USER EXISTS: " + email);
        }
    }
}