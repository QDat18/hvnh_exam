package vn.hvnh.exam.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class LLMIntegrationService {

    // Vẫn dùng biến này để lấy key từ application.properties
    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 1000;

    /**
     * Hàm Public để gọi từ DocumentAIProcessor
     */
    public String callAI(String prompt) {
        return callAI(prompt, 1);
    }

    /**
     * Xử lý gọi API sang hệ thống Groq (Llama 3)
     */
    private String callAI(String prompt, int attempt) {
        try {
            validateApiKey();

            // 1. Cấu hình Groq API
            String apiUrl = "https://api.groq.com/openai/v1/chat/completions";
            String modelName = "llama-3.3-70b-versatile"; // Model siêu tốc độ của Groq

            // 2. Tạo Headers (Chuẩn Bearer Token)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // 3. Tạo Body Dữ liệu
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("messages", List.of(message));
            requestBody.put("temperature", 0.2); // Để 0.2 cho kết quả JSON ổn định, không bịa chữ

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            log.info("🚀 Gọi Groq AI | Model: {} | Attempt: {}", modelName, attempt);
            
            // 4. Gửi Request
            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            // 5. Parse JSON trả về
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String aiResponseText = rootNode.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

            return cleanMarkdownCodeBlocks(aiResponseText);

        } catch (RestClientException e) {
            log.error("❌ Lỗi gọi AI API (lần {}): {}", attempt, e.getMessage());
            if (attempt < MAX_RETRIES) {
                try {
                    Thread.sleep(RETRY_DELAY_MS * attempt);
                    return callAI(prompt, attempt + 1);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread bị gián đoạn khi đợi retry", ie);
                }
            }
            throw new RuntimeException("AI API thất bại sau " + MAX_RETRIES + " lần thử", e);
        } catch (Exception e) {
            log.error("❌ Lỗi parse dữ liệu từ AI: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể đọc phản hồi từ AI", e);
        }
    }

    /**
     * Dọn dẹp chuỗi JSON (Bỏ block ```json ... ```)
     */
    private String cleanMarkdownCodeBlocks(String text) {
        String cleaned = text.trim();
        
        // Tìm vị trí mở ngoặc vuông đầu tiên và đóng ngoặc vuông cuối cùng
        int startIndex = cleaned.indexOf('[');
        int endIndex = cleaned.lastIndexOf(']');
        
        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            // Cắt đúng phần mảng JSON ra
            cleaned = cleaned.substring(startIndex, endIndex + 1);
        } else {
             // Nếu không có mảng, dùng cách xử lý markdown cũ
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
        }
        
        return cleaned.trim();
    }
    private void validateApiKey() {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-api-key-here")) {
            throw new RuntimeException("API key chưa được cấu hình trong application.properties");
        }
    }
}