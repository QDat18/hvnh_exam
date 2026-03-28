package vn.hvnh.exam.service;

import org.springframework.stereotype.Component;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.entity.sql.Chapter;

import java.util.*;

@Component
public class ExamMatrixHelper {

    /**
     * Tính toán phân bổ câu hỏi cho từng chương
     * @param totalQuestions Tổng số câu (VD: 40)
     * @param chapters Danh sách các chương cần thi
     * @param easyRate Tỷ lệ câu Dễ (0.0 - 1.0)
     * @param mediumRate Tỷ lệ câu TB
     * @param hardRate Tỷ lệ câu Khó
     * @return Map<ChapterID, Map<Difficulty, Count>>
     */
    public Map<UUID, Map<DifficultyLevel, Integer>> calculateMatrix(
            int totalQuestions, 
            List<Chapter> chapters,
            double easyRate, double mediumRate, double hardRate
    ) {
        Map<UUID, Map<DifficultyLevel, Integer>> matrix = new HashMap<>();
        if (chapters.isEmpty()) return matrix;

        // 1. Chia đều tổng số câu cho các chương
        int baseCount = totalQuestions / chapters.size();
        int remainder = totalQuestions % chapters.size();

        for (int i = 0; i < chapters.size(); i++) {
            UUID chapterId = chapters.get(i).getChapterId();
            
            // Chương đầu được cộng phần dư
            int chapterTotal = baseCount + (i < remainder ? 1 : 0);

            // 2. Trong mỗi chương, chia theo độ khó
            int countEasy = (int) Math.round(chapterTotal * easyRate);
            int countHard = (int) Math.round(chapterTotal * hardRate);
            int countMedium = chapterTotal - countEasy - countHard;

            // Fix lỗi làm tròn âm
            if (countMedium < 0) {
                countEasy += countMedium;
                countMedium = 0;
            }

            Map<DifficultyLevel, Integer> distribution = new HashMap<>();
            distribution.put(DifficultyLevel.EASY, countEasy);
            distribution.put(DifficultyLevel.MEDIUM, countMedium);
            distribution.put(DifficultyLevel.HARD, countHard);

            matrix.put(chapterId, distribution);
        }

        return matrix;
    }
}