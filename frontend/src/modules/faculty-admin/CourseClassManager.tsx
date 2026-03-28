import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
    BookOpen, Plus, Users, Copy, CheckCircle2, Search, 
    Edit, Trash2, Eye, List as ListIcon, ArrowLeft, Download, Layers, Info, UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import courseClassService from '../../services/course-class.service';
import facultyAdminService from './faculty-admin.service';
import subjectService from '../../services/subject.service';

type ViewMode = 'LIST' | 'CREATE_SINGLE' | 'CREATE_BULK' | 'EDIT';

const CourseClassManager: React.FC = () => {
    // --- DATA STATES ---
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    
    // --- UI STATES ---
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any>(null);

    // --- FORM STATES ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [classCode, setClassCode] = useState('');
    const [className, setClassName] = useState('');
    const [semester, setSemester] = useState('HK1');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [subjectId, setSubjectId] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [maxStudents, setMaxStudents] = useState(70);
    const [quantity, setQuantity] = useState(5); // Số lượng lớp mở hàng loạt
    const [newJoinCode, setNewJoinCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // --- EFFECTS ---
    useEffect(() => { 
        loadData(); 
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [subRes, teachRes, classRes] = await Promise.all([
                subjectService.getAllSubjects(),
                facultyAdminService.getMyTeachers(),
                courseClassService.getAllClasses()
            ]);
            setSubjects(subRes.data);
            setTeachers(teachRes.data);
            setClasses(classRes.data);
        } catch (error) {
            toast.error("Lỗi tải dữ liệu hệ thống!");
        } finally { 
            setIsLoading(false); 
        }
    };

    // Tự động lọc giảng viên theo bộ môn
    useEffect(() => {
        if (subjectId) {
            const sub = subjects.find(s => String(s.id) === String(subjectId));
            if (sub) {
                const matched = teachers.filter(t => String(t.departmentId) === String(sub.departmentId));
                setFilteredTeachers(matched);
            }
        } else {
            setFilteredTeachers([]);
        }
    }, [subjectId, subjects, teachers]);

    // --- HANDLERS ---
    const resetForm = () => {
        setEditingId(null); 
        setClassCode(''); 
        setClassName('');
        setSubjectId(''); 
        setTeacherId(''); 
        setNewJoinCode(null);
        setQuantity(5);
    };

    // Tự động điền Tên môn học vào ô Tên lớp
    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setSubjectId(selectedId);
        if (selectedId && (viewMode === 'CREATE_SINGLE' || viewMode === 'CREATE_BULK')) {
            const sub = subjects.find(s => String(s.id) === selectedId);
            if (sub) setClassName(sub.subjectName); 
        }
    };

    // Đổ dữ liệu khi ấn nút Sửa
    const handleEditClick = (c: any) => {
        setEditingId(c.id);
        setClassCode(c.classCode);
        setClassName(c.className);
        setSemester(c.semester);
        setAcademicYear(c.academicYear);
        setSubjectId(c.subjectId || '');
        setMaxStudents(c.maxStudents);
        // Delay 100ms để danh sách giảng viên kịp lọc theo subjectId
        setTimeout(() => setTeacherId(c.teacherId || ''), 100);
        setViewMode('EDIT');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // 🔥 FIX LỖI ÉP KIỂU UUID: Nếu rỗng thì phải chuyển thành null
            const finalTeacherId = teacherId && teacherId !== '' ? teacherId : null;

            if (viewMode === 'EDIT' && editingId) {
                await courseClassService.updateCourseClass(editingId, { 
                    classCode, className, semester, academicYear, subjectId, teacherId: finalTeacherId, maxStudents 
                });
                toast.success("Cập nhật lớp thành công!");
                setViewMode('LIST');
            } else if (viewMode === 'CREATE_BULK') {
                await courseClassService.createBulkCourseClasses({ 
                    subjectId, baseClassName: className, semester, academicYear, quantity, maxStudents 
                });
                toast.success(`Đã mở tự động ${quantity} lớp thành công!`);
                setViewMode('LIST'); 
            } else {
                const res = await courseClassService.createCourseClass({ 
                    classCode, className, semester, academicYear, subjectId, teacherId: finalTeacherId, maxStudents 
                });
                setNewJoinCode(res.data.joinCode);
                toast.success("Mở lớp học phần thành công!");
            }
            loadData();
        } catch (error: any) {
            // 🔥 In lỗi ra màn hình để Trưởng khoa biết vì sao lỗi
            const errorMsg = error.response?.data?.message || "Thao tác thất bại!";
            toast.error(errorMsg);
            console.error("Chi tiết lỗi từ Backend:", error.response); // In ra Console F12 để dev dễ bắt bệnh
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học phần này?")) return;
        try {
            await courseClassService.deleteClass(id);
            toast.success("Đã xóa lớp thành công!");
            loadData();
        } catch (error) {
            toast.error("Xóa thất bại!");
        }
    };

    const handleViewStudents = async (c: any) => {
        setSelectedClass(c);
        try {
            const res = await courseClassService.getStudentsInClass(c.id);
            setStudents(res.data);
            setShowStudentModal(true);
        } catch (error) { 
            toast.error("Không thể tải danh sách sinh viên!"); 
        }
    };

    const exportToExcel = () => {
        if (students.length === 0) {
            toast.warning("Lớp chưa có sinh viên để xuất!");
            return;
        }
        const data = students.map((s, i) => ({
            "STT": i + 1, 
            "Mã SV": s.studentCode, 
            "Họ Tên": s.fullName, 
            "Email": s.email, 
            "Ngày tham gia": s.joinDate !== "N/A" ? new Date(s.joinDate).toLocaleDateString('vi-VN') : "N/A"
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachSV");
        XLSX.writeFile(wb, `Danh_sach_lop_${selectedClass?.classCode}.xlsx`);
        toast.success("Xuất file Excel thành công!");
    };

    const handleCopyCode = () => {
        if (newJoinCode) {
            navigator.clipboard.writeText(newJoinCode);
            setCopied(true);
            toast.success("Đã copy mã tham gia!");
            setTimeout(() => setCopied(false), 3000);
        }
    };

    // --- RENDER ---
    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1 d-flex align-items-center">
                        <BookOpen className="me-3 text-primary" size={32} /> 
                        Quản lý Lớp Học Phần
                    </h2>
                    <p className="text-muted small mb-0">Hệ thống quản lý đào tạo & tổ chức thi</p>
                </div>
                <div className="btn-group shadow-sm">
                    <button className={`btn ${viewMode==='LIST'?'btn-primary':'btn-white border'}`} onClick={()=>setViewMode('LIST')}>
                        <ListIcon size={18} className="me-2"/>Danh sách
                    </button>
                    <button className={`btn ${viewMode==='CREATE_SINGLE'?'btn-primary':'btn-white border'}`} onClick={()=>{resetForm(); setViewMode('CREATE_SINGLE')}}>
                        <Plus size={18} className="me-2"/>Mở lớp đơn
                    </button>
                    <button className={`btn ${viewMode==='CREATE_BULK'?'btn-primary':'btn-white border'}`} onClick={()=>{resetForm(); setViewMode('CREATE_BULK')}}>
                        <Layers size={18} className="me-2"/>Mở lớp hàng loạt
                    </button>
                </div>
            </div>

            {viewMode === 'LIST' ? (
                /* --- DANH SÁCH LỚP --- */
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="p-3 border-bottom bg-white d-flex gap-3">
                        <div className="position-relative flex-grow-1">
                            <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={18} />
                            <input 
                                type="text" 
                                className="form-control bg-light border-0 ps-5" 
                                placeholder="Tìm kiếm theo mã lớp hoặc tên lớp..." 
                                value={searchTerm} 
                                onChange={e=>setSearchTerm(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-muted small fw-bold">
                                <tr>
                                    <th className="ps-4 py-3">MÃ LỚP / TÊN LỚP</th>
                                    <th>MÔN HỌC / GIẢNG VIÊN</th>
                                    <th className="text-center">JOIN CODE</th>
                                    <th className="text-center">SĨ SỐ</th>
                                    <th className="text-end pe-4">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.filter(c => c.className.toLowerCase().includes(searchTerm.toLowerCase()) || c.classCode.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                                    <tr key={c.id}>
                                        <td className="ps-4">
                                            <div className="fw-bold text-dark">{c.classCode}</div>
                                            <div className="small text-muted">{c.className}</div>
                                        </td>
                                        <td>
                                            <div className="fw-semibold text-primary">{c.subjectName}</div>
                                            <div className="small text-muted">{c.teacherName || "Chưa phân công"}</div>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-light text-primary border border-primary border-opacity-25 px-2 py-1 fs-6">
                                                {c.joinCode}
                                            </span>
                                        </td>
                                        <td className="text-center fw-bold">{c.currentStudents || 0}/{c.maxStudents}</td>
                                        <td className="text-end pe-4">
                                            <button className="btn btn-sm btn-light border text-info me-2" onClick={()=>handleViewStudents(c)} title="Xem danh sách SV">
                                                <Eye size={16}/>
                                            </button>
                                            <button className="btn btn-sm btn-light border text-primary me-2" onClick={()=>handleEditClick(c)} title="Chỉnh sửa">
                                                <Edit size={16}/>
                                            </button>
                                            <button className="btn btn-sm btn-light border text-danger" onClick={()=>handleDelete(c.id)} title="Xóa lớp">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {classes.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-muted">
                                            Chưa có lớp học phần nào được tạo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* --- BIỂU MẪU (TẠO/SỬA) --- */
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-header bg-white border-bottom p-4">
                                <h5 className="mb-0 fw-bold">
                                    {viewMode==='EDIT' ? 'Chỉnh sửa lớp học phần' : viewMode==='CREATE_BULK' ? 'Mở lớp hàng loạt' : 'Mở lớp học phần mới'}
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                <form onSubmit={handleSubmit} className="row g-3">
                                    
                                    {/* Alert Thông tin tự động hóa (Chỉ hiện ở BULK) */}
                                    {viewMode === 'CREATE_BULK' && (
                                        <div className="col-12 mb-2">
                                            <div className="alert alert-info border-0 shadow-sm d-flex align-items-start">
                                                <Info size={24} className="me-3 mt-1 text-info flex-shrink-0" />
                                                <div>
                                                    <strong className="d-block mb-1">Hệ thống sẽ tự động thực hiện:</strong>
                                                    <ul className="mb-0 ps-3 small">
                                                        <li>Sinh mã lớp theo chuẩn: <strong>{new Date().getFullYear() % 100}[Mã Môn]A[STT]</strong> (VD: 26IS16A01)</li>
                                                        <li>Tự động gắn thêm hậu tố <strong>" - Nhóm 1, 2, 3..."</strong> vào sau Tên lớp.</li>
                                                        <li><strong>Phân công xoay vòng (Round-Robin)</strong> đều các Giảng viên trong Bộ môn vào từng lớp.</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-md-12">
                                        <label className="form-label fw-bold small">Môn học <span className="text-danger">*</span></label>
                                        <select className="form-select" value={subjectId} onChange={handleSubjectChange} required>
                                            <option value="">-- Chọn môn học --</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                                        </select>
                                    </div>

                                    {/* Không hiện chọn Giảng viên khi chạy BULK */}
                                    {viewMode !== 'CREATE_BULK' && (
                                        <div className="col-md-12">
                                            <label className="form-label fw-bold small">Giảng viên phụ trách</label>
                                            <select className="form-select" value={teacherId} onChange={e=>setTeacherId(e.target.value)}>
                                                <option value="">-- Chưa phân công (Chọn giảng viên cùng bộ môn) --</option>
                                                {filteredTeachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {/* Không hiện nhập Mã lớp khi chạy BULK */}
                                    {viewMode !== 'CREATE_BULK' && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small">Mã lớp học phần <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" placeholder="VD: IT101_N01" value={classCode} onChange={e=>setClassCode(e.target.value)} required />
                                        </div>
                                    )}

                                    <div className={`col-md-${viewMode === 'CREATE_BULK' ? '12' : '6'}`}>
                                        <label className="form-label fw-bold small">
                                            {viewMode==='CREATE_BULK' ? 'Tên gốc môn học (Hệ thống tự động nối " - Nhóm x") *' : 'Tên lớp học phần *'}
                                        </label>
                                        <input type="text" className="form-control" placeholder="VD: Lập trình cơ bản" value={className} onChange={e=>setClassName(e.target.value)} required />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small">Học kỳ</label>
                                        <select className="form-select" value={semester} onChange={e=>setSemester(e.target.value)}>
                                            <option value="HK1">Học kỳ 1</option>
                                            <option value="HK2">Học kỳ 2</option>
                                            <option value="HK3">Học kỳ Phụ</option>
                                        </select>
                                    </div>
                                    
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small">Năm học</label>
                                        <input type="text" className="form-control" value={academicYear} onChange={e=>setAcademicYear(e.target.value)} required />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-bold small">Sĩ số tối đa</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light"><Users size={16}/></span>
                                            <input type="number" className="form-control" value={maxStudents} onChange={e=>setMaxStudents(Number(e.target.value))} min={1} required />
                                        </div>
                                    </div>

                                    {/* Nhập số lượng nhóm lớp chỉ hiện khi chạy BULK */}
                                    {viewMode === 'CREATE_BULK' && (
                                        <div className="col-md-12 mt-4">
                                            <label className="form-label fw-bold text-primary small">Số lượng nhóm lớp cần mở đồng loạt <span className="text-danger">*</span></label>
                                            <input 
                                                type="number" 
                                                className="form-control form-control-lg border-primary text-primary fw-bold bg-primary bg-opacity-10" 
                                                value={quantity} 
                                                onChange={e=>setQuantity(Number(e.target.value))} 
                                                min={1} max={50} required 
                                            />
                                        </div>
                                    )}

                                    <div className="col-12 mt-4 text-end">
                                        <button type="button" className="btn btn-light border me-2 px-4 fw-bold" onClick={()=>setViewMode('LIST')}>
                                            Hủy bỏ
                                        </button>
                                        <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={isLoading || (viewMode !== 'CREATE_BULK' && !classCode && !className)}>
                                            {isLoading ? "Đang xử lý..." : viewMode==='EDIT' ? 'Lưu cập nhật' : viewMode==='CREATE_BULK' ? `Xác nhận mở ${quantity} lớp` : 'Tạo Lớp & Lấy Join Code'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Join Code Display Card (Chỉ hiện khi tạo đơn có Join Code hoặc trạng thái chờ) */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-primary bg-gradient text-white p-4 d-flex flex-column justify-content-center align-items-center text-center">
                            {newJoinCode ? (
                                <div className="animation-fade-in w-100">
                                    <h6 className="text-white-50 small mb-3 fw-bold">🎉 TẠO LỚP THÀNH CÔNG!</h6>
                                    <p className="mb-2 small">Mã tham gia lớp học (Join Code)</p>
                                    <div className="bg-white text-primary rounded-4 py-3 px-4 shadow-lg d-inline-block mb-4 border border-4 border-light w-100">
                                        <h1 className="display-5 fw-bold mb-0 tracking-widest">{newJoinCode}</h1>
                                    </div>
                                    <button 
                                        className={`btn ${copied ? 'btn-success' : 'btn-light text-primary'} w-100 rounded-pill fw-bold shadow-sm`} 
                                        onClick={handleCopyCode}
                                    >
                                        {copied ? <><CheckCircle2 size={18} className="me-2"/> Đã Copy</> : <><Copy size={18} className="me-2"/> Copy mã gửi sinh viên</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="opacity-50">
                                    {viewMode === 'CREATE_BULK' ? <Layers size={70} className="mb-3 mx-auto" /> : <BookOpen size={70} className="mb-3 mx-auto" />}
                                    <h5 className="fw-bold">{viewMode === 'CREATE_BULK' ? 'Mở lớp hàng loạt' : 'Mã Tham Gia'}</h5>
                                    <p className="small">
                                        {viewMode === 'CREATE_BULK' 
                                            ? 'Sau khi xử lý xong, hệ thống sẽ tự động chuyển về danh sách lớp.' 
                                            : 'Mã dành cho sinh viên sẽ xuất hiện ở đây sau khi bạn tạo lớp thành công.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL HIỂN THỊ DANH SÁCH SINH VIÊN --- */}
            {showStudentModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-dark text-white p-4">
                                <div>
                                    <h5 className="modal-title fw-bold">Danh sách sinh viên</h5>
                                    <small className="opacity-75">Lớp: {selectedClass?.className} ({selectedClass?.classCode})</small>
                                </div>
                                <button className="btn-close btn-close-white" onClick={()=>setShowStudentModal(false)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="p-3 bg-light d-flex justify-content-between align-items-center border-bottom">
                                    <span className="fw-bold text-dark d-flex align-items-center">
                                        <UserCheck size={18} className="me-2 text-primary"/> Sĩ số: {students.length} / {selectedClass?.maxStudents} SV
                                    </span>
                                    <button className="btn btn-success btn-sm fw-bold shadow-sm" onClick={exportToExcel} disabled={students.length === 0}>
                                        <Download size={16} className="me-2"/> Xuất Excel
                                    </button>
                                </div>
                                <div className="table-responsive" style={{ maxHeight: '60vh' }}>
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light small fw-bold text-muted sticky-top">
                                            <tr>
                                                <th className="ps-4">Mã SV</th>
                                                <th>Họ và Tên</th>
                                                <th>Email</th>
                                                <th className="text-end pe-4">Ngày tham gia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.length > 0 ? students.map(s => (
                                                <tr key={s.studentId}>
                                                    <td className="ps-4 fw-bold text-primary">{s.studentCode}</td>
                                                    <td className="fw-semibold">{s.fullName}</td>
                                                    <td className="text-muted small">{s.email}</td>
                                                    <td className="text-end pe-4 small">
                                                        {s.joinDate !== "N/A" ? new Date(s.joinDate).toLocaleDateString('vi-VN') : "N/A"}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-5 text-muted">
                                                        <Users size={40} className="mb-2 opacity-25" />
                                                        <p className="mb-0">Chưa có sinh viên nào tham gia lớp này.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer bg-light p-3 border-0">
                                <button className="btn btn-secondary px-4 fw-bold rounded-3" onClick={()=>setShowStudentModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .tracking-widest { letter-spacing: 0.15em; }
                .animation-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

export default CourseClassManager;