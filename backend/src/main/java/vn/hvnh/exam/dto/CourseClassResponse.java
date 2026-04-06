package vn.hvnh.exam.dto;

import vn.hvnh.exam.entity.sql.CourseClass;
import java.util.UUID;

public class CourseClassResponse {
    private UUID id;
    private String classCode;
    private String className;
    private String semester;
    private String academicYear;
    private String subjectName;
    private String teacherName;
    private String joinCode;
    private Integer maxStudents;
    private String status;

    public CourseClassResponse() {}

    public CourseClassResponse(UUID id, String classCode, String className, String semester, String academicYear, 
                               String subjectName, String teacherName, String joinCode, Integer maxStudents, String status) {
        this.id = id;
        this.classCode = classCode;
        this.className = className;
        this.semester = semester;
        this.academicYear = academicYear;
        this.subjectName = subjectName;
        this.teacherName = teacherName;
        this.joinCode = joinCode;
        this.maxStudents = maxStudents;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    public String getJoinCode() { return joinCode; }
    public void setJoinCode(String joinCode) { this.joinCode = joinCode; }
    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static CourseClassResponse fromEntity(CourseClass cc) {
        CourseClassResponse response = new CourseClassResponse();
        response.setId(cc.getId());
        response.setClassCode(cc.getClassCode());
        response.setClassName(cc.getClassName());
        response.setSemester(cc.getSemester());
        response.setAcademicYear(cc.getAcademicYear());
        response.setSubjectName(cc.getSubject() != null ? cc.getSubject().getSubjectName() : "N/A");
        response.setTeacherName(cc.getTeacher() != null ? cc.getTeacher().getFullName() : "Chưa phân công");
        response.setJoinCode(cc.getJoinCode());
        response.setMaxStudents(cc.getMaxStudents());
        response.setStatus(cc.getStatus());
        return response;
    }
}