package vn.hvnh.exam.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DepartmentRequest {
    private String departmentName;
    private UUID facultyId;
}