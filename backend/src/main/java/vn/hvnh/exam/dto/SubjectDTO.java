package vn.hvnh.exam.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class SubjectDTO {
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private UUID departmentId; 
    private String description;
    private Boolean isActive;
    private String subjectGroup;

    public SubjectDTO() {}

    public SubjectDTO(String subjectCode, String subjectName, Integer credits, UUID departmentId, String description, Boolean isActive, String subjectGroup) {
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.credits = credits;
        this.departmentId = departmentId;
        this.description = description;
        this.isActive = isActive;
        this.subjectGroup = subjectGroup;
    }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getSubjectGroup() { return subjectGroup; }
    public void setSubjectGroup(String subjectGroup) { this.subjectGroup = subjectGroup; }
}