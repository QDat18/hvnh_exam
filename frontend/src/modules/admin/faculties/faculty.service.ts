import axiosClient from '../../../services/axiosClient';

export interface Faculty {
    id: string;
    facultyCode: string;
    facultyName: string;
    adminEmail?: string;
}

export interface Department {
    id: string;
    departmentName: string;
    facultyId: string;
}

const facultyService = {
    // ADMIN: quan ly khoa
    getAllFaculties:     ()                        => axiosClient.get<Faculty[]>('/admin/faculties'),
    createFaculty:      (data: any)               => axiosClient.post('/admin/faculties', data),
    updateFaculty:      (id: string, data: any)   => axiosClient.put(`/admin/faculties/${id}`, data),
    deleteFaculty:      (id: string)              => axiosClient.delete(`/admin/faculties/${id}`),
    resetAdminPassword: (id: string)              => axiosClient.post(`/admin/faculties/${id}/reset-admin-password`),

    // ADMIN: lay departments cua 1 khoa cu the (truyen facultyId)
    // Fix loi 400: faculty-admin/departments lay tu JWT nen ADMIN khong dung duoc
    getDepartmentsByFaculty: (facultyId: string) =>
        axiosClient.get<Department[]>(`/admin/faculties/${facultyId}/departments`),

    // FACULTY_ADMIN: quan ly bo mon cua khoa minh (lay facultyId tu JWT phia backend)
    getMyDepartments: () =>
        axiosClient.get<Department[]>('/faculty-admin/departments'),

    createDepartment: (data: any) =>
        axiosClient.post('/faculty-admin/departments', data),

    deleteDepartment: (id: string) =>
        axiosClient.delete(`/faculty-admin/departments/${id}`),
};

export default facultyService;