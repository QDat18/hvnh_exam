package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.Question;
import vn.hvnh.exam.common.DifficultyLevel;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    
    List<Question> findBySubject_Id(UUID subjectId);
    
    List<Question> findByChapter_ChapterId(UUID chapterId);

    long countBySubject_Id(UUID subjectId);

    @Query(value = "SELECT * FROM questions " +
                   "WHERE subject_id = :subjectId " +
                   "AND ((CAST(:chapterId AS uuid) IS NULL AND chapter_id IS NULL) OR (chapter_id = CAST(:chapterId AS uuid))) " +
                   "AND difficulty_level = CAST(:#{#difficulty.name()} AS difficultylevel)", 
           nativeQuery = true)
    List<Question> findByMatrixCriteria(
            @Param("subjectId") UUID subjectId,
            @Param("chapterId") UUID chapterId, 
            @Param("difficulty") DifficultyLevel difficulty
    );

    // Hàm lấy ngẫu nhiên và giới hạn số lượng bằng Java
    default List<Question> findByChapterAndDifficulty(UUID subjectId, UUID chapterId, DifficultyLevel difficulty, Integer limit) {
        List<Question> questions = findByMatrixCriteria(subjectId, chapterId, difficulty);
        Collections.shuffle(questions);
        if (limit != null && questions.size() > limit) {
            return questions.subList(0, limit);
        }
        return questions;
    }

    @Query(value = "SELECT * FROM questions WHERE subject_id = :subjectId", nativeQuery = true)
    List<Question> findBySubjectInternal(@Param("subjectId") UUID subjectId);

    default List<Question> findRandomBySubject(UUID subjectId, int limit) {
        List<Question> questions = findBySubjectInternal(subjectId);
        Collections.shuffle(questions);
        if (questions.size() > limit) {
            return questions.subList(0, limit);
        }
        return questions;
    }

    // 🔥 ĐÃ FIX: Bổ sung "countQuery" siêu quan trọng cho phân trang Native SQL
    @Query(value = "SELECT * FROM questions WHERE subject_id = :subjectId " +
           "AND (CAST(:chapterId AS uuid) IS NULL OR chapter_id = CAST(:chapterId AS uuid)) " +
           "AND (:difficulty IS NULL OR difficulty_level = CAST(:difficulty AS difficultylevel)) " +
           "AND (:keyword IS NULL OR LOWER(question_text) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')))",
           countQuery = "SELECT count(*) FROM questions WHERE subject_id = :subjectId " +
           "AND (CAST(:chapterId AS uuid) IS NULL OR chapter_id = CAST(:chapterId AS uuid)) " +
           "AND (:difficulty IS NULL OR difficulty_level = CAST(:difficulty AS difficultylevel)) " +
           "AND (:keyword IS NULL OR LOWER(question_text) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%')))",
           nativeQuery = true)
    Page<Question> searchQuestions(
            @Param("subjectId") UUID subjectId,
            @Param("chapterId") UUID chapterId,
            @Param("difficulty") String difficulty, 
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query(value = "SELECT CAST(difficulty_level AS text) as level, COUNT(*) as count FROM questions WHERE subject_id = :subjectId GROUP BY difficulty_level", nativeQuery = true)
    List<Map<String, Object>> countByDifficulty(@Param("subjectId") UUID subjectId);

    @Query(value = "SELECT CAST(bloom_level AS text) as level, COUNT(*) as count FROM questions WHERE subject_id = :subjectId GROUP BY bloom_level", nativeQuery = true)
    List<Map<String, Object>> countByBloomLevel(@Param("subjectId") UUID subjectId);
    
    Page<Question> findBySubject_Id(UUID subjectId, Pageable pageable);
}