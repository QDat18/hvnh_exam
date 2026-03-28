package vn.hvnh.exam.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ExamMatrixRequest {
    private UUID subjectId;
    private List<ChapterMatrix> matrices;

    @Data
    public static class ChapterMatrix {
        private UUID chapterId;
        private int easyCount;
        private int mediumCount;
        private int hardCount;
    }
}