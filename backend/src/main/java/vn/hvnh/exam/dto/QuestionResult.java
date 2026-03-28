package vn.hvnh.exam.dto;
import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResult {
    private Question question;
    private String selectedAnswer;
    private String correctAnswer;
    private Boolean isCorrect;
}