package vn.hvnh.exam.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class BulkCourseClassRequest {
    private UUID subjectId;         // Chọn Môn học
    private String baseClassCode;   // Mã gốc (VD: IT101) -> Hệ thống tự sinh IT101_01, IT101_02
    private String baseClassName;   // Tên gốc (VD: Lập trình Java) -> Sinh ra Lập trình Java - Nhóm 1
    private String semester;        // VD: HK1
    private String academicYear;    // VD: 2024-2025
    private Integer quantity;       // Số lượng nhóm cần mở (VD: 5)
    private Integer maxStudents;    
}