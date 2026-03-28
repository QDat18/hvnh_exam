package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.hvnh.exam.dto.BulkCourseClassRequest;
import vn.hvnh.exam.dto.CourseClassRequest;
import vn.hvnh.exam.dto.CourseClassResponse;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;
import java.util.HashMap;


@Service
@RequiredArgsConstructor
public class CourseClassService {

    private final CourseClassRepository courseClassRepository;
    private final CourseClassStudentRepository courseClassStudentRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    // ==========================================
    // 1. LUỒNG DÀNH CHO TRƯỞNG KHOA (TẠO LỚP)
    // ==========================================
    @Transactional
    public CourseClass createCourseClass(CourseClassRequest request) {
        if (courseClassRepository.existsByClassCode(request.getClassCode())) {
            throw new RuntimeException("Mã lớp học phần này đã tồn tại!");
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học!"));

        User teacher = null;
        if (request.getTeacherId() != null) {
            teacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên!"));
            if (teacher.getDepartment() == null || 
            !teacher.getDepartment().getId().equals(subject.getDepartment().getId())) {
            
            throw new RuntimeException("Lỗi: Giảng viên [" + teacher.getFullName() + 
                "] không thuộc bộ môn [" + subject.getDepartment().getDepartmentName() + 
                "] phụ trách môn học này!");
        }
        }

        CourseClass newClass = CourseClass.builder()
                .classCode(request.getClassCode())
                .className(request.getClassName())
                .semester(request.getSemester())
                .academicYear(request.getAcademicYear())
                .subject(subject)
                .teacher(teacher)
                .maxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 60)
                .status("ACTIVE")
                // joinCode sẽ được Entity (@PrePersist) tự động sinh ra!
                .build();

        return courseClassRepository.save(newClass);
    }

    @Transactional
    public CourseClassResponse updateCourseClass(UUID id, CourseClassRequest request) {
        // 1. Tìm lớp cũ
        CourseClass cc = courseClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học phần!"));

        // 2. Cập nhật các thông tin cơ bản
        cc.setClassName(request.getClassName());
        cc.setSemester(request.getSemester());
        cc.setAcademicYear(request.getAcademicYear());
        cc.setMaxStudents(request.getMaxStudents());

        // 3. Cập nhật Giảng viên (nếu có thay đổi)
        if (request.getTeacherId() != null) {
            User teacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Giảng viên không tồn tại!"));
            cc.setTeacher(teacher);
        }

        return CourseClassResponse.fromEntity(courseClassRepository.save(cc));
    }

    // 2. LUỒNG DÀNH CHO SINH VIÊN (NHẬP MÃ JOIN)
    // ==========================================
    @Transactional
    public String joinClassByCode(String joinCode, String studentEmail) {
        // 1. Tìm sinh viên
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản sinh viên!"));

        // 2. Tìm lớp qua mã Join Code
        CourseClass courseClass = courseClassRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new RuntimeException("Mã tham gia không hợp lệ hoặc lớp không tồn tại!"));

        if (!"ACTIVE".equals(courseClass.getStatus())) {
            throw new RuntimeException("Lớp học phần này đã bị khóa hoặc kết thúc!");
        }

        // 3. Kiểm tra xem sinh viên đã tham gia chính xác lớp này chưa
        boolean alreadyJoined = courseClassStudentRepository.existsByCourseClass_IdAndStudent_Id(courseClass.getId(), student.getId());
        if (alreadyJoined) {
            throw new RuntimeException("Bạn đã tham gia lớp học phần này rồi!");
        }

        // 🔥 3.5: RÀNG BUỘC MỚI - Kiểm tra xem SV đã học lớp khác CÙNG MÔN chưa
        boolean alreadyJoinedSubject = courseClassStudentRepository.existsByStudent_IdAndCourseClass_Subject_Id(
                student.getId(), 
                courseClass.getSubject().getId()
        );
        if (alreadyJoinedSubject) {
            throw new RuntimeException("Bạn đã tham gia một nhóm khác của môn [" + courseClass.getSubject().getSubjectName() + "] rồi. Không thể tham gia nhiều nhóm cùng 1 môn!");
        }

        // 4. Kiểm tra xem lớp đã đầy chưa
        long currentStudentCount = courseClassStudentRepository.countByCourseClass_Id(courseClass.getId());
        if (currentStudentCount >= courseClass.getMaxStudents()) {
            throw new RuntimeException("Lớp học phần này đã đủ số lượng sinh viên (" + courseClass.getMaxStudents() + " người)!");
        }

        // 5. Thêm sinh viên vào lớp
        CourseClassStudent classStudent = CourseClassStudent.builder()
                .courseClass(courseClass)
                .student(student)
                .status("ACTIVE")
                .build();

        courseClassStudentRepository.save(classStudent);
        return courseClass.getClassName(); 
    }

    // ==========================================
    // 1.5. LUỒNG DÀNH CHO TRƯỞNG KHOA (TẠO HÀNG LOẠT LỚP)
    // ==========================================
    @Transactional
    public List<CourseClass> createBulkCourseClasses(BulkCourseClassRequest request) {
        // 1. Tìm môn học và kiểm tra Bộ môn
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học!"));
        
        Department department = subject.getDepartment();
        if (department == null) {
            throw new RuntimeException("Môn học chưa được phân bổ về Bộ môn nào, không thể lấy danh sách Giảng viên!");
        }

        // 2. Chuẩn bị nguyên liệu sinh mã
        // Lấy 2 số cuối của năm hiện tại (Năm 2026 -> 26)
        int currentYear = java.time.Year.now().getValue() % 100; 
        
        // Lấy Mã Môn Học (Giả sử Entity Subject có trường subjectCode, VD: "2IS16", "IT101")
        String subjectCode = subject.getSubjectCode() != null ? subject.getSubjectCode().toUpperCase() : "UNKNOWN";

        // 3. Lấy danh sách TẤT CẢ giảng viên thuộc Bộ môn
        List<User> allTeachersInDept = userRepository.findByDepartment_Id(department.getId());
        
        // 🔥 BỘ LỌC BỤI: Chỉ lấy những giảng viên đang có trạng thái ACTIVE để chia bài
        List<User> availableTeachers = allTeachersInDept.stream()
                .filter(teacher -> "ACTIVE".equalsIgnoreCase(teacher.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        
        int quantity = request.getQuantity() != null ? request.getQuantity() : 1;
        List<CourseClass> newClasses = new java.util.ArrayList<>();

        for (int i = 1; i <= quantity; i++) {
            // 3.1. Sinh mã lớp theo format: {2 số cuối Năm}{Mã Môn Học}A{STT} -> VD: 262IS16A01
            String groupSuffix = String.format("%02d", i); 
            String baseGeneratedCode = currentYear + subjectCode + "A" + groupSuffix;
            String generatedName = request.getBaseClassName() + " - Nhóm " + i;

            // Kiểm tra trùng mã: Lỡ năm ngoái cũng mã này hoặc Trưởng khoa bấm 2 lần
            int retry = 0;
            String finalClassCode = baseGeneratedCode;
            while (courseClassRepository.existsByClassCode(finalClassCode)) {
                retry++;
                finalClassCode = baseGeneratedCode + "_V" + retry; // Ép thêm _V1, _V2 để không bị lỗi DB
            }

            // 3.2. Phân công giảng viên tự động (Round-Robin) TỪ DANH SÁCH ĐÃ LỌC ACTIVE
            User assignedTeacher = null;
            if (availableTeachers != null && !availableTeachers.isEmpty()) {
                // Thuật toán lấy dư: Nhóm 1 -> GV1, Nhóm 2 -> GV2, Nhóm 3 -> GV1...
                int teacherIndex = (i - 1) % availableTeachers.size();
                assignedTeacher = availableTeachers.get(teacherIndex);
            }

            // 3.3. Đóng gói Entity
            CourseClass cc = CourseClass.builder()
                    .subject(subject)
                    .classCode(finalClassCode) // Mã đã build chuẩn
                    .className(generatedName)
                    .semester(request.getSemester())
                    .academicYear(request.getAcademicYear())
                    .maxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 60)
                    .teacher(assignedTeacher) // Đã được phân công tự động (Chỉ người ACTIVE)
                    .status("ACTIVE")
                    .build();

            newClasses.add(cc);
        }

        // Lưu 1 phát ăn ngay N lớp xuống Database
        return courseClassRepository.saveAll(newClasses);
    }
    public List<CourseClassResponse> getAllClassesByFaculty() {
        // 1. Lấy Email của người đang đăng nhập từ Spring Security
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails)principal).getUsername();
        } else {
            email = principal.toString();
        }

        // 2. Tìm User trong Database dựa trên Email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng!"));

        // 3. Logic lọc lớp (giữ nguyên như cũ)
        List<CourseClass> classes;
        if ("ADMIN".equals(user.getRole())) {
            classes = courseClassRepository.findAll();
        } else {
            // Trưởng khoa thì lọc theo FacultyId
            classes = courseClassRepository.findBySubject_Department_Faculty_Id(user.getFaculty().getId());
        }

        return classes.stream()
                .map(CourseClassResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getStudentsInClass(UUID classId) {
    // Lấy dữ liệu từ bảng trung gian CourseClassStudent
        List<CourseClassStudent> relations = courseClassStudentRepository.findByCourseClass_Id(classId);
        
        return relations.stream().map(rel -> {
            Map<String, Object> map = new HashMap<>();
            map.put("studentId", rel.getStudent().getId());
            map.put("studentCode", rel.getStudent().getEmail()); // Thường mã SV lưu ở username
            map.put("fullName", rel.getStudent().getFullName());
            map.put("email", rel.getStudent().getEmail());
            map.put("joinDate", rel.getJoinedAt());
            return map;
        }).collect(Collectors.toList());
    }
}