package vn.hvnh.exam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.dto.DepartmentRequest; 
import vn.hvnh.exam.entity.sql.Department;
import vn.hvnh.exam.service.DepartmentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    
    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments(
            @RequestParam(required = false) UUID facultyId
    ) {
        if (facultyId != null) {
            return ResponseEntity.ok(departmentService.getDepartmentsByFaculty(facultyId));
        }
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody DepartmentRequest req) {
        return ResponseEntity.ok(departmentService.createDepartment(req.getDepartmentName(), req.getFacultyId()));
    }
}