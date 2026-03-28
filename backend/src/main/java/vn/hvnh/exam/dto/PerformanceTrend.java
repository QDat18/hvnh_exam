package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceTrend {
    private LocalDateTime date;
    private Double score;
    private Integer sessionsCount;
}