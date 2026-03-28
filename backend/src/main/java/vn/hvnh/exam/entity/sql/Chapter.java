package vn.hvnh.exam.entity.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.util.UUID;

@Entity
@Table(name = "chapters", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "chapter_id", nullable = false)
    private UUID chapterId;

    // Map với cột subject_id (FK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    // 🔥 ĐÃ CÓ TRONG SQL -> KHAI BÁO Ở ĐÂY
    @Column(name = "chapter_number", nullable = false)
    private Integer chapterNumber;

    @Column(name = "chapter_name", nullable = false, length = 255)
    private String chapterName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index")
    @ColumnDefault("0")
    private Integer orderIndex;
}