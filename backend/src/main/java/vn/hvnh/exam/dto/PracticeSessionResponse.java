package vn.hvnh.exam.dto;
import lombok.*;
import vn.hvnh.exam.entity.sql.*;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeSessionResponse {
    private UUID sessionId;
    private List<Question> questions;
    private Integer totalQuestions;
    private Subject subject;
    private LocalDateTime startedAt;
}
