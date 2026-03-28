package vn.hvnh.exam.dto;

import lombok.Data;

@Data
public class ClassRequest {
    private String classCode;
    private String className;
    private String academicYear;
    private Integer semester;
    private Integer maxStudents;
    private String description;
    private String advisorTeacherId; // ID của Cố vấn học tập (Giảng viên)
}