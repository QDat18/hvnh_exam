package vn.hvnh.exam.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ExamCreateRequest {
    private String title;
    private UUID courseClassId;
    private Integer durationMinutes;
    private LocalDateTime examDate;
    private Integer totalQuestions;
    private Integer maxAttempts; 
    private Boolean showResult;
    private List<UUID> questionIds;
    private List<ChapterMatrix> matrix;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public UUID getCourseClassId() { return courseClassId; }
    public void setCourseClassId(UUID courseClassId) { this.courseClassId = courseClassId; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public LocalDateTime getExamDate() { return examDate; }
    public void setExamDate(LocalDateTime examDate) { this.examDate = examDate; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public Boolean getShowResult() { return showResult; }
    public void setShowResult(Boolean showResult) { this.showResult = showResult; }
    public List<UUID> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<UUID> questionIds) { this.questionIds = questionIds; }
    public List<ChapterMatrix> getMatrix() { return matrix; }
    public void setMatrix(List<ChapterMatrix> matrix) { this.matrix = matrix; }

    public static class ChapterMatrix {
        private UUID chapterId;
        private Integer easyCount;
        private Integer mediumCount;
        private Integer hardCount;

        public UUID getChapterId() { return chapterId; }
        public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }
        public Integer getEasyCount() { return easyCount; }
        public void setEasyCount(Integer easyCount) { this.easyCount = easyCount; }
        public Integer getMediumCount() { return mediumCount; }
        public void setMediumCount(Integer mediumCount) { this.mediumCount = mediumCount; }
        public Integer getHardCount() { return hardCount; }
        public void setHardCount(Integer hardCount) { this.hardCount = hardCount; }
    }
}