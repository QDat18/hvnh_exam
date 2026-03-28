package vn.hvnh.exam.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CourseClassRequest {
    private String classCode;       // VD: IT101_N01
    private String className;       // VD: Lập trình Java - Nhóm 1
    private String semester;        // VD: HK1
    private String academicYear;    // VD: 2024-2025
    private UUID subjectId;         // ID Môn học
    private UUID teacherId;         // ID Giảng viên (Có thể null nếu chưa phân công)
    private Integer maxStudents;    // Sĩ số tối đa (Mặc định 60)
}