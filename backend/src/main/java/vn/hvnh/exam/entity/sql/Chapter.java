package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import java.util.UUID;

@Entity
@Table(name = "chapters", schema = "public")
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "chapter_id", nullable = false)
    private UUID chapterId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "chapter_number", nullable = false)
    private Integer chapterNumber;

    @Column(name = "chapter_name", nullable = false, length = 255)
    private String chapterName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index")
    @ColumnDefault("0")
    private Integer orderIndex;

    public Chapter() {}

    public Chapter(UUID chapterId, Subject subject, Integer chapterNumber, String chapterName, String description, Integer orderIndex) {
        this.chapterId = chapterId;
        this.subject = subject;
        this.chapterNumber = chapterNumber;
        this.chapterName = chapterName;
        this.description = description;
        this.orderIndex = (orderIndex == null) ? 0 : orderIndex;
    }

    // Getters and Setters
    public UUID getChapterId() { return chapterId; }
    public void setChapterId(UUID chapterId) { this.chapterId = chapterId; }
    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }
    public Integer getChapterNumber() { return chapterNumber; }
    public void setChapterNumber(Integer chapterNumber) { this.chapterNumber = chapterNumber; }
    public String getChapterName() { return chapterName; }
    public void setChapterName(String chapterName) { this.chapterName = chapterName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    // Manual Builder
    public static ChapterBuilder builder() {
        return new ChapterBuilder();
    }

    public static class ChapterBuilder {
        private UUID chapterId;
        private Subject subject;
        private Integer chapterNumber;
        private String chapterName;
        private String description;
        private Integer orderIndex = 0;

        public ChapterBuilder chapterId(UUID chapterId) { this.chapterId = chapterId; return this; }
        public ChapterBuilder subject(Subject subject) { this.subject = subject; return this; }
        public ChapterBuilder chapterNumber(Integer chapterNumber) { this.chapterNumber = chapterNumber; return this; }
        public ChapterBuilder chapterName(String chapterName) { this.chapterName = chapterName; return this; }
        public ChapterBuilder description(String description) { this.description = description; return this; }
        public ChapterBuilder orderIndex(Integer orderIndex) { this.orderIndex = orderIndex; return this; }

        public Chapter build() {
            return new Chapter(chapterId, subject, chapterNumber, chapterName, description, orderIndex);
        }
    }
}