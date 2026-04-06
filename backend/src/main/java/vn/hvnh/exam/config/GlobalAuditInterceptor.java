package vn.hvnh.exam.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import vn.hvnh.exam.service.AuditLogService;

@Component
public class GlobalAuditInterceptor implements HandlerInterceptor {

    private final AuditLogService auditLogService;

    public GlobalAuditInterceptor(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String method = request.getMethod();

        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        if (response.getStatus() >= 400) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) 
                ? auth.getName() : "Khách / Ẩn danh";
        
        String role = (auth != null && !auth.getAuthorities().isEmpty()) 
                ? auth.getAuthorities().iterator().next().getAuthority() : "GUEST";

        String endpoint = request.getRequestURI();
        String ip = request.getRemoteAddr();

        String actionName = method + "_API_CALL";
        String details = "Thực hiện gọi API " + method + " thành công.";

        auditLogService.logAction(email, role, actionName, ip, endpoint, details);
    }
}