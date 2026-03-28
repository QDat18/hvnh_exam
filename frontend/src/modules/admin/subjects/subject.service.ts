import axiosClient from '../../../services/axiosClient';
import type { Subject, SubjectPayload, Faculty, Department } from '../../../types/subject.types';

const ENDPOINT = '/subjects';

const subjectService = {
    // 1. Quản lý Môn học
    getAll: async () => {
        return axiosClient.get<Subject[]>(ENDPOINT);
    },

    create: async (payload: SubjectPayload) => {
        return axiosClient.post<Subject>(ENDPOINT, payload);
    },

    update: async (id: string, payload: SubjectPayload) => {
        return axiosClient.put<Subject>(`${ENDPOINT}/${id}`, payload);
    },

    delete: async (id: string) => {
        return axiosClient.delete(`${ENDPOINT}/${id}`);
    },

    // 2. Lấy dữ liệu bổ trợ cho Dropdown
    getAllFaculties: async () => {

        return axiosClient.get<Faculty[]>('/admin/faculties');
    },

    getDepartmentsByFaculty: async (facultyId: string) => {
            return axiosClient.get<Department[]>(`/admin/faculties/${facultyId}/departments`);
    }
};

export default subjectService;