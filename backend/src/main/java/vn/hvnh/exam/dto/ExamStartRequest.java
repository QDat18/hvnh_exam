package vn.hvnh.exam.dto;

import lombok.Data;
import vn.hvnh.exam.common.ExamMode;
import java.util.List;
import java.util.UUID;

@Data
public class ExamStartRequest {
    private UUID subjectId;
    private UUID chapterId; // Dùng cho logic cũ (nếu còn giữ)
    private ExamMode mode; 

    // --- CÁC TRƯỜNG MỚI BẮT BUỘC PHẢI THÊM ---
    private List<UUID> chapterIds; 
    private Integer totalQuestions; 
    
    private Integer easyPercent;   
    private Integer mediumPercent; 
    private Integer hardPercent;   
}