package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnalyticsResponse {
    private PracticeStatistics practiceStats;
    private FlashcardStatistics flashcardStats;
    private List<SubjectPerformance> subjectPerformance;
    private List<PerformanceTrend> trends;
}