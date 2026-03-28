package vn.hvnh.exam.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
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

    @Data
    public static class ChapterMatrix {
        private UUID chapterId;
        private Integer easyCount;
        private Integer mediumCount;
        private Integer hardCount;
    }
}