package vn.hvnh.exam.dto;

import lombok.Data;

@Data
public class CreateTeacherRequest {
    private String email;
    private String fullName;
    private String dateOfBirth;
    private String phone;
    private String address;
    private String departmentId; 
}