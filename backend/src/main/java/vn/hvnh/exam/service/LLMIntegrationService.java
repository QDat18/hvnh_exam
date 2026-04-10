package vn.hvnh.exam.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class LLMIntegrationService {
    private static final Logger log = LoggerFactory.getLogger(LLMIntegrationService.class);

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.groq.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final int MAX_RETRIES = 5;
    private static final long BASE_RETRY_DELAY_MS = 2000;

    public LLMIntegrationService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String callAI(String prompt) {
        return callAI(prompt, 1);
    }

    private String callAI(String prompt, int attempt) {
        try {
            validateApiKey();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // Sử dụng Map cho linh hoạt, nhưng khuyên dùng Record/DTO
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("temperature", 0.6);
            
            // Removed chat_template_kwargs for Groq compatibility

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            String maskedKey = apiKey != null && apiKey.length() > 8 ? apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length() - 4) : "INVALID";
            log.info("🚀 Calling AI | Model: {} | API Key (Masked): {} | Attempt: {}/{}", modelName, maskedKey, attempt, MAX_RETRIES);
            log.debug("📝 Request Body: {}", objectMapper.writeValueAsString(requestBody));

            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, requestEntity, String.class
            );

            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String aiResponseText = rootNode.path("choices").get(0).path("message").path("content").asText();
            
            return cleanMarkdownCodeBlocks(aiResponseText);

        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("❌ Invalid API Key (401). Please check your configuration.");
            throw new RuntimeException("API Key không hợp lệ (401). Vui lòng cấu hình AI_API_KEY chính xác.");
        } catch (HttpClientErrorException.TooManyRequests e) {
            return handleRetry(prompt, attempt, 3000 + (attempt * 2000L), "Rate limit (429)");
        } catch (HttpClientErrorException e) {
            log.error("❌ HTTP Error: {} | Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Lỗi AI Service (400/404): " + e.getResponseBodyAsString());
        } catch (RestClientException e) {
            long waitTime = BASE_RETRY_DELAY_MS * (long) Math.pow(2, attempt - 1);
            return handleRetry(prompt, attempt, waitTime, "API Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể xử lý phản hồi từ AI", e);
        }
    }

    private String handleRetry(String prompt, int attempt, long waitTime, String reason) {
        if (attempt < MAX_RETRIES) {
            log.warn("⚠️ {} on attempt {}. Retrying in {}ms...", reason, attempt, waitTime);
            try {
                Thread.sleep(waitTime);
                return callAI(prompt, attempt + 1);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Retry interrupted", ie);
            }
        }
        throw new RuntimeException("AI API failed after " + MAX_RETRIES + " attempts. Last reason: " + reason);
    }

    private String cleanMarkdownCodeBlocks(String text) {
        if (text == null) return "";
        String cleaned = text.trim();
        int startIndex = cleaned.indexOf('[');
        int endIndex = cleaned.lastIndexOf(']');
        if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
            return cleaned.substring(startIndex, endIndex + 1);
        }
        // Fallback cho markdown block
        return cleaned.replaceAll("(?s)```json\\s*(.*?)\\s*```", "$1")
                      .replaceAll("(?s)```\\s*(.*?)\\s*```", "$1")
                      .trim();
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("API key chưa được cấu hình trong application.properties");
        }
    }
}