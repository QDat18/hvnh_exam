package vn.hvnh.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.objecthunter.exp4j.Expression;
import net.objecthunter.exp4j.ExpressionBuilder;
import org.springframework.stereotype.Service;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.entity.sql.*;
import vn.hvnh.exam.repository.sql.QuestionTemplateRepository;

import java.util.*;

@Service
public class FormulaQuestionGenerator {

    private final QuestionTemplateRepository templateRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FormulaQuestionGenerator(QuestionTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public Question generateQuestionFromTemplate(UUID templateId) {
        QuestionTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        try {
            Map<String, Integer> variables = randomizeVariables(template.getVariableRanges());

            String questionText = replacePlaceholders(template.getQuestionPattern(), variables);

            double correctVal = evaluateFormula(template.getFormulaCorrect(), variables);
            String correctText = formatResult(correctVal);

            List<String> wrongFormulas = objectMapper.readValue(template.getFormulasDistractors(), new TypeReference<List<String>>(){});
            List<Answer> answers = new ArrayList<>();

            answers.add(createAnswer(correctText, true, "A"));

            char label = 'B';
            for (String wrongFormula : wrongFormulas) {
                double wrongVal = evaluateFormula(wrongFormula, variables);
                if (Math.abs(wrongVal - correctVal) < 0.001) {
                    wrongVal += new Random().nextInt(5) + 1;
                }
                answers.add(createAnswer(formatResult(wrongVal), false, String.valueOf(label++)));
            }

            Collections.shuffle(answers);
            assignLabels(answers);

            Question question = Question.builder()
                    .subject(template.getSubject())
                    .chapter(template.getChapter())
                    .questionText(questionText)
                    .bloomLevel(BloomLevel.APPLY)
                    .difficultyLevel(DifficultyLevel.MEDIUM)
                    .isActive(true)
                    .isVerified(true)
                    .build();
            question.setAnswers(answers);
            return question;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi sinh câu hỏi toán học: " + e.getMessage());
        }
    }

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

    private String replacePlaceholders(String text, Map<String, Integer> vars) {
        for (Map.Entry<String, Integer> entry : vars.entrySet()) {
            text = text.replace("{" + entry.getKey() + "}", entry.getValue().toString());
        }
        return text;
    }

    private double evaluateFormula(String formula, Map<String, Integer> vars) {
        ExpressionBuilder builder = new ExpressionBuilder(formula);
        Set<String> keySet = vars.keySet();
        builder.variables(keySet);
        
        Expression expression = builder.build();
        for (Map.Entry<String, Integer> entry : vars.entrySet()) {
            expression.setVariable(entry.getKey(), entry.getValue());
        }
        return expression.evaluate();
    }

    private String formatResult(double val) {
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