package vn.hvnh.exam.dto;

import java.util.UUID;

public class BulkCourseClassRequest {
    private UUID subjectId;
    private String baseClassCode;
    private String baseClassName;
    private String semester;
    private String academicYear;
    private Integer quantity;
    private Integer maxStudents;

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getBaseClassCode() { return baseClassCode; }
    public void setBaseClassCode(String baseClassCode) { this.baseClassCode = baseClassCode; }
    public String getBaseClassName() { return baseClassName; }
    public void setBaseClassName(String baseClassName) { this.baseClassName = baseClassName; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }
}