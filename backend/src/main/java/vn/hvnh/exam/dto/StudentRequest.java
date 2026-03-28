package vn.hvnh.exam.dto;

import lombok.Data;

@Data
public class StudentRequest {
    // Thông tin định danh (Bắt buộc)
    private String studentID; // Mã sinh viên
    private String fullName;    // Họ và tên
    private String email;       // Email (hvnh.edu.vn)

    private String dateOfBirth; // Định dạng YYYY-MM-DD
    private String gender;      // Nam / Nữ
    private String phoneNumber; // Số điện thoại
    private String address;     // Quê quán/Địa chỉ
}