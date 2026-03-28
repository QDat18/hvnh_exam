package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.Subject;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    
    // Tìm môn theo Department
    List<Subject> findByDepartment_Id(UUID departmentId);

    // Tìm môn theo Code
    java.util.Optional<Subject> findBySubjectCode(String subjectCode);
    @Query("SELECT s FROM Subject s WHERE s.department.faculty.id = :facultyId")
    List<Subject> findByFacultyId(@Param("facultyId") UUID facultyId);
}