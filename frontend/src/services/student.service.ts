import axiosClient from './axiosClient';

const studentService = {
  // 1. Tab Lớp học
  getMyClasses: () => {
    return axiosClient.get('/student/study-hub/my-classes');
  },

  // 2. Tab Tự luyện
  getAllSubjects: () => {
    return axiosClient.get('/subjects'); // Lấy danh sách môn học
  },
  generatePractice: (subjectId: string, limit: number, difficulty: string) => {
    // Gọi API bốc đề ngẫu nhiên ta đã viết ở Backend
    return axiosClient.get(`/exams/practice?subjectId=${subjectId}&limit=${limit}&difficulty=${difficulty}`);
  },

  // 3. Phòng thi
  getExamDetails: (examId: string) => {
    return axiosClient.get(`/exams/${examId}`);
  },
  submitExam: (examId: string, answers: any) => {
    return axiosClient.post(`/exams/${examId}/submit`, { answers });
  }
};

export default studentService;