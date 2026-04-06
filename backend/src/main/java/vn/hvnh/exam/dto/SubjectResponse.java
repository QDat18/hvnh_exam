package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.Subject;
import java.util.UUID;

public class SubjectResponse {
    private UUID id;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private String departmentName; 
    private UUID departmentId; 
    private String facultyName;    
    private String description;
    private Boolean isActive;
    private String subjectGroup;

    public SubjectResponse() {}

    public SubjectResponse(UUID id, String subjectCode, String subjectName, Integer credits, String departmentName, UUID departmentId, String facultyName, String description, Boolean isActive, String subjectGroup) {
        this.id = id;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.credits = credits;
        this.departmentName = departmentName;
        this.departmentId = departmentId;
        this.facultyName = facultyName;
        this.description = description;
        this.isActive = isActive;
        this.subjectGroup = subjectGroup;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getSubjectGroup() { return subjectGroup; }
    public void setSubjectGroup(String subjectGroup) { this.subjectGroup = subjectGroup; }

    public static SubjectResponse fromEntity(Subject s) {
        SubjectResponse dto = new SubjectResponse();
        dto.setId(s.getId());
        dto.setSubjectCode(s.getSubjectCode());
        dto.setSubjectName(s.getSubjectName());
        dto.setCredits(s.getCredits());
        dto.setDescription(s.getDescription());
        dto.setIsActive(s.getIsActive());
        
        dto.setSubjectGroup(s.getSubjectGroup() != null ? s.getSubjectGroup().name() : null);

        if (s.getDepartment() != null) {
            dto.setDepartmentName(s.getDepartment().getDepartmentName());
            dto.setDepartmentId(s.getDepartment().getId()); 
            if (s.getDepartment().getFaculty() != null) {
                dto.setFacultyName(s.getDepartment().getFaculty().getFacultyName());
            }
        }
        return dto;
    }
}