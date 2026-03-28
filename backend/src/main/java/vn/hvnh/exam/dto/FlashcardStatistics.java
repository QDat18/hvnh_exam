
package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardStatistics {
    private Long totalCards;
    private Long newCards;
    private Long learningCards;
    private Long knownCards;
    private Long masteredCards;
    private Double averageReviews;
}