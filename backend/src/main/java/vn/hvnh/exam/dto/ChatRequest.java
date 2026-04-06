package vn.hvnh.exam.dto;

public class ChatRequest {
    private String message;

    public ChatRequest() {}

    public ChatRequest(String message) {
        this.message = message;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static ChatRequestBuilder builder() {
        return new ChatRequestBuilder();
    }

    public static class ChatRequestBuilder {
        private String message;

        ChatRequestBuilder() {}

        public ChatRequestBuilder message(String message) {
            this.message = message;
            return this;
        }

        public ChatRequest build() {
            return new ChatRequest(message);
        }
    }
}
