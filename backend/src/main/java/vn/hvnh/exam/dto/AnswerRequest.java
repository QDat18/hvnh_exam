package vn.hvnh.exam.dto;

import lombok.Data;

@Data
public class AnswerRequest {
    private String answerText;
    private Boolean isCorrect;
    private String answerLabel;
}