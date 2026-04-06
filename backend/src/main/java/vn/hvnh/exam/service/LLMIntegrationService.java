package vn.hvnh.exam.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class LLMIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(LLMIntegrationService.class);

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public LLMIntegrationService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private static final int MAX_RETRIES = 5;
    private static final long BASE_RETRY_DELAY_MS = 2000;

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
            String modelName = "llama-3.3-70b-versatile";

            // 2. Tạo Headers
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
            requestBody.put("temperature", 0.2); 

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            log.info("🚀 Gọi Groq AI | Model: {} | Attempt: {}/{}", modelName, attempt, MAX_RETRIES);
            
            // 4. Gửi Request
            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            // 5. Parse JSON
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String aiResponseText = rootNode.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

            return cleanMarkdownCodeBlocks(aiResponseText);

        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            log.warn("⚠️ AI Rate Limit (429) hit on attempt {}. Waiting to retry...", attempt);
            if (attempt < MAX_RETRIES) {
                try {
                    // Groq thường yêu cầu đợi ~6-10s cho Rate Limit
                    long waitTime = 7000 + (attempt * 3000); 
                    log.info("⏳ Waiting {}ms before retrying AI API...", waitTime);
                    Thread.sleep(waitTime);
                    return callAI(prompt, attempt + 1);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread interrupted during retry wait", ie);
                }
            }
            throw new RuntimeException("AI API failed: Rate limit exceeded after " + MAX_RETRIES + " attempts", e);
        } catch (RestClientException e) {
            log.error("❌ Lỗi gọi AI API (lần {}): {}", attempt, e.getMessage());
            if (attempt < MAX_RETRIES) {
                try {
                    long waitTime = BASE_RETRY_DELAY_MS * (long) Math.pow(2, attempt - 1);
                    Thread.sleep(waitTime);
                    return callAI(prompt, attempt + 1);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread interrupted during retry wait", ie);
                }
            }
            throw new RuntimeException("AI API failed after " + MAX_RETRIES + " attempts", e);
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