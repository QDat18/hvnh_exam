package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import vn.hvnh.exam.common.SubjectGroup;
import vn.hvnh.exam.dto.SubjectDTO;       
import vn.hvnh.exam.dto.SubjectResponse;  
import vn.hvnh.exam.entity.sql.Department;    
import vn.hvnh.exam.entity.sql.Subject;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.repository.sql.DepartmentRepository;
import vn.hvnh.exam.repository.sql.SubjectRepository;
import vn.hvnh.exam.repository.sql.UserRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {
    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<SubjectResponse> getAllSubjects() {
        User user = getCurrentUser();

        if ("ADMIN".equals(user.getRole())) {
            return subjectRepository.findAll().stream()
                    .map(SubjectResponse::fromEntity) 
                    .collect(Collectors.toList());
        } 
        else if ("TEACHER".equals(user.getRole())) {
            if (user.getDepartment() == null) return List.of();
            return subjectRepository.findByDepartment_Id(user.getDepartment().getId()).stream()
                    .map(SubjectResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        else {
            if (user.getFaculty() == null) return List.of();
            return subjectRepository.findByFacultyId(user.getFaculty().getId()).stream()
                    .map(SubjectResponse::fromEntity)
                    .collect(Collectors.toList());
        }
    }

    public SubjectResponse createSubject(SubjectDTO req) {
        User user = getCurrentUser();

        if (subjectRepository.findBySubjectCode(req.getSubjectCode()).isPresent()) {
            throw new RuntimeException("Mã môn học đã tồn tại!");
        }

        Department targetDept;
        if ("ADMIN".equals(user.getRole()) ) {
            if (req.getDepartmentId() == null) throw new RuntimeException("Admin phải chọn Bộ môn");
            targetDept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Bộ môn không tồn tại"));
        }
        else if ("FACULTY_ADMIN".equals(user.getRole())) {
            if (req.getDepartmentId() == null) throw new RuntimeException("Vui lòng chọn Bộ môn phụ trách");
            targetDept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Bộ môn không tồn tại"));
            
            // Kiểm tra xem bộ môn này có thuộc khoa của ông Trưởng khoa này không
            if (!targetDept.getFaculty().getId().equals(user.getFaculty().getId())) {
                throw new AccessDeniedException("Bạn không có quyền tạo môn học cho khoa khác!");
            }
        } else if ("TEACHER".equals(user.getRole())) {
            if (user.getDepartment() == null) throw new AccessDeniedException("GV chưa thuộc bộ môn nào");
            targetDept = user.getDepartment();
        } else {
            throw new AccessDeniedException("Không có quyền");
        }

        Subject subject = Subject.builder()
                .subjectCode(req.getSubjectCode())
                .subjectName(req.getSubjectName())
                .credits(req.getCredits())
                .department(targetDept)
                .description(req.getDescription())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                // 🔥 ĐÃ SỬA: Thay đổi SubjectGroup.THEORY thành chuỗi "THEORY"
                .subjectGroup(req.getSubjectGroup() != null ? 
                    SubjectGroup.valueOf(req.getSubjectGroup()) : SubjectGroup.THEORY)
                .build();

        return SubjectResponse.fromEntity(subjectRepository.save(subject));
    }

    public SubjectResponse updateSubject(UUID id, SubjectDTO req) {
        User user = getCurrentUser();
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học!"));

        // 🔐 KIỂM TRA QUYỀN SỬA
        if ("TEACHER".equals(user.getRole())) {
            if (!subject.getDepartment().getId().equals(user.getDepartment().getId())) {
                throw new AccessDeniedException("Giảng viên không được sửa môn của bộ môn khác!");
            }
        } 
        // 🔥 THÊM QUYỀN CHO TRƯỞNG KHOA
        else if ("FACULTY_ADMIN".equals(user.getRole())) {
            if (!subject.getDepartment().getFaculty().getId().equals(user.getFaculty().getId())) {
                throw new AccessDeniedException("Trưởng khoa không được sửa môn của khoa khác!");
            }
        } 
        else if (!"ADMIN".equals(user.getRole())) {
            throw new AccessDeniedException("Bạn không có quyền thực hiện thao tác này!");
        }

        // Cập nhật thông tin
        subject.setSubjectName(req.getSubjectName());
        subject.setCredits(req.getCredits());
        subject.setDescription(req.getDescription());
        subject.setIsActive(req.getIsActive());
        
        // 🔥 Gán Enum (Vì DTO và Entity của bác đều đã dùng SubjectGroup enum)
        subject.setSubjectGroup(req.getSubjectGroup() != null ? 
            SubjectGroup.valueOf(req.getSubjectGroup()) : subject.getSubjectGroup());

        // Admin hoặc Trưởng khoa có thể đổi bộ môn quản lý môn học
        if (("ADMIN".equals(user.getRole()) || "FACULTY_ADMIN".equals(user.getRole())) && req.getDepartmentId() != null) {
            Department newDept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Bộ môn mới không tồn tại"));
            subject.setDepartment(newDept);
        }

        return SubjectResponse.fromEntity(subjectRepository.save(subject));
    }
    public void deleteSubject(UUID id) {
        User user = getCurrentUser();
        Subject subject = subjectRepository.findById(id).orElseThrow();
        
        if ("TEACHER".equals(user.getRole())) {
            if (!subject.getDepartment().getId().equals(user.getDepartment().getId())) {
                throw new AccessDeniedException("Không được xóa môn bộ môn khác");
            }
        }
        
        subject.setIsActive(false);
        subjectRepository.save(subject);
    }
}