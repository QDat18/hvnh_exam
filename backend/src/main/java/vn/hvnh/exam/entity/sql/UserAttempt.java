package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import vn.hvnh.exam.common.AttemptStatus;
import vn.hvnh.exam.common.ExamMode;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "attempt_id")
    private UUID attemptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    // Liên kết với Phòng thi (Đã thêm ở bước trước)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_room_id")
    private ExamRoom examRoom;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_mode", columnDefinition = "exam_mode")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM) // 🔥 VŨ KHÍ BÍ MẬT Ở ĐÂY
    private ExamMode examMode;

    @Column(name = "score", columnDefinition="numeric")
    private Double score;

    @CreationTimestamp
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;
    @Column(columnDefinition = "TEXT")
    private String draftAnswers;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "attempt_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM) // 🔥 ÉP KIỂU CHO CẢ TRƯỜNG STATUS
    private AttemptStatus status;

    @Column(name = "user_answers", columnDefinition = "text")
    private String userAnswers;
}