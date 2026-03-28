package vn.hvnh.exam.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtTokenProvider {

    // Lấy JWT Secret từ file application.yml (phần supabase.jwt.secret)
    @Value("${supabase.jwt.secret}")
    private String secretKey;

    // Lấy key để verify chữ ký
    private Key getSigningKey() {
        // ⚠️ QUAN TRỌNG:
        // Nếu Secret của bạn là chuỗi ký tự thường (vd: UUID, hoặc chuỗi ngẫu nhiên bạn tự gõ)
        // thì dùng .getBytes(StandardCharsets.UTF_8).
        // Nếu Supabase cấp cho bạn chuỗi Base64 (kết thúc bằng dấu =), hãy dùng Decoders.BASE64.decode(secretKey).
        
        // Mặc định với các project mới, dùng getBytes là an toàn nhất với UUID:
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // =============================================================
    // CÁC HÀM XÁC THỰC (VALIDATE)
    // =============================================================

    // 1. Trích xuất Email (Username) từ Token
    public String getEmailFromToken(String token) {
        return extractClaim(token, Claims::getSubject); // Supabase lưu user_id hoặc email vào subject
        // 💡 Lưu ý: Nếu Supabase lưu Email trong claim 'email' riêng, bạn có thể sửa thành:
        // return extractClaim(token, claims -> claims.get("email", String.class));
    }

    // 2. Kiểm tra Token có hợp lệ không
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String email = getEmailFromToken(token);
            // So sánh email trong token với email trong Database (UserDetails)
            // Và kiểm tra xem token còn hạn không
            return (email != null && email.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            System.err.println("❌ Token không hợp lệ: " + e.getMessage());
            return false;
        }
    }

    // 3. Tạo JWT Token mới (Dùng cho AuthController)
    public String generateToken(String email, String role) {
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", role); // Lưu quyền (ADMIN, STUDENT...) vào token

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                // Set hạn token là 24 giờ
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) 
                .signWith(getSigningKey())
                .compact();
    }
    // =============================================================
    // CÁC HÀM HỖ TRỢ (PRIVATE)
    // =============================================================

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}