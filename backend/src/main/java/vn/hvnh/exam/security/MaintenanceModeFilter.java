package vn.hvnh.exam.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.hvnh.exam.service.SystemSettingService;

import java.io.IOException;
import java.util.Optional;

@Component

public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final SystemSettingService systemSettingService;

    public MaintenanceModeFilter(SystemSettingService systemSettingService) {
        this.systemSettingService = systemSettingService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        // Luôn cho phép: login, static resources, admin APIs
        if (uri.startsWith("/api/auth/") || uri.startsWith("/uploads/") || uri.startsWith("/api/admin/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Dùng SystemSettingService đã được cache sẵn (10 mins TTL)
        boolean maintenanceMode = systemSettingService.getSettingValue("maintenanceMode")
                .map("true"::equals)
                .orElse(false);

        if (maintenanceMode) {
            // Kiểm tra user hiện tại có phải ADMIN không từ SecurityContext (đã được JwtFilter thiết lập)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            boolean isAdmin = false;
            if (auth != null && auth.isAuthenticated()) {
                isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
            }

            if (!isAdmin) {
                response.setStatus(503); // Service Unavailable
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                    "{\"success\": false, \"message\": \"Hệ thống đang trong chế độ BẢO TRÌ. Vui lòng thử lại sau.\", \"maintenance\": true}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
