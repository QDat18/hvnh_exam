export type QuestionLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface Answer {
    id?: string;
    content: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    content: string;          // Nội dung câu hỏi (HTML/Text)
    subjectId: string;        // Thuộc môn nào
    chapterId?: string;       // Thuộc chương nào
    level: QuestionLevel;     // Độ khó
    type: QuestionType;       // Loại câu hỏi
    answers: Answer[];        // Danh sách đáp án
    createdAt?: string;
}

// Dữ liệu gửi lên khi tạo mới
export interface QuestionPayload {
    content: string;
    subjectId: string;
    level: string;
    type: string;
    answers: Answer[];
}