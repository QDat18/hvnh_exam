package vn.hvnh.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import net.objecthunter.exp4j.Expression;
import net.objecthunter.exp4j.ExpressionBuilder;
import org.springframework.stereotype.Service;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.QuestionTemplateRepository;

import java.util.*;

@Service
@RequiredArgsConstructor
public class FormulaQuestionGenerator {

    private final QuestionTemplateRepository templateRepository;
    private final ObjectMapper objectMapper = new ObjectMapper(); // Để parse JSON

    /**
     * Sinh 1 câu hỏi hoàn chỉnh từ Template ID
     */
    public Question generateQuestionFromTemplate(UUID templateId) {
        QuestionTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        try {
            // 1. Random biến số (a, b, x...)
            Map<String, Integer> variables = randomizeVariables(template.getVariableRanges());

            // 2. Tạo nội dung câu hỏi (Thay thế {x} bằng số thực)
            String questionText = replacePlaceholders(template.getQuestionPattern(), variables);

            // 3. Tính toán đáp án đúng
            double correctVal = evaluateFormula(template.getFormulaCorrect(), variables);
            String correctText = formatResult(correctVal);

            // 4. Tính toán các đáp án nhiễu
            List<String> wrongFormulas = objectMapper.readValue(template.getFormulasDistractors(), new TypeReference<List<String>>(){});
            List<Answer> answers = new ArrayList<>();

            // Thêm đáp án đúng
            answers.add(createAnswer(correctText, true, "A")); // Label sẽ được shuffle sau

            // Thêm đáp án sai
            char label = 'B';
            for (String wrongFormula : wrongFormulas) {
                double wrongVal = evaluateFormula(wrongFormula, variables);
                // Tránh trường hợp công thức sai vô tình ra kết quả trùng đáp án đúng
                if (Math.abs(wrongVal - correctVal) < 0.001) {
                    wrongVal += new Random().nextInt(5) + 1; // Cộng bừa số để khác đi
                }
                answers.add(createAnswer(formatResult(wrongVal), false, String.valueOf(label++)));
            }

            // Shuffle đáp án để A không phải lúc nào cũng đúng
            Collections.shuffle(answers);
            assignLabels(answers); // Gán lại A, B, C, D sau khi trộn

            // 5. Build Question Object
            Question question = Question.builder()
                    .subject(template.getSubject())
                    .chapter(template.getChapter())
                    .questionText(questionText)
                    .bloomLevel(BloomLevel.APPLY)      // Mặc định là Vận dụng
                    .difficultyLevel(DifficultyLevel.MEDIUM)
                    .isActive(true)
                    .isVerified(true) // Câu hỏi từ công thức toán học thì luôn đúng
                    .build();
            question.setAnswers(answers);
            return question;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi sinh câu hỏi toán học: " + e.getMessage());
        }
    }

    // --- CÁC HÀM BỔ TRỢ ---

    // Parse JSON variable_ranges và random số
    private Map<String, Integer> randomizeVariables(String jsonRanges) throws Exception {
        Map<String, List<Integer>> ranges = objectMapper.readValue(jsonRanges, new TypeReference<Map<String, List<Integer>>>(){});
        Map<String, Integer> result = new HashMap<>();
        Random rand = new Random();

        for (Map.Entry<String, List<Integer>> entry : ranges.entrySet()) {
            int min = entry.getValue().get(0);
            int max = entry.getValue().get(1);
            int value = rand.nextInt((max - min) + 1) + min;
            result.put(entry.getKey(), value);
        }
        return result;
    }

    // Thay thế {x} thành số
    private String replacePlaceholders(String text, Map<String, Integer> vars) {
        for (Map.Entry<String, Integer> entry : vars.entrySet()) {
            text = text.replace("{" + entry.getKey() + "}", entry.getValue().toString());
        }
        return text;
    }

    // Tính toán biểu thức bằng exp4j
    private double evaluateFormula(String formula, Map<String, Integer> vars) {
        ExpressionBuilder builder = new ExpressionBuilder(formula);
        Set<String> keySet = vars.keySet();
        // Exp4j yêu cầu khai báo biến trước
        builder.variables(keySet);
        
        Expression expression = builder.build();
        for (Map.Entry<String, Integer> entry : vars.entrySet()) {
            expression.setVariable(entry.getKey(), entry.getValue());
        }
        return expression.evaluate();
    }

    private String formatResult(double val) {
        // Nếu là số nguyên (5.0) thì in ra 5, nếu lẻ thì làm tròn 2 số
        if (val == (long) val) return String.format("%d", (long) val);
        return String.format("%.2f", val);
    }

    private Answer createAnswer(String text, boolean correct, String label) {
        return Answer.builder().answerText(text).isCorrect(correct).answerLabel(label).build();
    }

    private void assignLabels(List<Answer> answers) {
        String[] labels = {"A", "B", "C", "D"};
        for (int i = 0; i < answers.size() && i < 4; i++) {
            answers.get(i).setAnswerLabel(labels[i]);
        }
    }
}