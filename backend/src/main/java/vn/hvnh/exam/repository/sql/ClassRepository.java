package vn.hvnh.exam.repository.sql;

import vn.hvnh.exam.entity.sql.Classes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassRepository extends JpaRepository<Classes, UUID> {
    
    Optional<Classes> findByClassCode(String classCode);
    List<Classes> findByFaculty_Id(UUID facultyId);
    List<Classes> findByAdvisorTeacher_Id(UUID teacherId);
    List<Classes> findByAcademicYear(String academicYear);
    boolean existsByClassCode(String classCode);
}
