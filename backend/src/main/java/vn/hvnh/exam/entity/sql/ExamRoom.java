package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Entity
@Table(name = "exam_rooms")
public class ExamRoom {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_class_id", nullable = false)
    private CourseClass courseClass;

    @Column(nullable = false)
    private String name; 

    @Column(name = "creation_mode")
    private String creationMode; 

    @Column(name = "start_time")
    private LocalDateTime startTime; 

    @Column(name = "end_time")
    private LocalDateTime endTime; 

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes; 

    @Column(name = "max_attempts")
    private Integer maxAttempts; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy; 

    @Column(name = "status")
    private String status; 

    @Column(name="pdf_url")
    private String pdfUrl;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "answer_key", columnDefinition = "text") 
    private String answerKey;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "show_result")
    private Boolean showResult = true;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "exam_room_questions",
        joinColumns = @JoinColumn(name = "exam_room_id", referencedColumnName = "room_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id", referencedColumnName = "question_id")
    )
    @OrderColumn(name = "order_index") 
    private List<Question> questions;

    public ExamRoom() {}

    public ExamRoom(UUID id, CourseClass courseClass, String name, String creationMode, LocalDateTime startTime, LocalDateTime endTime, Integer durationMinutes, Integer maxAttempts, User createdBy, String status, String pdfUrl, Integer totalQuestions, String answerKey, LocalDateTime createdAt, Boolean showResult, List<Question> questions) {
        this.id = id;
        this.courseClass = courseClass;
        this.name = name;
        this.creationMode = creationMode;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.maxAttempts = maxAttempts;
        this.createdBy = createdBy;
        this.status = status;
        this.pdfUrl = pdfUrl;
        this.totalQuestions = totalQuestions;
        this.answerKey = answerKey;
        this.createdAt = createdAt;
        this.showResult = (showResult == null) ? true : showResult;
        this.questions = questions;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public CourseClass getCourseClass() { return courseClass; }
    public void setCourseClass(CourseClass courseClass) { this.courseClass = courseClass; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCreationMode() { return creationMode; }
    public void setCreationMode(String creationMode) { this.creationMode = creationMode; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public String getAnswerKey() { return answerKey; }
    public void setAnswerKey(String answerKey) { this.answerKey = answerKey; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Boolean getShowResult() { return showResult; }
    public void setShowResult(Boolean showResult) { this.showResult = showResult; }
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
    }

    // Manual Builder
    public static ExamRoomBuilder builder() {
        return new ExamRoomBuilder();
    }

    public static class ExamRoomBuilder {
        private UUID id;
        private CourseClass courseClass;
        private String name;
        private String creationMode;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer durationMinutes;
        private Integer maxAttempts;
        private User createdBy;
        private String status;
        private String pdfUrl;
        private Integer totalQuestions;
        private String answerKey;
        private LocalDateTime createdAt;
        private Boolean showResult = true;
        private List<Question> questions;

        public ExamRoomBuilder id(UUID id) { this.id = id; return this; }
        public ExamRoomBuilder courseClass(CourseClass courseClass) { this.courseClass = courseClass; return this; }
        public ExamRoomBuilder name(String name) { this.name = name; return this; }
        public ExamRoomBuilder creationMode(String creationMode) { this.creationMode = creationMode; return this; }
        public ExamRoomBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public ExamRoomBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public ExamRoomBuilder durationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public ExamRoomBuilder maxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; return this; }
        public ExamRoomBuilder createdBy(User createdBy) { this.createdBy = createdBy; return this; }
        public ExamRoomBuilder status(String status) { this.status = status; return this; }
        public ExamRoomBuilder pdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; return this; }
        public ExamRoomBuilder totalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; return this; }
        public ExamRoomBuilder answerKey(String answerKey) { this.answerKey = answerKey; return this; }
        public ExamRoomBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ExamRoomBuilder showResult(Boolean showResult) { this.showResult = showResult; return this; }
        public ExamRoomBuilder questions(List<Question> questions) { this.questions = questions; return this; }

        public ExamRoom build() {
            return new ExamRoom(id, courseClass, name, creationMode, startTime, endTime, durationMinutes, maxAttempts, createdBy, status, pdfUrl, totalQuestions, answerKey, createdAt, showResult, questions);
        }
    }
}
