package vn.hvnh.exam.dto;
import lombok.Data;

@Data
public class CreateFacultyRequest {
    private String facultyCode;
    private String facultyName;
    private String description;    
}
