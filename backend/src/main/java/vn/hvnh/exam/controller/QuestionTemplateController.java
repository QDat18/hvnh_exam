package vn.hvnh.exam.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.hvnh.exam.dto.QuestionTemplateDTO;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.ChapterRepository;
import vn.hvnh.exam.repository.sql.QuestionTemplateRepository;
import vn.hvnh.exam.repository.sql.SubjectRepository;
import vn.hvnh.exam.service.FormulaQuestionGenerator;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class QuestionTemplateController {

    private final QuestionTemplateRepository templateRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final FormulaQuestionGenerator generatorService;
    private final ObjectMapper objectMapper;

    // 1. Tạo Template mới (Giảng viên nhập công thức)
    @PostMapping
    public ResponseEntity<QuestionTemplate> createTemplate(@RequestBody QuestionTemplateDTO dto) {
        try {
            Subject subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject not found"));
            Chapter chapter = chapterRepository.findById(dto.getChapterId())
                    .orElseThrow(() -> new RuntimeException("Chapter not found"));

            QuestionTemplate template = QuestionTemplate.builder()
                    .subject(subject)
                    .chapter(chapter)
                    .questionPattern(dto.getQuestionPattern())
                    .formulaCorrect(dto.getFormulaCorrect())
                    .explanationTemplate(dto.getExplanationTemplate())
                    // Convert List/Map sang JSON String để lưu vào DB
                    .formulasDistractors(objectMapper.writeValueAsString(dto.getFormulasDistractors()))
                    .variableRanges(objectMapper.writeValueAsString(dto.getVariableRanges()))
                    .build();

            return ResponseEntity.ok(templateRepository.save(template));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template: " + e.getMessage());
        }
    }

    // 2. Test thử sinh câu hỏi từ Template (Preview)
    @PostMapping("/{templateId}/preview")
    public ResponseEntity<Map<String, Object>> previewGeneratedQuestion(@PathVariable UUID templateId) {
        // Gọi Service sinh câu hỏi
        Question question = generatorService.generateQuestionFromTemplate(templateId);

        // Map data trả về để xem (vì Question entity chưa có list answers gắn kèm lúc này)
        Map<String, Object> response = new HashMap<>();
        response.put("questionText", question.getQuestionText());
        response.put("answers", question.getAnswers()); // Lưu ý: Cần sửa getter trong Entity hoặc lấy thủ công ở Service
        
        // Vì ở bước trước Service trả về Question nhưng Answer chưa được set vào list của Question (do JPA Lazy)
        // Nên ta trả về cấu trúc đơn giản để test:
        return ResponseEntity.ok(response);
    }
}