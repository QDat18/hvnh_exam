package vn.hvnh.exam.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import vn.hvnh.exam.security.JwtAuthenticationFilter;
import vn.hvnh.exam.security.MaintenanceModeFilter;
import vn.hvnh.exam.security.RateLimitFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;
    private final MaintenanceModeFilter maintenanceModeFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, 
                          RateLimitFilter rateLimitFilter, 
                          MaintenanceModeFilter maintenanceModeFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.maintenanceModeFilter = maintenanceModeFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 🔥 FIX 1: TẮT CHẶN IFRAME ĐỂ REACT VẼ ĐƯỢC PDF
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.disable()) 
            )
            
            .authorizeHttpRequests(auth -> auth
                // 🔥 FIX 2: CHO PHÉP TẤT CẢ MỌI NGƯỜI VÀO XEM FILE TRONG UPLOADS
                .requestMatchers("/uploads/**").permitAll()

                // Public endpoints không cần token
                .requestMatchers("/api/auth/**", "/auth/**").permitAll()
                .requestMatchers("/error").permitAll() 
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Yêu cầu các API còn lại phải có Token và đăng nhập
                .anyRequest().authenticated() 
            )
            // Thứ tự: RateLimit → JWT → MaintenanceMode
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(maintenanceModeFilter, JwtAuthenticationFilter.class);
            
        return http.build();
    }    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173", "https://hvnh-exam-review.vercel.app"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "x-auth-token"));
        configuration.setExposedHeaders(List.of("x-auth-token"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
