import { type AxiosResponse } from 'axios';
// Bác nhớ trỏ đúng đường dẫn tới file axiosClient nhé
import axiosClient from './axiosClient';
import { type StudentDocument, type Flashcard, type DocumentStatusResponse } from '../types/study';

let cachedSubjects: Promise<AxiosResponse<any>> | null = null;

export const studyHubApi = {
    /**
     * CLEAR CACHE (Khi cần tải lại danh sách môn mới)
     */
    clearSubjectCache: () => {
        cachedSubjects = null;
    },

    /**
     * TẢI TÀI LIỆU
     */
    uploadDocument: (file: File, subjectId: string, type: string = 'TEXTBOOK', onUploadProgress?: (progressEvent: any) => void): Promise<AxiosResponse<{ document: StudentDocument }>> => {

        // 1. KIỂM TRA BẮT BUỘC: Xem subjectId có bị undefined không
        console.log("=== KIỂM TRA TRƯỚC KHI UPLOAD ===");
        console.log("Tên file:", file.name);
        console.log("Subject ID:", subjectId);

        if (!subjectId || subjectId === 'undefined') {
            alert("Lỗi: Chưa có ID môn học! Bác kiểm tra lại component cha xem đã truyền subjectId vào AIStudyHub chưa nhé.");
            return Promise.reject("Missing subjectId");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectId', subjectId);
        formData.append('documentType', type);
        formData.append('enableAI', 'true');

        // 2. PHỤC HỒI LẠI HEADER: Bắt buộc phải đè lên cái application/json của axiosClient
        return axiosClient.post('/student/study-hub/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onUploadProgress
        });
    },

    getMyClasses: (): Promise<AxiosResponse<any>> => {
        return axiosClient.get('/student/study-hub/my-classes');
    },

    getAvailableSubjects: () => {
        if (!cachedSubjects) {
            cachedSubjects = axiosClient.get('/student/study-hub/practice/subjects');
            // Nếu lỗi thì xóa cache để lần sau gọi lại được
            cachedSubjects.catch(() => {
                cachedSubjects = null;
            });
        }
        return cachedSubjects;
    },
    getClassHub: (classId: string) => {
        return axiosClient.get(`/student/study-hub/class-hub/${classId}`);
    },

    getTeacherClasses: () => {
        return axiosClient.get('/teacher/study-hub/my-classes');
    },
    /**
     * GIẢNG VIÊN ĐĂNG TÀI LIỆU CHÍNH THỐNG (HỖ TRỢ MULTIPLE)
     */
    uploadOfficialMaterial: (file: File, subjectId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectId', subjectId);

        return axiosClient.post('/teacher/study-hub/upload-material', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    /**
     * PHÂN TRANG (PRO-PAGINATION)
     */
    getDocuments: (subjectId?: string, page: number = 0, size: number = 10): Promise<AxiosResponse<{
        documents: StudentDocument[],
        currentPage: number,
        totalElements: number,
        totalPages: number,
        hasNext: boolean
    }>> =>
        axiosClient.get('/student/study-hub/documents', { params: { subjectId, page, size } }),

    /**
     * KIỂM TRA TRẠNG THÁI AI
     */
    getStatus: (docId: string): Promise<AxiosResponse<DocumentStatusResponse>> =>
        axiosClient.get(`/student/study-hub/documents/${docId}/status`),

    /**
     * LẤY DANH SÁCH FLASHCARD (PAGINATED)
     */
    getFlashcards: (documentId?: string, page: number = 0, size: number = 20): Promise<AxiosResponse<{
        flashcards: Flashcard[],
        currentPage: number,
        totalElements: number,
        totalPages: number,
        hasNext: boolean
    }>> =>
        axiosClient.get('/student/study-hub/flashcards', { params: { documentId, page, size } }),

    getFlashcardsBySubject: (subjectId: string, limit: number = 20, mode: string = 'mixed'): Promise<AxiosResponse<{
        flashcards: Flashcard[],
        currentPage: number,
        totalElements: number,
        totalPages: number,
        hasNext: boolean
    }>> =>
        axiosClient.get('/student/study-hub/flashcards', { params: { subjectId, size: limit, mode } }),

    generateFlashcards: (studentDocId: string, count: number): Promise<AxiosResponse<any>> =>
        axiosClient.post('/student/study-hub/flashcards/generate', { studentDocId, count }),

    createFlashcard: (payload: { studentDocumentId: string, subjectId: string, frontText: string, backText: string, difficulty: string }): Promise<AxiosResponse<Flashcard>> =>
        axiosClient.post('/student/study-hub/flashcards', payload),

    updateFlashcard: (id: string, payload: { frontText: string, backText: string, difficulty: string }): Promise<AxiosResponse<Flashcard>> =>
        axiosClient.put(`/student/study-hub/flashcards/${id}`, payload),

    deleteFlashcard: (id: string): Promise<AxiosResponse<any>> =>
        axiosClient.delete(`/student/study-hub/flashcards/${id}`),

    getDetailedStats: (): Promise<AxiosResponse<any>> =>
        axiosClient.get('/student/study-hub/flashcards/stats-detail'),

    getFlashcardSubjectCounts: (): Promise<AxiosResponse<Record<string, number>>> =>
        axiosClient.get('/student/study-hub/flashcards/subject-counts'),

    getDueFlashcards: (): Promise<AxiosResponse<{ dueCount: number, dueCards: Flashcard[] }>> =>
        axiosClient.get('/student/study-hub/flashcards/due'),

    /**
     * REVIEW FLASHCARD (SM-2)
     */
    reviewCard: (flashcardId: string, quality: number): Promise<AxiosResponse<{ message: string }>> => {
        return axiosClient.post(`/student/study-hub/flashcards/${flashcardId}/review`, { quality });
    },
    chatWithDocument: (docId: string, message: string): Promise<AxiosResponse<{ answer: string }>> => {
        return axiosClient.post(`/student/study-hub/documents/${docId}/chat`, { message });
    },
    /**
     * TẠO ĐỀ THI TRẮC NGHIỆM AI (HỖ TRỢ ĐA TÀI LIỆU & MA TRẬN)
     */
    generateQuizMatrix: (docIds: string[], matrix: { easy: number, medium: number, hard: number }): Promise<AxiosResponse<any>> => {
        return axiosClient.post(`/student/study-hub/generate-quiz-matrix`, { docIds, matrix });
    },

    /**
     * XÓA TÀI LIỆU
     */
    deleteDocument: (docId: string): Promise<AxiosResponse<any>> => {
        return axiosClient.delete(`/student/study-hub/documents/${docId}`);
    },

    /**
     * TRÒ CHUYỆN TỰ DO VỚI AI (KHÔNG CẦN TÀI LIỆU)
     */
    chatGeneral: (message: string): Promise<AxiosResponse<{ answer: string }>> => {
        return axiosClient.post(`/student/study-hub/chat-general`, { message });
    },

    getExamRooms: (classId: string) =>
        axiosClient.get(`/teacher/study-hub/class-hub/${classId}/exam-rooms`),

    createExamRoom: (classId: string, payload: any) =>
        axiosClient.post(`/teacher/study-hub/class-hub/${classId}/exam-rooms`, payload),

    startExamAttempt: (classId: string, roomId: string) =>
        axiosClient.post(`/student/study-hub/class-hub/${classId}/exam-rooms/${roomId}/start`),

    getAttemptDetails: (attemptId: string) =>
        axiosClient.get(`/student/study-hub/attempts/${attemptId}`),

    saveAnswerDraft: (attemptId: string, questionId: string, answerId: string) =>
        axiosClient.post(`/student/study-hub/attempts/${attemptId}/save-answer`, { questionId, answerId }),

    submitExam: (attemptId: string, payload?: any) =>
        axiosClient.post(`/student/study-hub/attempts/${attemptId}/submit`, payload),

    createPdfExamRoom: (classId: string, formData: FormData) =>
        axiosClient.post(`/teacher/study-hub/class-hub/${classId}/exam-rooms/create-pdf`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    getExamResults: (classId: string, roomId: string) =>
        axiosClient.get(`/teacher/study-hub/class-hub/${classId}/exam-rooms/${roomId}/results`),

    monitorExamRoom: (classId: string, roomId: string) =>
        axiosClient.get(`/teacher/study-hub/class-hub/${classId}/exam-rooms/${roomId}/monitor`),

    getAttemptReview: (attemptId: string) =>
        axiosClient.get(`/student/study-hub/attempts/${attemptId}/review`),

    getPracticeHistory: () =>
        axiosClient.get('/student/study-hub/practice/history'),

    /**
     * GLOBAL SEARCH - TÌM KIẾM TOÀN CẦU
     */
    globalSearch: (query: string, page: number = 0, size: number = 10) =>
        axiosClient.get('/student/study-hub/search', { params: { query, page, size } }),

    /**
     * COMPETENCY ANALYSIS - PHÂN TÍCH HỒ SƠ NĂNG LỰC
     */
    getCompetencyAnalysis: () =>
        axiosClient.get('/student/study-hub/competency-analysis'),

    getDocumentSubjects: () => axiosClient.get('/student/study-hub/documents/subjects'),
};