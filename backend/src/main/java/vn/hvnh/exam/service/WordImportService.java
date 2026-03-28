package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.dto.QuestionRequest; 
import vn.hvnh.exam.dto.AnswerRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WordImportService {

    private final QuestionService questionService;

    public void importFromWord(MultipartFile file, UUID subjectId, UUID chapterId) throws Exception {
        XWPFDocument doc = new XWPFDocument(file.getInputStream());
        List<XWPFParagraph> paragraphs = doc.getParagraphs();

        QuestionRequest currentQuestion = null;
        List<AnswerRequest> currentAnswers = new ArrayList<>();

        for (XWPFParagraph p : paragraphs) {
            // 🔥 NÂNG CẤP 1: Cắt nhỏ paragraph theo mọi loại dấu xuống dòng (Chống lỗi Shift+Enter)
            String[] lines = p.getText().split("\\r?\\n");
            
            for (String rawLine : lines) {
                String text = rawLine.trim();
                if (text.isEmpty()) continue;

                // 1. Nhận diện Câu hỏi
                if (text.toLowerCase().startsWith("câu") || text.toLowerCase().startsWith("question")) {
                    savePreviousQuestion(currentQuestion, currentAnswers);

                    currentQuestion = new QuestionRequest();
                    currentQuestion.setSubjectId(subjectId);
                    currentQuestion.setChapterId(chapterId);
                    
                    String content = text.contains(":") ? text.substring(text.indexOf(":") + 1).trim() : text;
                    currentQuestion.setQuestionText(content);
                    currentQuestion.setDifficultyLevel(DifficultyLevel.MEDIUM);
                    currentQuestion.setBloomLevel(BloomLevel.UNDERSTAND);
                    currentAnswers = new ArrayList<>();
                } 
                // 2. Nhận diện Đáp án
                else if (isAnswerLine(text)) {
                    if (currentQuestion == null) continue;

                    boolean isCorrect = text.toLowerCase().contains("[x]");
                    String cleanText = text.replace("[x]", "").replace("[X]", "").trim();
                    
                    // 🔥 NÂNG CẤP 2: Chống lỗi giảng viên gõ A) thay vì A.
                    String label = cleanText.substring(0, 1).toUpperCase(); 
                    
                    // Lấy nội dung sau dấu chấm (.) hoặc ngoặc đóng ())
                    int splitIndex = Math.max(cleanText.indexOf("."), cleanText.indexOf(")"));
                    String answerContent = (splitIndex != -1) ? cleanText.substring(splitIndex + 1).trim() : cleanText.substring(1).trim();

                    AnswerRequest ans = new AnswerRequest();
                    ans.setAnswerText(answerContent);
                    ans.setAnswerLabel(label);
                    ans.setIsCorrect(isCorrect);
                    currentAnswers.add(ans);
                }
            }
        }

        savePreviousQuestion(currentQuestion, currentAnswers);
        doc.close();
    }

    private void savePreviousQuestion(QuestionRequest question, List<AnswerRequest> answers) {
        if (question != null && !answers.isEmpty()) {
            question.setAnswers(answers);
            questionService.createQuestion(question);
        }
    }

    private boolean isAnswerLine(String text) {
        // 🔥 NÂNG CẤP 3: Regex siêu việt, nhận diện cả A. B. và A) B) 
        return text.trim().matches("^(?i)(\\[x\\]\\s*)?[A-Z][\\.\\)]\\s*.*");
    }
}