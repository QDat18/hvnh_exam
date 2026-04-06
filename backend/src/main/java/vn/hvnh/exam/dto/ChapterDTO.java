package vn.hvnh.exam.dto;

import java.util.UUID;

public class ChapterDTO {
    private UUID subjectId;
    private Integer chapterNumber;
    private String chapterName;
    private String description;

    public ChapterDTO() {}

    public ChapterDTO(UUID subjectId, Integer chapterNumber, String chapterName, String description) {
        this.subjectId = subjectId;
        this.chapterNumber = chapterNumber;
        this.chapterName = chapterName;
        this.description = description;
    }

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }

    public Integer getChapterNumber() { return chapterNumber; }
    public void setChapterNumber(Integer chapterNumber) { this.chapterNumber = chapterNumber; }

    public String getChapterName() { return chapterName; }
    public void setChapterName(String chapterName) { this.chapterName = chapterName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}