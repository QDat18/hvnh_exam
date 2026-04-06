package vn.hvnh.exam.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ChatResponse {
    private String role;
    private String message;
    private List<SourceCitation> sources;
    private LocalDateTime timestamp;

    public ChatResponse() {}

    public ChatResponse(String role, String message, List<SourceCitation> sources, LocalDateTime timestamp) {
        this.role = role;
        this.message = message;
        this.sources = sources;
        this.timestamp = timestamp;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<SourceCitation> getSources() { return sources; }
    public void setSources(List<SourceCitation> sources) { this.sources = sources; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public static ChatResponseBuilder builder() {
        return new ChatResponseBuilder();
    }

    public static class ChatResponseBuilder {
        private String role;
        private String message;
        private List<SourceCitation> sources;
        private LocalDateTime timestamp;

        ChatResponseBuilder() {}

        public ChatResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public ChatResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public ChatResponseBuilder sources(List<SourceCitation> sources) {
            this.sources = sources;
            return this;
        }

        public ChatResponseBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public ChatResponse build() {
            return new ChatResponse(role, message, sources, timestamp);
        }
    }
}