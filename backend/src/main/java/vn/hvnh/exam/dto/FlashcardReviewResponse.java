
package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardReviewResponse {
    private String message;
    private Flashcard nextFlashcard;
    private Long remainingCount;
}