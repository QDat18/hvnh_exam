package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.dto.ExamCreateRequest;
import vn.hvnh.exam.dto.ExamMatrixRequest;
import vn.hvnh.exam.entity.sql.ExamRoom;
import vn.hvnh.exam.entity.sql.Question;
import vn.hvnh.exam.repository.sql.ExamRoomRepository;
import vn.hvnh.exam.service.ExamRoomService;
import vn.hvnh.exam.service.QuestionService;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams") // Chú ý có chữ 's' để phân biệt với api cũ của bác
@RequiredArgsConstructor
public class ExamRoomController {

    private final ExamRoomService examRoomService;
    private final ExamRoomRepository examRoomRepository;
    private final QuestionService questionService;
    /**
     * 1. API Tạo phòng thi từ bốc đề Ngân hàng (Ma trận)
     */
    @PostMapping("/create-from-matrix")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'FACULTY_ADMIN', 'TEACHER')")
    public ResponseEntity<?> createFromMatrix(@RequestBody ExamCreateRequest request) {
        try {
            ExamRoom room = examRoomService.createExamFromBank(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã khởi tạo đề thi từ ngân hàng thành công!",
                    "roomId", room.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 2. API Tạo phòng thi bằng file PDF
     */


    @PostMapping(value = "/create-from-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("courseClassId") UUID courseClassId,
            @RequestParam("durationMinutes") int durationMinutes,
            @RequestParam("totalQuestions") int totalQuestions,
            @RequestParam("maxAttempts") int maxAttempts,
            @RequestParam("answerKey") String answerKey,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime,
            @RequestParam(value = "showResult", defaultValue = "true") Boolean showResult // 🔥 Thêm param này
    ) {
        ExamRoom room = examRoomService.createExamFromPdf(
                file, name, courseClassId, durationMinutes, 
                totalQuestions, maxAttempts, answerKey, 
                startTime, endTime, showResult
        );
        return ResponseEntity.ok(room);
    }

    /**
     * 3. API Lấy danh sách phòng thi của 1 Lớp học phần (Dùng để hiển thị ở tab Kiểm tra)
     */
    @PostMapping("/preview-from-matrix")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'FACULTY_ADMIN')") 
    public ResponseEntity<?> previewFromMatrix(@RequestBody ExamMatrixRequest request) {
        try {
            // Gọi thuật toán nhặt câu hỏi
            List<Question> questions = questionService.generateExamFromMatrix(request);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            e.printStackTrace(); // In log ra console để bác xem DB đang thiếu câu gì
            // Hứng lỗi và trả về 400 (Bad Request) để Frontend hiện Toast thông báo đỏ
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage() != null ? e.getMessage() : "Lỗi trong quá trình bốc đề từ ma trận."
            ));
        }
    }

    @PostMapping("/create-final")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<?> createFinal(@RequestBody ExamCreateRequest request) {
        try {
            ExamRoom room = examRoomService.createExamWithFixedQuestions(request);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage() != null ? e.getMessage() : "Lỗi xuất bản đề thi."
            ));
        }
    }

    // 1. API CHỈNH SỬA PHÒNG THI
    @PutMapping("/{roomId}/update")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<?> updateExamRoom(
            @PathVariable UUID roomId, 
            @RequestBody Map<String, Object> updates) {
        try {
            ExamRoom room = examRoomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("Không tìm thấy phòng thi"));

            if (updates.containsKey("name")) room.setName(updates.get("name").toString());
            if (updates.containsKey("durationMinutes")) room.setDurationMinutes(Integer.parseInt(updates.get("durationMinutes").toString()));
            if (updates.containsKey("startTime") && updates.get("startTime") != null) {
                room.setStartTime(LocalDateTime.parse(updates.get("startTime").toString(), DateTimeFormatter.ISO_DATE_TIME));
            }
            if (updates.containsKey("endTime") && updates.get("endTime") != null) {
                room.setEndTime(LocalDateTime.parse(updates.get("endTime").toString(), DateTimeFormatter.ISO_DATE_TIME));
            }
            
            // 🔥 BỔ SUNG 2 TRƯỜNG NÀY ĐỂ UPDATE ĐƯỢC LƯỢT THI & ĐÁP ÁN
            if (updates.containsKey("maxAttempts")) {
                room.setMaxAttempts(Integer.parseInt(updates.get("maxAttempts").toString()));
            }
            if (updates.containsKey("showResult")) {
                room.setShowResult(Boolean.parseBoolean(updates.get("showResult").toString()));
            }

            examRoomRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "Cập nhật phòng thi thành công!", "room", room));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi cập nhật: " + e.getMessage()));
        }
    }
}