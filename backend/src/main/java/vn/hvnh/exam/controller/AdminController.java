package vn.hvnh.exam.controller;

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

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminController {
    
    private final FacultyService facultyService;
    private final UserAttemptRepository userAttemptRepository;
    private final DepartmentService departmentService;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ExamRoomRepository examRoomRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final RateLimitFilter rateLimitFilter;
    private final ActionLogRepository actionLogRepository;

    public AdminController(
            FacultyService facultyService,
            UserAttemptRepository userAttemptRepository,
            DepartmentService departmentService,
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            ExamRoomRepository examRoomRepository,
            SystemSettingRepository systemSettingRepository,
            RateLimitFilter rateLimitFilter,
            ActionLogRepository actionLogRepository
    ) {
        this.facultyService = facultyService;
        this.userAttemptRepository = userAttemptRepository;
        this.departmentService = departmentService;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.examRoomRepository = examRoomRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.rateLimitFilter = rateLimitFilter;
        this.actionLogRepository = actionLogRepository;
    }

    @GetMapping("/faculties")
    public ResponseEntity<?> getAllFaculties() {
        List<Faculty> faculties = facultyService.getAllFaculties();
        return ResponseEntity.ok(faculties);
    }
    
    @PostMapping("/faculties")
    public ResponseEntity<?> createFaculty(
            @RequestBody CreateFacultyRequest request,
            Authentication authentication
    ) {
        try {
            String adminEmail = authentication.getName();
            Map<String, Object> result = facultyService.createFacultyWithAdmin(request, adminEmail);
            
            Faculty faculty = (Faculty) result.get("faculty");
            User facultyAdmin = (User) result.get("facultyAdmin");
            String password = (String) result.get("password");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo khoa thành công");
            response.put("faculty", Map.of(
                "id", faculty.getId(),
                "code", faculty.getFacultyCode(),
                "name", faculty.getFacultyName()
            ));
            response.put("facultyAdmin", Map.of(
                "id", facultyAdmin.getId(),
                "email", facultyAdmin.getEmail(),
                "fullName", facultyAdmin.getFullName(),
                "password", password,
                "note", "Lưu mật khẩu này! Sẽ không hiển thị lại."
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PutMapping("/faculties/{id}")
    public ResponseEntity<?> updateFaculty(@PathVariable UUID id, @RequestBody CreateFacultyRequest request) {
        try {
            Faculty updated = facultyService.updateFaculty(id, request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật khoa thành công", "faculty", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @DeleteMapping("/faculties/{id}")
    public ResponseEntity<?> deleteFaculty(@PathVariable UUID id) {
        try {
            facultyService.deactivateFaculty(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã vô hiệu hóa khoa"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
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
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            long totalUsers = userRepository.count();
            long activeSubjects = subjectRepository.count(); 
            long totalExams = userAttemptRepository.count();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("activeSubjects", activeSubjects);
            stats.put("examsTodayCount", totalExams); 
            stats.put("uptime", "99.9% (24/7)");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("totalUsers", 0, "activeSubjects", 0, "examsTodayCount", 0, "uptime", "Bảo trì"));
        }
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<?> getRecentActivities() {
        try {
            List<UserAttempt> recent = userAttemptRepository.findTop20ByEndTimeIsNotNullOrderByEndTimeDesc();
            List<Map<String, Object>> activities = recent.stream().map(att -> {
                User student = att.getUser();
                String examName = att.getExamRoom() != null ? att.getExamRoom().getName() : "Bài thi";
                Map<String, Object> item = new HashMap<>();
                item.put("userName", student.getFullName() != null ? student.getFullName() : "Sinh viên");
                item.put("avatarUrl", student.getAvatarUrl());
                double score = att.getScore() != null ? att.getScore() : 0.0;
                item.put("action", String.format("Đã nộp bài \"%s\" — Điểm: %.1f", examName, score));
                item.put("timestamp", att.getEndTime());
                item.put("timeAgo", formatTimeAgo(att.getEndTime()));
                return item;
            }).toList();
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    private String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "";
        Duration d = Duration.between(time, LocalDateTime.now());
        if (d.toMinutes() < 1)   return "Vừa xong";
        if (d.toMinutes() < 60)  return d.toMinutes()  + " phút trước";
        if (d.toHours()   < 24)  return d.toHours()    + " giờ trước";
        return                          d.toDays()     + " ngày trước";
    }

    @GetMapping("/faculties/{facultyId}/departments")
    public ResponseEntity<?> getDepartmentsByFaculty(@PathVariable UUID facultyId) {
        try {
            return ResponseEntity.ok(departmentService.getDepartmentsByFaculty(facultyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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
            return ResponseEntity.ok(List.of());
        }
    }

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

    @PostMapping("/settings")
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, String> settings) {
        try {
            for (Map.Entry<String, String> entry : settings.entrySet()) {
                SystemSetting setting = systemSettingRepository.findById(entry.getKey()).orElse(new SystemSetting());
                setting.setSettingKey(entry.getKey());
                setting.setSettingValue(entry.getValue());
                systemSettingRepository.save(setting);
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã lưu cài đặt thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi lưu cài đặt: " + e.getMessage()));
        }
    }

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