package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitPracticeRequest {
    private UUID sessionId;
    private Map<UUID, String> answers; // questionId -> selectedAnswer
}