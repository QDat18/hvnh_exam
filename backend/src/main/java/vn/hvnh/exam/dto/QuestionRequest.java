package vn.hvnh.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType; // Bổ sung import

import java.util.List;
import java.util.UUID;

@Data
public class QuestionRequest {
    @NotNull(message = "Thiếu ID Môn học") 
    private UUID subjectId;
    
    // 🔥 ĐÃ BỎ @NotNull Ở ĐÂY CHO PHÉP TẠO CÂU HỎI KHO CHUNG
    private UUID chapterId; 
    
    private UUID objectiveId; 

    @NotBlank(message = "Nội dung câu hỏi không được trống")
    private String questionText;

    private BloomLevel bloomLevel;       
    private DifficultyLevel difficultyLevel; 

    private QuestionType questionType;
    private String explanation;

    @NotNull(message = "Câu hỏi phải có đáp án")
    @Size(min = 2, message = "Phải có ít nhất 2 đáp án")
    private List<AnswerRequest> answers; 
}