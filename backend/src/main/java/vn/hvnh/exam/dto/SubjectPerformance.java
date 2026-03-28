package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectPerformance {
    private String subjectName;
    private Long sessionsCount;
    private Double averageScore;
    private Long questionsAttempted;
}