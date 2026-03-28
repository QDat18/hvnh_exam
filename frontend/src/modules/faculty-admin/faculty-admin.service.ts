import axiosClient from '../../services/axiosClient'; 

export interface Department {
    id: string;
    departmentName: string;
}

export interface Teacher {
    id: string;
    fullName: string;
    dateOfBirth: string;
    email: string;
    departmentId?: string;
    departmentName?: string;
    status?: string;
}

export interface FacultyInfo {
    id: string;
    facultyName: string;
    facultyCode: string;
}

export interface AdministrativeClass {
    id: string;
    classCode: string;
    className: string;
    academicYear: string;
    semester: number;
    maxStudents: number;
    advisorTeacherId?: string;
    advisorTeacherName?: string;
}


const facultyAdminService = {

    getMyDepartments: () => {
        return axiosClient.get<Department[]>('/faculty-admin/departments');
    },
    getDepartments: () => axiosClient.get('/faculty-admin/departments'),

    getMyTeachers: () => {
        return axiosClient.get<Teacher[]>('/faculty-admin/teachers');
    },

    getMyFaculty: () => {
        return axiosClient.get<FacultyInfo>('/faculty-admin/my-faculty');
    },

    createTeacher: (data: { fullName: string; email: string; departmentId: string }) => {
        return axiosClient.post('/faculty-admin/teachers', data);
    },

    deleteTeacher: (id: string) => {
        return axiosClient.delete(`/faculty-admin/teachers/${id}`);
    },
    
    updateTeacher: (id: string, data: { fullName: string; email: string; departmentId: string }) => {
        return axiosClient.put(`/faculty-admin/teachers/${id}`, data);
    },

    /**
     * Tạo Bộ môn mới
     */
    createDepartment: (data: { departmentName: string }) => {
        return axiosClient.post('/faculty-admin/departments', data);
    },

    /**
     * Xóa Bộ môn
     */
    deleteDepartment: (id: string) => {
        return axiosClient.delete(`/faculty-admin/departments/${id}`);
    },

    /**
     * Cập nhật Bộ môn
     */
    updateDepartment: (id: string, data: { departmentName: string }) => {
        return axiosClient.put(`/faculty-admin/departments/${id}`, data);
    },

    getClasses: () => axiosClient.get('/faculty-admin/classes'),
    createClass: (data: any) => axiosClient.post('/faculty-admin/classes', data),
    updateClass: (id: string, data: any) => axiosClient.put(`/faculty-admin/classes/${id}`, data),
    deleteClass: (id: string) => axiosClient.delete(`/faculty-admin/classes/${id}`),
    
    // API Thêm sinh viên (Dùng cho Import Excel)
    // addStudentToClass: (classId: string, data: any) => axiosClient.post(`/faculty-admin/classes/${classId}/students`, data),

    getStudentsInClass: (classId: string) => axiosClient.get(`/faculty-admin/classes/${classId}/students`),

    getStudentsByClass: (classId: string) => 
        axiosClient.get(`/faculty-admin/classes/${classId}/students`),
        
    addStudentToClass: (classId: string, studentData: any) => 
        axiosClient.post(`/faculty-admin/classes/${classId}/students`, studentData),
};

export default facultyAdminService;