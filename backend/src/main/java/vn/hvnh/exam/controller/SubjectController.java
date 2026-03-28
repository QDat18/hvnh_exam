package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.dto.SubjectDTO;
import vn.hvnh.exam.dto.SubjectResponse;
import vn.hvnh.exam.service.SubjectService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {
    
    private final SubjectService subjectService;

    // Lấy danh sách: Cho phép Admin, Trưởng khoa, Giảng viên
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    public ResponseEntity<List<SubjectResponse>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    // Tạo mới: Chỉ Admin và Trưởng khoa
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<SubjectResponse> createSubject(@RequestBody SubjectDTO subjectDTO) {
        return ResponseEntity.ok(subjectService.createSubject(subjectDTO));
    }

    // Cập nhật: Chỉ Admin và Trưởng khoa
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<SubjectResponse> updateSubject(@PathVariable UUID id, @RequestBody SubjectDTO subjectDTO) {
        return ResponseEntity.ok(subjectService.updateSubject(id, subjectDTO));
    }

    // Xóa (Ngưng hoạt động): Chỉ Admin và Trưởng khoa
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<Void> deleteSubject(@PathVariable UUID id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok().build();
    }
}