import React, { useEffect, useState } from 'react';
import type { Subject } from '../types/subject.types';
import { subjectService } from '../services/subjectService';
import SubjectModal from '../components/subjects/SubjectModal';

const SubjectManager: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    // Load data
    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const data = await subjectService.getAllSubjects();
            setSubjects(data);
        } catch (error) {
            console.error("Lỗi load môn học:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    // Handlers
    const handleAddNew = () => {
        setEditingSubject(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sub: Subject) => {
        setEditingSubject(sub);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bạn có chắc muốn xóa môn học này?")) {
            try {
                await subjectService.deleteSubject(id);
                fetchSubjects(); // Load lại bảng
            } catch (error) {
                alert("Không thể xóa (có thể môn học đã có dữ liệu thi)");
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Môn học</h1>
                <button 
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                    + Thêm Môn học
                </button>
            </div>

            {/* Bảng dữ liệu */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Môn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số TC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa / Bộ môn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
                        ) : subjects.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4 text-gray-500">Chưa có môn học nào.</td></tr>
                        ) : (
                            subjects.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{sub.subjectCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{sub.subjectName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">{sub.credits}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">{sub.facultyName}</div>
                                        <div className="text-xs text-gray-500">{sub.departmentName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {sub.isActive ? 'Đang mở' : 'Đã đóng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(sub)} className="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button>
                                        <button onClick={() => handleDelete(sub.id)} className="text-red-600 hover:text-red-900">Xóa</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            <SubjectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={fetchSubjects}
                initialData={editingSubject}
            />
        </div>
    );
};

export default SubjectManager;