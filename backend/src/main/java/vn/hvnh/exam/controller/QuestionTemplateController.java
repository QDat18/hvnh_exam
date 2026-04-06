package vn.hvnh.exam.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
public class QuestionTemplateController {

    private final QuestionTemplateRepository templateRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final FormulaQuestionGenerator generatorService;
    private final ObjectMapper objectMapper;

    public QuestionTemplateController(QuestionTemplateRepository templateRepository, SubjectRepository subjectRepository, ChapterRepository chapterRepository, FormulaQuestionGenerator generatorService, ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.subjectRepository = subjectRepository;
        this.chapterRepository = chapterRepository;
        this.generatorService = generatorService;
        this.objectMapper = objectMapper;
    }

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
                    .formulasDistractors(objectMapper.writeValueAsString(dto.getFormulasDistractors()))
                    .variableRanges(objectMapper.writeValueAsString(dto.getVariableRanges()))
                    .build();

            return ResponseEntity.ok(templateRepository.save(template));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template: " + e.getMessage());
        }
    }

    @PostMapping("/{templateId}/preview")
    public ResponseEntity<Map<String, Object>> previewGeneratedQuestion(@PathVariable UUID templateId) {
        Question question = generatorService.generateQuestionFromTemplate(templateId);

        Map<String, Object> response = new HashMap<>();
        response.put("questionText", question.getQuestionText());
        response.put("answers", question.getAnswers());
        
        return ResponseEntity.ok(response);
    }
}