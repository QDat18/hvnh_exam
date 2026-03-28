import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen, X, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

// Import Types & Service
import type { Subject, SubjectPayload, Faculty, Department } from '../../../types/subject.types';
import subjectService from './subject.service';

const SubjectManager = () => {
    // --- STATE DỮ LIỆU ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]); // List Khoa
    const [departments, setDepartments] = useState<Department[]>([]); // List Bộ môn (theo khoa chọn)
    
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATE MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState<SubjectPayload>({
        subjectCode: '',
        subjectName: '',
        credits: 3,
        departmentId: '',
        description: '',
        isActive: true,
        subjectGroup: 'THEORY'
    });

    // State riêng để quản lý Dropdown Khoa trong Modal (Dùng để filter bộ môn)
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');

    // --- EFFECT 1: Load dữ liệu ban đầu ---
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Gọi song song 2 API: Lấy môn học & Lấy danh sách khoa
            const [subjectsRes, facultiesRes] = await Promise.all([
                subjectService.getAll(),
                subjectService.getAllFaculties()
            ]);

            // axios trả về AxiosResponse, lấy .data để có array thật
            setSubjects(Array.isArray(subjectsRes.data)  ? subjectsRes.data  : subjectsRes.data?.content ?? []);
            setFaculties(Array.isArray(facultiesRes.data) ? facultiesRes.data : []);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải dữ liệu hệ thống");
        } finally {
            setIsLoading(false);
        }
    };

    // --- EFFECT 2: Khi chọn Khoa -> Load Bộ môn tương ứng ---
    useEffect(() => {
        if (selectedFacultyId) {
            const fetchDepts = async () => {
                try {
                    const res = await subjectService.getDepartmentsByFaculty(selectedFacultyId);
                    setDepartments(Array.isArray(res.data) ? res.data : []);
                } catch (error) {
                    console.error(error);
                    setDepartments([]);
                }
            };
            fetchDepts();
        } else {
            setDepartments([]);
        }
    }, [selectedFacultyId]);

    // --- HANDLERS ---
    const handleOpenModal = (subject?: Subject) => {
        if (subject) {
            // Chế độ EDIT
            setIsEditing(true);
            setEditId(subject.id);
            setFormData({
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                credits: subject.credits,
                departmentId: '', // Lưu ý: Backend trả về Name, nhưng sửa cần Id. Logic này cần mapping lại nếu BE không trả departmentId
                description: subject.description || '',
                isActive: subject.isActive,
                subjectGroup: subject.subjectGroup
            });
            // Lưu ý: Việc set selectedFacultyId để hiển thị đúng bộ môn cũ khá phức tạp nếu không có facultyId trong subject
            // Tạm thời để trống hoặc yêu cầu user chọn lại
        } else {
            // Chế độ ADD
            setIsEditing(false);
            setEditId(null);
            setFormData({
                subjectCode: '', subjectName: '', credits: 3,
                departmentId: '', description: '', isActive: true, subjectGroup: 'THEORY'
            });
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
            fetchInitialData(); // Load lại bảng
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) {
            try {
                await subjectService.delete(id);
                toast.success("Đã xóa môn học!");
                fetchInitialData();
            } catch (error) {
                toast.error("Không thể xóa môn học này!");
            }
        }
    };

    return (
        <div className="container-fluid p-0">
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-primary mb-1">Quản lý Môn học</h4>
                    <p className="text-muted small mb-0">Quản lý danh mục học phần, tín chỉ và bộ môn</p>
                </div>
                <button className="btn btn-warning fw-bold text-primary shadow-sm" onClick={() => handleOpenModal()}>
                    <Plus size={18} className="me-2"/> Thêm mới
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><Search size={16} className="text-muted"/></span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0 ps-0 shadow-none" 
                                    placeholder="Tìm kiếm môn học..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select shadow-none">
                                <option value="">Tất cả Khoa</option>
                                {faculties.map(f => (
                                    <option key={f.id} value={f.id}>{f.facultyName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-primary">
                                <tr>
                                    <th className="ps-4">Mã HP</th>
                                    <th>Tên môn học</th>
                                    <th>TC</th>
                                    <th>Bộ môn / Khoa</th>
                                    <th>Loại</th>
                                    <th>Trạng thái</th>
                                    <th className="text-end pe-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map(item => (
                                    <tr key={item.id}>
                                        <td className="ps-4 fw-bold text-primary">{item.subjectCode}</td>
                                        <td className="fw-bold text-dark">{item.subjectName}</td>
                                        <td><span className="badge bg-light text-dark border">{item.credits}</span></td>
                                        <td>
                                            <div className="small fw-bold">{item.departmentName}</div>
                                            <div className="x-small text-muted">{item.facultyName}</div>
                                        </td>
                                        <td>
                                            {item.subjectGroup === 'THEORY' && <span className="badge bg-info-subtle text-info border border-info-subtle">Lý thuyết</span>}
                                            {item.subjectGroup === 'PRACTICE' && <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Thực hành</span>}
                                        </td>
                                        <td>
                                            {item.isActive 
                                                ? <span className="badge bg-success-subtle text-success border border-success-subtle">Hoạt động</span>
                                                : <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Đã khóa</span>
                                            }
                                        </td>
                                        <td className="text-end pe-4">
                                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenModal(item)}>
                                                <Edit size={16}/>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL FORM */}
            {showModal && (
                <>
                    <div className="modal-backdrop show"></div>
                    <div className="modal show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title fw-bold">
                                        {isEditing ? 'Cập nhật Môn học' : 'Thêm Môn học mới'}
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                </div>
                                <form onSubmit={handleSave}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            {/* Cột 1: Mã & Tên & TC */}
                                            <div className="col-md-3">
                                                <label className="form-label small fw-bold">Mã HP</label>
                                                <input type="text" className="form-control" required 
                                                    value={formData.subjectCode}
                                                    onChange={e => setFormData({...formData, subjectCode: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-md-7">
                                                <label className="form-label small fw-bold">Tên môn học</label>
                                                <input type="text" className="form-control" required 
                                                    value={formData.subjectName}
                                                    onChange={e => setFormData({...formData, subjectName: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small fw-bold">Số TC</label>
                                                <input type="number" className="form-control" min="1" max="10" required 
                                                    value={formData.credits}
                                                    onChange={e => setFormData({...formData, credits: Number(e.target.value)})}
                                                />
                                            </div>

                                            {/* Cột 2: Chọn Khoa -> Chọn Bộ Môn */}
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-primary">Chọn Khoa</label>
                                                <select 
                                                    className="form-select" 
                                                    value={selectedFacultyId}
                                                    onChange={e => {
                                                        setSelectedFacultyId(e.target.value);
                                                        setFormData({...formData, departmentId: ''}); // Reset bộ môn khi đổi khoa
                                                    }}
                                                >
                                                    <option value="">-- Chọn Khoa --</option>
                                                    {faculties.map(f => (
                                                        <option key={f.id} value={f.id}>{f.facultyName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-danger">Chọn Bộ môn (*)</label>
                                                <select 
                                                    className="form-select" 
                                                    required
                                                    value={formData.departmentId}
                                                    onChange={e => setFormData({...formData, departmentId: e.target.value})}
                                                    disabled={!selectedFacultyId} // Khóa nếu chưa chọn Khoa
                                                >
                                                    <option value="">-- Chọn Bộ môn --</option>
                                                    {departments.map(d => (
                                                        <option key={d.id} value={d.id}>{d.departmentName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Cột 3: Loại & Trạng thái */}
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Nhóm môn</label>
                                                <select 
                                                    className="form-select"
                                                    value={formData.subjectGroup}
                                                    onChange={e => setFormData({...formData, subjectGroup: e.target.value})}
                                                >
                                                    <option value="THEORY">Lý thuyết</option>
                                                    <option value="PRACTICE">Thực hành</option>
                                                    <option value="FORMULA">Tính toán</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Trạng thái</label>
                                                <div className="form-check form-switch mt-2">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={formData.isActive}
                                                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                                    />
                                                    <label className="form-check-label">{formData.isActive ? 'Đang hoạt động' : 'Tạm khóa'}</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label small fw-bold">Mô tả thêm</label>
                                                <textarea 
                                                    className="form-control" 
                                                    rows={3}
                                                    value={formData.description}
                                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                                        <button type="submit" className="btn btn-primary fw-bold">Lưu thông tin</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SubjectManager;