package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

// ============================================
// PRACTICE ZONE DTOs
// ============================================

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratePracticeRequest {
    private UUID subjectId;
    private Integer numQuestions = 20;
    private Map<String, Integer> difficultyDistribution; // {"easy": 40, "medium": 40, "hard": 20}
    private String mode = "RANDOM"; // RANDOM, BY_CHAPTER, BY_WEAK_AREAS
    private List<UUID> chapterIds;
}


