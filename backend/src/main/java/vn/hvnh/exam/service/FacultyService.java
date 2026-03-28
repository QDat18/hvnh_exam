package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.dto.CreateFacultyRequest;
import vn.hvnh.exam.entity.sql.Faculty;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.FacultyRepository;
import vn.hvnh.exam.repository.sql.UserRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FacultyService {
    
    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;
    private final UserCreationService userCreationService;
    
    /**
     * Lấy tất cả các khoa
     */
    public List<Faculty> getAllFaculties() {
        return facultyRepository.findAllByIsActiveTrueOrderByFacultyNameAsc();
    }
    
    /**
     * Tạo khoa mới và tự động tạo Faculty Admin
     */
    @Transactional
    public Map<String, Object> createFacultyWithAdmin(
            CreateFacultyRequest request,
            String adminEmail
    ) {
        System.out.println("🏫 [FACULTY] Creating faculty: " + request.getFacultyName());
        
        // 1. Kiểm tra faculty code đã tồn tại chưa
        if (facultyRepository.existsByFacultyCode(request.getFacultyCode())) {
            throw new RuntimeException("Mã khoa đã tồn tại: " + request.getFacultyCode());
        }
        
        // 2. Tìm admin user (người tạo)
        User adminUser = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));
        
        // 3. Tạo Faculty trước
        Faculty faculty = Faculty.builder()
                .facultyCode(request.getFacultyCode())
                .facultyName(request.getFacultyName())
                .description(request.getDescription())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        faculty = facultyRepository.save(faculty);
        System.out.println("✅ [FACULTY] Faculty created: " + faculty.getId());
        
        // 4. Tạo Faculty Admin
        User facultyAdmin = userCreationService.createFacultyAdmin(
                request.getFacultyCode(),
                request.getFacultyName(),
                adminUser.getId()
        );
        
        // 5. Update faculty với faculty_admin_id
        faculty.setFacultyAdminId(facultyAdmin.getId());
        faculty = facultyRepository.save(faculty);
        
        // 6. Update faculty admin với faculty_id
        facultyAdmin.setFaculty(faculty);
        facultyAdmin = userRepository.save(facultyAdmin);
        
        System.out.println("✅ [FACULTY] Faculty Admin linked to faculty");
        
        // 7. Return kết quả
        Map<String, Object> result = new HashMap<>();
        result.put("faculty", faculty);
        result.put("facultyAdmin", facultyAdmin);
        result.put("password", facultyAdmin.getDefaultPassword());
        
        return result;
    }
    
    /**
     * Cập nhật thông tin khoa
     */
    @Transactional
    public Faculty updateFaculty(UUID facultyId, CreateFacultyRequest request) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Khoa không tồn tại"));
        
        // Check duplicate faculty code (nếu đổi code)
        if (!faculty.getFacultyCode().equals(request.getFacultyCode())) {
            if (facultyRepository.existsByFacultyCode(request.getFacultyCode())) {
                throw new RuntimeException("Mã khoa đã tồn tại: " + request.getFacultyCode());
            }
        }
        
        faculty.setFacultyCode(request.getFacultyCode());
        faculty.setFacultyName(request.getFacultyName());
        faculty.setDescription(request.getDescription());
        faculty.setUpdatedAt(LocalDateTime.now());
        
        return facultyRepository.save(faculty);
    }
    
    /**
     * Vô hiệu hóa khoa (soft delete)
     */
    @Transactional
    public void deactivateFaculty(UUID facultyId) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Khoa không tồn tại"));
        
        faculty.setIsActive(false);
        faculty.setUpdatedAt(LocalDateTime.now());
        
        facultyRepository.save(faculty);
        
        System.out.println("⚠️ [FACULTY] Faculty deactivated: " + faculty.getFacultyName());
    }
    
    /**
     * Reset mật khẩu Faculty Admin
     */
    @Transactional
    public Map<String, String> resetFacultyAdminPassword(UUID facultyId) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Khoa không tồn tại"));
        
        if (faculty.getFacultyAdminId() == null) {
            throw new RuntimeException("Khoa chưa có Faculty Admin");
        }
        
        User facultyAdmin = userRepository.findById(faculty.getFacultyAdminId())
                .orElseThrow(() -> new RuntimeException("Faculty Admin không tồn tại"));
        
        // Generate new password
        String newPassword = userCreationService.generateEasyPassword();
        
        // Update in Supabase (you'll need to inject SupabaseService)
        userCreationService.updateSupabasePassword(facultyAdmin.getId(), newPassword);        
        // Update in database
        facultyAdmin.setDefaultPassword(newPassword);
        facultyAdmin.setPasswordChanged(false);
        facultyAdmin.setUpdatedAt(LocalDateTime.now());
        userRepository.save(facultyAdmin);
        
        System.out.println("🔐 [FACULTY] Password reset for: " + facultyAdmin.getEmail());
        
        Map<String, String> result = new HashMap<>();
        result.put("email", facultyAdmin.getEmail());
        result.put("password", newPassword);
        
        return result;
    }
    
    /**
     * Thống kê hệ thống
     */
    public Map<String, Object> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalFaculties = facultyRepository.count();
        long activeFaculties = facultyRepository.countByIsActive(true);
        
        long totalTeachers = userRepository.countByRole("TEACHER");
        long totalStudents = userRepository.countByRole("STUDENT");
        long totalFacultyAdmins = userRepository.countByRole("FACULTY_ADMIN");
        
        stats.put("totalFaculties", totalFaculties);
        stats.put("activeFaculties", activeFaculties);
        stats.put("totalTeachers", totalTeachers);
        stats.put("totalStudents", totalStudents);
        stats.put("totalFacultyAdmins", totalFacultyAdmins);
        stats.put("totalUsers", totalTeachers + totalStudents + totalFacultyAdmins);
        
        return stats;
    }
}