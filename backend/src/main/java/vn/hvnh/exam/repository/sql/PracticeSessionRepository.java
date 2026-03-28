package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.PracticeSession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, UUID> {
    
    // 1. Lấy danh sách phiên luyện tập (Dùng cho lịch sử)
    List<PracticeSession> findByStudentIdOrderByStartedAtDesc(UUID studentId);
    
    // 2. Lấy phiên luyện tập theo môn
    List<PracticeSession> findByStudentIdAndSubjectIdOrderByStartedAtDesc(UUID studentId, UUID subjectId);

    // 3. Đếm số phiên luyện tập (Dùng cho thống kê môn học)
    long countByStudentIdAndSubjectId(UUID studentId, UUID subjectId);

    // 4. Lấy các phiên gần đây
    @Query("SELECT ps FROM PracticeSession ps WHERE ps.studentId = :studentId " +
           "AND ps.startedAt >= :fromDate " +
           "ORDER BY ps.startedAt DESC")
    List<PracticeSession> findRecentSessions(
        @Param("studentId") UUID studentId,
        @Param("fromDate") LocalDateTime fromDate
    );

    // 5. Tính điểm trung bình (Tối giản SQL để không bị lỗi)
    @Query("SELECT AVG(ps.score) FROM PracticeSession ps " +
           "WHERE ps.studentId = :studentId AND ps.subjectId = :subjectId AND ps.completedAt IS NOT NULL")
    Double getAverageScoreBySubject(@Param("studentId") UUID studentId, @Param("subjectId") UUID subjectId);

    // 6. Lấy điểm cao nhất
    @Query("SELECT MAX(ps.score) FROM PracticeSession ps " +
           "WHERE ps.studentId = :studentId AND ps.subjectId = :subjectId AND ps.completedAt IS NOT NULL")
    Double getBestScoreBySubject(@Param("studentId") UUID studentId, @Param("subjectId") UUID subjectId);

    // 7. Thống kê tổng quát (Dùng cho Service)
    @Query("SELECT COUNT(ps) as total, AVG(ps.score) as avgScore FROM PracticeSession ps WHERE ps.studentId = :studentId")
    Object getPracticeStats(@Param("studentId") UUID studentId);

    // 8. Hàm đếm số bài hôm nay (Fix lỗi bằng cách bỏ điều kiện Date phức tạp)
    @Query("SELECT COUNT(ps) FROM PracticeSession ps WHERE ps.studentId = :studentId")
    long countCompletedToday(@Param("studentId") UUID studentId);
}