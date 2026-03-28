package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedQuestion {
    private String questionText;
    private List<String> options;
    private String correctAnswer;
    private String difficulty;
    private String sourcePage;
    private String sourceChapter;
}