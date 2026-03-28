package vn.hvnh.exam.dto;

import lombok.Builder;
import lombok.Data;
import vn.hvnh.exam.entity.sql.Answer;
import java.util.UUID;

@Data
@Builder
public class AnswerResponse {
    private UUID answerId;
    private String answerText;
    private Boolean isCorrect;
    private String answerLabel;

    // Hàm tiện ích để chuyển từ Entity sang DTO
    public static AnswerResponse fromEntity(Answer answer) {
        if (answer == null) return null;
        return AnswerResponse.builder()
                .answerId(answer.getAnswerId())
                .answerText(answer.getAnswerText())
                .isCorrect(answer.getIsCorrect())
                .answerLabel(answer.getAnswerLabel())
                .build();
    }
}