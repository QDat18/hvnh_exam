import axiosClient from "./axiosClient";

const questionService = {
    // Tạo câu hỏi kèm đáp án (One-shot)
    createQuestion: (data: any) => {
        return axiosClient.post('/content/questions', data);
    },

    // Lấy câu hỏi theo chương
    getQuestionsByChapter: (chapterId: string) => {
        return axiosClient.get(`/content/chapters/${chapterId}/questions`);
    },

    // Lấy chương theo môn học (Dùng cho dropdown)
    getChaptersBySubject: (subjectId: string) => {
        return axiosClient.get(`/content/subjects/${subjectId}/chapters`);
    }
};

export default questionService;