package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "practice_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSession {
    
    @Id
    @GeneratedValue
    @Column(name = "session_id")
    private UUID sessionId;
    
    @Column(name = "student_id")
    private UUID studentId;
    
    @Column(name = "subject_id")
    private UUID subjectId;
    
    @Column(name = "session_type", length = 50)
    private String sessionType; // RANDOM_QUIZ, CHAPTER_PRACTICE, AI_GENERATED, FLASHCARD
    
    @Column(name = "source_type", length = 50)
    private String sourceType; // SYSTEM_BANK, STUDENT_DOCUMENT
    
    @Column(name = "student_document_id")
    private UUID studentDocumentId;
    
    @Column(name = "total_questions")
    private Integer totalQuestions;
    
    @Column(name = "correct_answers")
    @Builder.Default
    private Integer correctAnswers = 0;
    
    @Column(name = "score")
    @Builder.Default
    private Double score = 0.0;
    
    @Column(name = "time_spent_seconds")
    @Builder.Default
    private Integer timeSpentSeconds = 0;
    
    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}