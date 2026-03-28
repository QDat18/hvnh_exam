package vn.hvnh.exam.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service để tạo user trực tiếp trong Supabase Auth
 * Sử dụng Supabase Admin API
 */
@Service
@RequiredArgsConstructor
public class SupabaseService {
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.key.service-role-key}")
    private String serviceRoleKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Tạo user mới trong Supabase Auth
     * @param email Email của user
     * @param password Mật khẩu
     * @return Supabase User ID (UUID string)
     */
    public String createUser(String email, String password) {
        try {
            System.out.println("🔐 [SUPABASE] Creating user: " + email);
            
            String url = supabaseUrl + "/auth/v1/admin/users";
            
            // Request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            requestBody.put("password", password);
            requestBody.put("email_confirm", true); // Auto-confirm email
            
            // Metadata
            Map<String, String> userMetadata = new HashMap<>();
            userMetadata.put("full_name", email.split("@")[0]); // Default name
            requestBody.put("user_metadata", userMetadata);
            
            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make request
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK || 
                response.getStatusCode() == HttpStatus.CREATED) {
                
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                String userId = jsonResponse.get("id").asText();
                
                System.out.println("✅ [SUPABASE] User created successfully: " + userId);
                return userId;
                
            } else {
                throw new RuntimeException("Failed to create user in Supabase: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SUPABASE] Error creating user: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create user in Supabase: " + e.getMessage());
        }
    }
    
    /**
     * Update user password trong Supabase
     */
    public void updateUserPassword(String userId, String newPassword) {
        try {
            System.out.println("🔐 [SUPABASE] Updating password for user: " + userId);
            
            String url = supabaseUrl + "/auth/v1/admin/users/" + userId;
            
            // Request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("password", newPassword);
            
            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make request
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                request,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                System.out.println("✅ [SUPABASE] Password updated successfully");
            } else {
                throw new RuntimeException("Failed to update password: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SUPABASE] Error updating password: " + e.getMessage());
            throw new RuntimeException("Failed to update password: " + e.getMessage());
        }
    }
    
    /**
     * Delete user từ Supabase
     */
    public void deleteUser(String userId) {
        try {
            System.out.println("🗑️ [SUPABASE] Deleting user: " + userId);
            
            String url = supabaseUrl + "/auth/v1/admin/users/" + userId;
            
            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            
            HttpEntity<?> request = new HttpEntity<>(headers);
            
            // Make request
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                request,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK || 
                response.getStatusCode() == HttpStatus.NO_CONTENT) {
                System.out.println("✅ [SUPABASE] User deleted successfully");
            } else {
                throw new RuntimeException("Failed to delete user: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SUPABASE] Error deleting user: " + e.getMessage());
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
    }
    
    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String email) {
        try {
            System.out.println("📧 [SUPABASE] Sending password reset email to: " + email);
            
            String url = supabaseUrl + "/auth/v1/recover";
            
            // Request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            
            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", serviceRoleKey);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make request
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                System.out.println("✅ [SUPABASE] Password reset email sent");
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SUPABASE] Error sending reset email: " + e.getMessage());
        }
    }
    
    /**
     * Verify user email (admin action)
     */
    public void verifyUserEmail(String userId) {
        try {
            System.out.println("✉️ [SUPABASE] Verifying email for user: " + userId);
            
            String url = supabaseUrl + "/auth/v1/admin/users/" + userId;
            
            // Request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email_confirm", true);
            
            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", serviceRoleKey);
            headers.set("Authorization", "Bearer " + serviceRoleKey);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make request
            restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
            
            System.out.println("✅ [SUPABASE] Email verified");
            
        } catch (Exception e) {
            System.err.println("❌ [SUPABASE] Error verifying email: " + e.getMessage());
        }
    }
}