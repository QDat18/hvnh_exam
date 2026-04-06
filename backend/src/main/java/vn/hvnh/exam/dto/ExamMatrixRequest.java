package vn.hvnh.exam.dto;

import java.util.List;
import java.util.UUID;

public class ExamMatrixRequest {
    private UUID subjectId;
    private List<ChapterMatrix> matrices;

    public ExamMatrixRequest() {}

    public ExamMatrixRequest(UUID subjectId, List<ChapterMatrix> matrices) {
        this.subjectId = subjectId;
        this.matrices = matrices;
    }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public List<ChapterMatrix> getMatrices() { return matrices; }
    public void setMatrices(List<ChapterMatrix> matrices) { this.matrices = matrices; }

    public static class ChapterMatrix {
        private UUID chapterId;
        private int easyCount;
        private int mediumCount;
        private int hardCount;

        public ChapterMatrix() {}

        public ChapterMatrix(UUID chapterId, int easyCount, int mediumCount, int hardCount) {
            this.chapterId = chapterId;
            this.easyCount = easyCount;
            this.mediumCount = mediumCount;
            this.hardCount = hardCount;
        }

        public UUID getChapterId() { return chapterId; }
        public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }
        public int getEasyCount() { return easyCount; }
        public void setEasyCount(int easyCount) { this.easyCount = easyCount; }
        public int getMediumCount() { return mediumCount; }
        public void setMediumCount(int mediumCount) { this.mediumCount = mediumCount; }
        public int getHardCount() { return hardCount; }
        public void setHardCount(int hardCount) { this.hardCount = hardCount; }
    }
}