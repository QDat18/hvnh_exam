package vn.hvnh.exam.dto;

import lombok.Builder;
import lombok.Data;
import vn.hvnh.exam.common.BloomLevel;
import vn.hvnh.exam.common.DifficultyLevel;
import vn.hvnh.exam.common.QuestionType;
import vn.hvnh.exam.entity.sql.Question;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class QuestionResponse {
    private UUID questionId;
    private String questionText;
    private DifficultyLevel difficultyLevel;
    private BloomLevel bloomLevel;
    private QuestionType questionType;
    private String explanation;
    private Integer usageCount;
    private LocalDateTime createdAt;
    
    // Thông tin kèm theo (Chỉ lấy những gì Frontend thực sự cần)
    private UUID subjectId;
    private String subjectName;
    private UUID chapterId;
    private String chapterName;
    private Integer chapterNumber;

    private List<AnswerResponse> answers;

    // Hàm tiện ích: Trích xuất an toàn dữ liệu từ Entity (Bypass Lazy Loading)
    public static QuestionResponse fromEntity(Question question) {
        if (question == null) return null;
        
        return QuestionResponse.builder()
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .difficultyLevel(question.getDifficultyLevel())
                .bloomLevel(question.getBloomLevel())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .usageCount(question.getUsageCount())
                .createdAt(question.getCreatedAt())
                
                // Trích xuất an toàn Subject (Môn học)
                .subjectId(question.getSubject() != null ? question.getSubject().getId() : null)
                .subjectName(question.getSubject() != null ? question.getSubject().getSubjectName() : null)
                
                // Trích xuất an toàn Chapter (Chương - Nếu có)
                .chapterId(question.getChapter() != null ? question.getChapter().getChapterId() : null)
                .chapterName(question.getChapter() != null ? question.getChapter().getChapterName() : null)
                .chapterNumber(question.getChapter() != null ? question.getChapter().getChapterNumber() : null)
                
                // Biến đổi danh sách Answer Entity thành Answer DTO
                .answers(question.getAnswers() != null ? 
                        question.getAnswers().stream().map(AnswerResponse::fromEntity).collect(Collectors.toList()) : null)
                .build();
    }
}