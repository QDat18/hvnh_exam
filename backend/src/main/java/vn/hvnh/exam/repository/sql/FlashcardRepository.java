package vn.hvnh.exam.repository.sql;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.Flashcard;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {
    
    // ============================================
    // 1. CÁC HÀM CƠ BẢN (Spring tự sinh SQL)
    // ============================================
    
    Page<Flashcard> findByStudentIdOrderByCreatedAtDesc(UUID studentId, Pageable pageable);
    
    Page<Flashcard> findByStudentIdAndSubjectIdOrderByCreatedAtDesc(UUID studentId, UUID subjectId, Pageable pageable);
    
    Page<Flashcard> findByStudentDocumentIdOrderByCreatedAtDesc(UUID studentDocumentId, Pageable pageable);
    
    // ============================================
    // 2. CÁC HÀM TÌM THẺ MỚI (Dành cho FlashcardService)
    // ============================================
    
    @Query("SELECT f FROM Flashcard f WHERE f.studentId = :studentId " +
           "AND f.timesReviewed = 0 " +
           "AND f.proficiencyLevel = 'NEW' " +
           "ORDER BY f.createdAt ASC")
    List<Flashcard> findNewFlashcards(@Param("studentId") UUID studentId);

    @Query("SELECT COUNT(f) FROM Flashcard f WHERE f.studentId = :studentId " +
           "AND f.proficiencyLevel = 'NEW'")
    long countNewCards(@Param("studentId") UUID studentId);

    // ============================================
    // 3. CÁC HÀM ÔN TẬP (SM-2 đúng chuẩn)
    // ============================================

    // Thẻ đến hạn ôn = thẻ có FlashcardReview mới nhất với nextReviewDate <= today
    // HOẶC thẻ LEARNING chưa có review (mới học lần đầu)
    @Query("""
        SELECT f FROM Flashcard f
        WHERE f.studentId = :studentId
          AND f.proficiencyLevel != 'MASTERED'
          AND (
            f.proficiencyLevel = 'NEW'
            OR EXISTS (
              SELECT r FROM FlashcardReview r
              WHERE r.flashcard = f
                AND r.studentId = :studentId
                AND r.nextReviewDate <= :today
                AND r.reviewedAt = (
                  SELECT MAX(r2.reviewedAt) FROM FlashcardReview r2
                  WHERE r2.flashcard = f AND r2.studentId = :studentId
                )
            )
          )
        ORDER BY f.lastReviewedAt ASC NULLS FIRST
        """)
    List<Flashcard> findDueForReview(
        @Param("studentId") UUID studentId,
        @Param("today") LocalDate today
    );

    @Query("""
        SELECT COUNT(f) FROM Flashcard f
        WHERE f.studentId = :studentId
          AND f.proficiencyLevel != 'MASTERED'
          AND (
            f.proficiencyLevel = 'NEW'
            OR EXISTS (
              SELECT r FROM FlashcardReview r
              WHERE r.flashcard = f
                AND r.studentId = :studentId
                AND r.nextReviewDate <= :today
                AND r.reviewedAt = (
                  SELECT MAX(r2.reviewedAt) FROM FlashcardReview r2
                  WHERE r2.flashcard = f AND r2.studentId = :studentId
                )
            )
          )
        """)
    long countDueForReview(
        @Param("studentId") UUID studentId,
        @Param("today") LocalDate today
    );

    @Query("""
        SELECT f FROM Flashcard f
        WHERE f.studentId = :studentId
          AND f.subjectId = :subjectId
          AND f.proficiencyLevel != 'MASTERED'
          AND (
            f.proficiencyLevel = 'NEW'
            OR EXISTS (
              SELECT r FROM FlashcardReview r
              WHERE r.flashcard = f
                AND r.studentId = :studentId
                AND r.nextReviewDate <= :today
                AND r.reviewedAt = (
                  SELECT MAX(r2.reviewedAt) FROM FlashcardReview r2
                  WHERE r2.flashcard = f AND r2.studentId = :studentId
                )
            )
          )
        ORDER BY f.lastReviewedAt ASC NULLS FIRST
        """)
    List<Flashcard> findDueForReviewBySubject(
        @Param("studentId") UUID studentId,
        @Param("subjectId") UUID subjectId,
        @Param("today") LocalDate today
    );

    // ============================================
    // 4. HÀM THỐNG KÊ & CHỐNG TRÙNG LẶP
    // ============================================
    
    @Query("SELECT " +
           "COUNT(f) as total, " +
           "SUM(CASE WHEN f.proficiencyLevel = 'NEW' THEN 1 ELSE 0 END) as newCards, " +
           "SUM(CASE WHEN f.proficiencyLevel = 'LEARNING' THEN 1 ELSE 0 END) as learning, " +
           "SUM(CASE WHEN f.proficiencyLevel = 'KNOWN' THEN 1 ELSE 0 END) as known, " +
           "SUM(CASE WHEN f.proficiencyLevel = 'MASTERED' THEN 1 ELSE 0 END) as mastered, " +
           "AVG(f.timesReviewed) as avgReviews " +
           "FROM Flashcard f " +
           "WHERE f.studentId = :studentId")
    Object getFlashcardStats(@Param("studentId") UUID studentId);

    /**
     * Kiểm tra xem thẻ đã tồn tại chưa bằng cách so sánh độ tương đồng (similarity)
     * Yêu cầu: Đã cài extension pg_trgm trên PostgreSQL/Supabase
     */
    @Query(value = "SELECT EXISTS (" +
                   "  SELECT 1 FROM flashcards f " +
                   "  WHERE f.student_document_id = :docId " +
                   "    AND similarity(f.front_content, :content) > 0.85" +
                   ")", nativeQuery = true)
    boolean existsBySemanticSimilarity(@Param("docId") UUID docId, @Param("content") String content);

    @Query("SELECT f.subjectId, COUNT(f) FROM Flashcard f WHERE f.studentId = :studentId GROUP BY f.subjectId")
    List<Object[]> countFlashcardsBySubject(@Param("studentId") UUID studentId);

    long countByStudentIdAndProficiencyLevel(UUID studentId, String proficiencyLevel);

    long countByStudentId(UUID studentId);

    @Query("SELECT f.studentDocumentId, COUNT(f) FROM Flashcard f WHERE f.studentDocumentId IN :docIds GROUP BY f.studentDocumentId")
    List<Object[]> countFlashcardsByDocIds(@Param("docIds") List<UUID> docIds);
}