package vn.hvnh.exam.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 🛡️ Rate Limit Filter — Chống DDoS & Brute-force
 * - API thường: 100 requests/phút/IP
 * - Login API: 5 requests/phút/IP
 * - Trả 429 Too Many Requests khi vượt ngưỡng
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Cấu hình giới hạn
    private static final int GENERAL_LIMIT = 100;   // req/phút cho API thường
    private static final int LOGIN_LIMIT = 5;        // req/phút cho login
    private static final long WINDOW_MS = 60_000;    // 1 phút

    // Lưu trữ request count theo IP
    private final Map<String, RequestCounter> generalCounters = new ConcurrentHashMap<>();
    private final Map<String, RequestCounter> loginCounters = new ConcurrentHashMap<>();

    // Thống kê toàn cục (để Admin xem)
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalBlocked = new AtomicLong(0);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String uri = request.getRequestURI();

        totalRequests.incrementAndGet();

        // Bỏ qua rate limit cho static resources
        if (uri.startsWith("/uploads/") || uri.startsWith("/swagger") || uri.startsWith("/v3/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Kiểm tra login endpoint (giới hạn chặt hơn)
        boolean isLoginRequest = uri.contains("/api/auth/login");
        Map<String, RequestCounter> counters = isLoginRequest ? loginCounters : generalCounters;
        int limit = isLoginRequest ? LOGIN_LIMIT : GENERAL_LIMIT;

        RequestCounter counter = counters.computeIfAbsent(clientIp, k -> new RequestCounter());

        if (!counter.allowRequest(limit)) {
            totalBlocked.incrementAndGet();

            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Retry-After", "60");

            String msg = isLoginRequest
                ? "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 1 phút."
                : "Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau 1 phút.";

            response.getWriter().write("{\"success\": false, \"message\": \"" + msg + "\"}");

            System.out.println("⛔ [RATE LIMIT] Blocked " + clientIp + " on " + uri
                + " | " + (isLoginRequest ? "LOGIN" : "GENERAL") + " limit exceeded");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Lấy IP thực (hỗ trợ proxy/nginx) */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    // ===== PUBLIC STATS cho Admin Dashboard =====
    public long getTotalRequests() { return totalRequests.get(); }
    public long getTotalBlocked() { return totalBlocked.get(); }
    public int getActiveIpCount() { return generalCounters.size(); }
    public int getBlockedIpCount() {
        int count = 0;
        long now = System.currentTimeMillis();
        for (RequestCounter c : generalCounters.values()) {
            if (now - c.windowStart < WINDOW_MS && c.count.get() >= GENERAL_LIMIT) count++;
        }
        for (RequestCounter c : loginCounters.values()) {
            if (now - c.windowStart < WINDOW_MS && c.count.get() >= LOGIN_LIMIT) count++;
        }
        return count;
    }

    /** Xóa bộ đếm cũ (gọi định kỳ hoặc khi cần) */
    public void cleanup() {
        long now = System.currentTimeMillis();
        generalCounters.entrySet().removeIf(e -> now - e.getValue().windowStart > WINDOW_MS * 5);
        loginCounters.entrySet().removeIf(e -> now - e.getValue().windowStart > WINDOW_MS * 5);
    }

    // ===== Inner class: Sliding window counter =====
    private static class RequestCounter {
        volatile long windowStart = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);

        boolean allowRequest(int limit) {
            long now = System.currentTimeMillis();
            // Reset window nếu hết 1 phút
            if (now - windowStart > WINDOW_MS) {
                synchronized (this) {
                    if (now - windowStart > WINDOW_MS) {
                        windowStart = now;
                        count.set(0);
                    }
                }
            }
            return count.incrementAndGet() <= limit;
        }
    }
}
