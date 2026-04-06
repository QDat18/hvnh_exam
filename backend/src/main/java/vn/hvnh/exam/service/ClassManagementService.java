package vn.hvnh.exam.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.dto.ClassRequest;
import vn.hvnh.exam.entity.sql.ClassStudent;
import vn.hvnh.exam.entity.sql.Classes;
import vn.hvnh.exam.entity.sql.Faculty;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.ClassRepository;
import vn.hvnh.exam.repository.sql.UserRepository;
import vn.hvnh.exam.repository.sql.ClassStudentRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ClassManagementService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository; 

    public ClassManagementService(ClassRepository classRepository, UserRepository userRepository, ClassStudentRepository classStudentRepository) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.classStudentRepository = classStudentRepository;
    }
    // 1. Lấy danh sách lớp theo Khoa
    public List<Classes> getClassesByFacultyAdmin(String facultyAdminEmail) {
        User admin = userRepository.findByEmail(facultyAdminEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Faculty Admin"));
        
        if (admin.getFaculty() == null) throw new RuntimeException("Admin chưa được gán Khoa!");

        return classRepository.findByFaculty_Id(admin.getFaculty().getId());
    }

    // 2. Tạo lớp mới & Phân công Cố vấn học tập
    @Transactional
    public Classes createClass(ClassRequest request, String facultyAdminEmail) {
        User admin = userRepository.findByEmail(facultyAdminEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Faculty Admin"));
        
        if (classRepository.findByClassCode(request.getClassCode()).isPresent()) {
            throw new RuntimeException("Mã lớp " + request.getClassCode() + " đã tồn tại!");
        }

        Classes newClass = Classes.builder()
                .classCode(request.getClassCode())
                .className(request.getClassName())
                .academicYear(request.getAcademicYear() != null ? request.getAcademicYear() : "2024-2025")
                .semester(request.getSemester() != null ? request.getSemester() : 1)
                .maxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 50)
                .description(request.getDescription())
                .faculty(admin.getFaculty())
                .isActive(true)
                .createdBy(admin)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Gán Cố vấn học tập nếu có
        if (request.getAdvisorTeacherId() != null && !request.getAdvisorTeacherId().trim().isEmpty()) {
            User teacher = userRepository.findById(UUID.fromString(request.getAdvisorTeacherId()))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Giảng viên để gán"));
            newClass.setAdvisorTeacher(teacher);
        }

        return classRepository.save(newClass);
    }

    // 3. Sửa thông tin lớp
    @Transactional
    public Classes updateClass(UUID classId, ClassRequest request) {
        Classes existingClass = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));

        if (!existingClass.getClassCode().equals(request.getClassCode()) && 
            classRepository.findByClassCode(request.getClassCode()).isPresent()) {
            throw new RuntimeException("Mã lớp " + request.getClassCode() + " đã tồn tại!");
        }

        existingClass.setClassCode(request.getClassCode());
        existingClass.setClassName(request.getClassName());
        existingClass.setAcademicYear(request.getAcademicYear());
        existingClass.setSemester(request.getSemester());
        existingClass.setMaxStudents(request.getMaxStudents());
        existingClass.setDescription(request.getDescription());
        existingClass.setUpdatedAt(LocalDateTime.now());

        // Cập nhật Cố vấn học tập
        if (request.getAdvisorTeacherId() != null && !request.getAdvisorTeacherId().trim().isEmpty()) {
            User teacher = userRepository.findById(UUID.fromString(request.getAdvisorTeacherId()))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Giảng viên"));
            existingClass.setAdvisorTeacher(teacher);
        } else {
            existingClass.setAdvisorTeacher(null);
        }

        return classRepository.save(existingClass);
    }

    // 4. Xóa (Vô hiệu hóa) lớp
    @Transactional
    public void deleteClass(UUID classId) {
        Classes existingClass = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));
        existingClass.setIsActive(false);
        existingClass.setUpdatedAt(LocalDateTime.now());
        classRepository.save(existingClass);
    }


    public List<ClassStudent> getStudentsByClass(UUID classId) {
        // Bạn cần inject ClassStudentRepository vào đây nhé
        return classStudentRepository.findByClassEntity_Id(classId);
    }
}