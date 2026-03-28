import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
// Import Service (nhớ thêm chữ type để Vite không báo lỗi)
import facultyAdminService, { type Department } from './faculty-admin.service';

const DepartmentManager: React.FC = () => {
    const { user } = useAuth();
    
    // --- STATE DỮ LIỆU ---
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- STATE FORM (THÊM & SỬA) ---
    const [showModal, setShowModal] = useState(false);
    const [departmentName, setDepartmentName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==========================================
    // CÁC HÀM XỬ LÝ LOGIC
    // ==========================================

    // 1. Tải dữ liệu khi mở trang
    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        setIsLoading(true);
        try {
            const res = await facultyAdminService.getMyDepartments();
            setDepartments(res.data);
        } catch (error) {
            toast.error("Không thể tải danh sách bộ môn.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Mở form Thêm mới
    const openCreateModal = () => {
        setEditingId(null);
        setDepartmentName('');
        setShowModal(true);
    };

    // 3. Mở form Chỉnh sửa
    const openEditModal = (id: string, currentName: string) => {
        setEditingId(id);
        setDepartmentName(currentName);
        setShowModal(true);
    };

    // 4. Xử lý Lưu (Gộp chung logic Thêm mới và Cập nhật)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Gọi API Cập nhật
                await facultyAdminService.updateDepartment(editingId, { departmentName: departmentName.trim() });
                toast.success("Cập nhật Bộ môn thành công!");
            } else {
                // Gọi API Thêm mới
                await facultyAdminService.createDepartment({ departmentName: departmentName.trim() });
                toast.success("Thêm Bộ môn thành công!");
            }
            
            // Tải lại dữ liệu và đóng form
            loadDepartments();
            setShowModal(false);
            setDepartmentName('');
            setEditingId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu bộ môn.");
        }
    };

    // 5. Xử lý Xóa
    const handleDelete = async (id: string, name: string) => {
        if(window.confirm(`Xóa bộ môn ${name}?\nLưu ý: Không thể xóa nếu bộ môn đang có Giảng viên trực thuộc.`)) {
            try {
                await facultyAdminService.deleteDepartment(id);
                toast.success("Xóa bộ môn thành công!");
                setDepartments(prev => prev.filter(d => (d.id || d.departmentId) !== id));
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Không thể xóa bộ môn này.");
            }
        }
    };

    // 6. Lọc dữ liệu tìm kiếm
    const filteredDepartments = departments.filter(d => 
        d.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ==========================================
    // GIAO DIỆN (UI)
    // ==========================================
    return (
        <main className="container-fluid py-4 px-md-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <style>{`
                .premium-card { border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .premium-input { border-radius: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; background: #f8fafc; transition: all 0.2s; }
                .premium-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); outline: none; }
                .btn-premium { border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.2s; }
                .btn-premium:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; }
                .btn-action-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s; background: white; border: 1px solid #e2e8f0; color: #64748b; }
                .btn-action-icon:hover { background: #f1f5f9; color: #0f172a; }
                .btn-action-icon.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
            `}</style>

            <header className="mb-4 d-flex justify-content-between align-items-end">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-2">Cơ cấu Bộ môn</h1>
                    <p className="text-secondary mb-0">Quản lý các bộ môn trực thuộc <strong className="text-primary">{user?.full_name || 'Khoa của bạn'}</strong></p>
                </div>
                {/* Nút Thêm mới gọi hàm openCreateModal */}
                <button className="btn btn-primary btn-premium d-flex align-items-center gap-2 shadow-sm" onClick={openCreateModal}>
                    <Plus size={18} /> Thêm Bộ môn
                </button>
            </header>

            <section className="premium-card overflow-hidden">
                {/* Thanh tìm kiếm */}
                <div className="p-4 border-bottom bg-white d-flex gap-3 align-items-center">
                    <div className="position-relative flex-grow-1" style={{ maxWidth: '400px' }}>
                        <Search size={18} className="position-absolute text-muted" style={{ top: '14px', left: '16px' }} />
                        <input 
                            type="text" 
                            className="premium-input w-100" 
                            style={{ paddingLeft: '44px' }} 
                            placeholder="Tìm kiếm bộ môn..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bảng dữ liệu */}
                <div className="table-responsive bg-white">
                    <table className="table align-middle mb-0 table-hover">
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase small fw-bold">Tên Bộ môn</th>
                                <th className="py-3 text-secondary text-uppercase small fw-bold">Trạng thái</th>
                                <th className="text-end pe-4 py-3 text-secondary text-uppercase small fw-bold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-5 text-primary">
                                        <div className="spinner-border spinner-border-sm me-2"></div> Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-5 text-muted">
                                        <AlertCircle size={32} className="mb-2 opacity-50"/>
                                        <p className="mb-0">Chưa có bộ môn nào.</p>
                                    </td>
                                </tr>
                            ) : filteredDepartments.map(d => {
                                // 🔥 Xử lý an toàn ID (Phòng trường hợp Backend trả về 'departmentId' thay vì 'id')
                                const safeId = (d.id || d.departmentId) as string;
                                
                                return (
                                <tr key={safeId} className="border-bottom">
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                <Layers size={20} />
                                            </div>
                                            <span className="fw-bold text-dark">{d.departmentName}</span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 d-inline-flex align-items-center gap-1">
                                            Hoạt động
                                        </span>
                                    </td>
                                    <td className="text-end pe-4 py-3">
                                        <div className="d-flex justify-content-end gap-2">
                                            {/* Nút Sửa gọi hàm openEditModal */}
                                            <button 
                                                className="btn-action-icon" 
                                                onClick={() => openEditModal(safeId, d.departmentName)} 
                                                aria-label="Sửa"
                                            >
                                                <Edit2 size={14}/>
                                            </button>
                                            
                                            {/* Nút Xóa gọi hàm handleDelete */}
                                            <button 
                                                className="btn-action-icon danger" 
                                                onClick={() => handleDelete(safeId, d.departmentName)} 
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modal Dùng chung cho Thêm & Sửa Bộ môn */}
            {showModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050 }}>
                    <div className="position-absolute w-100 h-100 bg-dark opacity-50" onClick={() => setShowModal(false)}></div>
                    <form className="glass-modal shadow-lg position-relative w-100" style={{ maxWidth: '450px' }} onSubmit={handleSave}>
                        <div className="p-4 border-bottom">
                            <h2 className="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                <Layers className="text-primary" /> 
                                {/* Đổi Tiêu đề dựa trên trạng thái */}
                                {editingId ? 'Chỉnh sửa Bộ môn' : 'Thêm Bộ môn mới'}
                            </h2>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-secondary">Tên bộ môn <span className="text-danger">*</span></label>
                                <input 
                                    type="text" 
                                    className="premium-input w-100" 
                                    placeholder="VD: Hệ thống Thông tin" 
                                    value={departmentName} 
                                    onChange={e => setDepartmentName(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="p-4 pt-2 d-flex justify-content-end gap-2">
                            <button type="button" className="btn btn-light btn-premium text-secondary" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                            <button type="submit" className="btn btn-primary btn-premium">
                                {/* Đổi chữ Nút dựa trên trạng thái */}
                                {editingId ? 'Cập nhật' : 'Lưu Bộ môn'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
};

export default DepartmentManager;