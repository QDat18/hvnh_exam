package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    // 🔥 ĐÃ THÊM: Đánh dấu phòng này dùng PDF hay bốc Ngân hàng (BANK)
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
    
    // 🔥 ĐÃ THÊM: Ghi nhận thời gian tạo phòng
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
    }

    @Column(name = "show_result")
    private Boolean showResult = true;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "exam_room_questions",
        joinColumns = @JoinColumn(name = "exam_room_id", referencedColumnName = "room_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id", referencedColumnName = "question_id")
    )
    @OrderColumn(name = "order_index") 
    private java.util.List<Question> questions;
}
