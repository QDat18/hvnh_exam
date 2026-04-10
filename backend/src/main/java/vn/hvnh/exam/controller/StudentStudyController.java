package vn.hvnh.exam.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.dto.*;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.*;
import vn.hvnh.exam.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/student/study-hub")
public class StudentStudyController {

    private static final Logger log = LoggerFactory.getLogger(StudentStudyController.class);

    private final DocumentAIProcessor aiProcessor;
    private final FlashcardService flashcardService;
    private final PracticeSessionService practiceSessionService;
    private final StudentDocumentRepository documentRepo;
    private final FlashcardRepository flashcardRepo;
    private final PracticeSessionRepository sessionRepo;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final CourseClassRepository courseClassRepository;
    private final CourseClassStudentRepository courseClassStudentRepository;
    private final QuestionRepository questionRepository;
    private final LLMIntegrationService llmIntegrationService;
    private final ObjectMapper objectMapper;
    private final ExamRoomRepository examRoomRepository;
    private final UserAttemptRepository userAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final AnswerRepository answerRepository;
    private final CurrentUserService currentUserService;

    public StudentStudyController(
        DocumentAIProcessor aiProcessor,
        FlashcardService flashcardService,
        PracticeSessionService practiceSessionService,
        StudentDocumentRepository documentRepo,
        FlashcardRepository flashcardRepo,
        PracticeSessionRepository sessionRepo,
        UserRepository userRepository,
        SubjectRepository subjectRepository,
        CourseClassRepository courseClassRepository,
        CourseClassStudentRepository courseClassStudentRepository,
        QuestionRepository questionRepository,
        LLMIntegrationService llmIntegrationService,
        ObjectMapper objectMapper,
        ExamRoomRepository examRoomRepository,
        UserAttemptRepository userAttemptRepository,
        AttemptAnswerRepository attemptAnswerRepository,
        AnswerRepository answerRepository,
        CurrentUserService currentUserService
    ) {
        this.aiProcessor = aiProcessor;
        this.flashcardService = flashcardService;
        this.practiceSessionService = practiceSessionService;
        this.documentRepo = documentRepo;
        this.flashcardRepo = flashcardRepo;
        this.sessionRepo = sessionRepo;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.courseClassRepository = courseClassRepository;
        this.courseClassStudentRepository = courseClassStudentRepository;
        this.questionRepository = questionRepository;
        this.llmIntegrationService = llmIntegrationService;
        this.objectMapper = objectMapper;
        this.examRoomRepository = examRoomRepository;
        this.userAttemptRepository = userAttemptRepository;
        this.attemptAnswerRepository = attemptAnswerRepository;
        this.answerRepository = answerRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/my-classes")
    public ResponseEntity<?> getMyClasses() {
        try {
            User student = currentUserService.getCurrentUser();
            UUID studentId = student.getId();
            List<CourseClassStudent> joinedClasses = courseClassStudentRepository.findByStudent_Id(studentId);
            
            // [TỐI ƯU HIỆU NĂNG]: Chống N+1 query bằng cách lấy docCount của tất cả môn học trong 1 lần
            List<UUID> subjectIds = joinedClasses.stream()
                .map(rel -> rel.getCourseClass().getSubject().getId())
                .distinct()
                .collect(Collectors.toList());
            
            Map<UUID, Long> docCountMap = new HashMap<>();
            if (!subjectIds.isEmpty()) {
                List<Object[]> docCounts = documentRepo.countDocsBySubjectIds(studentId, subjectIds);
                for (Object[] row : docCounts) {
                    docCountMap.put((UUID) row[0], (Long) row[1]);
                }
            }

            List<Map<String, Object>> classCards = joinedClasses.stream().map(rel -> {
                CourseClass cc = rel.getCourseClass();
                Map<String, Object> map = new HashMap<>();
                map.put("id", cc.getId()); 
                map.put("name", cc.getClassName());
                map.put("code", cc.getClassCode());
                
                UUID subjId = cc.getSubject().getId();
                map.put("subjectId", subjId);
                map.put("teacher", cc.getTeacher() != null ? cc.getTeacher().getFullName() : "Khoa phân công");
                
                // Lấy từ Map O(1) thay vì chọc DB
                map.put("totalDocs", docCountMap.getOrDefault(subjId, 0L));
                
                return map;
            }).toList();

            return ResponseEntity.ok(Map.of("classes", classCards));
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách lớp đã tham gia", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/class-hub/{classId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER')") 
    public ResponseEntity<?> getClassHubDetails(@PathVariable UUID classId) {
        try {
            UUID currentUserId = getCurrentUserId();
            User currentUser = userRepository.findById(currentUserId).orElseThrow();
            
            CourseClass courseClass = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Lớp học phần không tồn tại"));

            Map<String, Object> hubData = new HashMap<>();
            hubData.put("className", courseClass.getClassName());
            hubData.put("classCode", courseClass.getClassCode());
            hubData.put("subjectId", courseClass.getSubject().getId());
            hubData.put("subjectName", courseClass.getSubject().getSubjectName());
            hubData.put("subjectCode", courseClass.getSubject().getSubjectCode());
            
            User teacher = courseClass.getTeacher();
            Map<String, Object> teacherMap = new HashMap<>();
            teacherMap.put("name", teacher != null ? teacher.getFullName() : "Chưa phân công");
            teacherMap.put("email", teacher != null ? teacher.getEmail() : "N/A");
            teacherMap.put("gender", teacher != null && teacher.getGender() != null ? teacher.getGender() : "NAM"); 
            teacherMap.put("avatar", teacher != null && teacher.getAvatarUrl() != null ? teacher.getAvatarUrl() : "");            
            hubData.put("teacher", teacherMap);

            boolean isTeacherOfClass = currentUser != null && currentUser.getRole().equals("TEACHER") && 
                                       teacher != null && teacher.getId().equals(currentUserId);
            hubData.put("userRole", currentUser != null ? currentUser.getRole() : "STUDENT");
            hubData.put("canEdit", isTeacherOfClass);

            UUID subjectId = (courseClass.getSubject() != null) ? courseClass.getSubject().getId() : null;
            if (subjectId != null) {
                List<vn.hvnh.exam.entity.sql.StudentDocument> officialDocs = documentRepo.findBySubjectId(subjectId).stream()
                        .filter(doc -> "TEACHER".equals(doc.getUploaderRole()))
                        .toList();
                hubData.put("materials", officialDocs);
            } else {
                hubData.put("materials", new ArrayList<>());
            }

            List<CourseClassStudent> classStudents = courseClassStudentRepository.findByCourseClass_Id(classId);
            List<Map<String, Object>> studentsList = classStudents.stream()
                .filter(ccs -> ccs.getStudent() != null)
                .map(ccs -> {
                    User s = ccs.getStudent();
                    Map<String, Object> studentMap = new HashMap<>();
                    studentMap.put("id", s.getId());
                    studentMap.put("fullName", s.getFullName() != null ? s.getFullName() : "Vô danh");
                    
                    String studentCode = s.getStudentId();
                    if (studentCode == null || studentCode.trim().isEmpty()) {
                        if (s.getEmail() != null && s.getEmail().contains("@")) {
                            studentCode = s.getEmail().split("@")[0].toUpperCase(); 
                        } else {
                            studentCode = "N/A";
                        }
                    }
                    studentMap.put("studentId", studentCode);
                    studentMap.put("email", s.getEmail());
                    studentMap.put("avatar", s.getAvatarUrl() != null ? s.getAvatarUrl() : 
                            "https://api.dicebear.com/9.x/initials/svg?seed=" + (s.getFullName() != null ? s.getFullName() : "User"));
                    return studentMap;
                }).toList();
            hubData.put("memberCount", studentsList.size());
            hubData.put("students", studentsList);

            return ResponseEntity.ok(hubData);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi đồng bộ Hub: " + e.getMessage()));
        }
    }

    @GetMapping("/practice/subjects")
    public ResponseEntity<?> getAvailableSubjects() {
        try {
            UUID studentId = getCurrentUserId();
            List<Map<String, Object>> subjects = subjectRepository.findAll().stream()
                .map(subject -> {
                    long questionCount = questionRepository.countBySubject_Id(subject.getId());
                    long sessionsCompleted = sessionRepo.countByStudentIdAndSubjectId(studentId, subject.getId());
                    Double avgScore = sessionRepo.getAverageScoreBySubject(studentId, subject.getId());
                    
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("subjectId", subject.getId());
                    map.put("subjectCode", subject.getSubjectCode());
                    map.put("subjectName", subject.getSubjectName());
                    map.put("questionCount", questionCount);
                    map.put("sessionsCompleted", sessionsCompleted);
                    map.put("averageScore", avgScore != null ? avgScore : 0.0);
                    return map;
                    })
                .filter(s -> (long) s.get("questionCount") > 0)
                .toList();
            
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            log.error("Error getting available subjects", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // API MỚI: Lấy danh sách môn học cho Tab Tài Liệu (Cực nhẹ, không đếm câu hỏi)
    @GetMapping("/documents/subjects")
    public ResponseEntity<?> getDocumentSubjects() {
        try {
            UUID studentId = getCurrentUserId();
            List<CourseClassStudent> joinedClasses = courseClassStudentRepository.findByStudent_Id(studentId);
            
            List<Map<String, Object>> subjects = joinedClasses.stream()
                .filter(rel -> rel.getCourseClass() != null && rel.getCourseClass().getSubject() != null)
                .map(rel -> rel.getCourseClass().getSubject())
                .distinct() // Loại bỏ các môn học bị trùng
                .map(subject -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("subjectId", subject.getId());
                    map.put("subjectName", subject.getSubjectName());
                    return map;
                })
                .toList();
                
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            log.error("Error getting document subjects", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @PostMapping("/practice/generate")
    public ResponseEntity<?> generatePracticeQuiz(@RequestBody GeneratePracticeRequest request) {
        try {
            UUID studentId = getCurrentUserId();
            PracticeSessionResponse session = practiceSessionService.generatePracticeSession(
                studentId, request.getSubjectId(), request.getNumQuestions() != null ? request.getNumQuestions() : 20,
                request.getDifficultyDistribution(), request.getMode() != null ? request.getMode() : "RANDOM"
            );
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            log.error("Error generating practice quiz", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/practice/submit")
    public ResponseEntity<?> submitPracticeSession(@RequestBody SubmitPracticeRequest request) {
        try {
            UUID studentId = getCurrentUserId();
            PracticeResultResponse result = practiceSessionService.submitPracticeSession(
                studentId, request.getSessionId(), request.getAnswers()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error submitting practice", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/practice/history")
    public ResponseEntity<?> getPracticeHistory(
        @RequestParam(required = false) UUID subjectId,
        @RequestParam(defaultValue = "30") int days
    ) {
        try {
            UUID studentId = getCurrentUserId();
            LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
            List<PracticeSession> sessions = sessionRepo.findRecentSessions(studentId, fromDate);
            
            // Bulk lookup Subject Names
            Set<UUID> subjectIdsToFetch = sessions.stream()
                .map(PracticeSession::getSubjectId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
            
            Map<UUID, String> subjectNameMap = subjectRepository.findAllById(subjectIdsToFetch).stream()
                .collect(Collectors.toMap(Subject::getId, Subject::getSubjectName));

            // Bulk lookup Document Titles (Fallback)
            Set<UUID> docIdsToFetch = sessions.stream()
                .filter(s -> s.getSubjectId() == null && s.getStudentDocumentId() != null)
                .map(PracticeSession::getStudentDocumentId)
                .collect(Collectors.toSet());
            
            Map<UUID, String> docTitleMap = documentRepo.findAllById(docIdsToFetch).stream()
                .collect(Collectors.toMap(vn.hvnh.exam.entity.sql.StudentDocument::getStudentDocId, vn.hvnh.exam.entity.sql.StudentDocument::getDocumentTitle));
            
            List<Map<String, Object>> history = sessions.stream()
                .map(session -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", session.getSessionId());
                    
                    String displayName = "Tài liệu tự ôn tập";
                    if (session.getSubjectId() != null) {
                        displayName = subjectNameMap.getOrDefault(session.getSubjectId(), "Môn học không tên");
                    } else if (session.getStudentDocumentId() != null) {
                        displayName = "📄 " + docTitleMap.getOrDefault(session.getStudentDocumentId(), "Tài liệu không tên");
                    }
                    dto.put("subjectName", displayName);
                    
                    dto.put("score", session.getScore() != null ? session.getScore() : 0.0);
                    dto.put("totalQuestions", session.getTotalQuestions() != null ? session.getTotalQuestions() : 0);
                    dto.put("correctAnswers", session.getCorrectAnswers() != null ? session.getCorrectAnswers() : 0);
                    dto.put("completedAt", session.getCompletedAt());
                    dto.put("duration", session.getTimeSpentSeconds() != null ? session.getTimeSpentSeconds().longValue() : 0L);
                    
                    return dto;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting practice history", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/proactive-suggestions")
    public ResponseEntity<?> getProactiveSuggestions() {
        try {
            User currentUser = currentUserService.getCurrentUser();
            LocalDateTime now = LocalDateTime.now();

            // Nếu đã có lời khuyên và chưa quá 24h thì dùng lại (Caching logic)
            if (currentUser.getAiMentorAdvice() != null && 
                currentUser.getAdviceUpdatedAt() != null && 
                currentUser.getAdviceUpdatedAt().isAfter(now.minusDays(1))) {
                return ResponseEntity.ok(Map.of("advice", currentUser.getAiMentorAdvice()));
            }

            // Lấy dữ liệu phân tích để AI làm cơ sở (Top 3 yếu)
            LocalDateTime thirtyDaysAgo = now.minusDays(30);
            List<PracticeSession> recentSessions = sessionRepo.findRecentSessions(currentUser.getId(), thirtyDaysAgo);
            
            if (recentSessions.isEmpty()) {
                return ResponseEntity.ok(Map.of("advice", "Bạn chưa có nhiều hoạt động luyện tập gần đây. Hãy bắt đầu ôn tập để iReview có thể đưa ra những lời khuyên hữu ích nhé! 📚"));
            }

            // Phân tích sơ bộ để AI có context
            double avgScore = recentSessions.stream().mapToDouble(s -> s.getScore() != null ? s.getScore() : 0).average().orElse(0);
            
            String prompt = String.format(
                "Bạn là 'iReview AI Tutor'. Phân tích dữ liệu học tập của sinh viên %s:\n" +
                "- Điểm trung bình gần đây: %.1f%%\n" +
                "- Số buổi luyện tập: %d\n" +
                "Yêu cầu: Hãy viết một lời khuyên ngắn gọn (tối đa 2 câu), mang tính cá nhân hóa cao, động viên và gợi ý hướng ôn tập tiếp theo. " +
                "Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp.",
                currentUser.getFullName(), avgScore, recentSessions.size()
            );

            String advice = llmIntegrationService.callAI(prompt);
            
            // Lưu cache vào database
            currentUser.setAiMentorAdvice(advice);
            currentUser.setAdviceUpdatedAt(now);
            userRepository.save(currentUser);

            return ResponseEntity.ok(Map.of("advice", advice));
        } catch (Exception e) {
            log.error("Error generating proactive advice", e);
            return ResponseEntity.ok(Map.of("advice", "iReview đang bận phân tích dữ liệu của bạn, hãy quay lại sau nhé! ✨"));
        }
    }

    @PostMapping("/documents/upload")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("subjectId") UUID subjectId,
            @RequestParam(defaultValue = "TEXTBOOK") String documentType,
            @RequestParam(defaultValue = "true") boolean enableAI
    ) {
        try {
            UUID studentId = getCurrentUserId();
            vn.hvnh.exam.entity.sql.StudentDocument doc = aiProcessor.createDocumentRecord(
                file, studentId, subjectId, documentType, enableAI
            );
            
            // Trigger async processing via proxy
            aiProcessor.processAsync(file, doc);
            
            return ResponseEntity.ok(Map.of("document", doc));
        } catch (Exception e) {
            log.error("Error uploading document", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/study-hub/flashcards/generate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> generateFlashcards(@RequestBody GenerateFlashcardsRequest request) {
        try {
            vn.hvnh.exam.entity.sql.StudentDocument doc = documentRepo.findById(request.getStudentDocId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu"));
            
            // Trigger AI generation with custom count
            aiProcessor.generateAndSaveFlashcards(doc.getExtractedText(), doc, request.getCount());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đang tạo thêm flashcard, vui lòng đợi trong giây lát!"
            ));
        } catch (Exception e) {
            log.error("Error generating flashcards", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/documents")
    public ResponseEntity<?> getMyDocuments(
        @RequestParam(required = false) UUID subjectId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        try {
            UUID studentId = getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);
            Page<vn.hvnh.exam.entity.sql.StudentDocument> docPage;
            
            if (subjectId != null) {
                docPage = documentRepo.findByStudentIdAndSubjectIdOrderByUploadedAtDesc(studentId, subjectId, pageable);
            } else {
                docPage = documentRepo.findByStudentIdOrderByUploadedAtDesc(studentId, pageable);
            }
            
            // Populate flashcard counts
            List<UUID> docIds = docPage.getContent().stream()
                .map(StudentDocument::getStudentDocId)
                .collect(Collectors.toList());
            
            if (!docIds.isEmpty()) {
                List<Object[]> counts = flashcardRepo.countFlashcardsByDocIds(docIds);
                Map<UUID, Long> countMap = counts.stream()
                    .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                    ));
                
                docPage.getContent().forEach(doc -> 
                    doc.setFlashcardCount(countMap.getOrDefault(doc.getStudentDocId(), 0L))
                );
            }

            return ResponseEntity.ok(Map.of(
                "documents", docPage.getContent(),
                "currentPage", docPage.getNumber(),
                "totalElements", docPage.getTotalElements(),
                "totalPages", docPage.getTotalPages(),
                "hasNext", docPage.hasNext()
            ));
        } catch (Exception e) {
            log.error("Error getting documents", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/flashcards")
    public ResponseEntity<?> getFlashcards(
        @RequestParam(required = false) UUID documentId,
        @RequestParam(required = false) UUID subjectId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        try {
            UUID studentId = getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);
            Page<Flashcard> cardPage;

            if (documentId != null) {
                cardPage = flashcardRepo.findByStudentDocumentIdOrderByCreatedAtDesc(documentId, pageable);
            } else if (subjectId != null) {
                cardPage = flashcardRepo.findByStudentIdAndSubjectIdOrderByCreatedAtDesc(studentId, subjectId, pageable);
            } else {
                cardPage = flashcardRepo.findByStudentIdOrderByCreatedAtDesc(studentId, pageable);
            }

            return ResponseEntity.ok(Map.of(
                "flashcards", cardPage.getContent(),
                "currentPage", cardPage.getNumber(),
                "totalElements", cardPage.getTotalElements(),
                "totalPages", cardPage.getTotalPages(),
                "hasNext", cardPage.hasNext()
            ));
        } catch (Exception e) {
            log.error("Error getting flashcards", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/flashcards/due")
    public ResponseEntity<?> getDueFlashcards(@RequestParam(required = false) UUID subjectId) {
        try {
            UUID studentId = getCurrentUserId();
            LocalDate today = LocalDate.now();
            List<Flashcard> dueCards;
            if (subjectId != null) {
                dueCards = flashcardRepo.findDueForReviewBySubject(studentId, subjectId, today);
            } else {
                dueCards = flashcardRepo.findDueForReview(studentId, today);
            }
            long dueCount = flashcardRepo.countDueForReview(studentId, today);
            return ResponseEntity.ok(Map.of("dueCards", dueCards, "dueCount", dueCount));
        } catch (Exception e) {
            log.error("Error getting due flashcards", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/flashcards/subject-counts")
    public ResponseEntity<?> getFlashcardSubjectCounts() {
        log.info("📊 Fetching flashcard subject counts for current student");
        try {
            UUID studentId = getCurrentUserId();
            List<Object[]> counts = flashcardRepo.countFlashcardsBySubject(studentId);
            
            Map<UUID, Long> countMap = counts.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(
                    row -> (UUID) row[0],
                    row -> (Long) row[1]
                ));
                
            return ResponseEntity.ok(countMap);
        } catch (Exception e) {
            log.error("Error getting flashcard subject counts", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/flashcards/{flashcardId}/review")
    public ResponseEntity<?> reviewFlashcard(
        @PathVariable UUID flashcardId,
        @RequestBody ReviewFlashcardRequest request
    ) {
        try {
            flashcardService.recordReview(flashcardId, request.getQuality());
            return ResponseEntity.ok(Map.of("message", "Review recorded successfully"));
        } catch (Exception e) {
            log.error("Error reviewing flashcard", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/flashcards/session-complete")
    public ResponseEntity<?> completeFlashcardSession(@RequestBody SubmitFlashcardSessionRequest request) {
        try {
            UUID studentId = getCurrentUserId();
            
            // 1. Process batch reviews if provided
            if (request.getReviews() != null && !request.getReviews().isEmpty()) {
                for (SubmitFlashcardSessionRequest.CardReview review : request.getReviews()) {
                    flashcardService.recordReview(review.getFlashcardId(), review.getQuality());
                }
            }
            
            // 2. Save PracticeSession log
            SubmitFlashcardSessionResponse response = practiceSessionService.saveFlashcardSession(studentId, request);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error completing flashcard session", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/flashcards")
    public ResponseEntity<?> createFlashcard(@RequestBody CreateFlashcardRequest request) {
        try {
            UUID studentId = getCurrentUserId();
            Flashcard card = Flashcard.builder()
                .studentId(studentId)
                .studentDocumentId(request.getStudentDocumentId())
                .subjectId(request.getSubjectId())
                .frontText(request.getFrontText())
                .backText(request.getBackText())
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM")
                .proficiencyLevel("NEW")
                .createdBy("MANUAL")
                .createdAt(LocalDateTime.now())
                .build();
            
            Flashcard saved = flashcardRepo.save(card);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error creating flashcard", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/flashcards/{id}")
    public ResponseEntity<?> updateFlashcard(@PathVariable UUID id, @RequestBody UpdateFlashcardRequest request) {
        try {
            Flashcard card = flashcardRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));
            
            card.setFrontText(request.getFrontText());
            card.setBackText(request.getBackText());
            if (request.getDifficulty() != null) {
                card.setDifficulty(request.getDifficulty());
            }
            
            Flashcard updated = flashcardRepo.save(card);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating flashcard", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/flashcards/{id}")
    public ResponseEntity<?> deleteFlashcard(@PathVariable UUID id) {
        try {
            flashcardRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa thẻ nhớ thành công"));
        } catch (Exception e) {
            log.error("Error deleting flashcard", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/flashcards/stats-detail")
    public ResponseEntity<?> getDetailedStats() {
        try {
            User user = currentUserService.getCurrentUser();
            if (user == null) throw new RuntimeException("Tài khoản chưa được xác thực!");
            UUID studentId = user.getId();
            LocalDate today = LocalDate.now();
            
            long dueToday = flashcardRepo.countDueForReview(studentId, today);
            long newCardsCount = flashcardRepo.countNewCards(studentId);
            Object rawStats = flashcardRepo.getFlashcardStats(studentId);
            
            // Lấy streak từ PracticeSession (đếm sơ bộ số phiên gần đây)
            long streakCount = sessionRepo.countByStudentId(studentId) > 0 ? 1 : 0; 

            // Chuyển đổi Object[] từ JPA query sang Map để Frontend dễ truy cập
            Map<String, Object> overallStats = new HashMap<>();
            overallStats.put("streakCount", streakCount);
            
            if (rawStats instanceof Object[]) {
                Object[] arr = (Object[]) rawStats;
                overallStats.put("total", arr.length > 0 && arr[0] != null ? arr[0] : 0);
                overallStats.put("newCards", arr.length > 1 && arr[1] != null ? arr[1] : 0);
                overallStats.put("learning", arr.length > 2 && arr[2] != null ? arr[2] : 0);
                overallStats.put("known", arr.length > 3 && arr[3] != null ? arr[3] : 0);
                overallStats.put("mastered", arr.length > 4 && arr[4] != null ? arr[4] : 0);
                overallStats.put("avgReviews", arr.length > 5 && arr[5] != null ? arr[5] : 0);
            } else {
                overallStats.put("total", 0);
                overallStats.put("newCards", 0);
                overallStats.put("mastered", 0);
            }
            
            return ResponseEntity.ok(Map.of(
                "dueToday", dueToday,
                "newCards", newCardsCount,
                "overallStats", overallStats
            ));
        } catch (Exception e) {
            log.error("Error getting detailed flashcard stats", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private UUID getCurrentUserId() {
        User user = currentUserService.getCurrentUser();
        if (user == null) throw new RuntimeException("Tài khoản chưa được xác thực!");
        return user.getId(); 
    }

    /**
     * GLOBAL SEARCH - TÌM KIẾM TOÀN CẦU
     */
    @GetMapping("/search")
    public ResponseEntity<?> globalSearch(
        @RequestParam String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Từ khóa tìm kiếm không được để trống"));
            }
            
            UUID studentId = getCurrentUserId();
            String lowerQuery = query.toLowerCase();
            
            // [TỐI ƯU HIỆU NĂNG - QUAN TRỌNG]: 
            // 1. Dùng Database Level search (searchByTitle) thay vì findAll() rác RAM.
            // 2. Chặn Limit query PageRequest.of(0, 500) để không làm nổ bộ nhớ.
            
            // Tìm tài liệu
            List<Map<String, Object>> documents = documentRepo.searchByTitle(studentId, lowerQuery)
                .stream()
                .limit(5)
                .map(doc -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", doc.getStudentDocId());
                    result.put("type", "document");
                    result.put("title", doc.getDocumentTitle());
                    result.put("description", doc.getDocumentTitle());
                    result.put("icon", "📄");
                    result.put("url", "/study-hub/document/" + doc.getStudentDocId());
                    return result;
                })
                .toList();
            
            // Tìm flashcard (Bọc Page Limit 500 bản ghi thay vì .findAll)
            List<Map<String, Object>> flashcards = flashcardRepo.findByStudentIdOrderByCreatedAtDesc(studentId, PageRequest.of(0, 500))
                .getContent()
                .stream()
                .filter(card -> (card.getFrontText() != null && card.getFrontText().toLowerCase().contains(lowerQuery)) ||
                               (card.getBackText() != null && card.getBackText().toLowerCase().contains(lowerQuery)))
                .limit(5)
                .map(card -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", card.getFlashcardId());
                    result.put("type", "flashcard");
                    result.put("title", card.getFrontText() != null ? card.getFrontText().substring(0, Math.min(card.getFrontText().length(), 50)) : "Flashcard");
                    result.put("description", card.getBackText() != null ? card.getBackText().substring(0, Math.min(card.getBackText().length(), 100)) : "");
                    result.put("icon", "🎴");
                    result.put("url", "/study-hub/learn/" + card.getStudentDocumentId());
                    return result;
                })
                .toList();
            
            // Tìm câu hỏi (Limit 500)
            List<Map<String, Object>> questions = questionRepository.findAll(PageRequest.of(0, 500))
                .getContent()
                .stream()
                .filter(q -> q.getQuestionText() != null && q.getQuestionText().toLowerCase().contains(lowerQuery))
                .limit(4)
                .map(q -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", q.getQuestionId());
                    result.put("type", "question");
                    result.put("title", q.getQuestionText().length() > 50 ? q.getQuestionText().substring(0, 50) + "..." : q.getQuestionText());
                    result.put("description", q.getSubject() != null ? "Môn: " + q.getSubject().getSubjectName() : "Câu hỏi");
                    result.put("icon", "❓");
                    result.put("url", "/study-hub/questions/" + q.getQuestionId());
                    return result;
                })
                .toList();
            
            // Tìm môn học (Thường ít nên findAll an toàn)
            List<Map<String, Object>> subjects = subjectRepository.findAll()
                .stream()
                .filter(s -> (s.getSubjectName() != null && s.getSubjectName().toLowerCase().contains(lowerQuery)) ||
                            (s.getSubjectCode() != null && s.getSubjectCode().toLowerCase().contains(lowerQuery)))
                .limit(4)
                .map(s -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", s.getId());
                    result.put("type", "subject");
                    result.put("title", s.getSubjectName());
                    result.put("description", "Mã: " + s.getSubjectCode());
                    result.put("icon", "📚");
                    result.put("url", "/study-hub/subject/" + s.getId());
                    return result;
                })
                .toList();
            
            // Tìm lớp học đã tham gia
            List<Map<String, Object>> classes = courseClassStudentRepository.findByStudent_Id(studentId)
                .stream()
                .filter(ccs -> ccs.getCourseClass() != null && ccs.getCourseClass().getClassName() != null && 
                              ccs.getCourseClass().getClassName().toLowerCase().contains(lowerQuery))
                .limit(4)
                .map(ccs -> {
                    CourseClass cc = ccs.getCourseClass();
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", cc.getId());
                    result.put("type", "class");
                    result.put("title", cc.getClassName());
                    result.put("description", "Mã lớp: " + cc.getClassCode());
                    result.put("icon", "🏫");
                    result.put("url", "/study-hub/class/" + cc.getId());
                    return result;
                })
                .toList();
            
            List<Map<String, Object>> allResults = new ArrayList<>();
            allResults.addAll(documents);
            allResults.addAll(flashcards);
            allResults.addAll(questions);
            allResults.addAll(subjects);
            allResults.addAll(classes);
            
            int totalResults = allResults.size();
            int startIdx = page * size;
            int endIdx = Math.min(startIdx + size, totalResults);
            
            List<Map<String, Object>> pagedResults = new ArrayList<>();
            if (startIdx < totalResults) {
                pagedResults = allResults.subList(startIdx, endIdx);
            }
            
            return ResponseEntity.ok(Map.of(
                "query", query,
                "results", pagedResults,
                "totalResults", totalResults,
                "currentPage", page,
                "pageSize", size,
                "totalPages", (totalResults + size - 1) / size
            ));
        } catch (Exception e) {
            log.error("Error in global search", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi tìm kiếm: " + e.getMessage()));
        }
    }

    /**
     * COMPETENCY ANALYSIS - PHÂN TÍCH HỒ SƠ NĂNG LỰC BẰNG AI
     */
    @GetMapping("/competency-analysis")
    public ResponseEntity<?> getCompetencyAnalysis() {
        try {
            User student = currentUserService.getCurrentUser();
            UUID studentId = student.getId();
            
            // Lấy tổng số thẻ và số thẻ đã thuộc (MASTERED)
            long totalFlashcards = flashcardRepo.countByStudentId(studentId);
            long masteredFlashcards = flashcardRepo.countByStudentIdAndProficiencyLevel(studentId, "MASTERED");
            
            long totalQuestionsAnswered = sessionRepo.countByStudentId(studentId);
            
            // [TỐI ƯU HIỆU NĂNG]: Thay vì subjectRepository.findAll() (hàng trăm môn), 
            // chỉ lấy các môn sinh viên đã thực sự có lượt học/thi.
            List<Object[]> subjectStats = sessionRepo.getAverageScoresGroupBySubject(studentId);
            
            Double totalScoreSum = 0.0;
            int countValidSubjects = 0;
            List<Map<String, Object>> subjectAnalyses = new ArrayList<>();
            
            for (Object[] stat : subjectStats) {
                UUID subjectId = (UUID) stat[0];
                String subjectName = (String) stat[1];
                Double avgScore = (Double) stat[2];
                
                if (avgScore != null && avgScore > 0) {
                    totalScoreSum += avgScore;
                    countValidSubjects++;
                    
                    Map<String, Object> analysis = new HashMap<>();
                    analysis.put("subjectName", subjectName);
                    
                    // Questions in bank for this subject (có thể cache hoặc query 1 lần)
                    Long questionsInBank = questionRepository.countBySubject_Id(subjectId);
                    analysis.put("questionsAttempted", questionsInBank); 
                    analysis.put("accuracy", avgScore);
                    
                    String level = avgScore >= 80 ? "MASTERY" : 
                                   avgScore >= 60 ? "PROFICIENT" : 
                                   avgScore >= 40 ? "DEVELOPING" : "BEGINNING";
                    analysis.put("performanceLevel", level);
                    subjectAnalyses.add(analysis);
                }
            }
            
            Double overallScore = countValidSubjects > 0 ? (totalScoreSum / countValidSubjects) : 0.0;
            String competencyLevel = overallScore >= 80 ? "EXCELLENT" : overallScore >= 60 ? "GOOD" : overallScore >= 40 ? "AVERAGE" : "NEEDS_IMPROVEMENT";
            
            // Tạo prompt cho AI phân tích
            StringBuilder analysisPrompt = new StringBuilder();
            analysisPrompt.append("Phân tích hồ sơ năng lực của sinh viên dựa vào dữ liệu sau:\n");
            analysisPrompt.append("- Tên: ").append(student.getFullName()).append("\n");
            analysisPrompt.append("- Điểm trung bình: ").append(String.format("%.1f%%", overallScore)).append("\n");
            analysisPrompt.append("- Tổng thẻ đã thuộc: ").append(masteredFlashcards).append("/").append(totalFlashcards).append("\n");
            analysisPrompt.append("- Tổng câu hỏi đã làm: ").append(totalQuestionsAnswered).append("\n\n");
            
            analysisPrompt.append("Phân tích theo từng môn:\n");
            subjectAnalyses.forEach(a -> {
                analysisPrompt.append("- ").append(a.get("subjectName")).append(": ")
                    .append(String.format("%.1f%%", (Double) a.get("accuracy")))
                    .append(" (").append(a.get("performanceLevel")).append(")\n");
            });
            
            analysisPrompt.append("\nHãy cho 3 điểm mạnh, 3 điểm yếu và lộ trình cải thiện ngắn gọn.");

            String aiAnalysis;
            if (countValidSubjects == 0 && totalFlashcards == 0 && totalQuestionsAnswered == 0) {
                aiAnalysis = "Hiện chưa có đủ dữ liệu học tập để phân tích. Hãy bắt đầu học và làm bài tập để nhận được phân tích từ AI!";
            } else {
                aiAnalysis = llmIntegrationService.callAI(analysisPrompt.toString());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("studentName", student.getFullName());
            response.put("overallScore", overallScore);
            response.put("competencyLevel", competencyLevel);
            response.put("subjectAnalyses", subjectAnalyses);
            response.put("strengths", extractStrengths(aiAnalysis));
            response.put("weaknesses", extractWeaknesses(aiAnalysis));
            response.put("aiRecommendation", aiAnalysis);
            response.put("totalFlashcardsReviewed", masteredFlashcards);
            response.put("totalFlashcardsCount", totalFlashcards);
            response.put("totalQuestionsAnswered", totalQuestionsAnswered);
            response.put("averageAccuracy", overallScore);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error analyzing competency", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi phân tích năng lực: " + e.getMessage()));
        }
    }
    
    private List<String> extractStrengths(String aiText) {
        List<String> strengths = new ArrayList<>();
        try {
            int idx = aiText.toLowerCase().indexOf("điểm mạnh");
            if (idx > 0) {
                String section = aiText.substring(idx, Math.min(idx + 500, aiText.length()));
                String[] lines = section.split("\n");
                for (String line : lines) {
                    if (line.contains("-") && !line.toLowerCase().contains("yếu")) {
                        strengths.add(line.replaceAll("^[^-]*-", "").trim());
                        if (strengths.size() >= 4) break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error extracting strengths", e);
        }
        return strengths.isEmpty() ? List.of("Năng lực tổng quát", "Khả năng học tập") : strengths;
    }
    
    private List<String> extractWeaknesses(String aiText) {
        List<String> weaknesses = new ArrayList<>();
        try {
            int idx = aiText.toLowerCase().indexOf("yếu");
            if (idx > 0) {
                String section = aiText.substring(idx, Math.min(idx + 500, aiText.length()));
                String[] lines = section.split("\n");
                for (String line : lines) {
                    if (line.contains("-") && !line.toLowerCase().contains("mạnh")) {
                        weaknesses.add(line.replaceAll("^[^-]*-", "").trim());
                        if (weaknesses.size() >= 4) break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error extracting weaknesses", e);
        }
        return weaknesses.isEmpty() ? List.of("Cần tăng cường ôn tập", "Nên làm thêm bài tập") : weaknesses;
    }

    @PostMapping("/documents/{docId}/chat")
    public ResponseEntity<?> chatWithDocument(
            @PathVariable UUID docId,
            @RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        vn.hvnh.exam.entity.sql.StudentDocument doc = documentRepo.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Lấy nội dung đã trích xuất (RAG - Retrieval Augmented Generation)
        String context = doc.getExtractedText();
        if (context == null || context.trim().isEmpty()) {
            context = "Nội dung tài liệu đang được xử lý hoặc để trống.";
        } else if (context.length() > 15000) {
            // Giới hạn để không bị tràn Token của Groq (Llama 3.3 hỗ trợ lớn nhưng nên súc tích)
            context = context.substring(0, 15000) + "... [Nội dung quá dài, đã được lược bớt]";
        }

        String prompt = String.format(
                "Bạn là một Gia sư Đại học xuất sắc. Sinh viên đang học tài liệu mang tên: '%s'.\n" +
                "NỘI DUNG TÀI LIỆU NHƯ SAU:\n\"\"\"\n%s\n\"\"\"\n\n" +
                "Dựa trên nội dung tài liệu trên, hãy trả lời câu hỏi của sinh viên: '%s'.\n" +
                "YÊU CẦU: Trả lời bằng tiếng Việt, chuyên nghiệp, súc tích, dễ hiểu. Nếu câu hỏi không liên quan đến tài liệu, hãy nhắc nhở nhẹ nhàng và trả lời dựa trên kiến thức chung.",
                doc.getDocumentTitle(), context, userMessage
        );

        String aiResponse = llmIntegrationService.callAI(prompt);
        return ResponseEntity.ok(Map.of("answer", aiResponse));
    }

    @PostMapping("/generate-quiz-matrix")
    public ResponseEntity<?> generateQuizMatrix(@RequestBody Map<String, Object> request) {
        try {
            List<String> docIds = (List<String>) request.get("docIds");
            Map<String, Integer> matrix = (Map<String, Integer>) request.get("matrix");

            int easy = matrix.getOrDefault("easy", 0);
            int medium = matrix.getOrDefault("medium", 0);
            int hard = matrix.getOrDefault("hard", 0);
            int totalQuestions = easy + medium + hard;

            if (totalQuestions == 0 || docIds == null || docIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn tài liệu và số lượng câu hỏi"));
            }

            StringBuilder combinedContent = new StringBuilder();
            int maxCharsPerDoc = 20000 / Math.max(1, docIds.size());
            for (String id : docIds) {
                vn.hvnh.exam.entity.sql.StudentDocument doc = documentRepo.findById(UUID.fromString(id)).orElse(null);
                if (doc != null && doc.getExtractedText() != null) {
                    combinedContent.append("--- BẮT ĐẦU TÀI LIỆU: ").append(doc.getDocumentTitle()).append(" ---\n");
                    String extractedText = doc.getExtractedText();
                    if (extractedText.length() > maxCharsPerDoc) {
                        extractedText = extractedText.substring(0, maxCharsPerDoc) + "\n...[Nội dung tài liệu đã bị cắt bớt do giới hạn độ dài của AI]...";
                    }
                    combinedContent.append(extractedText).append("\n");
                    combinedContent.append("--- KẾT THÚC TÀI LIỆU ---\n\n");
                }
            }

            String prompt = String.format(
                    "Bạn là một Giáo sư đại học ra đề thi trắc nghiệm khách quan. Dựa vào nội dung tài liệu sau đây (đã được đánh dấu [TRANG X] ở mỗi trang):\n\n%s\n\n" +
                    "Hãy tạo ra ĐÚNG %d câu hỏi trắc nghiệm khách quan theo ma trận độ khó: %d câu Dễ, %d câu Trung bình, %d câu Khó.\n" +
                    "BẮT BUỘC CHỈ TRẢ VỀ ĐÚNG 1 MẢNG JSON HỢP LỆ. Cấu trúc mỗi object trong mảng phải chính xác như sau:\n" +
                    "{\n" +
                    "  \"question\": \"nội dung câu hỏi\",\n" +
                    "  \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"],\n" +
                    "  \"correctAnswer\": 0,\n" +
                    "  \"difficulty\": \"Dễ hoặc Trung bình hoặc Khó\",\n" +
                    "  \"explanation\": \"Giải thích chi tiết tại sao đáp án đó đúng dựa vào tài liệu\",\n" +
                    "  \"reference\": \"Tên tài liệu chứa kiến thức này\",\n" +
                    "  \"page\": 5\n" + 
                    "}\n\n" +
                    "LUẬT THÉP CẦN TUÂN THỦ (NẾU VI PHẠM SẼ BỊ PHẠT):\n" +
                    "1. TUYỆT ĐỐI KHÔNG dùng các đáp án: 'Tất cả đều đúng', 'Cả A và B đều đúng', 'Không có đáp án nào đúng'.\n" +
                    "2. Trường 'page' PHẢI LÀ SỐ NGUYÊN chỉ định chính xác con số nằm trong thẻ [TRANG X] của đoạn văn chứa đáp án. Nếu không tìm thấy trang chính xác, hãy trả về 1.",
                    combinedContent.toString(), totalQuestions, easy, medium, hard
            );
            
            String aiResponse = llmIntegrationService.callAI(prompt);

            int startIndex = aiResponse.indexOf('[');
            int endIndex = aiResponse.lastIndexOf(']');
            
            if (startIndex != -1) {
                if (endIndex != -1 && startIndex < endIndex) {
                    aiResponse = aiResponse.substring(startIndex, endIndex + 1);
                } else {
                    aiResponse = aiResponse.substring(startIndex);
                    int lastValidObjectEnd = aiResponse.lastIndexOf('}');
                    if (lastValidObjectEnd != -1) {
                        aiResponse = aiResponse.substring(0, lastValidObjectEnd + 1) + "]";
                    } else {
                        throw new RuntimeException("AI trả về dữ liệu không thể phục hồi");
                    }
                }
            } else {
                 throw new RuntimeException("AI không trả về mảng JSON");
            }

            List<Map<String, Object>> quizList = objectMapper.readValue(aiResponse, new TypeReference<List<Map<String, Object>>>(){});
            return ResponseEntity.ok(quizList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo đề thi: " + e.getMessage()));
        }
    }

    @PostMapping("/chat-general")
    public ResponseEntity<?> chatGeneral(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tin nhắn không được để trống"));
            }
            String prompt = String.format(
                "Bạn là 'iReview AI Tutor' - Trợ lý học tập thông minh, chuyên nghiệp và tận tâm của Học viện Ngân hàng (HVNH).\n" +
                "Nhiệm vụ: Tư vấn phương pháp học tập, giải đáp thắc mắc về kiến thức đại học, động viên sinh viên.\n" +
                "PHONG CÁCH: Trí tuệ, đáng tin cậy nhưng thân thiện.\n" +
                "Ngôn ngữ: Tiếng Việt.\n" +
                "Câu hỏi từ sinh viên: '%s'", message
            );
            String aiResponse = llmIntegrationService.callAI(prompt);
            return ResponseEntity.ok(Map.of("answer", aiResponse));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "AI đang bận, vui lòng thử lại sau: " + e.getMessage()));
        }
    }

    // =========================================================================
    // 🔥 LUỒNG THAM GIA THI CỦA SINH VIÊN 
    // =========================================================================

    @PostMapping("/class-hub/{classId}/exam-rooms/{roomId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<?> startExamAttempt(
            @PathVariable UUID classId, 
            @PathVariable UUID roomId, 
            Principal principal) {
        try {
            User student = userRepository.findByEmail(principal.getName()).orElseThrow();
            ExamRoom room = examRoomRepository.findById(roomId).orElseThrow();

            Optional<UserAttempt> globalInProgress = userAttemptRepository
                    .findFirstByUser_IdAndStatus(student.getId(), vn.hvnh.exam.common.AttemptStatus.IN_PROGRESS);
            
            if (globalInProgress.isPresent()) {
                UserAttempt unfinished = globalInProgress.get();
                ExamRoom unfinishedRoom = unfinished.getExamRoom();
                LocalDateTime now = LocalDateTime.now();
                
                boolean isTimeUp = unfinished.getStartTime().plusMinutes((unfinishedRoom.getDurationMinutes() != null ? unfinishedRoom.getDurationMinutes() : 60) + 1).isBefore(now);
                boolean isRoomClosed = unfinishedRoom.getEndTime() != null && unfinishedRoom.getEndTime().isBefore(now);
                
                if (isTimeUp || isRoomClosed) {
                    unfinished.setEndTime(now);
                    unfinished.setStatus(vn.hvnh.exam.common.AttemptStatus.COMPLETED);
                    userAttemptRepository.saveAndFlush(unfinished);
                } else {
                    if (unfinishedRoom.getId().equals(roomId)) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("attemptId", unfinished.getAttemptId());
                        response.put("duration", room.getDurationMinutes());
                        response.put("creationMode", room.getCreationMode());
                        response.put("message", "Đang tiếp tục bài thi dang dở...");
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.badRequest().body(Map.of(
                            "error", "Bạn đang có bài thi '" + unfinishedRoom.getName() + "' chưa nộp. Vui lòng nộp bài đó trước!"
                        ));
                    }
                }
            }

            LocalDateTime now = LocalDateTime.now();
            if (room.getStartTime() != null && now.isBefore(room.getStartTime())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Phòng thi chưa mở cửa."));
            }
            if (room.getEndTime() != null && now.isAfter(room.getEndTime())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Phòng thi đã đóng cửa."));
            }

            long attemptCount = userAttemptRepository.countByUser_IdAndExamRoom_Id(student.getId(), roomId);
            int maxLimit = room.getMaxAttempts() != null ? room.getMaxAttempts() : 1;

            if (attemptCount >= maxLimit) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã hết lượt làm bài."));
            }

            userAttemptRepository.forceCloseInProgressAttempts(student.getId(), roomId);
            userAttemptRepository.flush();

            UserAttempt attempt = new UserAttempt();
            attempt.setUser(student);
            attempt.setExamRoom(room);
            attempt.setStartTime(now);
            attempt.setExamMode(vn.hvnh.exam.common.ExamMode.COMPREHENSIVE); 
            attempt.setStatus(vn.hvnh.exam.common.AttemptStatus.IN_PROGRESS); 
            
            userAttemptRepository.save(attempt);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("attemptId", attempt.getAttemptId());
            response.put("duration", room.getDurationMinutes());
            response.put("creationMode", room.getCreationMode());

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Lỗi hệ thống"));
        }
    }
    
    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true) 
    public ResponseEntity<?> getAttemptDetails(@PathVariable UUID attemptId, Principal principal) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt làm bài"));
            
            ExamRoom room = attempt.getExamRoom();
            
            Map<String, Object> response = new HashMap<>();
            response.put("attemptId", attempt.getAttemptId());
            response.put("examRoomName", room.getName());
            response.put("durationMinutes", room.getDurationMinutes());
            response.put("startTime", attempt.getStartTime());
            response.put("creationMode", room.getCreationMode());
            response.put("showResult", room.getShowResult());
            response.put("maxAttempts", room.getMaxAttempts());
            response.put("attemptCount", userAttemptRepository.countByUser_IdAndExamRoom_Id(attempt.getUser().getId(), room.getId()));
            
            if ("PDF".equals(room.getCreationMode())) {
                response.put("examType", "PDF");
                response.put("pdfUrl", room.getPdfUrl()); 
                response.put("totalQuestions", room.getTotalQuestions());
                response.put("draftAnswers", attempt.getDraftAnswers()); 
            } 
            else if ("BANK".equals(room.getCreationMode())) {
                response.put("examType", "BANK");
                List<QuestionResponse> questions = room.getQuestions().stream()
                        .map(QuestionResponse::fromEntity)
                        .collect(Collectors.toList());
                response.put("questions", questions);
            }

            if (attempt.getEndTime() != null) {
                response.put("isSubmitted", true);
                response.put("score", attempt.getScore());
            } else {
                response.put("isSubmitted", false);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin lượt thi", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/attempts/{attemptId}/save-answer")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> saveAnswerDraft(
            @PathVariable UUID attemptId,
            @RequestBody Map<String, String> payload) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt thi"));
            
            ExamRoom room = attempt.getExamRoom();

            if ("PDF".equals(room.getCreationMode())) {
                String qIndex = payload.get("questionId"); 
                String ans = payload.get("answerId");      

                ObjectMapper mapper = new ObjectMapper();
                Map<String, String> draftMap = new HashMap<>();

                if (attempt.getDraftAnswers() != null && !attempt.getDraftAnswers().isEmpty()) {
                    draftMap = mapper.readValue(attempt.getDraftAnswers(), new TypeReference<Map<String, String>>(){});
                }

                draftMap.put(qIndex, ans);
                attempt.setDraftAnswers(mapper.writeValueAsString(draftMap));
                userAttemptRepository.save(attempt);

                return ResponseEntity.ok(Map.of("success", true, "message", "Đã lưu nháp câu " + qIndex + ": " + ans));
            }
            else if ("BANK".equals(room.getCreationMode())) {
                UUID questionId = UUID.fromString(payload.get("questionId"));
                UUID answerId = UUID.fromString(payload.get("answerId"));
                
                AttemptAnswer attemptAnswer = attemptAnswerRepository
                        .findByAttempt_AttemptIdAndQuestion_QuestionId(attemptId, questionId)
                        .orElse(new AttemptAnswer());

                vn.hvnh.exam.entity.sql.Question question = questionRepository.findById(questionId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi"));
                vn.hvnh.exam.entity.sql.Answer selectedAnswer = answerRepository.findById(answerId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy đáp án"));

                attemptAnswer.setAttempt(attempt);
                attemptAnswer.setQuestion(question);
                attemptAnswer.setSelectedAnswer(selectedAnswer);
                attemptAnswer.setAnsweredAt(LocalDateTime.now());

                attemptAnswerRepository.save(attemptAnswer);
                
                return ResponseEntity.ok(Map.of("success", true, "message", "Đã lưu nháp đáp án"));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Chế độ thi không hợp lệ"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitExam(
            @PathVariable UUID attemptId,
            @RequestBody(required = false) Map<String, Object> payload) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt thi"));
            
            ExamRoom room = attempt.getExamRoom();
            
            if (attempt.getEndTime() != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bài thi này đã được nộp trước đó!"));
            }

            attempt.setEndTime(LocalDateTime.now());
            attempt.setStatus(vn.hvnh.exam.common.AttemptStatus.COMPLETED);
            int correctCount = 0;
            int totalQuestions = room.getTotalQuestions() != null ? room.getTotalQuestions() : 0;
            double score = 0.0;
            int totalAnswered = 0;

            if ("PDF".equals(room.getCreationMode())) {
                Map<String, String> studentAnswers = new HashMap<>();
                ObjectMapper mapper = new ObjectMapper();
                
                if (payload != null && payload.containsKey("answers")) {
                    studentAnswers = (Map<String, String>) payload.get("answers");
                } else if (attempt.getDraftAnswers() != null && !attempt.getDraftAnswers().isEmpty()) {
                    studentAnswers = mapper.readValue(attempt.getDraftAnswers(), new TypeReference<Map<String, String>>(){});
                }

                totalAnswered = studentAnswers.size();
                String answerKey = room.getAnswerKey(); 
                
                if (answerKey != null && !answerKey.isEmpty()) {
                    Map<String, String> correctAnswersMap = parseAnswerKey(answerKey);
                    
                    for (Map.Entry<String, String> entry : studentAnswers.entrySet()) {
                        String qIndex = entry.getKey(); 
                        String sAns = entry.getValue().trim().toUpperCase(); 
                        
                        String cAns = correctAnswersMap.get(qIndex); 
                        if (cAns != null && cAns.toUpperCase().equals(sAns)) {
                            correctCount++;
                        }
                    }
                }
                if (totalQuestions > 0) {
                    score = (double) correctCount / totalQuestions * 10.0; 
                }
            } 
            else if ("BANK".equals(room.getCreationMode())) {
                List<AttemptAnswer> attemptAnswers = attemptAnswerRepository.findByAttempt_AttemptId(attemptId);
                totalAnswered = attemptAnswers.size();
                
                for (AttemptAnswer attemptAns : attemptAnswers) {
                    vn.hvnh.exam.entity.sql.Answer selectedAns = attemptAns.getSelectedAnswer();
                    if (selectedAns != null && Boolean.TRUE.equals(selectedAns.getIsCorrect())) {
                        correctCount++;
                    }
                }
                
                if (totalQuestions > 0) {
                    score = (double) correctCount / totalQuestions * 10.0; 
                }
            }

            attempt.setScore(Math.round(score * 100.0) / 100.0); 
            userAttemptRepository.save(attempt);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "score", attempt.getScore(),
                    "correctAnswers", correctCount,
                    "totalQuestions", totalQuestions,
                    "totalAnswered", totalAnswered,
                    "message", "Nộp bài thành công!"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, String> parseAnswerKey(String answerKey) {
        Map<String, String> map = new HashMap<>();
        try {
            if (answerKey.trim().startsWith("{")) {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(answerKey, new TypeReference<Map<String, String>>(){});
            }
            String cleanKey = answerKey.toUpperCase().replaceAll("[^0-9A-D]", ""); 
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)([A-D])").matcher(cleanKey);
            while (m.find()) {
                map.put(m.group(1), m.group(2)); 
            }
        } catch (Exception e) {
            System.err.println("Lỗi parse answerKey: " + e.getMessage());
        }
        return map;
    }

    @GetMapping("/attempts/{attemptId}/review")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAttemptReview(@PathVariable UUID attemptId, Principal principal) {
        try {
            UserAttempt attempt = userAttemptRepository.findById(attemptId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt thi"));
            
            ExamRoom room = attempt.getExamRoom();
            
            long attemptCount = userAttemptRepository.countByUser_IdAndExamRoom_Id(attempt.getUser().getId(), room.getId());
            int maxAttempts = room.getMaxAttempts() != null ? room.getMaxAttempts() : 1;
            boolean showResult = room.getShowResult() != null ? room.getShowResult() : true;
            
            if (!showResult || attemptCount < maxAttempts) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Tuyệt mật! Bạn chưa hoàn thành tất cả các lượt thi hoặc Giảng viên đã ẩn đáp án."
                ));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("examRoomName", room.getName());
            response.put("score", attempt.getScore());
            response.put("totalQuestions", room.getTotalQuestions());
            response.put("creationMode", room.getCreationMode());
            response.put("durationMinutes", room.getDurationMinutes());
            response.put("startTime", attempt.getStartTime());
            response.put("endTime", attempt.getEndTime());

            if ("PDF".equals(room.getCreationMode())) {
                response.put("pdfUrl", room.getPdfUrl());
                response.put("answerKey", room.getAnswerKey()); 
                
                ObjectMapper mapper = new ObjectMapper();
                Map<String, String> studentAnswers = new HashMap<>();
                if (attempt.getDraftAnswers() != null && !attempt.getDraftAnswers().isEmpty()) {
                    studentAnswers = mapper.readValue(attempt.getDraftAnswers(), new TypeReference<Map<String, String>>(){});
                }
                response.put("studentAnswers", studentAnswers); 
            } 
            else if ("BANK".equals(room.getCreationMode())) {
                List<AttemptAnswer> attemptAnswers = attemptAnswerRepository.findByAttempt_AttemptId(attemptId);
                Map<UUID, UUID> selectedMap = new HashMap<>();
                for (AttemptAnswer aa : attemptAnswers) {
                    if (aa.getSelectedAnswer() != null && aa.getQuestion() != null) {
                        selectedMap.put(aa.getQuestion().getQuestionId(), aa.getSelectedAnswer().getAnswerId());
                    }
                }

                List<Map<String, Object>> questionsList = new ArrayList<>();
                if (room.getQuestions() != null) {
                    for (vn.hvnh.exam.entity.sql.Question q : room.getQuestions()) {
                        if (q == null) continue;

                        Map<String, Object> qMap = new HashMap<>();
                        qMap.put("questionId", q.getQuestionId());
                        qMap.put("questionText", q.getQuestionText());
                        qMap.put("difficultyLevel", q.getDifficultyLevel() != null ? q.getDifficultyLevel().name() : "MEDIUM");

                        List<Map<String, Object>> ansList = new ArrayList<>();
                        
                        if (q.getAnswers() != null) {
                            for (vn.hvnh.exam.entity.sql.Answer a : q.getAnswers()) {
                                if (a == null) continue;
                                
                                Map<String, Object> aMap = new HashMap<>();
                                aMap.put("answerId", a.getAnswerId());
                                aMap.put("answerText", a.getAnswerText());
                                aMap.put("answerLabel", a.getAnswerLabel());
                                aMap.put("isCorrect", a.getIsCorrect()); 
                                aMap.put("isSelected", a.getAnswerId().equals(selectedMap.get(q.getQuestionId()))); 
                                ansList.add(aMap);
                            }
                        }
                        qMap.put("answers", ansList);
                        questionsList.add(qMap);
                    }
                }
                response.put("questions", questionsList);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/documents/{docId}")
    @Transactional
    public ResponseEntity<?> deleteDocument(@PathVariable UUID docId) {
        log.info("🗑️ Deleting document: {}", docId);
        Optional<StudentDocument> docOpt = documentRepo.findById(docId);
        if (docOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StudentDocument doc = docOpt.get();

        // 1. Delete associated flashcards first
        Page<Flashcard> cards = flashcardRepo.findByStudentDocumentIdOrderByCreatedAtDesc(docId, Pageable.unpaged());
        flashcardRepo.deleteAll(cards.getContent());

        // 2. Delete physical file if exists
        try {
            String filename = doc.getStudentDocId() + "_" + doc.getDocumentTitle();
            Path filePath = Paths.get("uploads/student-documents").resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Failed to delete physical file", e);
        }

        // 3. Delete document record
        documentRepo.delete(doc);

        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    @GetMapping("/documents/download/{docId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID docId) {
        try {
            Optional<StudentDocument> docOpt = documentRepo.findById(docId);
            if (docOpt.isEmpty()) return ResponseEntity.notFound().build();
            
            StudentDocument doc = docOpt.get();
            Resource resource = null;
            
            // Strategy 1: New path - uploads/student-documents/{docId}_{title}
            String filename = doc.getStudentDocId() + "_" + doc.getDocumentTitle();
            Path filePath = Paths.get("uploads/student-documents").resolve(filename);
            Resource candidate = new UrlResource(filePath.toUri());
            if (candidate.exists()) {
                resource = candidate;
            }
            
            // Strategy 2: Old path - uploads/{docId}.{ext}
            if (resource == null) {
                String ext = doc.getFileType() != null ? doc.getFileType().toLowerCase() : "pdf";
                filePath = Paths.get("uploads").resolve(doc.getStudentDocId() + "." + ext);
                candidate = new UrlResource(filePath.toUri());
                if (candidate.exists()) {
                    resource = candidate;
                }
            }
            
            // Strategy 3: Scan uploads/ for any file starting with the docId
            if (resource == null) {
                Path uploadsDir = Paths.get("uploads");
                if (Files.exists(uploadsDir)) {
                    try (var stream = Files.list(uploadsDir)) {
                        Optional<Path> match = stream
                            .filter(p -> p.getFileName().toString().startsWith(doc.getStudentDocId().toString()))
                            .findFirst();
                        if (match.isPresent()) {
                            resource = new UrlResource(match.get().toUri());
                        }
                    }
                }
            }

            // Strategy 4: Fallback for 'null_' prefix bug - uploads/student-documents/null_{title}
            if (resource == null) {
                String nullFilename = "null_" + doc.getDocumentTitle();
                filePath = Paths.get("uploads/student-documents").resolve(nullFilename);
                candidate = new UrlResource(filePath.toUri());
                if (candidate.exists()) {
                    resource = candidate;
                    log.info("🩹 recovered file using null_ prefix strategy for doc: {}", docId);
                }
            }
            
            if (resource == null || !resource.exists()) {
                log.warn("File not found for document: {} (title: {})", docId, doc.getDocumentTitle());
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            if (doc.getFileType() != null && doc.getFileType().equalsIgnoreCase("pdf")) contentType = "application/pdf";
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getDocumentTitle() + "\"")
                .body(resource);
        } catch (Exception e) {
            log.error("Download error", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}