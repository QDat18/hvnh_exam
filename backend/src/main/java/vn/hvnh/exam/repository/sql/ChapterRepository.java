package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.Chapter;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {
    
    List<Chapter> findBySubject_IdOrderByOrderIndexAsc(UUID subjectId);
}