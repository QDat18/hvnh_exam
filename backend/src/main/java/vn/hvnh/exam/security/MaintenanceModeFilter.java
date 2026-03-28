package vn.hvnh.exam.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.hvnh.exam.entity.sql.SystemSetting;
import vn.hvnh.exam.repository.sql.SystemSettingRepository;

import java.io.IOException;
import java.util.Optional;

/**
 * 🛡️ Maintenance Mode Filter
 * Khi Admin bật chế độ bảo trì, tất cả user không phải ADMIN sẽ bị chặn.
 * Filter này chạy SAU JwtAuthenticationFilter (để đã có Authentication trong context).
 */
@Component
@RequiredArgsConstructor
public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final SystemSettingRepository systemSettingRepository;

    // Cache để không query DB mỗi request
    private volatile boolean maintenanceMode = false;
    private volatile long lastCheck = 0;
    private static final long CACHE_DURATION_MS = 2_000; // Refresh mỗi 2 giây

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        // Luôn cho phép: login, static resources, admin APIs
        if (uri.startsWith("/api/auth/") || uri.startsWith("/uploads/") || uri.startsWith("/api/admin/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Refresh cache nếu quá 10 giây
        refreshMaintenanceStatus();

        if (maintenanceMode) {
            // Kiểm tra user hiện tại có phải ADMIN không
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
                System.out.println("🔧 [MAINTENANCE] Chặn truy cập: " + uri + " (user không phải ADMIN)");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void refreshMaintenanceStatus() {
        long now = System.currentTimeMillis();
        if (now - lastCheck > CACHE_DURATION_MS) {
            try {
                Optional<SystemSetting> setting = systemSettingRepository.findById("maintenanceMode");
                maintenanceMode = setting.map(s -> "true".equals(s.getSettingValue())).orElse(false);
            } catch (Exception e) {
                // Nếu lỗi DB, giữ nguyên trạng thái cũ
            }
            lastCheck = now;
        }
    }
}
