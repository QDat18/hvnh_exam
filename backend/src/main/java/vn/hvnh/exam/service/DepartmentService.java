package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.hvnh.exam.entity.sql.Department;
import vn.hvnh.exam.entity.sql.Faculty;
import vn.hvnh.exam.repository.sql.DepartmentRepository;
import vn.hvnh.exam.repository.sql.FacultyRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    // Lấy bộ môn theo khoa
    public List<Department> getDepartmentsByFaculty(UUID facultyId) {
        return departmentRepository.findByFacultyId(facultyId);
    }

    // Tạo bộ môn (cần check Khoa có tồn tại không)
    public Department createDepartment(String name, UUID facultyId) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Khoa với ID: " + facultyId));

        Department dept = Department.builder()
                .departmentName(name)
                .faculty(faculty)
                .build();
        
        return departmentRepository.save(dept);
    }

    public Department getDepartmentById(UUID id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Bộ môn với ID: " + id));
    }
    
    public void deleteDepartment(UUID departmentId) {
            departmentRepository.deleteById(departmentId);
    }

    // Thêm hàm Cập nhật bộ môn
    public Department updateDepartment(UUID departmentId, String newName) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bộ môn với ID: " + departmentId));
        
        dept.setDepartmentName(newName);
        return departmentRepository.save(dept);
    }

}