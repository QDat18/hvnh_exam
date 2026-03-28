package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.CourseClass;
import vn.hvnh.exam.entity.sql.CourseClassStudent;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseClassRepository extends JpaRepository<CourseClass, UUID> {
    
    // 🔥 THÊM DÒNG NÀY: Để truy vấn lớp theo ID của Khoa
    List<CourseClass> findBySubject_Department_Faculty_Id(UUID facultyId);

    // Kiểm tra trùng mã lớp
    boolean existsByClassCode(String classCode);

    // Tìm lớp theo mã Join Code để SV vào lớp
    Optional<CourseClass> findByJoinCode(String joinCode);
  
    List<CourseClass> findByTeacher_Id(UUID teacherId);
    // List<CourseClassStudent> findByCourseClass_Id(UUID classId);
}