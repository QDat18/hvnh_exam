package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

public class Recommendation {
    private String type; // WEAK_SUBJECT, FLASHCARD_REVIEW, LOW_PERFORMANCE
    private String priority; // HIGH, MEDIUM, LOW
    private String message;
    private String action; // PRACTICE, REVIEW_FLASHCARDS, etc.
    private Map<String, Object> data;

    public Recommendation() {}

    public Recommendation(String type, String priority, String message, String action, Map<String, Object> data) {
        this.type = type;
        this.priority = priority;
        this.message = message;
        this.action = action;
        this.data = data;
    }

    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    // Builder
    public static RecommendationBuilder builder() {
        return new RecommendationBuilder();
    }

    public static class RecommendationBuilder {
        private String type;
        private String priority;
        private String message;
        private String action;
        private Map<String, Object> data;

        public RecommendationBuilder type(String type) { this.type = type; return this; }
        public RecommendationBuilder priority(String priority) { this.priority = priority; return this; }
        public RecommendationBuilder message(String message) { this.message = message; return this; }
        public RecommendationBuilder action(String action) { this.action = action; return this; }
        public RecommendationBuilder data(Map<String, Object> data) { this.data = data; return this; }

        public Recommendation build() {
            return new Recommendation(type, priority, message, action, data);
        }
    }
}