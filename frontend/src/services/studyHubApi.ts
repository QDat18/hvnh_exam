import { type AxiosResponse } from 'axios';
// Bác nhớ trỏ đúng đường dẫn tới file axiosClient nhé
import axiosClient from './axiosClient'; 
import { type StudentDocument, type Flashcard, type DocumentStatusResponse } from '../types/study';

export const studyHubApi = {
    /**
     * TẢI TÀI LIỆU
     */
    uploadDocument: (file: File, subjectId: string, type: string = 'TEXTBOOK'): Promise<AxiosResponse<{document: StudentDocument}>> => {
        
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
            }
        });
    },

    getMyClasses: (): Promise<AxiosResponse<any>> => {
        return axiosClient.get('/student/study-hub/my-classes');
    },

    getAvailableSubjects: () => {
        return axiosClient.get('/student/study-hub/practice/subjects');
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
        
        // 🔥 Đã thêm '/study-hub' vào đường dẫn để khớp 100% với Backend
        return axiosClient.post('/teacher/study-hub/upload-material', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
     /**
     * LẤY DANH SÁCH TÀI LIỆU
     */
    getDocuments: (subjectId?: string): Promise<AxiosResponse<{documents: StudentDocument[]}>> => 
        axiosClient.get('/student/study-hub/documents', { params: { subjectId } }),

    /**
     * KIỂM TRA TRẠNG THÁI AI
     */
    getStatus: (docId: string): Promise<AxiosResponse<DocumentStatusResponse>> => 
        axiosClient.get(`/student/study-hub/documents/${docId}/status`),

    /**
     * LẤY DANH SÁCH FLASHCARD
     */
    getFlashcards: (documentId: string): Promise<AxiosResponse<{flashcards: Flashcard[]}>> => 
        axiosClient.get('/student/study-hub/flashcards', { params: { documentId } }),

    /**
     * REVIEW FLASHCARD (SM-2)
     */
    reviewCard: (flashcardId: string, quality: number): Promise<AxiosResponse<{message: string}>> => {
        return axiosClient.post(`/student/study-hub/flashcards/${flashcardId}/review`, { quality });
    },
    chatWithDocument: (docId: string, message: string): Promise<AxiosResponse<{answer: string}>> => {
        return axiosClient.post(`/student/study-hub/documents/${docId}/chat`, { message });
    },
    /**
     * TẠO ĐỀ THI TRẮC NGHIỆM AI (HỖ TRỢ ĐA TÀI LIỆU & MA TRẬN)
     */
    generateQuizMatrix: (docIds: string[], matrix: {easy: number, medium: number, hard: number}): Promise<AxiosResponse<any>> => {
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
    chatGeneral: (message: string): Promise<AxiosResponse<{answer: string}>> => {
        return axiosClient.post(`/student/study-hub/chat-general`, { message });
    },

    getExamRooms: (classId: string) => 
        axiosClient.get(`/teacher/study-hub/class-hub/${classId}/exam-rooms`),

    // 2. Giảng viên tạo phòng thi
    createExamRoom: (classId: string, payload: any) => 
        axiosClient.post(`/teacher/study-hub/class-hub/${classId}/exam-rooms`, payload),

    // 3. Sinh viên bắt đầu vào thi
    startExamAttempt: (classId: string, roomId: string) => 
        axiosClient.post(`/student/study-hub/class-hub/${classId}/exam-rooms/${roomId}/start`),

    getAttemptDetails: (attemptId: string) => 
        axiosClient.get(`/student/study-hub/attempts/${attemptId}`),

    // Lưu nháp đáp án realtime
    saveAnswerDraft: (attemptId: string, questionId: string, answerId: string) => 
        axiosClient.post(`/student/study-hub/attempts/${attemptId}/save-answer`, { questionId, answerId }),

    submitExam: (attemptId: string, payload?: any) => 
        axiosClient.post(`/student/study-hub/attempts/${attemptId}/submit`, payload),

    createPdfExamRoom: (classId: string, formData: FormData) => 
        axiosClient.post(`/teacher/study-hub/class-hub/${classId}/exam-rooms/create-pdf`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
    }),
    // Cập nhật lại hàm này trong file studyHubApi.ts
    getExamResults: (classId: string, roomId: string) => 
        axiosClient.get(`/teacher/study-hub/class-hub/${classId}/exam-rooms/${roomId}/results`),
    
    // 🔥 MONITOR EXAM REAL-TIME
    monitorExamRoom: (classId: string, roomId: string) => 
        axiosClient.get(`/teacher/study-hub/class-hub/${classId}/exam-rooms/${roomId}/monitor`),

    
    getAttemptReview: (attemptId: string) =>
        axiosClient.get(`/student/study-hub/attempts/${attemptId}/review`),
};