package vn.hvnh.exam.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.hvnh.exam.entity.sql.User; 
import vn.hvnh.exam.service.CurrentUserService;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final CurrentUserService currentUserService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService, CurrentUserService currentUserService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
        this.currentUserService = currentUserService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            userEmail = jwtTokenProvider.getEmailFromToken(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Sử dụng CurrentUserService để lấy user và cache trong request scope bằng email đã extract từ JWT
                User currentUser = currentUserService.setUserByEmail(userEmail);
                
                if (currentUser != null) {
                    // Kiểm tra trạng thái tài khoản
                    if ("INACTIVE".equals(currentUser.getStatus())) {
                        System.out.println("⛔ [JWT FILTER] Chặn truy cập: Tài khoản " + userEmail + " đã bị vô hiệu hóa (INACTIVE)!");
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\": false, \"message\": \"Tài khoản của bạn đã bị vô hiệu hóa hoặc bị xóa!\"}");
                        return;
                    }

                    if (jwtTokenProvider.validateToken(jwt, currentUser)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                currentUser, null, currentUser.getAuthorities()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("🚨 [JWT FILTER] Lỗi xác thực: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}