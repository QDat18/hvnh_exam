package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recommendation {
    private String type; // WEAK_SUBJECT, FLASHCARD_REVIEW, LOW_PERFORMANCE
    private String priority; // HIGH, MEDIUM, LOW
    private String message;
    private String action; // PRACTICE, REVIEW_FLASHCARDS, etc.
    private Map<String, Object> data;
}