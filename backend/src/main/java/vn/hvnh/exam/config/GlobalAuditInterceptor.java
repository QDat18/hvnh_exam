package vn.hvnh.exam.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import vn.hvnh.exam.service.AuditLogService;

@Component
@RequiredArgsConstructor
public class GlobalAuditInterceptor implements HandlerInterceptor {

    private final AuditLogService auditLogService;

    // Hàm này tự động chạy SAU KHI bất kỳ API nào thực thi xong
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String method = request.getMethod();

        // 1. CHỈ GHI LOG CÁC HÀNH ĐỘNG THAY ĐỔI DỮ LIỆU
        // Bỏ qua các API GET (chỉ đọc dữ liệu) để tránh làm rác database
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        // 2. CHỈ GHI LOG NẾU API CHẠY THÀNH CÔNG (Status 200 -> 299)
        if (response.getStatus() >= 400) {
            return;
        }

        // 3. LẤY THÔNG TIN NGƯỜI VỪA THAO TÁC (Từ Security Context)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) 
                ? auth.getName() : "Khách / Ẩn danh";
        
        String role = (auth != null && !auth.getAuthorities().isEmpty()) 
                ? auth.getAuthorities().iterator().next().getAuthority() : "GUEST";

        // 4. LẤY THÔNG TIN API VÀ IP
        String endpoint = request.getRequestURI();
        String ip = request.getRemoteAddr();

        // 5. GHI XUỐNG MONGODB
        String actionName = method + "_API_CALL"; // VD: POST_API_CALL, PATCH_API_CALL
        String details = "Thực hiện gọi API " + method + " thành công.";

        auditLogService.logAction(email, role, actionName, ip, endpoint, details);
    }
}