package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.CourseClassStudent;
import java.util.List;
import java.util.UUID;

@Repository
public interface CourseClassStudentRepository extends JpaRepository<CourseClassStudent, UUID> {
    
    // Lấy danh sách sinh viên trong 1 lớp
    List<CourseClassStudent> findByCourseClass_Id(UUID classId);
    
    // Kiểm tra xem sinh viên đã join CHÍNH XÁC lớp này chưa
    boolean existsByCourseClass_IdAndStudent_Id(UUID courseClassId, UUID studentId);
    
    // Đếm số lượng sinh viên hiện tại trong lớp (Để check full slot)
    long countByCourseClass_Id(UUID courseClassId);

    // Kiểm tra xem sinh viên đã học môn này ở bất kỳ lớp nào chưa
    boolean existsByStudent_IdAndCourseClass_Subject_Id(UUID studentId, UUID subjectId);

    // Lấy danh sách các lớp mà một sinh viên đã tham gia
    List<CourseClassStudent> findByStudent_Id(UUID studentId);
}