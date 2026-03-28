package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizFromDocumentResponse {
    private UUID quizId;
    private UUID documentId;
    private List<GeneratedQuestion> questions;
    private Integer totalQuestions;
    private LocalDateTime generatedAt;
}