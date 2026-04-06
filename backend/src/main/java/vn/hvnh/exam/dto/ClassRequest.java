package vn.hvnh.exam.dto;

public class ClassRequest {
    private String classCode;
    private String className;
    private String academicYear;
    private Integer semester;
    private Integer maxStudents;
    private String description;
    private String advisorTeacherId;

    public ClassRequest() {}

    public ClassRequest(String classCode, String className, String academicYear, Integer semester, Integer maxStudents, String description, String advisorTeacherId) {
        this.classCode = classCode;
        this.className = className;
        this.academicYear = academicYear;
        this.semester = semester;
        this.maxStudents = maxStudents;
        this.description = description;
        this.advisorTeacherId = advisorTeacherId;
    }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAdvisorTeacherId() { return advisorTeacherId; }
    public void setAdvisorTeacherId(String advisorTeacherId) { this.advisorTeacherId = advisorTeacherId; }
}