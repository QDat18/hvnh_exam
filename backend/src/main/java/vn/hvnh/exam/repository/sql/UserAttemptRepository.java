package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.UserAttempt;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface UserAttemptRepository extends JpaRepository<UserAttempt, UUID> {
    // Đếm số lần sinh viên đã thi trong phòng này
    long countByUser_IdAndExamRoom_Id(UUID userId, UUID roomId);
    
    // Lấy toàn bộ lượt thi của một phòng để giảng viên thống kê
    List<UserAttempt> findByExamRoom_Id(UUID roomId);

    Optional<UserAttempt> findFirstByUser_IdAndExamRoom_IdAndEndTimeIsNull(UUID userId, UUID roomId);
    Optional<UserAttempt> findFirstByUser_IdAndEndTimeIsNull(UUID userId);
    java.util.Optional<UserAttempt> findFirstByUser_IdAndStatus(java.util.UUID userId, vn.hvnh.exam.common.AttemptStatus status);
    List<UserAttempt> findTop20ByEndTimeIsNotNullOrderByEndTimeDesc();
    @Modifying
    @Query(value = """
        UPDATE user_attempts
        SET status = 'COMPLETED', end_time = NOW()
        WHERE user_id = :userId
        AND exam_room_id = :roomId
        AND status = 'IN_PROGRESS'
        """, nativeQuery = true)
    void forceCloseInProgressAttempts(
        @Param("userId") UUID userId,
        @Param("roomId") UUID roomId
    );
    
}