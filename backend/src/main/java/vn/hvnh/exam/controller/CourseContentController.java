package vn.hvnh.exam.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.dto.ChapterDTO;
import vn.hvnh.exam.dto.QuestionRequest;
import vn.hvnh.exam.entity.sql.Chapter;
import vn.hvnh.exam.entity.sql.Question;
import vn.hvnh.exam.service.CourseContentService;
import vn.hvnh.exam.service.ExcelImportService;
import vn.hvnh.exam.service.QuestionService;
import vn.hvnh.exam.service.WordImportService;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class CourseContentController {

    private final CourseContentService contentService;
    private final QuestionService questionService;
    private final ExcelImportService excelImportService;
    private final WordImportService wordImportService;

    // ==========================================
    // 1. QUẢN LÝ CHƯƠNG (CHAPTER)
    // ==========================================
    
    @PostMapping("/chapters")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    public ResponseEntity<Chapter> createChapter(@RequestBody ChapterDTO dto) {
        return ResponseEntity.ok(contentService.createChapter(dto));
    }

    @GetMapping("/subjects/{subjectId}/chapters")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<Chapter>> getChapters(@PathVariable UUID subjectId) {
        return ResponseEntity.ok(contentService.getChaptersBySubject(subjectId));
    }

    // ==========================================
    // 2. QUẢN LÝ CÂU HỎI (NHẬP TAY + SỬA + XÓA)
    // ==========================================

    @PostMapping("/questions")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> createQuestion(@Valid @RequestBody QuestionRequest dto) {
        try {
            Question question = questionService.createQuestion(dto);
            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm thành công!", "id", question.getQuestionId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 🔥 API CẬP NHẬT CÂU HỎI (Khớp với Frontend axiosClient.put)
    @PutMapping("/questions/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> updateQuestion(@PathVariable UUID id, @Valid @RequestBody QuestionRequest dto) {
        try {
            questionService.updateQuestion(id, dto); // Bác nhớ code hàm updateQuestion trong QuestionService nhé
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 🔥 API XÓA CÂU HỎI (Khớp với Frontend axiosClient.delete)
    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> deleteQuestion(@PathVariable UUID id) {
        try {
            questionService.deleteQuestion(id); // Bác nhớ code hàm deleteQuestion trong QuestionService nhé
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa câu hỏi!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không thể xóa câu hỏi này!"));
        }
    }

    // ==========================================
    // 3. IMPORT HÀNG LOẠT (EXCEL & WORD)
    // ==========================================

    @PostMapping("/questions/import")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    public ResponseEntity<?> importQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subjectId") UUID subjectId,
            @RequestParam(value = "chapterId", required = false) UUID chapterId) {
        try {
            // 🔥 SỬA DÒNG NÀY: Gọi sang questionService (Nơi chứa code anh em mình vừa fix)
            questionService.importFromExcel(file, subjectId, chapterId);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Import Excel thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi: " + e.getMessage()));
        }
    }

    // @PostMapping("/import/word")
    // @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    // public ResponseEntity<?> importWord(
    //         @RequestParam("file") MultipartFile file,
    //         @RequestParam("subjectId") UUID subjectId,
    //         @RequestParam(value = "chapterId", required = false) UUID chapterId) {
    //     try {
    //         wordImportService.importFromWord(file, subjectId, chapterId);
    //         return ResponseEntity.ok(Map.of("success", true, "message", "Import Word thành công!"));
    //     } catch (Exception e) {
    //         return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi Word: " + e.getMessage()));
    //     }
    // }

    @GetMapping("/questions/export")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam("subjectId") UUID subjectId) {
        try {
            byte[] data = questionService.exportToExcel(subjectId);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            // Tên file khi tải về
            headers.setContentDispositionFormData("attachment", "NganHangCauHoi.xlsx"); 
            return ResponseEntity.ok().headers(headers).body(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/questions/generate-matrix")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> generateExamMatrix(@RequestBody vn.hvnh.exam.dto.ExamMatrixRequest request) {
        try {
            List<vn.hvnh.exam.entity.sql.Question> questions = questionService.generateExamFromMatrix(request);
            List<vn.hvnh.exam.dto.QuestionResponse> result = questions.stream()
                    .map(vn.hvnh.exam.dto.QuestionResponse::fromEntity)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}