package vn.hvnh.exam.service;

import org.springframework.stereotype.Service;
import vn.hvnh.exam.dto.ChapterDTO;
import vn.hvnh.exam.dto.QuestionRequest;
import vn.hvnh.exam.entity.sql.Chapter;
import vn.hvnh.exam.entity.sql.Question;
import vn.hvnh.exam.entity.sql.Subject;
import vn.hvnh.exam.repository.sql.ChapterRepository;
import vn.hvnh.exam.repository.sql.QuestionRepository;
import vn.hvnh.exam.repository.sql.SubjectRepository;

import java.util.List;
import java.util.UUID;

@Service
public class CourseContentService {

    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final QuestionRepository questionRepository;
    private final vn.hvnh.exam.repository.sql.AnswerRepository answerRepository;

    public CourseContentService(SubjectRepository subjectRepository, ChapterRepository chapterRepository, QuestionRepository questionRepository, vn.hvnh.exam.repository.sql.AnswerRepository answerRepository) {
        this.subjectRepository = subjectRepository;
        this.chapterRepository = chapterRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
    }

    // --- QUẢN LÝ CHƯƠNG ---

    public Chapter createChapter(ChapterDTO dto) {
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Môn học không tồn tại"));

        Chapter chapter = Chapter.builder()
                .subject(subject)
                .chapterNumber(dto.getChapterNumber()) 
                .chapterName(dto.getChapterName())
                .description(dto.getDescription())  
                .orderIndex(dto.getChapterNumber())   
                .build();

        return chapterRepository.save(chapter);
    }

    public List<Chapter> getChaptersBySubject(UUID subjectId) {
        return chapterRepository.findBySubject_IdOrderByOrderIndexAsc(subjectId);
    }

    // --- QUẢN LÝ CÂU HỎI ---

    public Question createQuestion(QuestionRequest dto) {
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Môn học không tồn tại"));

        Chapter chapter = chapterRepository.findById(dto.getChapterId())
                .orElseThrow(() -> new RuntimeException("Chương không tồn tại"));

        Question question = Question.builder()
                .subject(subject)
                .chapter(chapter)
                .questionText(dto.getQuestionText())
                .bloomLevel(dto.getBloomLevel())
                .difficultyLevel(dto.getDifficultyLevel())
                .isActive(true)
                .isVerified(true)
                .build();

        return questionRepository.save(question);
    }

    public List<Question> getQuestionsByChapter(UUID chapterId) {
        return questionRepository.findByChapter_ChapterId(chapterId);
    }

    public List<vn.hvnh.exam.entity.sql.Answer> addAnswersToQuestion(UUID questionId, List<vn.hvnh.exam.dto.AnswerRequest> AnswerRequests) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Câu hỏi không tồn tại"));

        List<vn.hvnh.exam.entity.sql.Answer> answers = AnswerRequests.stream().map(dto -> 
            vn.hvnh.exam.entity.sql.Answer.builder()
                .question(question)
                .answerText(dto.getAnswerText())
                .isCorrect(dto.getIsCorrect())
                .answerLabel(dto.getAnswerLabel())
                .build()
        ).toList();

        return answerRepository.saveAll(answers);
    }
}