import React, { useState, useEffect, useMemo, memo } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen, Filter, ShieldAlert, Layers } from 'lucide-react';
import { toast } from 'react-toastify';

// Import Types & Service
import type { Subject, SubjectPayload, Faculty, Department } from '../../../types/subject.types';
import subjectService from './subject.service';

// ── TỐI ƯU 1: Tách Row thành Component riêng với React.memo ──
const SubjectRow = memo(({
    item,
    onEdit,
    onDelete
}: {
    item: Subject;
    onEdit: (s: Subject) => void;
    onDelete: (id: string) => void;
}) => {
    return (
        <tr className="border-bottom transition-all hover-bg-light">
            <td className="ps-4 py-3">
                <span className="fw-bold text-primary bg-primary bg-opacity-10 px-2 py-1 rounded text-nowrap" style={{ fontSize: '0.85rem' }}>
                    {item.subjectCode}
                </span>
            </td>
            <td className="py-3">
                <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{item.subjectName}</div>
                {item.description && <div className="text-muted text-truncate" style={{ fontSize: '0.8rem', maxWidth: '250px' }}>{item.description}</div>}
            </td>
            <td className="py-3 text-center">
                <span className="badge bg-light text-dark border shadow-sm px-2 py-1 fs-6">{item.credits}</span>
            </td>
            <td className="py-3">
                <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{item.departmentName || '—'}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.facultyName || '—'}</div>
            </td>
            <td className="py-3">
                {item.subjectGroup === 'THEORY' && <span className="badge rounded-pill px-3 py-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 600 }}>Lý thuyết</span>}
                {item.subjectGroup === 'PRACTICE' && <span className="badge rounded-pill px-3 py-2" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 600 }}>Thực hành</span>}
                {item.subjectGroup === 'FORMULA' && <span className="badge rounded-pill px-3 py-2" style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '0.75rem', fontWeight: 600 }}>Tính toán</span>}
            </td>
            <td className="py-3">
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.isActive ? '#22c55e' : '#9ca3af' }} />
                    <span className={`fw-semibold ${item.isActive ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                        {item.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                </div>
            </td>
            <td className="text-end pe-4 py-3">
                <div className="d-flex gap-2 justify-content-end">
                    <button className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center transition-all bg-light text-muted hover-bg-primary hover-text-white" style={{ width: 32, height: 32, border: 'none' }} onClick={() => onEdit(item)} title="Chỉnh sửa">
                        <Edit size={15} />
                    </button>
                    <button className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center transition-all bg-light text-muted hover-bg-danger hover-text-white" style={{ width: 32, height: 32, border: 'none' }} onClick={() => onDelete(item.id)} title="Xóa môn học">
                        <Trash2 size={15} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

// ── COMPONENT CHÍNH ──
const SubjectManager = () => {
    // --- STATE DỮ LIỆU ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Tách 2 trạng thái loading để làm Soft Loading
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    // State Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [facultyFilter, setFacultyFilter] = useState(''); // FIX: Thêm state lọc khoa cho Table

    // --- STATE MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [formData, setFormData] = useState<SubjectPayload>({
        subjectCode: '', subjectName: '', credits: 3,
        departmentId: '', description: '', isActive: true, subjectGroup: 'THEORY'
    });
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');

    // --- EFFECT: Load dữ liệu ---
    const fetchInitialData = async (showSoftLoad = false) => {
        if (showSoftLoad) setIsFetching(true);
        else setIsLoading(true);

        try {
            const [subjectsRes, facultiesRes] = await Promise.all([
                subjectService.getAll(),
                subjectService.getAllFaculties()
            ]);
            setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data?.content ?? []);
            setFaculties(Array.isArray(facultiesRes.data) ? facultiesRes.data : []);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải dữ liệu hệ thống");
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    // Load Bộ môn khi đổi Khoa (trong Modal)
    useEffect(() => {
        if (selectedFacultyId) {
            subjectService.getDepartmentsByFaculty(selectedFacultyId)
                .then(res => setDepartments(Array.isArray(res.data) ? res.data : []))
                .catch(() => setDepartments([]));
        } else {
            setDepartments([]);
        }
    }, [selectedFacultyId]);

    // ── TỐI ƯU 2: Memoize bộ lọc tìm kiếm (FIX lỗi search không hoạt động) ──
    const filteredSubjects = useMemo(() => {
        return subjects.filter(subject => {
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = subject.subjectCode.toLowerCase().includes(searchLower) ||
                subject.subjectName.toLowerCase().includes(searchLower);

            // Tìm tên khoa tương ứng với ID đang lọc
            const selectedFacultyObj = faculties.find(f => f.id === facultyFilter);
            const matchFaculty = selectedFacultyObj ? subject.facultyName === selectedFacultyObj.facultyName : true;

            return matchSearch && matchFaculty;
        });
    }, [subjects, searchTerm, facultyFilter, faculties]);

    // --- HANDLERS ---
    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            setIsEditing(true);
            setEditId(subject.id);
            setFormData({
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                credits: subject.credits,
                departmentId: '', // Cần user chọn lại vì BE trả về departmentName
                description: subject.description || '',
                isActive: subject.isActive,
                subjectGroup: subject.subjectGroup
            });
            setSelectedFacultyId('');
        } else {
            setIsEditing(false);
            setEditId(null);
            setFormData({ subjectCode: '', subjectName: '', credits: 3, departmentId: '', description: '', isActive: true, subjectGroup: 'THEORY' });
            setSelectedFacultyId('');
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.departmentId) {
            toast.warning("Vui lòng chọn Bộ môn!");
            return;
        }

        try {
            if (isEditing && editId) {
                await subjectService.update(editId, formData);
                toast.success("Cập nhật thành công!");
            } else {
                await subjectService.create(formData);
                toast.success("Thêm mới thành công!");
            }
            setShowModal(false);
            fetchInitialData(true); // Load lại bảng với hiệu ứng soft load
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) {
            try {
                await subjectService.delete(id);
                toast.success("Đã xóa môn học!");
                fetchInitialData(true); // Load lại bảng
            } catch (error) {
                toast.error("Không thể xóa môn học này!");
            }
        }
    };

    return (
        <div className="animation-fade-in container-fluid py-4 p-0">
            {/* HEADER */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                    <h3 className="fw-extrabold mb-1 d-flex align-items-center gap-2 text-dark">
                        <BookOpen size={26} className="text-primary" /> Quản lý Môn học
                    </h3>
                    <p className="text-muted mb-0">Quản lý danh mục học phần, tín chỉ và bộ môn giảng dạy</p>
                </div>
                <button className="btn btn-primary fw-bold rounded-pill shadow-sm d-flex align-items-center px-4" onClick={() => handleOpenModal()}>
                    <Plus size={18} className="me-2" /> Thêm Môn học
                </button>
            </div>

            {/* FILTER BAR - SaaS Style */}
            <div className="d-flex flex-column flex-lg-row gap-3 mb-4">
                {/* Search Bar */}
                <div className="position-relative" style={{ maxWidth: '400px', width: '100%' }}>
                    <Search className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '16px' }} size={18} />
                    <input
                        type="text"
                        className="form-control rounded-pill border-0 shadow-sm"
                        style={{ paddingLeft: '44px', paddingRight: '20px', height: '48px', backgroundColor: '#fff' }}
                        placeholder="Tìm kiếm theo mã hoặc tên môn..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* FIX: Thêm onChange cho bộ lọc Khoa */}
                <div className="position-relative" style={{ minWidth: '250px' }}>
                    <Filter className="position-absolute top-50 translate-middle-y text-primary" style={{ left: '16px', zIndex: 10 }} size={18} />
                    <select
                        className="form-select rounded-pill border-0 shadow-sm text-dark fw-medium cursor-pointer"
                        style={{ paddingLeft: '44px', height: '48px', backgroundColor: '#fff', appearance: 'none' }}
                        value={facultyFilter}
                        onChange={e => setFacultyFilter(e.target.value)}
                    >
                        <option value="">🏫 Tất cả các Khoa</option>
                        {faculties.map(f => (
                            <option key={f.id} value={f.id}>{f.facultyName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white position-relative">
                {/* THANH TẢI TRẠNG THÁI NGẦM (SOFT LOADING) */}
                {isFetching && !isLoading && (
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '3px', zIndex: 10 }}>
                        <div className="progress w-100 h-100 rounded-0 bg-transparent">
                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100" style={{ animationDuration: '0.8s' }}></div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary border-3" style={{ width: '3rem', height: '3rem' }} />
                        <div className="mt-3 text-muted fw-medium">Đang tải danh sách môn học...</div>
                    </div>
                ) : (
                    <div className={`table-responsive transition-all duration-300 ${isFetching ? 'opacity-50' : ''}`}>
                        <table className="table table-borderless align-middle mb-0">
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <tr>
                                    <th className="ps-4 py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', width: '120px' }}>Mã HP</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Tên môn học</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold text-center" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', width: '80px' }}>TC</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Bộ môn / Khoa</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Nhóm môn</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Trạng thái</th>
                                    <th className="text-end pe-4 py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', width: '100px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <ShieldAlert size={48} className="text-muted opacity-25 mb-3 mx-auto" />
                                            <h6 className="fw-bold text-dark mb-1">Không tìm thấy môn học nào</h6>
                                            <p className="text-muted small mb-0">Thử thay đổi từ khóa hoặc bộ lọc khoa</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map(item => (
                                        <SubjectRow key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleDelete} />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Footer báo cáo số lượng (Tùy chọn) */}
                        <div className="bg-light px-4 py-3 border-top text-muted small fw-medium">
                            Hiển thị {filteredSubjects.length} môn học {facultyFilter ? `thuộc khoa đã chọn` : `trong hệ thống`}.
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FORM (Được làm đẹp) */}
            {showModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}></div>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header bg-white border-bottom px-4 py-3">
                                    <h5 className="modal-title fw-extrabold text-dark d-flex align-items-center">
                                        <Layers size={20} className="text-primary me-2" />
                                        {isEditing ? 'Cập nhật Môn học' : 'Thêm Môn học mới'}
                                    </h5>
                                    <button type="button" className="btn-close shadow-none bg-light rounded-circle p-2" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleSave}>
                                    <div className="modal-body px-4 py-4 bg-light">
                                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
                                            <h6 className="fw-bold mb-3 text-primary">1. Thông tin chung</h6>
                                            <div className="row g-3">
                                                <div className="col-md-3">
                                                    <label className="form-label small fw-bold text-secondary">Mã HP <span className="text-danger">*</span></label>
                                                    <input type="text" className="form-control rounded-3" required placeholder="VD: INT101" value={formData.subjectCode} onChange={e => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })} />
                                                </div>
                                                <div className="col-md-7">
                                                    <label className="form-label small fw-bold text-secondary">Tên môn học <span className="text-danger">*</span></label>
                                                    <input type="text" className="form-control rounded-3" required placeholder="Nhập tên môn học..." value={formData.subjectName} onChange={e => setFormData({ ...formData, subjectName: e.target.value })} />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="form-label small fw-bold text-secondary">Số TC <span className="text-danger">*</span></label>
                                                    <input type="number" className="form-control rounded-3 text-center" min="1" max="10" required value={formData.credits} onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
                                            <h6 className="fw-bold mb-3 text-primary">2. Phân bổ chuyên môn</h6>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold text-secondary">Chọn Khoa quản lý</label>
                                                    <select className="form-select rounded-3" value={selectedFacultyId} onChange={e => { setSelectedFacultyId(e.target.value); setFormData({ ...formData, departmentId: '' }); }}>
                                                        <option value="">-- Lọc theo Khoa --</option>
                                                        {faculties.map(f => <option key={f.id} value={f.id}>{f.facultyName}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold text-danger">Bộ môn phụ trách (*)</label>
                                                    <select className="form-select rounded-3 border-danger-subtle" required value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} disabled={!selectedFacultyId}>
                                                        <option value="">{selectedFacultyId ? '-- Chọn Bộ môn --' : 'Vui lòng chọn Khoa trước'}</option>
                                                        {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                                                    </select>
                                                    {isEditing && !selectedFacultyId && <small className="text-warning mt-1 d-block">⚠️ Vui lòng chọn lại Khoa và Bộ môn do cấu trúc dữ liệu cũ.</small>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card border-0 shadow-sm rounded-4 p-4">
                                            <h6 className="fw-bold mb-3 text-primary">3. Phân loại & Trạng thái</h6>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold text-secondary">Nhóm môn</label>
                                                    <select className="form-select rounded-3" value={formData.subjectGroup} onChange={e => setFormData({ ...formData, subjectGroup: e.target.value })}>
                                                        <option value="THEORY">Lý thuyết</option>
                                                        <option value="PRACTICE">Thực hành</option>
                                                        <option value="FORMULA">Tính toán</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold text-secondary">Trạng thái</label>
                                                    <div className="form-check form-switch mt-2 fs-5">
                                                        <input className="form-check-input cursor-pointer shadow-none" type="checkbox" role="switch" id="statusSwitch" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                                        <label className="form-check-label fs-6 ms-2 cursor-pointer" htmlFor="statusSwitch" style={{ marginTop: '2px' }}>{formData.isActive ? <span className="text-success fw-bold">Đang hoạt động</span> : <span className="text-muted fw-bold">Tạm khóa</span>}</label>
                                                    </div>
                                                </div>
                                                <div className="col-12 mt-4">
                                                    <label className="form-label small fw-bold text-secondary">Mô tả thêm</label>
                                                    <textarea className="form-control rounded-3" rows={2} placeholder="Thông tin chi tiết về môn học (không bắt buộc)..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-white border-top px-4 py-3">
                                        <button type="button" className="btn btn-light rounded-pill px-4 fw-bold text-muted" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm">Lưu Môn học</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Custom Styles */}
            <style>{`
                .hover-bg-primary:hover { background-color: #4f46e5 !important; }
                .hover-bg-danger:hover { background-color: #ef4444 !important; }
                .hover-text-white:hover { color: white !important; }
                .hover-bg-light:hover { background-color: #f8fafc !important; }
                .cursor-pointer { cursor: pointer !important; }
                textarea { resize: none; }
            `}</style>
        </div>
    );
};

export default SubjectManager;