package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIRecommendationsResponse {
    private List<Recommendation> recommendations;
    private List<String> weakAreas;
    private List<String> strongAreas;
    private Double recentMastery;
}
