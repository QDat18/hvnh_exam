import api from './axiosClient'; // File cấu hình axios của bác

export interface CourseClassRequest {
    classCode: string;
    className: string;
    semester: string;
    academicYear: string;
    subjectId: string;
    teacherId?: string;
    maxStudents: number;
}

const courseClassService = {
    // Trưởng khoa tạo lớp mới
    createCourseClass: (data: CourseClassRequest) => {
        return api.post('/faculty-admin/course-classes', data);
    },
    createBulkCourseClasses: (data: { subjectId: string; semester: string; academicYear: string; classCount: number }) => {
        return api.post('/faculty-admin/course-classes/bulk', data);
    },
    // API Sinh viên join lớp (chuẩn bị sẵn cho bước sau)
    joinClass: (joinCode: string) => {
        return api.post('/student/course-classes/join', { joinCode });
    },
    getAllClasses: () => api.get('/faculty-admin/course-classes'),
    updateCourseClass: (id: string, data: any) => {
        return api.put(`/faculty-admin/course-classes/${id}`, data);
    },
    getStudentsInClass: (id: string) => api.get(`/faculty-admin/course-classes/${id}/students`),
};

export default courseClassService;