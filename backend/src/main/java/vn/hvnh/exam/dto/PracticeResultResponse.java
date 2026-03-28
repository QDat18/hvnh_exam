package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeResultResponse {
    private UUID sessionId;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double score;
    private Integer timeSpentSeconds;
    private List<QuestionResult> results;
    private LocalDateTime completedAt;
}