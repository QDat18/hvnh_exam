package vn.hvnh.exam.service;

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
public class CourseClassService {

    private final CourseClassRepository courseClassRepository;
    private final CourseClassStudentRepository courseClassStudentRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ChapterRepository chapterRepository;
    private final CurrentUserService currentUserService;

    public CourseClassService(CourseClassRepository courseClassRepository, 
                            CourseClassStudentRepository courseClassStudentRepository,
                            SubjectRepository subjectRepository,
                            UserRepository userRepository,
                            DepartmentRepository departmentRepository,
                            ChapterRepository chapterRepository,
                            CurrentUserService currentUserService) {
        this.courseClassRepository = courseClassRepository;
        this.courseClassStudentRepository = courseClassStudentRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.chapterRepository = chapterRepository;
        this.currentUserService = currentUserService;
    }

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
                .build();

        return courseClassRepository.save(newClass);
    }

    @Transactional
    public CourseClassResponse updateCourseClass(UUID id, CourseClassRequest request) {
        CourseClass cc = courseClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học phần!"));

        cc.setClassName(request.getClassName());
        cc.setSemester(request.getSemester());
        cc.setAcademicYear(request.getAcademicYear());
        cc.setMaxStudents(request.getMaxStudents());

        if (request.getTeacherId() != null) {
            User teacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Giảng viên không tồn tại!"));
            cc.setTeacher(teacher);
        }

        return CourseClassResponse.fromEntity(courseClassRepository.save(cc));
    }

    @Transactional
    public String joinClassByCode(String joinCode, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản sinh viên!"));

        CourseClass courseClass = courseClassRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new RuntimeException("Mã tham gia không hợp lệ hoặc lớp không tồn tại!"));

        if (!"ACTIVE".equals(courseClass.getStatus())) {
            throw new RuntimeException("Lớp học phần này đã bị khóa hoặc kết thúc!");
        }

        boolean alreadyJoined = courseClassStudentRepository.existsByCourseClass_IdAndStudent_Id(courseClass.getId(), student.getId());
        if (alreadyJoined) {
            throw new RuntimeException("Bạn đã tham gia lớp học phần này rồi!");
        }

        boolean alreadyJoinedSubject = courseClassStudentRepository.existsByStudent_IdAndCourseClass_Subject_Id(
                student.getId(), 
                courseClass.getSubject().getId()
        );
        if (alreadyJoinedSubject) {
            throw new RuntimeException("Bạn đã tham gia một nhóm khác của môn [" + courseClass.getSubject().getSubjectName() + "] rồi. Không thể tham gia nhiều nhóm cùng 1 môn!");
        }

        long currentStudentCount = courseClassStudentRepository.countByCourseClass_Id(courseClass.getId());
        if (currentStudentCount >= courseClass.getMaxStudents()) {
            throw new RuntimeException("Lớp học phần này đã đủ số lượng sinh viên (" + courseClass.getMaxStudents() + " người)!");
        }

        CourseClassStudent classStudent = CourseClassStudent.builder()
                .courseClass(courseClass)
                .student(student)
                .status("ACTIVE")
                .build();

        courseClassStudentRepository.save(classStudent);
        return courseClass.getClassName(); 
    }

    @Transactional
    public List<CourseClass> createBulkCourseClasses(BulkCourseClassRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học!"));
        
        Department department = subject.getDepartment();
        if (department == null) {
            throw new RuntimeException("Môn học chưa được phân bổ về Bộ môn nào, không thể lấy danh sách Giảng viên!");
        }

        int currentYear = java.time.Year.now().getValue() % 100; 
        
        String subjectCode = subject.getSubjectCode() != null ? subject.getSubjectCode().toUpperCase() : "UNKNOWN";

        List<User> allTeachersInDept = userRepository.findByDepartment_Id(department.getId());
        
        List<User> availableTeachers = allTeachersInDept.stream()
                .filter(teacher -> "ACTIVE".equalsIgnoreCase(teacher.getStatus()))
                .collect(Collectors.toList());
        
        int quantity = request.getQuantity() != null ? request.getQuantity() : 1;
        List<CourseClass> newClasses = new java.util.ArrayList<>();

        for (int i = 1; i <= quantity; i++) {
            String groupSuffix = String.format("%02d", i); 
            String baseGeneratedCode = currentYear + subjectCode + "A" + groupSuffix;
            String generatedName = request.getBaseClassName() + " - Nhóm " + i;

            int retry = 0;
            String finalClassCode = baseGeneratedCode;
            while (courseClassRepository.existsByClassCode(finalClassCode)) {
                retry++;
                finalClassCode = baseGeneratedCode + "_V" + retry;
            }

            User assignedTeacher = null;
            if (availableTeachers != null && !availableTeachers.isEmpty()) {
                int teacherIndex = (i - 1) % availableTeachers.size();
                assignedTeacher = availableTeachers.get(teacherIndex);
            }

            CourseClass cc = CourseClass.builder()
                    .subject(subject)
                    .classCode(finalClassCode)
                    .className(generatedName)
                    .semester(request.getSemester())
                    .academicYear(request.getAcademicYear())
                    .maxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 60)
                    .teacher(assignedTeacher)
                    .status("ACTIVE")
                    .build();

            newClasses.add(cc);
        }

        return courseClassRepository.saveAll(newClasses);
    }
    
    public List<CourseClassResponse> getAllClassesByFaculty() {
        User user = currentUserService.getCurrentUser();
        if (user == null) throw new RuntimeException("Tài khoản chưa được xác thực!");

        List<CourseClass> classes;
        if ("ADMIN".equals(user.getRole())) {
            classes = courseClassRepository.findAll();
        } else {
            classes = courseClassRepository.findBySubject_Department_Faculty_Id(user.getFaculty().getId());
        }

        return classes.stream()
                .map(CourseClassResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getStudentsInClass(UUID classId) {
        List<CourseClassStudent> relations = courseClassStudentRepository.findByCourseClass_Id(classId);
        
        return relations.stream().map(rel -> {
            Map<String, Object> map = new HashMap<>();
            map.put("studentId", rel.getStudent().getId());
            map.put("studentCode", rel.getStudent().getEmail());
            map.put("fullName", rel.getStudent().getFullName());
            map.put("email", rel.getStudent().getEmail());
            map.put("joinDate", rel.getJoinedAt());
            return map;
        }).collect(Collectors.toList());
    }
}