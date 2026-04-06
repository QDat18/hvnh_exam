package vn.hvnh.exam.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vn.hvnh.exam.entity.nosql.ActionLog;
import vn.hvnh.exam.repository.nosql.ActionLogRepository;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    private final ActionLogRepository actionLogRepository;

    public AuditLogService(ActionLogRepository actionLogRepository) {
        this.actionLogRepository = actionLogRepository;
    }

    /**
     * @Async giúp việc ghi log chạy ngầm (Thread riêng).
     * Dù Mongo có bị chậm 1 giây thì API chính của User cũng không bị delay.
     */
    @Async 
    public void logAction(String email, String role, String action, String ipAddress, String endPoint, String details) {
        ActionLog log = ActionLog.builder()
                .email(email)
                .role(role)
                .action(action)
                .ipAddress(ipAddress)
                .endPoint(endPoint)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        
        actionLogRepository.save(log);
    }
}