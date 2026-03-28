package vn.hvnh.exam.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.entity.sql.StudentDocument;
import vn.hvnh.exam.entity.sql.Subject;
import vn.hvnh.exam.entity.sql.User;
import vn.hvnh.exam.entity.sql.UserAttempt;
import vn.hvnh.exam.repository.sql.StudentDocumentRepository;
import vn.hvnh.exam.repository.sql.SubjectRepository;
import vn.hvnh.exam.repository.sql.UserAttemptRepository;
import vn.hvnh.exam.repository.sql.UserRepository;
import vn.hvnh.exam.service.FileStorageService; 
import vn.hvnh.exam.repository.sql.CourseClassRepository;
import vn.hvnh.exam.repository.sql.CourseClassStudentRepository;
import vn.hvnh.exam.entity.sql.CourseClass;
import vn.hvnh.exam.entity.sql.ExamRoom;
import vn.hvnh.exam.repository.sql.ExamRoomRepository;
import java.util.HashMap;
import java.util.List;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/teacher/study-hub")
@RequiredArgsConstructor
public class TeacherStudyController {

    private final StudentDocumentRepository documentRepo;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final CourseClassRepository courseClassRepository;
    private final CourseClassStudentRepository courseClassStudentRepository;
    private final ExamRoomRepository examRoomRepository;
    private final UserAttemptRepository userAttemptRepository;
    // Nếu bác có service lưu file (Cloudinary/S3/Local) thì inject vào đây
    private final FileStorageService fileStorageService;

    @PostMapping("/upload-material")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subjectId") UUID subjectId,
            Principal principal) {
        try {
            // Lấy thông tin giảng viên đang đăng nhập
            User teacher = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên"));

            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));

            // 1. Upload file và lấy URL (Giả lập URL, bác thay bằng hàm upload thực tế của bác nhé)
            String fileUrl = fileStorageService.uploadFile(file);
            // String fileUrl = "https://example.com/mock-file.pdf"; 

            // 2. Lưu vào DB với cờ uploaderRole = "TEACHER"
            StudentDocument doc = new StudentDocument();
            doc.setDocumentTitle(file.getOriginalFilename());
            doc.setFileUrl(fileUrl);
            doc.setSubjectId(subject.getId());
            doc.setStudentId(teacher.getId()); // Nối với User là Giảng viên
            doc.setUploaderRole("TEACHER"); // ĐÁNH DẤU LÀ TÀI LIỆU CHÍNH THỐNG
            doc.setUploadedAt(LocalDateTime.now());
            doc.setProcessingStatus("COMPLETED"); 

            documentRepo.save(doc);
            

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đăng tài liệu thành công!",
                    "document", doc
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-classes")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> getMyClasses(Principal principal) {
        try {
            User teacher = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên"));

            // Lấy các lớp mà giảng viên này được gán
            List<CourseClass> myClasses = courseClassRepository.findByTeacher_Id(teacher.getId());

            List<Map<String, Object>> classCards = myClasses.stream().map(cc -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", cc.getId());
                map.put("name", cc.getClassName());
                map.put("code", cc.getClassCode());
                
                // Đếm số sinh viên trong lớp
                long studentCount = courseClassStudentRepository.countByCourseClass_Id(cc.getId());
                map.put("studentCount", studentCount);
                return map;
            }).toList();

            return ResponseEntity.ok(Map.of("classes", classCards));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/class-hub/{classId}/exam-rooms")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> createExamRoom(
            @PathVariable UUID classId,
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        try {
            User teacher = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên"));

            CourseClass courseClass = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học phần"));

            ExamRoom room = new ExamRoom();
            room.setCourseClass(courseClass);
            room.setCreatedBy(teacher);
            room.setName(payload.get("name").toString());
            // room.setId(UUID.fromString(payload.get("examId").toString()));
            room.setDurationMinutes(Integer.parseInt(payload.get("durationMinutes").toString()));
            
            // Xử lý thời gian (Frontend gửi lên chuẩn ISO 8601)
            if (payload.containsKey("startTime") && payload.get("startTime") != null) {
                room.setStartTime(LocalDateTime.parse(payload.get("startTime").toString()));
            }
            if (payload.containsKey("endTime") && payload.get("endTime") != null) {
                room.setEndTime(LocalDateTime.parse(payload.get("endTime").toString()));
            }

            room.setMaxAttempts(Integer.parseInt(payload.getOrDefault("maxAttempts", "1").toString()));
            room.setStatus("ACTIVE");

            examRoomRepository.save(room);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo phòng thi thành công!",
                    "examRoom", room
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 🔥 API LẤY DANH SÁCH PHÒNG THI TRONG LỚP (Dùng chung cho cả SV và GV)
    @GetMapping("/class-hub/{classId}/exam-rooms/{roomId}/results")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> getExamRoomResults(@PathVariable UUID classId, @PathVariable UUID roomId) {
        try {
            ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng thi"));
            long totalStudents = courseClassStudentRepository.countByCourseClass_Id(classId);

            List<UserAttempt> allAttempts = userAttemptRepository.findByExamRoom_Id(roomId);
            
            // 1. Gom nhóm các lượt thi theo ID Sinh viên
            Map<UUID, List<UserAttempt>> attemptsByStudent = allAttempts.stream()
                .collect(java.util.stream.Collectors.groupingBy(att -> att.getUser().getId()));

            List<Map<String, Object>> groupedResults = new java.util.ArrayList<>();
            
            for (Map.Entry<UUID, List<UserAttempt>> entry : attemptsByStudent.entrySet()) {
                List<UserAttempt> studentAttempts = entry.getValue();
                User student = studentAttempts.get(0).getUser();
                
                // Sắp xếp lượt thi: Mới nhất lên đầu
                studentAttempts.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));
                
                // Lấy điểm cao nhất của sinh viên này
                double maxScore = studentAttempts.stream()
                    .mapToDouble(att -> att.getScore() != null ? att.getScore() : 0)
                    .max().orElse(0);
                
                // Trích xuất lịch sử các lần thi
                List<Map<String, Object>> history = studentAttempts.stream().map(att -> {
                    Map<String, Object> hMap = new HashMap<>();
                    hMap.put("attemptId", att.getAttemptId());
                    hMap.put("score", att.getScore());
                    hMap.put("startTime", att.getStartTime());
                    hMap.put("endTime", att.getEndTime());
                    hMap.put("violations", 0); // Có thể thay bằng dữ liệu vi phạm thật nếu có
                    return hMap;
                }).toList();

                Map<String, Object> map = new HashMap<>();
                map.put("studentId", student.getId());
                map.put("studentCode", student.getStudentId() != null ? student.getStudentId() : "N/A");
                map.put("studentName", student.getFullName());
                map.put("bestScore", Math.round(maxScore * 100.0) / 100.0);
                map.put("attemptCount", studentAttempts.size());
                map.put("latestSubmitTime", studentAttempts.get(0).getEndTime());
                map.put("history", history); // Gửi kèm lịch sử để hiện Modal
                
                groupedResults.add(map);
            }

            // Tính thống kê tổng quan dựa trên điểm cao nhất của từng người
            double classMaxScore = groupedResults.stream().mapToDouble(r -> (double) r.get("bestScore")).max().orElse(0);
            double classMinScore = groupedResults.stream().mapToDouble(r -> (double) r.get("bestScore")).min().orElse(0);
            double classAvgScore = groupedResults.stream().mapToDouble(r -> (double) r.get("bestScore")).average().orElse(0);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "roomName", room.getName(),
                    "totalStudents", totalStudents,
                    "totalParticipants", groupedResults.size(), // Số lượng SV duy nhất đã nộp
                    "statistics", Map.of("max", classMaxScore, "min", classMinScore, "avg", Math.round(classAvgScore * 100.0) / 100.0),
                    "results", groupedResults
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/class-hub/{classId}/exam-rooms/create-pdf", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> createPdfExamRoom(
            @PathVariable UUID classId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("durationMinutes") Integer durationMinutes,
            @RequestParam("maxAttempts") Integer maxAttempts,
            @RequestParam("totalQuestions") Integer totalQuestions,
            @RequestParam("answerKey") String answerKey,
            @RequestParam(value = "startTime", required = false) String startTime,
            @RequestParam(value = "endTime", required = false) String endTime) {
        try {
            // 🔥 XÓA DÒNG CODE GIẢ ĐỊNH VÀ GỌI SERVICE ĐỂ UPLOAD LÊN SUPABASE
            String fileUrl = fileStorageService.uploadFile(file);

            // 2. Khởi tạo Phòng thi
            CourseClass courseClass = courseClassRepository.findById(classId).orElseThrow();
            ExamRoom room = new ExamRoom();
            room.setCourseClass(courseClass);
            room.setName(name);
            room.setDurationMinutes(durationMinutes);
            room.setMaxAttempts(maxAttempts);
            room.setStatus("ACTIVE");
            
            // 3. Gắn thông tin PDF (Lúc này fileUrl sẽ là 1 cái link Supabase thật dài)
            room.setPdfUrl(fileUrl);
            room.setTotalQuestions(totalQuestions);
            room.setAnswerKey(answerKey);

            // Xử lý chuỗi thời gian (nếu có)
            if (startTime != null && !startTime.isEmpty()) room.setStartTime(LocalDateTime.parse(startTime));
            if (endTime != null && !endTime.isEmpty()) room.setEndTime(LocalDateTime.parse(endTime));

            examRoomRepository.save(room);

            return ResponseEntity.ok(Map.of("success", true, "message", "Tạo phòng thi PDF thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 🔥 API GIÁM SÁT KỲ THI ĐANG DIỄN RA
    @GetMapping("/class-hub/{classId}/exam-rooms/{roomId}/monitor")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'ADMIN')")
    public ResponseEntity<?> monitorExamRoom(@PathVariable UUID classId, @PathVariable UUID roomId) {
        try {
            ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng thi"));
            
            // Lấy tóm tắt sinh viên của lớp
            List<vn.hvnh.exam.entity.sql.CourseClassStudent> classStudents = courseClassStudentRepository.findByCourseClass_Id(classId);
            List<UserAttempt> allAttempts = userAttemptRepository.findByExamRoom_Id(roomId);
            
            Map<UUID, List<UserAttempt>> attemptsByStudent = allAttempts.stream()
                .collect(java.util.stream.Collectors.groupingBy(att -> att.getUser().getId()));

            List<Map<String, Object>> monitorList = new java.util.ArrayList<>();
            
            for (vn.hvnh.exam.entity.sql.CourseClassStudent cs : classStudents) {
                User student = cs.getStudent();
                List<UserAttempt> studentAttempts = attemptsByStudent.getOrDefault(student.getId(), new java.util.ArrayList<>());
                
                studentAttempts.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));
                UserAttempt latestAttempt = studentAttempts.isEmpty() ? null : studentAttempts.get(0);
                
                Map<String, Object> map = new HashMap<>();
                map.put("studentId", student.getId());
                map.put("studentCode", student.getStudentId() != null ? student.getStudentId() : "N/A");
                map.put("studentName", student.getFullName());
                
                if (latestAttempt == null) {
                    map.put("status", "CHƯA_THAM_GIA");
                    map.put("startTime", null);
                    map.put("attemptCount", 0);
                    map.put("violations", 0);
                } else {
                    String statusStr = "ĐÃ_KẾT_THÚC";
                    if (latestAttempt.getStatus() != null) {
                        if (latestAttempt.getStatus().name().equals("IN_PROGRESS")) {
                            statusStr = "ĐANG_THI";
                        } else if (latestAttempt.getStatus().name().equals("SUBMITTED")) {
                            statusStr = "ĐÃ_NỘP";
                        }
                    }
                    map.put("status", statusStr);
                    map.put("startTime", latestAttempt.getStartTime());
                    map.put("attemptCount", studentAttempts.size());
                    map.put("violations", 0); 
                }
                
                monitorList.add(map);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "roomName", room.getName(),
                    "totalStudents", classStudents.size(),
                    "students", monitorList
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    // 🔥 THÊM HOẶC SỬA HÀM NÀY TRONG TeacherStudyController.java
    @GetMapping("/class-hub/{classId}/exam-rooms")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'STUDENT')") // Cho phép cả GV và SV đều được gọi
    public ResponseEntity<?> getExamRoomsInClass(@PathVariable UUID classId, Principal principal) {
        try {
            // Lấy thông tin user hiện tại
            User currentUser = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
            boolean isStudent = currentUser.getRole().equals("STUDENT");

            // Tìm danh sách phòng thi theo classId
            List<ExamRoom> rooms = examRoomRepository.findByCourseClass_IdOrderByStartTimeDesc(classId);

            List<Map<String, Object>> roomResponses = rooms.stream().map(room -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", room.getId());
                map.put("name", room.getName());
                // map.put("examId", room.getExamId());
                map.put("startTime", room.getStartTime());
                map.put("endTime", room.getEndTime());
                map.put("durationMinutes", room.getDurationMinutes());
                map.put("maxAttempts", room.getMaxAttempts());
                map.put("status", room.getStatus());

                // Nếu là sinh viên, lấy thêm lịch sử làm bài để Frontend biết đường hiển thị Nút "Vào thi" hay "Hiện điểm"
                if (isStudent) {
                    List<UserAttempt> userAttempts = userAttemptRepository.findByExamRoom_Id(room.getId()).stream()
                            .filter(att -> att.getUser().getId().equals(currentUser.getId()))
                            .toList();

                    map.put("attemptsCount", userAttempts.size());

                    Optional<Double> highestScore = userAttempts.stream()
                            .map(UserAttempt::getScore)
                            .filter(score -> score != null)
                            .max(Double::compare);

                    map.put("highestScore", highestScore.orElse(null));
                    List<Map<String, Object>> history = userAttempts.stream()
                            .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime())) // Mới nhất lên đầu
                            .map(att -> {
                                Map<String, Object> hMap = new HashMap<>();
                                hMap.put("attemptId", att.getAttemptId());
                                hMap.put("score", att.getScore());
                                hMap.put("startTime", att.getStartTime());
                                hMap.put("endTime", att.getEndTime());
                                return hMap;
                            }).toList();
                    map.put("history", history);
                }

                return map;
            }).toList();

            return ResponseEntity.ok(Map.of("examRooms", roomResponses));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}