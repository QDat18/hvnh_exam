package vn.hvnh.exam.repository.sql;

import vn.hvnh.exam.entity.sql.ClassStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassStudentRepository extends JpaRepository<ClassStudent, UUID> {
    List<ClassStudent> findByClassEntity_Id(UUID classId);
    List<ClassStudent> findByStudent_Id(UUID studentId);
    List<ClassStudent> findByClassEntity_IdAndStatus(UUID classId, String status);
    boolean existsByClassEntity_IdAndStudent_Id(UUID classId, UUID studentId);
}