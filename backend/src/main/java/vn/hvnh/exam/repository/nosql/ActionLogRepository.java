package vn.hvnh.exam.repository.nosql;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import vn.hvnh.exam.entity.nosql.ActionLog;

public interface ActionLogRepository extends MongoRepository<ActionLog, String> {
    // Lấy log mới nhất, hỗ trợ phân trang
    Page<ActionLog> findAllByOrderByTimestampDesc(Pageable pageable);
    
    // Tìm log theo email (để theo dõi một sinh viên cụ thể có gian lận không)
    Page<ActionLog> findByEmailOrderByTimestampDesc(String email, Pageable pageable);
}