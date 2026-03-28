package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.dto.CreateTeacherRequest;
import vn.hvnh.exam.entity.sql.Faculty;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.FacultyRepository;
import vn.hvnh.exam.repository.sql.UserRepository;
import vn.hvnh.exam.repository.sql.DepartmentRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherManagementService {
    
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final UserCreationService userCreationService;
    private final DepartmentRepository departmentRepository;
    
    public List<User> getTeachersByFacultyAdmin(String facultyAdminEmail) {
        User facultyAdmin = userRepository.findByEmail(facultyAdminEmail)
                .orElseThrow(() -> new RuntimeException("Faculty Admin not found"));
        
        if (facultyAdmin.getFaculty() == null) {
            throw new RuntimeException("Faculty Admin chua duoc gan khoa");
        }
        
        UUID facultyId = facultyAdmin.getFaculty().getId();
        return userRepository.findByRoleAndFaculty_Id("TEACHER", facultyId);
    }
    
    @Transactional
    public Map<String, Object> createTeacher(CreateTeacherRequest request, String facultyAdminEmail) {
        System.out.println("[TEACHER] Creating/Restoring teacher: " + request.getEmail());
        
        User facultyAdmin = userRepository.findByEmail(facultyAdminEmail)
                .orElseThrow(() -> new RuntimeException("Faculty Admin not found"));
        
        if (facultyAdmin.getFaculty() == null) {
            throw new RuntimeException("Faculty Admin chua duoc gan khoa");
        }
        
        UUID facultyId = facultyAdmin.getFaculty().getId();
        
        if (!request.getEmail().endsWith("@hvnh.edu.vn")) {
            throw new RuntimeException("Email phai co domain @hvnh.edu.vn");
        }

        // 🔥 LOGIC KHÔI PHỤC THÔNG MINH
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            
            if ("INACTIVE".equals(existingUser.getStatus())) {
                System.out.println("[TEACHER] Found INACTIVE teacher. Restoring account & resetting password...");
                existingUser.setStatus("ACTIVE");
                existingUser.setFullName(request.getFullName());
                
                // KIỂM TRA RỖNG + ÉP KIỂU LOCAL DATE
                if (request.getDateOfBirth() != null && !request.getDateOfBirth().trim().isEmpty()) {
                    existingUser.setDateOfBirth(LocalDate.parse(request.getDateOfBirth().trim()));
                } else {
                    existingUser.setDateOfBirth(null);
                }
                
                if (request.getDepartmentId() != null && !request.getDepartmentId().trim().isEmpty()) {
                    departmentRepository.findById(UUID.fromString(request.getDepartmentId()))
                            .ifPresent(existingUser::setDepartment);
                } else {
                    existingUser.setDepartment(null);
                }

                // 🔥 Cấp lại mật khẩu mới khi khôi phục để quy trình minh bạch
                String newPassword = userCreationService.generateEasyPassword();
                userCreationService.updateSupabasePassword(existingUser.getId(), newPassword);
                existingUser.setDefaultPassword(newPassword);
                existingUser.setPasswordChanged(false);
                
                userRepository.save(existingUser);
                
                Map<String, Object> result = new HashMap<>();
                result.put("teacher", existingUser);
                result.put("password", newPassword); 
                
                return result;
            } else {
                throw new RuntimeException("Email này đã tồn tại và đang hoạt động trong hệ thống!");
            }
        }

        // 🔥 TẠO MỚI HOÀN TOÀN
        User teacher = userCreationService.createTeacher(
                request.getEmail(),
                request.getFullName(),
                facultyId,
                facultyAdmin.getId()
        );
        
        teacher.setFaculty(facultyAdmin.getFaculty());
        
        // KIỂM TRA RỖNG + ÉP KIỂU LOCAL DATE
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().trim().isEmpty()) {
            teacher.setDateOfBirth(LocalDate.parse(request.getDateOfBirth().trim()));
        } else {
            teacher.setDateOfBirth(null);
        }
        
        if (request.getDepartmentId() != null && !request.getDepartmentId().trim().isEmpty()) {
            departmentRepository.findById(UUID.fromString(request.getDepartmentId()))
                    .ifPresent(teacher::setDepartment);
        }

        teacher = userRepository.save(teacher);
        System.out.println("[TEACHER] Teacher created successfully: " + teacher.getEmail());
        
        Map<String, Object> result = new HashMap<>();
        result.put("teacher", teacher);
        result.put("password", teacher.getDefaultPassword());
        
        return result;
    }
    
    @Transactional
    public User updateTeacher(UUID teacherId, CreateTeacherRequest request) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên để cập nhật"));

        teacher.setFullName(request.getFullName());
        
        // 🔥 LƯỚI BẢO VỆ CHUẨN XÁC: Kiểm tra rỗng trước khi Parse
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().trim().isEmpty()) {
            teacher.setDateOfBirth(LocalDate.parse(request.getDateOfBirth().trim()));
        } else {
            teacher.setDateOfBirth(null);
        }
        
        if (request.getDepartmentId() != null && !request.getDepartmentId().trim().isEmpty()) {
            departmentRepository.findById(UUID.fromString(request.getDepartmentId()))
                    .ifPresent(teacher::setDepartment);
        } else {
            teacher.setDepartment(null);
        }

        teacher.setStatus("ACTIVE"); 

        return userRepository.save(teacher);
    }
    
    @Transactional
    public void deactivateTeacher(UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Giang vien khong ton tai"));
        
        teacher.setStatus("INACTIVE");
        teacher.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(teacher);
        System.out.println("[TEACHER] Teacher deactivated: " + teacher.getEmail());
    }
    
    @Transactional
    public Map<String, String> resetPassword(UUID teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Giảng viên không tồn tại"));
        
        String newPassword = userCreationService.generateEasyPassword();
        
        userCreationService.updateSupabasePassword(teacher.getId(), newPassword);

        teacher.setDefaultPassword(newPassword);
        teacher.setPasswordChanged(false);
        teacher.setUpdatedAt(LocalDateTime.now());
        userRepository.save(teacher);
        
        System.out.println("[TEACHER] Password reset for: " + teacher.getEmail());
        
        Map<String, String> result = new HashMap<>();
        result.put("email", teacher.getEmail());
        result.put("password", newPassword);
        
        return result;
    }
    
    public Map<String, Object> getFacultyStatistics(String facultyAdminEmail) {
        User facultyAdmin = userRepository.findByEmail(facultyAdminEmail)
                .orElseThrow(() -> new RuntimeException("Faculty Admin not found"));
        
        if (facultyAdmin.getFaculty() == null) {
            throw new RuntimeException("Faculty Admin chua duoc gan khoa");
        }
        
        UUID facultyId = facultyAdmin.getFaculty().getId();
        Map<String, Object> stats = new HashMap<>();
        
        long totalTeachers = userRepository.countByRoleAndFaculty_Id("TEACHER", facultyId);
        long totalStudents = userRepository.countByRoleAndFaculty_Id("STUDENT", facultyId);
        
        stats.put("totalTeachers", totalTeachers); 
        stats.put("totalStudents", totalStudents);
        stats.put("facultyName", facultyAdmin.getFaculty().getFacultyName());
        
        return stats;
    }
    
    public Map<String, Object> getFacultyInfo(String facultyAdminEmail) {
        User facultyAdmin = userRepository.findByEmail(facultyAdminEmail)
                .orElseThrow(() -> new RuntimeException("Faculty Admin not found"));
        
        if (facultyAdmin.getFaculty() == null) {
            throw new RuntimeException("Faculty Admin chua duoc gan khoa");
        }
        
        Faculty faculty = facultyAdmin.getFaculty();
        
        Map<String, Object> info = new HashMap<>();
        info.put("id", faculty.getId());
        info.put("code", faculty.getFacultyCode());
        info.put("name", faculty.getFacultyName());
        info.put("description", faculty.getDescription());
        info.put("isActive", faculty.getIsActive());
        
        return info;
    }
}