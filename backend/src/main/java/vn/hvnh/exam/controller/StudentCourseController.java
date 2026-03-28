package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.service.CourseClassService;

import java.util.Map;

@RestController
@RequestMapping("/api/student/course-classes")
@RequiredArgsConstructor
public class StudentCourseController {

    private final CourseClassService courseClassService;

    // API: Sinh viên nhập mã tham gia lớp
    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> joinClass(@RequestBody Map<String, String> payload, Authentication authentication) {
        try {
            String joinCode = payload.get("joinCode");
            String studentEmail = authentication.getName(); // Lấy email sinh viên từ Token đăng nhập
            
            String className = courseClassService.joinClassByCode(joinCode, studentEmail);
            
            return ResponseEntity.ok(Map.of(
                "success", true, 
                "message", "Tham gia lớp " + className + " thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}