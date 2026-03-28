package vn.hvnh.exam.repository.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.hvnh.exam.entity.sql.KnowledgeObjective;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeObjectiveRepository extends JpaRepository<KnowledgeObjective, UUID> {
    // Lấy mục kiến thức theo chương
    List<KnowledgeObjective> findByChapter_ChapterId(UUID chapterId);
}