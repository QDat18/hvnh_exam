package vn.hvnh.exam.service;

import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.RequestScope;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;

@Service
@RequestScope(proxyMode = ScopedProxyMode.TARGET_CLASS)
public class CurrentUserService {

    private final UserRepository userRepository;
    private User currentUser;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        if (currentUser == null) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return null;
            }
            String email = auth.getName();
            return setUserByEmail(email);
        }
        return currentUser;
    }

    public User setUserByEmail(String email) {
        if (currentUser == null || !email.equals(currentUser.getEmail())) {
            currentUser = userRepository.findByEmailWithFaculty(email)
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found in database: " + email));
        }
        return currentUser;
    }
}
