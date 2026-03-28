package vn.hvnh.exam.dto;

import lombok.*;
import vn.hvnh.exam.entity.sql.CourseClass;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    public static CourseClassResponse fromEntity(CourseClass cc) {
        return CourseClassResponse.builder()
                .id(cc.getId())
                .classCode(cc.getClassCode())
                .className(cc.getClassName())
                .semester(cc.getSemester())
                .academicYear(cc.getAcademicYear())
                .subjectName(cc.getSubject() != null ? cc.getSubject().getSubjectName() : "N/A")
                .teacherName(cc.getTeacher() != null ? cc.getTeacher().getFullName() : "Chưa phân công")
                .joinCode(cc.getJoinCode())
                .maxStudents(cc.getMaxStudents())
                .status(cc.getStatus())
                .build();
    }
}