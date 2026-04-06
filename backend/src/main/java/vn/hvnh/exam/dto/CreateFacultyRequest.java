package vn.hvnh.exam.dto;

public class CreateFacultyRequest {
    private String facultyCode;
    private String facultyName;
    private String description;

    public String getFacultyCode() { return facultyCode; }
    public void setFacultyCode(String facultyCode) { this.facultyCode = facultyCode; }
    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
