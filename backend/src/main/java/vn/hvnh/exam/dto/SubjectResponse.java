package vn.hvnh.exam.dto;

import lombok.Data;
import vn.hvnh.exam.entity.sql.Subject;
import java.util.UUID;

@Data
public class SubjectResponse {
    private UUID id;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private String departmentName; 
    private UUID departmentId; // 🔥 THÊM TRƯỜNG NÀY ĐỂ FRONTEND LẤY ID
    private String facultyName;    
    private String description;
    private Boolean isActive;
    private String subjectGroup;

    public static SubjectResponse fromEntity(Subject s) {
        SubjectResponse dto = new SubjectResponse();
        dto.setId(s.getId());
        dto.setSubjectCode(s.getSubjectCode());
        dto.setSubjectName(s.getSubjectName());
        dto.setCredits(s.getCredits());
        dto.setDescription(s.getDescription());
        dto.setIsActive(s.getIsActive());
        
        // Chuyển Enum sang String để hiển thị ở Frontend
        dto.setSubjectGroup(s.getSubjectGroup() != null ? s.getSubjectGroup().name() : null);

        if (s.getDepartment() != null) {
            dto.setDepartmentName(s.getDepartment().getDepartmentName());
            dto.setDepartmentId(s.getDepartment().getId()); // 🔥 MAP ID VÀO ĐÂY
            if (s.getDepartment().getFaculty() != null) {
                dto.setFacultyName(s.getDepartment().getFaculty().getFacultyName());
            }
        }
        return dto;
    }
}