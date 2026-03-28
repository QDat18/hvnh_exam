package vn.hvnh.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class ChapterDTO {
    @NotNull(message = "ID môn học không được để trống")
    private UUID subjectId;

    @NotNull(message = "Số thứ tự chương không được để trống")
    private Integer chapterNumber;

    @NotBlank(message = "Tên chương không được để trống")
    private String chapterName;

    private String description;
}