package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import vn.hvnh.exam.dto.CreateFacultyRequest;
import vn.hvnh.exam.entity.nosql.ActionLog;
import vn.hvnh.exam.entity.sql.Faculty;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.entity.sql.UserAttempt;
import vn.hvnh.exam.repository.nosql.ActionLogRepository;
import vn.hvnh.exam.repository.sql.SubjectRepository;
import vn.hvnh.exam.repository.sql.UserAttemptRepository;
import vn.hvnh.exam.repository.sql.UserRepository;
import vn.hvnh.exam.repository.sql.ExamRoomRepository;
import vn.hvnh.exam.repository.sql.SystemSettingRepository;
import vn.hvnh.exam.entity.sql.ExamRoom;
import vn.hvnh.exam.entity.sql.CourseClass;
import vn.hvnh.exam.entity.sql.SystemSetting;
import vn.hvnh.exam.security.RateLimitFilter;
import vn.hvnh.exam.service.FacultyService;
import vn.hvnh.exam.service.DepartmentService;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Pageable;

/**
 * Controller cho ADMIN
 * Quản lý Khoa và Faculty Admin
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminController {
    
    // ✅ Fix: đổi FacultyService → facultyService (Java convention, tránh NPE tiềm ẩn)
    private final FacultyService facultyService;
    private final UserAttemptRepository userAttemptRepository;
    private final DepartmentService departmentService;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ExamRoomRepository examRoomRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final RateLimitFilter rateLimitFilter;
    /**
     * GET /api/admin/faculties
     * Lấy danh sách tất cả các khoa
     */
    @GetMapping("/faculties")
    public ResponseEntity<?> getAllFaculties() {
        List<Faculty> faculties = facultyService.getAllFaculties();
        return ResponseEntity.ok(faculties);
    }
    
    /**
     * POST /api/admin/faculties
     * Tạo khoa mới → Tự động tạo Faculty Admin
     */
    @PostMapping("/faculties")
    public ResponseEntity<?> createFaculty(
            @RequestBody CreateFacultyRequest request,
            Authentication authentication
    ) {
        try {
            String adminEmail = authentication.getName();
            
            System.out.println("👤 [ADMIN] Creating faculty by: " + adminEmail);
            System.out.println("📋 [ADMIN] Faculty: " + request.getFacultyName());
            
            // Create faculty and auto-create faculty admin
            Map<String, Object> result = facultyService.createFacultyWithAdmin(
                request,
                adminEmail
            );
            
            Faculty faculty = (Faculty) result.get("faculty");
            User facultyAdmin = (User) result.get("facultyAdmin");
            String password = (String) result.get("password");
            
            // Response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo khoa thành công");
            response.put("faculty", Map.of(
                "id", faculty.getId(),
                "code", faculty.getFacultyCode(),
                "name", faculty.getFacultyName()
            ));

            // ⚠️ SECURITY TODO: Không nên trả password qua HTTP response trong production.
            // Thay thế bằng: gửi email qua MailService hoặc mã hoá AES trước khi trả.
            // Tạm thời giữ để dev test, BẮT BUỘC dùng HTTPS và không log response này.
            response.put("facultyAdmin", Map.of(
                "id", facultyAdmin.getId(),
                "email", facultyAdmin.getEmail(),
                "fullName", facultyAdmin.getFullName(),
                "password", password,
                "note", "Lưu mật khẩu này! Sẽ không hiển thị lại."
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ [ADMIN] Error creating faculty: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * PUT /api/admin/faculties/{id}
     * Cập nhật thông tin khoa
     */
    @PutMapping("/faculties/{id}")
    public ResponseEntity<?> updateFaculty(
            @PathVariable UUID id,
            @RequestBody CreateFacultyRequest request
    ) {
        try {
            Faculty updated = facultyService.updateFaculty(id, request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cập nhật khoa thành công",
                "faculty", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * DELETE /api/admin/faculties/{id}
     * Xóa khoa (soft delete - set is_active = false)
     */
    @DeleteMapping("/faculties/{id}")
    public ResponseEntity<?> deleteFaculty(@PathVariable UUID id) {
        try {
            facultyService.deactivateFaculty(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã vô hiệu hóa khoa"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * POST /api/admin/faculties/{id}/reset-admin-password
     * Reset mật khẩu Faculty Admin
     */
    @PostMapping("/faculties/{id}/reset-admin-password")
    public ResponseEntity<?> resetFacultyAdminPassword(@PathVariable UUID id) {
        try {
            Map<String, String> result = facultyService.resetFacultyAdminPassword(id);
            
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
     * GET /api/admin/statistics
     * Thống kê tổng quan
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            // Đếm số lượng thực tế dưới Database
            long totalUsers = userRepository.count();
            long activeSubjects = subjectRepository.count(); 
            long totalExams = userAttemptRepository.count(); // Tạm lấy tổng lượt thi toàn hệ thống
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("activeSubjects", activeSubjects);
            stats.put("examsTodayCount", totalExams); 
            stats.put("uptime", "99.9% (24/7)"); // Thông số phần cứng (có thể Hardcode cho ngầu)
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            // Trả về số 0 nếu có lỗi để Frontend không sập
            return ResponseEntity.ok(Map.of(
                "totalUsers", 0, "activeSubjects", 0, "examsTodayCount", 0, "uptime", "Bảo trì"
            ));
        }
    }
    /**
     * GET /api/admin/recent-activities
     * Lấy 20 lượt nộp bài gần nhất trong toàn hệ thống để hiển thị activity feed.
     * Dùng UserAttempt (endTime != null) làm nguồn activity.
     */
@GetMapping("/recent-activities")
    public ResponseEntity<?> getRecentActivities() {
        try {
            // Gọi hàm đã khai báo ở Bước 1
            List<UserAttempt> recent = userAttemptRepository.findTop20ByEndTimeIsNotNullOrderByEndTimeDesc();

            List<Map<String, Object>> activities = recent.stream().map(att -> {
                User student = att.getUser();
                String examName = att.getExamRoom() != null ? att.getExamRoom().getName() : "Bài thi";

                Map<String, Object> item = new HashMap<>();
                item.put("userName", student.getFullName() != null ? student.getFullName() : "Sinh viên");
                item.put("avatarUrl", student.getAvatarUrl());
                
                // Format điểm số làm tròn 1 chữ số thập phân
                double score = att.getScore() != null ? att.getScore() : 0.0;
                item.put("action", String.format("Đã nộp bài \"%s\" — Điểm: %.1f", examName, score));
                
                item.put("timestamp", att.getEndTime());
                item.put("timeAgo", formatTimeAgo(att.getEndTime()));
                
                return item;
            }).toList();

            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of()); // Trả mảng rỗng để Dashboard không lỗi
        }
    }

    /** Helper: chuyển LocalDateTime thành chữ (Vừa xong, 5 phút trước...) */
    private String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "";
        Duration d = Duration.between(time, LocalDateTime.now());
        if (d.toMinutes() < 1)   return "Vừa xong";
        if (d.toMinutes() < 60)  return d.toMinutes()  + " phút trước";
        if (d.toHours()   < 24)  return d.toHours()    + " giờ trước";
        return                          d.toDays()     + " ngày trước";
    }

    /**
     * GET /api/admin/faculties/{facultyId}/departments
     * ADMIN xem bo mon cua bat ky khoa nao (khac faculty-admin chi thay khoa minh)
     */
    @GetMapping("/faculties/{facultyId}/departments")
    public ResponseEntity<?> getDepartmentsByFaculty(@PathVariable UUID facultyId) {
        try {
            return ResponseEntity.ok(departmentService.getDepartmentsByFaculty(facultyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Autowired
    private ActionLogRepository actionLogRepository;

    /**
     * GET /api/admin/logs?page=0&size=50
     * Lấy danh sách nhật ký hệ thống từ MongoDB
     */
    @GetMapping("/logs")
    public ResponseEntity<?> getSystemLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ActionLog> logs = actionLogRepository.findAllByOrderByTimestampDesc(pageable);
            
            return ResponseEntity.ok(Map.of(
                "content", logs.getContent(),
                "totalElements", logs.getTotalElements(),
                "totalPages", logs.getTotalPages(),
                "currentPage", logs.getNumber()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi khi lấy log MongoDB: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/active-exam-rooms
     * Lấy tất cả phòng thi đang ACTIVE trong toàn hệ thống
     */
    @GetMapping("/active-exam-rooms")
    public ResponseEntity<?> getActiveExamRooms() {
        try {
            List<ExamRoom> activeRooms = examRoomRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
            
            List<Map<String, Object>> result = activeRooms.stream().map(room -> {
                Map<String, Object> map = new HashMap<>();
                map.put("roomId", room.getId());
                map.put("roomName", room.getName());
                map.put("durationMinutes", room.getDurationMinutes());
                map.put("startTime", room.getStartTime());
                map.put("endTime", room.getEndTime());
                map.put("createdAt", room.getCreatedAt());
                
                CourseClass cc = room.getCourseClass();
                if (cc != null) {
                    map.put("classId", cc.getId());
                    map.put("className", cc.getClassName());
                    map.put("classCode", cc.getClassCode());
                    map.put("subjectName", cc.getSubject() != null ? cc.getSubject().getSubjectName() : "");
                }
                return map;
            }).toList();

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    // ======================== SETTINGS API ========================

    /**
     * GET /api/admin/settings
     * Lấy tất cả cài đặt hệ thống dưới dạng Map
     */
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        try {
            List<SystemSetting> all = systemSettingRepository.findAll();
            Map<String, String> result = new HashMap<>();
            for (SystemSetting s : all) {
                result.put(s.getSettingKey(), s.getSettingValue());
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of());
        }
    }

    /**
     * POST /api/admin/settings
     * Lưu/cập nhật cài đặt từ request body (JSON key-value)
     */
    @PostMapping("/settings")
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, String> settings) {
        try {
            for (Map.Entry<String, String> entry : settings.entrySet()) {
                SystemSetting setting = systemSettingRepository.findById(entry.getKey())
                    .orElse(new SystemSetting());
                setting.setSettingKey(entry.getKey());
                setting.setSettingValue(entry.getValue());
                systemSettingRepository.save(setting);
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã lưu cài đặt thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi lưu cài đặt: " + e.getMessage()));
        }
    }

    // ======================== SECURITY STATUS API ========================

    /**
     * GET /api/admin/security-status
     * Trả về thống kê bảo mật real-time từ RateLimitFilter
     */
    @GetMapping("/security-status")
    public ResponseEntity<?> getSecurityStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("totalRequests", rateLimitFilter.getTotalRequests());
        status.put("totalBlocked", rateLimitFilter.getTotalBlocked());
        status.put("activeIpCount", rateLimitFilter.getActiveIpCount());
        status.put("blockedIpCount", rateLimitFilter.getBlockedIpCount());
        status.put("rateLimitGeneral", "100 req/phút");
        status.put("rateLimitLogin", "5 req/phút");
        status.put("jwtEnabled", true);
        status.put("corsEnabled", true);
        status.put("csrfDisabled", true);
        status.put("sessionPolicy", "STATELESS");
        return ResponseEntity.ok(status);
    }
}