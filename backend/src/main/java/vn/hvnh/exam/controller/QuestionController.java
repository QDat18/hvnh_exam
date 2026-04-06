package vn.hvnh.exam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import vn.hvnh.exam.dto.QuestionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import jakarta.validation.Valid;
import vn.hvnh.exam.dto.QuestionRequest;
import vn.hvnh.exam.service.QuestionService;

import vn.hvnh.exam.entity.sql.Question;
import java.util.List;
import java.util.stream.Collectors;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final vn.hvnh.exam.repository.sql.QuestionRepository questionRepository;

    public QuestionController(QuestionService questionService, vn.hvnh.exam.repository.sql.QuestionRepository questionRepository) {
        this.questionService = questionService;
        this.questionRepository = questionRepository;
    }

    // API: Tạo mới 1 câu hỏi
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    public ResponseEntity<?> createQuestion(@Valid @RequestBody QuestionRequest request) {
        try {
            questionService.createQuestion(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm câu hỏi thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // API: Lấy danh sách câu hỏi theo Môn học (có lọc difficulty, bloom, type, keyword)
    @GetMapping("/subject/{subjectId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<?> getQuestionsBySubject(
            @PathVariable UUID subjectId,
            @RequestParam(required = false) UUID chapterId,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "created_at") String sortBy, // 🔥 SỬA CHỮ createdAt THÀNH created_at Ở ĐÂY
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            // 🔥 CHỐT CHẶN: Ép kiểu tự động (Phòng trường hợp Frontend cố tình gửi "createdAt" lên)
            if ("createdAt".equals(sortBy)) {
                sortBy = "created_at";
            }
            
            // Khởi tạo Pageable với tên cột đã được dịch chuẩn sang Snake_Case cho PostgreSQL
            Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            
            // Gọi Service hoặc Repository để lấy dữ liệu
            Page<Question> questions = questionRepository.searchQuestions(subjectId, chapterId, difficulty, keyword, pageable);
            
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/questions/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> updateQuestion(@PathVariable UUID id, @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> deleteQuestion(@PathVariable UUID id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(Map.of("message", "Xóa thành công"));
    }    
}