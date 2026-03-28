package vn.hvnh.exam.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.UserRepository;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // 🔥 FIX LỖI: user.getRole() trả về String, nên dùng trực tiếp, bỏ .name()
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password("") // Password trống vì dùng OAuth2/Supabase
                .authorities(user.getRole()) // <-- Dùng trực tiếp String role
                .accountExpired(false)
                .accountLocked("INACTIVE".equals(user.getStatus()))
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}