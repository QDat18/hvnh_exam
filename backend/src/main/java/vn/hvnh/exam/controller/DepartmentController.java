package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// Đảm bảo import đúng DTO request
import vn.hvnh.exam.dto.DepartmentRequest; 
import vn.hvnh.exam.entity.sql.Department;
import vn.hvnh.exam.service.DepartmentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {
    private final DepartmentService departmentService;

    // Gộp logic: Nếu có facultyId thì lọc, không thì lấy tất cả
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments(
            @RequestParam(required = false) UUID facultyId
    ) {
        if (facultyId != null) {
            return ResponseEntity.ok(departmentService.getDepartmentsByFaculty(facultyId));
        }
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    // API tạo mới giữ nguyên
    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody DepartmentRequest req) {
        return ResponseEntity.ok(departmentService.createDepartment(req.getDepartmentName(), req.getFacultyId()));
    }

    // API cập nhật giữ nguyên
    // @PutMapping("/{id}")
    // public ResponseEntity<Department> updateDepartment(
    //         @PathVariable UUID id,
    //         @RequestBody DepartmentRequest req
    // ) {
    //     return ResponseEntity.ok(departmentService.updateDepartment(id, req.getDepartmentName(), req.getFacultyId()));
    // }

    // // API xóa giữ nguyên
    // @DeleteMapping("/{id}")
    // public ResponseEntity<Void> deleteDepartment(@PathVariable UUID id) {
    //     departmentService.deleteDepartment(id);
    //     return ResponseEntity.noContent().build();
    // }
}