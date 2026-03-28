import axiosClient from '../../../services/axiosClient';
import type { Question, QuestionPayload } from '../../../types/question.types';

const ENDPOINT = '/questions';

const questionService = {
    // Lấy danh sách câu hỏi (có lọc theo môn học)
    getBySubject: async (subjectId: string) => {
        // API: /questions?subjectId=...
        return axiosClient.get<Question[]>(ENDPOINT, { params: { subjectId } });
    },

    // Tạo câu hỏi mới
    create: async (payload: QuestionPayload) => {
        return axiosClient.post<Question>(ENDPOINT, payload);
    },

    // Cập nhật câu hỏi
    update: async (id: string, payload: QuestionPayload) => {
        return axiosClient.put<Question>(`${ENDPOINT}/${id}`, payload);
    },

    // Xóa câu hỏi
    delete: async (id: string) => {
        return axiosClient.delete(`${ENDPOINT}/${id}`);
    }
};

export default questionService;