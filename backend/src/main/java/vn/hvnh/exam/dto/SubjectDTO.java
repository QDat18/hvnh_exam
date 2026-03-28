package vn.hvnh.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class SubjectDTO {
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private UUID departmentId; 
    private String description;
    private Boolean isActive;
    
    private String subjectGroup; 
}