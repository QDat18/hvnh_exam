import api from './axiosClient';

// 🔥 PHẢI CÓ TỪ KHÓA export Ở ĐÂY
export interface Subject {
    id: string;
    subjectCode: string;
    subjectName: string;
    credits: number;
    departmentName?: string;
    departmentId?: string; // Thêm để dùng cho edit
    facultyName?: string;
    description?: string;
    isActive: boolean;
    subjectGroup: string;
}

const subjectService = {
    getAllSubjects: () => {
        return api.get('/subjects'); 
    },

    getDepartments: () => {
        return api.get('/faculty-admin/departments');
    },

    createSubject: (data: any) => {
        return api.post('/subjects', data);
    },

    updateSubject: (id: string, data: any) => {
        return api.put(`/subjects/${id}`, data);
    },

    deleteSubject: (id: string) => {
        return api.delete(`/subjects/${id}`);
    }
};

export default subjectService;