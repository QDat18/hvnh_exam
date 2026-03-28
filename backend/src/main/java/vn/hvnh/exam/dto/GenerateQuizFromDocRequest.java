

package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateQuizFromDocRequest {
    private Integer numQuestions = 20;
    private List<String> chapters; // Chapter titles/numbers to include
    private Map<String, Integer> difficultyDistribution;
}