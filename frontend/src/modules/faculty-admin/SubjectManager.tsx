import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Search, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import subjectService, { type Subject } from '../../services/subject.service';

const SubjectManager: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [departments, setDepartments] = useState<any[]>([]); // Danh sách bộ môn
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('ALL');

    // Form States
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [credits, setCredits] = useState<number>(3);
    const [subjectGroup, setSubjectGroup] = useState('THEORY');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [departmentId, setDepartmentId] = useState('');

    useEffect(() => {
        loadSubjects();
        loadDepartments();
    }, []);

    const loadSubjects = async () => {
        setIsLoading(true);
        try {
            const res = await subjectService.getAllSubjects();
            setSubjects(res.data);
        } catch (error) {
            toast.error("❌ Không thể tải danh sách môn học!");
        } finally {
            setIsLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            // Giả sử bác đã thêm hàm getDepartments vào subject.service.ts
            const res = await subjectService.getDepartments();
            setDepartments(res.data);
        } catch (error) {
            console.error("Lỗi tải bộ môn:", error);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSubjectCode('');
        setSubjectName('');
        setCredits(3);
        setSubjectGroup('THEORY');
        setDescription('');
        setIsActive(true);
        setDepartmentId('');
    };

    const openEditModal = (s: Subject) => {
        setEditingId(s.id);
        setSubjectCode(s.subjectCode);
        setSubjectName(s.subjectName);
        setCredits(s.credits);
        setSubjectGroup(s.subjectGroup);
        setDescription(s.description || '');
        setIsActive(s.isActive);
        setDepartmentId(s.departmentId || ''); // 🔥 Dòng này cực kỳ quan trọng
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!departmentId) {
            toast.warning("⚠️ Vui lòng chọn Bộ môn phụ trách!");
            return;
        }

        try {
            const payload = {
                subjectCode,
                subjectName,
                credits,
                subjectGroup,
                description,
                isActive,
                departmentId
            };

            if (editingId) {
                await subjectService.updateSubject(editingId, payload);
                toast.success("✅ Cập nhật môn học thành công!");
            } else {
                await subjectService.createSubject(payload);
                toast.success("🎉 Thêm môn học mới thành công!");
            }
            setShowModal(false);
            loadSubjects();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "❌ Lỗi khi lưu môn học!");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("⚠️ Bạn có chắc chắn muốn ngưng hoạt động môn học này?")) return;
        try {
            await subjectService.deleteSubject(id);
            toast.success("✅ Đã ngưng hoạt động môn học!");
            loadSubjects();
        } catch (error) {
            toast.error("❌ Xóa thất bại!");
        }
    };

    const filteredSubjects = subjects.filter(s => {
        const matchSearch = s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchGroup = filterGroup === 'ALL' || s.subjectGroup === filterGroup;
        return matchSearch && matchGroup;
    });

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h2 className="h3 mb-1 fw-bold text-dark">Quản lý Môn học</h2>
                        <p className="mb-0 text-muted">Danh mục môn học thuộc Khoa</p>
                    </div>
                </div>
                <button 
                    className="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={20} className="me-2" /> Thêm Môn Học
                </button>
            </div>

            {/* Table Card */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white border-bottom p-3">
                    <div className="row g-3">
                        <div className="col-md-8">
                            <div className="position-relative">
                                <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={18} />
                                <input 
                                    type="text" 
                                    className="form-control bg-light border-0 ps-5"
                                    placeholder="Tìm theo mã hoặc tên môn..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select bg-light border-0" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                                <option value="ALL">Tất cả loại hình</option>
                                <option value="THEORY">Lý thuyết</option>
                                <option value="PRACTICE">Thực hành</option>
                                <option value="FORMULA">Bài tập / Công thức</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr className="text-muted small text-uppercase">
                                <th className="px-4 py-3">Mã Môn</th>
                                <th>Tên Môn Học</th>
                                <th className="text-center">Số TC</th>
                                <th>Bộ Môn</th>
                                <th className="text-center">Trạng Thái</th>
                                <th className="text-end px-4">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-5">Đang tải...</td></tr>
                            ) : filteredSubjects.map(s => (
                                <tr key={s.id}>
                                    <td className="px-4 fw-bold text-primary">{s.subjectCode}</td>
                                    <td className="fw-semibold">{s.subjectName}</td>
                                    <td className="text-center">{s.credits}</td>
                                    <td className="small text-muted">
                                        <Building2 size={14} className="me-1"/>
                                        {s.departmentName || '---'}
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge bg-${s.isActive ? 'success' : 'danger'} bg-opacity-10 text-${s.isActive ? 'success' : 'danger'} rounded-pill`}>
                                            {s.isActive ? 'Hoạt động' : 'Khóa'}
                                        </span>
                                    </td>
                                    <td className="text-end px-4">
                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(s)}><Edit2 size={14}/></button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}><Trash2 size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <form className="modal-content border-0 shadow rounded-4" onSubmit={handleSubmit}>
                            <div className="modal-header p-4 border-0">
                                <h5 className="fw-bold mb-0">{editingId ? 'Sửa môn học' : 'Thêm môn học mới'}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 pt-0 row g-3">
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Mã môn học</label>
                                    <input type="text" className="form-control" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} required />
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label small fw-bold">Tên môn học</label>
                                    <input type="text" className="form-control" value={subjectName} onChange={e => setSubjectName(e.target.value)} required />
                                </div>
                                <div className="col-md-12">
                                    <label className="form-label small fw-bold text-primary">Bộ môn phụ trách <span className="text-danger">*</span></label>
                                    <select className="form-select border-primary border-opacity-25" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
                                        <option value="">-- Chọn Bộ môn --</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Số tín chỉ</label>
                                    <input type="number" className="form-control" value={credits} onChange={e => setCredits(Number(e.target.value))} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Nhóm môn</label>
                                    <select className="form-select" value={subjectGroup} onChange={e => setSubjectGroup(e.target.value)}>
                                        <option value="THEORY">Lý thuyết</option>
                                        <option value="PRACTICE">Thực hành</option>
                                        <option value="FORMULA">Công thức</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Trạng thái</label>
                                    <select className="form-select" value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}>
                                        <option value="true">Hoạt động</option>
                                        <option value="false">Ngưng cấp</option>
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label small fw-bold">Mô tả</label>
                                    <textarea className="form-control" rows={2} value={description} onChange={e => setDescription(e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className="modal-footer p-4 border-0">
                                <button type="button" className="btn btn-light px-4" onClick={() => setShowModal(false)}>Đóng</button>
                                <button type="submit" className="btn btn-primary px-4 fw-bold">Lưu môn học</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectManager;