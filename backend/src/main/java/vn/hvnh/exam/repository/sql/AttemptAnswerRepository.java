package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.AttemptAnswer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, UUID> {
    // Tìm câu trả lời nháp của một câu hỏi cụ thể trong 1 lượt thi
    Optional<AttemptAnswer> findByAttempt_AttemptIdAndQuestion_QuestionId(UUID attemptId, UUID questionId);
    
    // Lấy tất cả câu trả lời của 1 lượt thi để chấm điểm
    List<AttemptAnswer> findByAttempt_AttemptId(UUID attemptId);
    Optional<AttemptAnswer> findFirstByAttempt_AttemptIdAndQuestion_QuestionId(UUID attemptId, UUID questionId);
    
}