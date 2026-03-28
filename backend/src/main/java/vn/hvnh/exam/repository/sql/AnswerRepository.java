package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.Answer;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {
    // Lấy tất cả đáp án của 1 câu hỏi
    List<Answer> findByQuestion_QuestionId(UUID questionId);
}