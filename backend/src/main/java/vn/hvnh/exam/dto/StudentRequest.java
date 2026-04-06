package vn.hvnh.exam.dto;

public class StudentRequest {
    // Thông tin định danh (Bắt buộc)
    private String studentID; // Mã sinh viên
    private String fullName;    // Họ và tên
    private String email;       // Email (hvnh.edu.vn)

    private String dateOfBirth; // Định dạng YYYY-MM-DD
    private String gender;      // Nam / Nữ
    private String phoneNumber; // Số điện thoại
    private String address;     // Quê quán/Địa chỉ

    public StudentRequest() {}

    public StudentRequest(String studentID, String fullName, String email, String dateOfBirth, String gender, String phoneNumber, String address) {
        this.studentID = studentID;
        this.fullName = fullName;
        this.email = email;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.phoneNumber = phoneNumber;
        this.address = address;
    }

    // Manual Getters and Setters
    public String getStudentID() { return studentID; }
    public void setStudentID(String studentID) { this.studentID = studentID; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}