package vn.hvnh.exam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.dto.CourseClassRequest;
import vn.hvnh.exam.dto.CourseClassResponse;
import vn.hvnh.exam.dto.BulkCourseClassRequest;
import vn.hvnh.exam.entity.sql.CourseClass;
import vn.hvnh.exam.service.CourseClassService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/faculty-admin/course-classes")
public class FacultyAdminCourseController {

    private final CourseClassService courseClassService;

    public FacultyAdminCourseController(CourseClassService courseClassService) {
        this.courseClassService = courseClassService;
    }

    @GetMapping
    @PreAuthorize("hasRole('FACULTY_ADMIN')")
    public ResponseEntity<List<CourseClassResponse>> getAllClasses() {
        return ResponseEntity.ok(courseClassService.getAllClassesByFaculty());
    }

    @PostMapping
    @PreAuthorize("hasRole('FACULTY_ADMIN')")
    public ResponseEntity<?> createCourseClass(@RequestBody CourseClassRequest request) {
        try {
            CourseClass newClass = courseClassService.createCourseClass(request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo lớp thành công!");
            response.put("joinCode", newClass.getJoinCode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('FACULTY_ADMIN')")
    public ResponseEntity<?> createBulkCourseClasses(@RequestBody BulkCourseClassRequest request) {
        try {
            List<CourseClass> createdClasses = courseClassService.createBulkCourseClasses(request);
            
            List<Map<String, String>> resultList = createdClasses.stream().map(c -> Map.of(
                    "classCode", c.getClassCode(),
                    "className", c.getClassName(),
                    "joinCode", c.getJoinCode()
            )).toList();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tạo thành công " + request.getQuantity() + " nhóm lớp học phần!",
                "data", resultList
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getStudentsInClass(@PathVariable UUID id) {
        return ResponseEntity.ok(courseClassService.getStudentsInClass(id));
    }
}