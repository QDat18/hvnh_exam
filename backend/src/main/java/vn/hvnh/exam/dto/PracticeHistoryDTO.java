package vn.hvnh.exam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

public class PracticeHistoryDTO {
    private UUID id;
    
    @JsonProperty("subjectName")
    private String subjectName;
    
    @JsonProperty("score")
    private Double score;
    
    @JsonProperty("totalQuestions")
    private Integer totalQuestions;
    
    @JsonProperty("correctAnswers")
    private Integer correctAnswers;
    
    @JsonProperty("completedAt")
    private LocalDateTime completedAt;
    
    @JsonProperty("duration")
    private Long duration; // in seconds

    public PracticeHistoryDTO() {}

    public PracticeHistoryDTO(UUID id, String subjectName, Double score, Integer totalQuestions, Integer correctAnswers, LocalDateTime completedAt, Long duration) {
        this.id = id;
        this.subjectName = subjectName;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.completedAt = completedAt;
        this.duration = duration;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }
}
