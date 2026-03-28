package vn.hvnh.exam.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class QuestionTemplateDTO {
    private UUID subjectId;
    private UUID chapterId;

    // VD: "Cho hàm số y = {a}x + {b}. Tính y khi x = {x}"
    private String questionPattern;

    // VD: "a * x + b"
    private String formulaCorrect;

    // VD: ["a * x - b", "a + x + b"]
    private List<String> formulasDistractors;

    // VD: {"a": [1, 10], "x": [1, 5]} -> Map<Tên biến, [Min, Max]>
    private Map<String, List<Integer>> variableRanges;
    
    private String explanationTemplate;
}