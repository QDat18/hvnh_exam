package vn.hvnh.exam.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.dto.AnswerRequest;
import vn.hvnh.exam.dto.QuestionRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExcelImportService {

    private final QuestionService questionService;

    public void importFromExcel(MultipartFile file, UUID subjectId, UUID chapterId) throws Exception {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên

        List<String> errors = new ArrayList<>();

        // Bắt đầu từ dòng 1 (bỏ qua tiêu đề ở dòng 0)
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || row.getCell(0) == null) continue;

            try {
                QuestionRequest dto = new QuestionRequest();
                dto.setSubjectId(subjectId);
                dto.setChapterId(chapterId);
                
                // 1. Đọc nội dung câu hỏi
                dto.setQuestionText(getCellValueAsString(row.getCell(0)));

                // 2. Đọc độ khó và mức Bloom
                String diffStr = getCellValueAsString(row.getCell(1)).toUpperCase();
                String bloomStr = getCellValueAsString(row.getCell(2)).toUpperCase();
                dto.setDifficultyLevel(DifficultyLevel.valueOf(diffStr));
                dto.setBloomLevel(BloomLevel.valueOf(bloomStr));

                // 3. Đọc đáp án đúng (Label: A, B, C, D...)
                String correctLabels = getCellValueAsString(row.getCell(7)).toUpperCase();

                // 4. Duyệt các cột đáp án (từ cột 3 đến cột 6)
                List<AnswerRequest> answers = new ArrayList<>();
                for (int j = 0; j < 4; j++) {
                    String cellContent = getCellValueAsString(row.getCell(3 + j));
                    if (cellContent.isEmpty()) continue;

                    String currentLabel = String.valueOf((char) ('A' + j));
                    AnswerRequest ans = new AnswerRequest();
                    ans.setAnswerText(cellContent);
                    ans.setAnswerLabel(currentLabel);
                    // Kiểm tra xem label này có nằm trong danh sách đáp án đúng không
                    ans.setIsCorrect(correctLabels.contains(currentLabel));
                    
                    answers.add(ans);
                }

                dto.setAnswers(answers);
                
                // Gọi QuestionService để lưu xuống DB
                questionService.createQuestion(dto);

            } catch (Exception e) {
                errors.add("Lỗi tại dòng " + (i + 1) + ": " + e.getMessage());
            }
        }
        workbook.close();

        if (!errors.isEmpty()) {
            throw new RuntimeException("Import hoàn tất nhưng có lỗi: " + String.join(" | ", errors));
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            default -> "";
        };
    }
}