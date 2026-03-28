package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import vn.hvnh.exam.dto.ClassRequest;
import vn.hvnh.exam.dto.CreateTeacherRequest;
import vn.hvnh.exam.dto.StudentRequest;
import vn.hvnh.exam.entity.sql.ClassStudent;
import vn.hvnh.exam.entity.sql.Classes;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.service.TeacherManagementService;
import vn.hvnh.exam.service.ClassManagementService;
import vn.hvnh.exam.service.DepartmentService;
import vn.hvnh.exam.service.StudentManagementService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;


/**
 * Controller cho FACULTY_ADMIN
 * Quản lý Giảng viên trong khoa
 */
@RestController
@RequestMapping("/api/faculty-admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('FACULTY_ADMIN')")
public class FacultyAdminController {
    
    private final TeacherManagementService teacherManagementService;
    private final DepartmentService departmentService;
    private final ClassManagementService classManagementService;
    private final StudentManagementService studentManagementService;
    /**
     * GET /api/faculty-admin/teachers
     * Lấy danh sách giảng viên trong khoa
     */
    @GetMapping("/teachers")
    public ResponseEntity<?> getTeachers(Authentication authentication) {
        try {
            String facultyAdminEmail = authentication.getName();
            List<User> teachers = teacherManagementService.getTeachersByFacultyAdmin(facultyAdminEmail);
            
            List<Map<String, Object>> safeResponse = teachers.stream()
                // 🔥 THÊM ĐÚNG 1 DÒNG NÀY: Lọc bỏ những giảng viên đã bị xóa (INACTIVE)
                .filter(t -> !"INACTIVE".equals(t.getStatus())) 
                .map(t -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", t.getId());
                    dto.put("fullName", t.getFullName());
                    dto.put("dateOfBirth", t.getDateOfBirth());
                    dto.put("email", t.getEmail());
                    dto.put("status", t.getStatus());
                    
                    if (t.getDepartment() != null) {
                        dto.put("departmentId", t.getDepartment().getId());
                        dto.put("departmentName", t.getDepartment().getDepartmentName());
                    } else {
                        dto.put("departmentName", "Chưa phân bộ môn");
                    }
                    
                    return dto;
                }).collect(Collectors.toList());

            return ResponseEntity.ok(safeResponse);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi server: " + e.getMessage()
            ));
        }
    }
    /**
     * POST /api/faculty-admin/teachers
     * Thêm giảng viên mới → Tự động tạo account
     */
    @PostMapping("/teachers")
    public ResponseEntity<?> createTeacher(
            @RequestBody CreateTeacherRequest request,
            Authentication authentication
    ) {
        try {
            String facultyAdminEmail = authentication.getName();
            
            System.out.println("👤 [FACULTY ADMIN] Creating teacher by: " + facultyAdminEmail);
            System.out.println("📋 [FACULTY ADMIN] Teacher email: " + request.getEmail());
            
            // Create teacher account
            Map<String, Object> result = teacherManagementService.createTeacher(
                request,
                facultyAdminEmail
            );
            
            User teacher = (User) result.get("teacher");
            String password = (String) result.get("password");
            
            // Response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo giảng viên thành công");
            
            // 🔥 THÊM DÒNG NÀY: Đưa password ra ngoài để Frontend lấy được bằng res.data.password
            response.put("password", password); 
            
            response.put("teacher", Map.of(
                "id", teacher.getId(),
                "email", teacher.getEmail(),
                "fullName", teacher.getFullName(),
                "note", "Lưu mật khẩu này! Sẽ không hiển thị lại."
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [FACULTY ADMIN] Error creating teacher: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * PUT /api/faculty-admin/teachers/{id}
     * Cập nhật thông tin giảng viên
     */
    @PutMapping("/teachers/{id}")
    public ResponseEntity<?> updateTeacher(
            @PathVariable UUID id,
            @RequestBody CreateTeacherRequest request
    ) {
        try {
            User updated = teacherManagementService.updateTeacher(id, request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cập nhật giảng viên thành công",
                "teacher", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * DELETE /api/faculty-admin/teachers/{id}
     * Vô hiệu hóa giảng viên
     */
    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<?> deactivateTeacher(@PathVariable UUID id) {
        try {
            teacherManagementService.deactivateTeacher(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã vô hiệu hóa giảng viên"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * POST /api/faculty-admin/teachers/{id}/reset-password
     * Reset mật khẩu giảng viên
     */
    @PostMapping("/teachers/{id}/reset-password")
    public ResponseEntity<?> resetTeacherPassword(@PathVariable UUID id) {
        try {
            Map<String, String> result = teacherManagementService.resetPassword(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reset mật khẩu thành công",
                "email", result.get("email"),
                "newPassword", result.get("password"),
                "note", "Lưu mật khẩu này! Sẽ không hiển thị lại."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * GET /api/faculty-admin/dashboard
     * Dashboard statistics cho Faculty Admin
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        String facultyAdminEmail = authentication.getName();
        Map<String, Object> stats = teacherManagementService.getFacultyStatistics(facultyAdminEmail);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * GET /api/faculty-admin/my-faculty
     * Thông tin khoa mà Faculty Admin đang quản lý
     */
    @GetMapping("/my-faculty")
    public ResponseEntity<?> getMyFaculty(Authentication authentication) {
        String facultyAdminEmail = authentication.getName();
        Map<String, Object> facultyInfo = teacherManagementService.getFacultyInfo(facultyAdminEmail);
        return ResponseEntity.ok(facultyInfo);
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getMyDepartments(Authentication authentication) {
        try {
            String facultyAdminEmail = authentication.getName();
            
            // 1. Lấy thông tin khoa của Admin này
            Map<String, Object> facultyInfo = teacherManagementService.getFacultyInfo(facultyAdminEmail);
            UUID facultyId = (UUID) facultyInfo.get("id");
            
            // 2. Trả về danh sách bộ môn của khoa đó
            // (Đảm bảo bạn đã khai báo private final DepartmentService departmentService; ở đầu class)
            return ResponseEntity.ok(departmentService.getDepartmentsByFaculty(facultyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, String> payload, Authentication authentication) {
        try {
            String facultyAdminEmail = authentication.getName();
            // Lấy ID Khoa của Admin đang đăng nhập
            Map<String, Object> facultyInfo = teacherManagementService.getFacultyInfo(facultyAdminEmail);
            UUID facultyId = (UUID) facultyInfo.get("id");
            
            String departmentName = payload.get("departmentName");
            return ResponseEntity.ok(departmentService.createDepartment(departmentName, facultyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * DELETE /api/faculty-admin/departments/{id}
     * Xóa bộ môn
     */
    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable UUID id) {
        try {
            departmentService.deleteDepartment(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Xóa bộ môn thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xóa bộ môn vì đang có giảng viên hoặc môn học trực thuộc."
            ));
        }
    }

    /**
     * PUT /api/faculty-admin/departments/{id}
     * Sửa tên bộ môn
     */
    @PutMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        try {
            String newName = payload.get("departmentName");
            departmentService.updateDepartment(id, newName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cập nhật bộ môn thành công"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // ==========================================
    // QUẢN LÝ LỚP HÀNH CHÍNH (CLASSES)
    // ==========================================

    @GetMapping("/classes")
    public ResponseEntity<?> getClasses(Authentication authentication) {
        try {
            List<Classes> classes = classManagementService.getClassesByFacultyAdmin(authentication.getName());
            
            // Xử lý an toàn tránh lỗi Hibernate Proxy
            List<Map<String, Object>> response = classes.stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .map(c -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", c.getId());
                    map.put("classCode", c.getClassCode());
                    map.put("className", c.getClassName());
                    map.put("academicYear", c.getAcademicYear());
                    map.put("semester", c.getSemester());
                    map.put("maxStudents", c.getMaxStudents());
                    
                    if (c.getAdvisorTeacher() != null) {
                        map.put("advisorTeacherId", c.getAdvisorTeacher().getId());
                        map.put("advisorTeacherName", c.getAdvisorTeacher().getFullName());
                    } else {
                        map.put("advisorTeacherName", "Chưa phân công");
                    }
                    return map;
                }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/classes")
    public ResponseEntity<?> createClass(@RequestBody ClassRequest request, Authentication authentication) {
        try {
            Classes newClass = classManagementService.createClass(request, authentication.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Tạo lớp thành công", "classId", newClass.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<?> updateClass(@PathVariable UUID id, @RequestBody ClassRequest request) {
        try {
            classManagementService.updateClass(id, request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật lớp thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable UUID id) {
        try {
            classManagementService.deleteClass(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã vô hiệu hóa lớp"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/classes/{classId}/students")
    public ResponseEntity<?> addStudentToClass(
            @PathVariable UUID classId, 
            @RequestBody StudentRequest request, 
            Authentication authentication) {
        try {
            studentManagementService.addStudentToClass(classId, request, authentication.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm sinh viên vào lớp thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/classes/{classId}/students")
    public ResponseEntity<?> getStudentsInClass(@PathVariable UUID classId) {
        try {
            // Lấy danh sách ClassStudent từ Service
            List<ClassStudent> list = classManagementService.getStudentsByClass(classId);
            
            // Chuyển đổi sang Map để trả về JSON cho Frontend
            List<Map<String, Object>> response = list.stream().map(cs -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", cs.getStudent().getId());
                map.put("studentID", cs.getStudent().getStudentId()); // Mã SV
                map.put("fullName", cs.getStudent().getFullName());
                map.put("dateOfBirth", cs.getStudent().getDateOfBirth());
                map.put("email", cs.getStudent().getEmail());
                map.put("gender", cs.getStudent().getGender());
                map.put("address", cs.getStudent().getAddress());
                map.put("status", cs.getStatus());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }}