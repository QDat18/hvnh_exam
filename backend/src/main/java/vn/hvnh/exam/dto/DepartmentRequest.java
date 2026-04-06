package vn.hvnh.exam.dto;

import java.util.UUID;

public class DepartmentRequest {
    private String departmentName;
    private UUID facultyId;

    public DepartmentRequest() {}

    public DepartmentRequest(String departmentName, UUID facultyId) {
        this.departmentName = departmentName;
        this.facultyId = facultyId;
    }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public UUID getFacultyId() { return facultyId; }
    public void setFacultyId(UUID facultyId) { this.facultyId = facultyId; }
}