package vn.hvnh.exam.controller;

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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher/study-hub")
public class TeacherStudyController {

    private final StudentDocumentRepository documentRepo;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final CourseClassRepository courseClassRepository;
    private final CourseClassStudentRepository courseClassStudentRepository;
    private final ExamRoomRepository examRoomRepository;
    private final UserAttemptRepository userAttemptRepository;
    private final FileStorageService fileStorageService;

    public TeacherStudyController(StudentDocumentRepository documentRepo, SubjectRepository subjectRepository, UserRepository userRepository, CourseClassRepository courseClassRepository, CourseClassStudentRepository courseClassStudentRepository, ExamRoomRepository examRoomRepository, UserAttemptRepository userAttemptRepository, FileStorageService fileStorageService) {
        this.documentRepo = documentRepo;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.courseClassRepository = courseClassRepository;
        this.courseClassStudentRepository = courseClassStudentRepository;
        this.examRoomRepository = examRoomRepository;
        this.userAttemptRepository = userAttemptRepository;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload-material")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subjectId") UUID subjectId,
            Principal principal) {
        try {
            User teacher = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giảng viên"));

            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));

            String fileUrl = fileStorageService.uploadFile(file);

            StudentDocument doc = new StudentDocument();
            doc.setDocumentTitle(file.getOriginalFilename());
            doc.setFileUrl(fileUrl);
            doc.setSubjectId(subject.getId());
            doc.setStudentId(teacher.getId());
            doc.setUploaderRole("TEACHER");
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

            List<CourseClass> myClasses = courseClassRepository.findByTeacher_Id(teacher.getId());

            List<Map<String, Object>> classCards = myClasses.stream().map(cc -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", cc.getId());
                map.put("name", cc.getClassName());
                map.put("code", cc.getClassCode());
                
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
            room.setDurationMinutes(Integer.parseInt(payload.get("durationMinutes").toString()));
            
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

    @GetMapping("/class-hub/{classId}/exam-rooms/{roomId}/results")
    @PreAuthorize("hasAuthority('TEACHER')")
    public ResponseEntity<?> getExamRoomResults(@PathVariable UUID classId, @PathVariable UUID roomId) {
        try {
            ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng thi"));
            long totalStudents = courseClassStudentRepository.countByCourseClass_Id(classId);

            List<UserAttempt> allAttempts = userAttemptRepository.findByExamRoom_Id(roomId);
            
            Map<UUID, List<UserAttempt>> attemptsByStudent = allAttempts.stream()
                .collect(Collectors.groupingBy(att -> att.getUser().getId()));

            List<Map<String, Object>> groupedResults = new java.util.ArrayList<>();
            
            for (Map.Entry<UUID, List<UserAttempt>> entry : attemptsByStudent.entrySet()) {
                List<UserAttempt> studentAttempts = entry.getValue();
                User student = studentAttempts.get(0).getUser();
                
                studentAttempts.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));
                
                double maxScore = studentAttempts.stream()
                    .mapToDouble(att -> att.getScore() != null ? att.getScore() : 0)
                    .max().orElse(0);
                
                List<Map<String, Object>> history = studentAttempts.stream().map(att -> {
                    Map<String, Object> hMap = new HashMap<>();
                    hMap.put("attemptId", att.getAttemptId());
                    hMap.put("score", att.getScore());
                    hMap.put("startTime", att.getStartTime());
                    hMap.put("endTime", att.getEndTime());
                    hMap.put("violations", 0);
                    return hMap;
                }).toList();

                Map<String, Object> map = new HashMap<>();
                map.put("studentId", student.getId());
                map.put("studentCode", student.getStudentId() != null ? student.getStudentId() : "N/A");
                map.put("studentName", student.getFullName());
                map.put("bestScore", Math.round(maxScore * 100.0) / 100.0);
                map.put("attemptCount", studentAttempts.size());
                map.put("latestSubmitTime", studentAttempts.get(0).getEndTime());
                map.put("history", history);
                
                groupedResults.add(map);
            }

            double classMaxScore = groupedResults.stream().mapToDouble(r -> (double) r.get("bestScore")).max().orElse(0);
            double classMinScore = groupedResults.stream().mapToDouble(r -> (double) r.get("bestScore")).min().orElse(0);
            double classAvgScore = groupedResults.stream().mapToDouble(r -> (double) r.get("bestScore")).average().orElse(0);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "roomName", room.getName(),
                    "totalStudents", totalStudents,
                    "totalParticipants", groupedResults.size(),
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
            String fileUrl = fileStorageService.uploadFile(file);

            CourseClass courseClass = courseClassRepository.findById(classId).orElseThrow();
            ExamRoom room = new ExamRoom();
            room.setCourseClass(courseClass);
            room.setName(name);
            room.setDurationMinutes(durationMinutes);
            room.setMaxAttempts(maxAttempts);
            room.setStatus("ACTIVE");
            
            room.setPdfUrl(fileUrl);
            room.setTotalQuestions(totalQuestions);
            room.setAnswerKey(answerKey);

            if (startTime != null && !startTime.isEmpty()) room.setStartTime(LocalDateTime.parse(startTime));
            if (endTime != null && !endTime.isEmpty()) room.setEndTime(LocalDateTime.parse(endTime));

            examRoomRepository.save(room);

            return ResponseEntity.ok(Map.of("success", true, "message", "Tạo phòng thi PDF thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/class-hub/{classId}/exam-rooms/{roomId}/monitor")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'ADMIN')")
    public ResponseEntity<?> monitorExamRoom(@PathVariable UUID classId, @PathVariable UUID roomId) {
        try {
            ExamRoom room = examRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng thi"));
            
            List<vn.hvnh.exam.entity.sql.CourseClassStudent> classStudents = courseClassStudentRepository.findByCourseClass_Id(classId);
            List<UserAttempt> allAttempts = userAttemptRepository.findByExamRoom_Id(roomId);
            
            Map<UUID, List<UserAttempt>> attemptsByStudent = allAttempts.stream()
                .collect(Collectors.groupingBy(att -> att.getUser().getId()));

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

    @GetMapping("/class-hub/{classId}/exam-rooms")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'STUDENT')") 
    public ResponseEntity<?> getExamRoomsInClass(@PathVariable UUID classId, Principal principal) {
        try {
            User currentUser = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
            boolean isStudent = currentUser.getRole().equals("STUDENT");

            List<ExamRoom> rooms = examRoomRepository.findByCourseClass_IdOrderByStartTimeDesc(classId);

            List<Map<String, Object>> roomResponses = rooms.stream().map(room -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", room.getId());
                map.put("name", room.getName());
                map.put("startTime", room.getStartTime());
                map.put("endTime", room.getEndTime());
                map.put("durationMinutes", room.getDurationMinutes());
                map.put("maxAttempts", room.getMaxAttempts());
                map.put("status", room.getStatus());

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
                            .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
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