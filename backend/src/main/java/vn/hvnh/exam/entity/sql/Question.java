package vn.hvnh.exam.entity.sql;

import java.time.LocalDateTime; 
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType; // Nhớ import List
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType;

@Entity
@Table(name = "questions")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "question_id")
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable=true)
    private Chapter chapter;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    private DifficultyLevel difficultyLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "bloom_level")
    private BloomLevel bloomLevel;

    // 🔥 THÊM ĐOẠN NÀY ĐỂ FIX LỖI (Quan hệ 1-N với bảng Answers)
    // cascade = ALL: Xóa câu hỏi thì xóa luôn câu trả lời
    // JsonManagedReference: Giúp Jackson hiểu đây là chiều "cha" để serialize
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference 
    private List<Answer> answers; 

    @Column(name = "is_active")
    @ColumnDefault("true")
    private Boolean isActive;

    @Column(name = "is_verified")
    @ColumnDefault("false")
    private Boolean isVerified;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType = QuestionType.MCQ_SINGLE;

    @Column(name = "topic")
    private String topic; // Chủ đề bài học

    @Column(name = "tags")
    private String tags; 

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation; // Giải thích đáp án

    @Column(name = "usage_count")
    @ColumnDefault("0")
    private Integer usageCount = 0; // Đếm số lần đã được bốc vào đề thi

    public vn.hvnh.exam.entity.sql.Answer getCorrectAnswer() {
        if (this.answers == null) return null;

        return this.answers.stream()
                .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                .findFirst()
                .orElse(null);
    }
    
}