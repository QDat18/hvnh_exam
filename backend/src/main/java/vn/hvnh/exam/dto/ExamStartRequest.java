package vn.hvnh.exam.dto;

import vn.hvnh.exam.common.ExamMode;
import java.util.List;
import java.util.UUID;

public class ExamStartRequest {
    private UUID subjectId;
    private UUID chapterId;
    private ExamMode mode;
    private List<UUID> chapterIds;
    private Integer totalQuestions;
    private Integer easyPercent;
    private Integer mediumPercent;
    private Integer hardPercent;

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public UUID getChapterId() { return chapterId; }
    public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }
    public ExamMode getMode() { return mode; }
    public void setMode(ExamMode mode) { this.mode = mode; }
    public List<UUID> getChapterIds() { return chapterIds; }
    public void setChapterIds(List<UUID> chapterIds) { this.chapterIds = chapterIds; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public Integer getEasyPercent() { return easyPercent; }
    public void setEasyPercent(Integer easyPercent) { this.easyPercent = easyPercent; }
    public Integer getMediumPercent() { return mediumPercent; }
    public void setMediumPercent(Integer mediumPercent) { this.mediumPercent = mediumPercent; }
    public Integer getHardPercent() { return hardPercent; }
    public void setHardPercent(Integer hardPercent) { this.hardPercent = hardPercent; }
}