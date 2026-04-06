package vn.hvnh.exam.dto;

public class CreateTeacherRequest {
    private String email;
    private String fullName;
    private String dateOfBirth;
    private String phone;
    private String address;
    private String departmentId;

    public CreateTeacherRequest() {}

    public CreateTeacherRequest(String email, String fullName, String dateOfBirth, String phone, String address, String departmentId) {
        this.email = email;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.phone = phone;
        this.address = address;
        this.departmentId = departmentId;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
}