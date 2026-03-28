package vn.hvnh.exam.entity.nosql;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Document(collection = "action_logs") // Tên bảng (collection) trong MongoDB
public class ActionLog {
    @Id
    private String id;
    
    private String email;          // Ai làm? (Email hoặc User ID)
    private String role;           // Vai trò lúc làm hành động đó
    private String action;         // Làm gì? (VD: "SUBMIT_EXAM", "LOGIN", "UPDATE_SETTING")
    private String ipAddress;      // Địa chỉ IP (Rất quan trọng để bắt gian lận)
    private String endPoint;       // Đường dẫn API đã gọi
    private String details;        // Chi tiết (VD: "Nộp bài môn MIS_01 được 8.5 điểm")
    
    private LocalDateTime timestamp;
}