package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.ExamRoom;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamRoomRepository extends JpaRepository<ExamRoom, UUID> {
    
    // Lấy toàn bộ phòng thi của một Lớp học phần
    List<ExamRoom> findByCourseClass_IdOrderByStartTimeDesc(UUID courseClassId);
    List<ExamRoom> findByCourseClassIdOrderByCreatedAtDesc(UUID courseClassId);
    
    // Lấy tất cả phòng thi theo trạng thái
    List<ExamRoom> findByStatusOrderByCreatedAtDesc(String status);
}