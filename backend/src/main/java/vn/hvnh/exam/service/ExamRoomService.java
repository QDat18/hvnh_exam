package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import vn.hvnh.exam.dto.ExamCreateRequest;
import vn.hvnh.exam.dto.ExamMatrixRequest;
import vn.hvnh.exam.entity.sql.CourseClass;
import vn.hvnh.exam.entity.sql.ExamRoom;
import vn.hvnh.exam.entity.sql.Question;
import vn.hvnh.exam.repository.sql.CourseClassRepository;
import vn.hvnh.exam.repository.sql.ExamRoomRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamRoomService {
    
    private final ExamRoomRepository examRoomRepository;
    private final CourseClassRepository courseClassRepository;
    private final QuestionService questionService;
    private final JdbcTemplate jdbcTemplate;

    private final String UPLOAD_DIR = "uploads/pdfs/"; 

    @Transactional
    public ExamRoom createExamFromBank(ExamCreateRequest request) {
        // 1. Kiểm tra lớp học phần
        CourseClass courseClass = courseClassRepository.findById(request.getCourseClassId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học phần!"));

        // 2. Khởi tạo thông tin phòng thi
        ExamRoom room = new ExamRoom();
        room.setName(request.getTitle());
        room.setCourseClass(courseClass);
        room.setDurationMinutes(request.getDurationMinutes());
        room.setMaxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 1);
        room.setShowResult(request.getShowResult() != null ? request.getShowResult() : true);
        room.setTotalQuestions(request.getTotalQuestions());
        room.setStartTime(request.getExamDate());
        room.setCreationMode("BANK");
        room.setStatus("ACTIVE");
        
        // 🔥 ĐIỂM CHỐT: Dùng saveAndFlush để lưu phòng thi xuống DB ngay lập tức
        ExamRoom savedRoom = examRoomRepository.saveAndFlush(room);

        // 3. Gọi bốc đề
        ExamMatrixRequest matrixReq = new ExamMatrixRequest();
        matrixReq.setSubjectId(courseClass.getSubject().getId());
        matrixReq.setMatrices(request.getMatrix().stream().map(m -> {
            ExamMatrixRequest.ChapterMatrix cm = new ExamMatrixRequest.ChapterMatrix();
            cm.setChapterId(m.getChapterId());
            cm.setEasyCount(m.getEasyCount());
            cm.setMediumCount(m.getMediumCount());
            cm.setHardCount(m.getHardCount());
            return cm;
        }).collect(java.util.stream.Collectors.toList()));
        
        List<Question> selectedQuestions = questionService.generateExamFromMatrix(matrixReq);

        // 4. Lưu danh sách câu hỏi bằng JdbcTemplate (Lúc này savedRoom.getId() đã hợp lệ)
        String sql = "INSERT INTO exam_room_questions (exam_room_id, question_id, order_index) VALUES (?, ?, ?)";
        List<Object[]> batchArgs = new ArrayList<>();
        int index = 1;
        for (Question q : selectedQuestions) {
            batchArgs.add(new Object[]{savedRoom.getId(), q.getQuestionId(), index++});
        }
        
        jdbcTemplate.batchUpdate(sql, batchArgs);

        return savedRoom;
    }
    @Transactional
    public ExamRoom createExamFromPdf(MultipartFile file, String name, UUID courseClassId, 
                                      int durationMinutes, int totalQuestions, int maxAttempts, 
                                      String answerKey, String startTime, String endTime, Boolean showResult) {
        
        CourseClass courseClass = courseClassRepository.findById(courseClassId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học phần!"));

        String fileUrl = savePdfFile(file);

        ExamRoom room = new ExamRoom();
        room.setName(name);
        room.setCourseClass(courseClass);
        room.setDurationMinutes(durationMinutes);
        room.setTotalQuestions(totalQuestions);
        room.setMaxAttempts(maxAttempts);
        room.setAnswerKey(answerKey);
        room.setPdfUrl(fileUrl);
        room.setCreationMode("PDF");
        room.setStatus("ACTIVE");
        room.setShowResult(showResult != null ? showResult : true);
                                       
        if (startTime != null && !startTime.isEmpty()) {
            room.setStartTime(LocalDateTime.parse(startTime));
        }
        if (endTime != null && !endTime.isEmpty()) {
            room.setEndTime(LocalDateTime.parse(endTime));
        }

        return examRoomRepository.save(room);
    }

    private String savePdfFile(MultipartFile file) {
        if (file.isEmpty()) throw new RuntimeException("File PDF trống!");
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
            String newFileName = UUID.randomUUID().toString() + ".pdf";
            Path filePath = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/api/files/pdfs/" + newFileName; 
        } catch (IOException e) {
            throw new RuntimeException("Lỗi lưu file PDF!");
        }
    }

    @Transactional
    public ExamRoom createExamWithFixedQuestions(ExamCreateRequest request) {
        // 1. Kiểm tra lớp học phần
        CourseClass courseClass = courseClassRepository.findById(request.getCourseClassId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học phần!"));

        if (request.getQuestionIds() == null || request.getQuestionIds().isEmpty()) {
            throw new RuntimeException("Danh sách câu hỏi không được để trống!");
        }

        // 2. Khởi tạo phòng thi
        ExamRoom room = new ExamRoom();
        room.setName(request.getTitle());
        room.setCourseClass(courseClass);
        room.setDurationMinutes(request.getDurationMinutes());
        room.setTotalQuestions(request.getQuestionIds().size()); // Lấy số lượng thực tế từ list ID
        
        // Lưu cài đặt nâng cao
        room.setMaxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 1);
        room.setShowResult(request.getShowResult() != null ? request.getShowResult() : true);
        
        room.setStartTime(request.getExamDate());
        
        if (request.getExamDate() != null) {
            room.setEndTime(request.getExamDate().plusMinutes(request.getDurationMinutes() + 60));
        }
        
        room.setCreationMode("BANK");
        room.setStatus("ACTIVE");

        // Dùng saveAndFlush để có ID ngay cho batchUpdate
        ExamRoom savedRoom = examRoomRepository.saveAndFlush(room);

        // 3. Lưu bảng trung gian bằng JdbcTemplate Batch Update cho nhanh
        String sql = "INSERT INTO exam_room_questions (exam_room_id, question_id, order_index) VALUES (?, ?, ?)";
        List<Object[]> batchArgs = new ArrayList<>();
        
        int index = 1;
        for (UUID questionId : request.getQuestionIds()) {
            // Ép kiểu UUID thành chuỗi (hoặc để nguyên tùy config JDBC của bác)
            batchArgs.add(new Object[]{savedRoom.getId(), questionId, index++});
        }
        
        jdbcTemplate.batchUpdate(sql, batchArgs);

        return savedRoom;
    }
}