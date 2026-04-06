package vn.hvnh.exam.dto;

import java.util.*;

public class SubmitPracticeRequest {
    private UUID sessionId;
    private Map<UUID, String> answers; // questionId -> selectedAnswer

    public SubmitPracticeRequest() {}

    public SubmitPracticeRequest(UUID sessionId, Map<UUID, String> answers) {
        this.sessionId = sessionId;
        this.answers = answers;
    }

    // Manual getters to bypass Lombok failures
    public UUID getSessionId() { return sessionId; }
    public Map<UUID, String> getAnswers() { return answers; }

    public void setSessionId(UUID id) { this.sessionId = id; }
    public void setAnswers(Map<UUID, String> answers) { this.answers = answers; }

    public static SubmitPracticeRequestBuilder builder() {
        return new SubmitPracticeRequestBuilder();
    }

    public static class SubmitPracticeRequestBuilder {
        private UUID sessionId;
        private Map<UUID, String> answers;

        public SubmitPracticeRequestBuilder sessionId(UUID id) { this.sessionId = id; return this; }
        public SubmitPracticeRequestBuilder answers(Map<UUID, String> answers) { this.answers = answers; return this; }

        public SubmitPracticeRequest build() {
            return new SubmitPracticeRequest(sessionId, answers);
        }
    }
}