import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Edit2, Trash2, UploadCloud, Download, BookOpen, Search, Filter, Eye, UserPlus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import facultyAdminService, { type AdministrativeClass, type Teacher } from './faculty-admin.service';

const ClassManager: React.FC = () => {
    // --- States Lớp học ---
    const [classes, setClasses] = useState<AdministrativeClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- States Modal Lớp học ---
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [classForm, setClassForm] = useState({ classCode: '', className: '', academicYear: '2024-2028', semester: 1, maxStudents: 50, advisorTeacherId: '' });

    // --- States Modal Sinh Viên (MỚI) ---
    const [showStudentListModal, setShowStudentListModal] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [currentClassStudents, setCurrentClassStudents] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form thêm sinh viên thủ công
    const [showAddStudentForm, setShowAddStudentForm] = useState(false);
    const [studentForm, setStudentForm] = useState({ studentID: '', fullName: '', dateOfBirth: '', gender: 'Nam', phoneNumber: '', address: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [classRes, teacherRes] = await Promise.all([
                facultyAdminService.getClasses(),
                facultyAdminService.getMyTeachers()
            ]);
            setClasses(classRes.data);
            setTeachers(teacherRes.data);
        } catch (error) {
            toast.error("Lỗi tải dữ liệu!");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // LOGIC LỚP NIÊN CHẾ (Thêm/Sửa/Xóa)
    // ==========================================
    const handleSubmitClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await facultyAdminService.updateClass(editingId, classForm);
                toast.success('Cập nhật lớp thành công!');
            } else {
                await facultyAdminService.createClass(classForm);
                toast.success('Tạo lớp mới thành công!');
            }
            setShowModal(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa lớp này?")) return;
        try {
            await facultyAdminService.deleteClass(id);
            toast.success("Đã xóa lớp!");
            loadData();
        } catch (error) {
            toast.error("Lỗi khi xóa lớp!");
        }
    };

    // ==========================================
    // LOGIC QUẢN LÝ SINH VIÊN (MỚI)
    // ==========================================
    
    // 1. Mở modal và tải danh sách sinh viên
    const handleOpenStudentModal = async (classId: string) => {
        setSelectedClassId(classId);
        setShowStudentListModal(true);
        setShowAddStudentForm(false);
        loadStudentsOfClass(classId);
    };

    const loadStudentsOfClass = async (classId: string) => {
        try {
            const res = await facultyAdminService.getStudentsByClass(classId);
            setCurrentClassStudents(res.data);
        } catch (error) {
            toast.error("Không thể tải danh sách sinh viên");
        }
    };

    // 2. Thêm tay 1 sinh viên
    const handleAddSingleStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId) return;
        try {
            await facultyAdminService.addStudentToClass(selectedClassId, studentForm);
            toast.success(`Đã thêm sinh viên ${studentForm.fullName}`);
            setStudentForm({ studentID: '', fullName: '', dateOfBirth: '', gender: 'Nam', phoneNumber: '', address: '' });
            setShowAddStudentForm(false);
            loadStudentsOfClass(selectedClassId); // Reload list
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi thêm sinh viên");
        }
    };

    // 3. Xử lý file Excel Import
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClassId) return;

        setIsImporting(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            let successCount = 0;
            let errorCount = 0;

            // Chạy vòng lặp đẩy từng dòng trong Excel xuống Backend
            for (const row of jsonData as any[]) {
                try {
                    // Mapping các cột từ Excel (có thể linh hoạt tên cột)
                    const payload = {
                        studentID: String(row['Mã SV'] || row['studentID'] || row['MSSV'] || ''),
                        fullName: row['Họ và tên'] || row['Họ tên'] || row['fullName'] || '',
                        dateOfBirth: row['Ngày sinh'] || '',
                        gender: row['Giới tính'] || 'Nam',
                        phoneNumber: String(row['SĐT'] || row['Điện thoại'] || ''),
                        address: row['Địa chỉ'] || row['Quê quán'] || ''
                    };
                    
                    if (!payload.studentID) continue; // Bỏ qua dòng trống
                    
                    await facultyAdminService.addStudentToClass(selectedClassId, payload);
                    successCount++;
                } catch (err) {
                    errorCount++;
                    console.error("Lỗi dòng:", row, err);
                }
            }

            toast.info(`Import hoàn tất: ${successCount} thành công, ${errorCount} thất bại.`);
            loadStudentsOfClass(selectedClassId);
        } catch (error) {
            toast.error("File không hợp lệ hoặc có lỗi xảy ra!");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Tải file mẫu Excel
    const handleDownloadTemplate = () => {
        const templateData = [
            { "Mã SV": "26A4040001", "Họ và tên": "Nguyễn Văn A", "Ngày sinh": "2004-05-15", "Giới tính": "Nam", "SĐT": "0901234567", "Địa chỉ": "Hà Nội" },
            { "Mã SV": "26A4040002", "Họ và tên": "Trần Thị B", "Ngày sinh": "2004-10-20", "Giới tính": "Nữ", "SĐT": "0987654321", "Địa chỉ": "Hải Phòng" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_SV");
        XLSX.writeFile(wb, "Template_Import_SinhVien.xlsx");
    };

    const filteredClasses = classes.filter(c => 
        c.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.classCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid py-4 animation-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                        <BookOpen size={28} className="text-primary"/> Quản lý Lớp niên chế
                    </h2>
                    <p className="text-muted mb-0">Quản lý các lớp hành chính và danh sách sinh viên thuộc khoa</p>
                </div>
                <button className="btn btn-primary btn-premium shadow-sm d-flex align-items-center gap-2" onClick={() => {
                    setEditingId(null);
                    setClassForm({ classCode: '', className: '', academicYear: '2024-2028', semester: 1, maxStudents: 50, advisorTeacherId: '' });
                    setShowModal(true);
                }}>
                    <Plus size={20} /> Tạo lớp mới
                </button>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4 d-flex gap-3">
                    <div className="position-relative flex-grow-1">
                        <Search className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} size={20} />
                        <input type="text" className="form-control bg-light border-0 py-2 ps-5" placeholder="Tìm kiếm theo mã lớp, tên lớp..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {isLoading ? (
                    <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
                ) : filteredClasses.length === 0 ? (
                    <div className="text-center py-5 text-muted">Không tìm thấy lớp học nào.</div>
                ) : (
                    filteredClasses.map(cls => (
                        <div key={cls.id} className="col-md-6 col-lg-4">
                            <div className="card border shadow-sm rounded-4 h-100 card-hover transition-all">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <span className="badge bg-primary bg-opacity-10 text-primary mb-2 fw-bold px-3 py-2 rounded-pill">
                                                {cls.classCode}
                                            </span>
                                            <h5 className="fw-bold text-dark mb-1">{cls.className}</h5>
                                            <small className="text-muted">Khóa: {cls.academicYear}</small>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                                        <Users size={16}/> Sĩ số tối đa: {cls.maxStudents}
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-muted small mb-4">
                                        <BookOpen size={16}/> Cố vấn: <span className="fw-bold text-dark">{cls.advisorTeacherName || 'Chưa phân công'}</span>
                                    </div>
                                    
                                    <div className="d-flex gap-2 border-top pt-3">
                                        <button className="btn btn-light text-primary fw-bold flex-grow-1 d-flex justify-content-center align-items-center gap-2" onClick={() => handleOpenStudentModal(cls.id)}>
                                            <Eye size={18}/> Sinh viên
                                        </button>
                                        <button className="btn btn-light text-secondary" onClick={() => {
                                            setEditingId(cls.id);
                                            setClassForm({ ...cls, advisorTeacherId: cls.advisorTeacherId || '' });
                                            setShowModal(true);
                                        }}><Edit2 size={18}/></button>
                                        <button className="btn btn-light text-danger" onClick={() => handleDeleteClass(cls.id)}>
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 🔥 MODAL QUẢN LÝ SINH VIÊN TRONG LỚP 🔥 */}
            {showStudentListModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-header bg-light border-0 py-3">
                                <h5 className="modal-title fw-bold text-primary d-flex align-items-center gap-2">
                                    <Users size={22}/> Danh sách sinh viên
                                </h5>
                                <button className="btn-close" onClick={() => setShowStudentListModal(false)}></button>
                            </div>
                            
                            <div className="modal-body p-4">
                                {/* Thanh công cụ Import & Thêm mới */}
                                <div className="d-flex justify-content-between align-items-center mb-4 bg-light p-3 rounded-3 border">
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-outline-primary fw-bold d-flex align-items-center gap-2 bg-white" onClick={() => setShowAddStudentForm(!showAddStudentForm)}>
                                            {showAddStudentForm ? <X size={18}/> : <UserPlus size={18}/>} 
                                            {showAddStudentForm ? 'Hủy thêm tay' : 'Thêm thủ công'}
                                        </button>
                                        
                                        {/* Input ẩn cho việc import */}
                                        <input type="file" accept=".xlsx, .xls" className="d-none" ref={fileInputRef} onChange={handleFileUpload} />
                                        
                                        <button className="btn btn-success fw-bold d-flex align-items-center gap-2 shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                                            {isImporting ? <span className="spinner-border spinner-border-sm"/> : <UploadCloud size={18}/>}
                                            Import Excel
                                        </button>
                                    </div>
                                    <button className="btn btn-link text-decoration-none text-muted fw-bold d-flex align-items-center gap-2" onClick={handleDownloadTemplate}>
                                        <Download size={18}/> Tải File Mẫu
                                    </button>
                                </div>

                                {/* Form Thêm thủ công (Toggle) */}
                                {showAddStudentForm && (
                                    <form onSubmit={handleAddSingleStudent} className="bg-primary bg-opacity-10 p-4 rounded-4 mb-4 border border-primary border-opacity-25 animation-fade-in">
                                        <h6 className="fw-bold text-primary mb-3">Thêm sinh viên mới</h6>
                                        <div className="row g-3">
                                            <div className="col-md-3">
                                                <input type="text" className="form-control" placeholder="Mã SV *" required value={studentForm.studentID} onChange={e => setStudentForm({...studentForm, studentID: e.target.value})} />
                                            </div>
                                            <div className="col-md-4">
                                                <input type="text" className="form-control" placeholder="Họ và tên *" required value={studentForm.fullName} onChange={e => setStudentForm({...studentForm, fullName: e.target.value})} />
                                            </div>
                                            <div className="col-md-3">
                                                <input type="date" className="form-control" placeholder="Ngày sinh" value={studentForm.dateOfBirth} onChange={e => setStudentForm({...studentForm, dateOfBirth: e.target.value})} />
                                            </div>
                                            <div className="col-md-2">
                                                <button type="submit" className="btn btn-primary w-100 fw-bold">Lưu</button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {/* Bảng danh sách sinh viên */}
                                <div className="table-responsive rounded-3 border">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="py-3 px-4">STT</th>
                                                <th className="py-3">Mã SV</th>
                                                <th className="py-3">Họ và tên</th>
                                                <th className="py-3">Email</th>
                                                <th className="py-3">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentClassStudents.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center py-5 text-muted">Chưa có sinh viên nào. Hãy thêm thủ công hoặc Import Excel.</td></tr>
                                            ) : (
                                                currentClassStudents.map((s, idx) => (
                                                    <tr key={s.id}>
                                                        <td className="px-4 fw-bold text-muted">{idx + 1}</td>
                                                        <td className="fw-bold text-dark">{s.studentID}</td>
                                                        <td className="fw-medium">{s.fullName}</td>
                                                        <td className="text-muted">{s.email}</td>
                                                        <td><span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">Hoạt động</span></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM / SỬA LỚP NIÊN CHẾ (Giữ nguyên logic cũ của bác) */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <form onSubmit={handleSubmitClass}>
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold text-primary">{editingId ? 'Sửa thông tin lớp' : 'Tạo lớp hành chính mới'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">Mã lớp (VD: K24HTTT) <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control" required value={classForm.classCode} onChange={e => setClassForm({...classForm, classCode: e.target.value})} disabled={!!editingId} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">Tên lớp <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control" required value={classForm.className} onChange={e => setClassForm({...classForm, className: e.target.value})} />
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-secondary">Khóa học</label>
                                            <input type="text" className="form-control" value={classForm.academicYear} onChange={e => setClassForm({...classForm, academicYear: e.target.value})} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold text-secondary">Sĩ số tối đa</label>
                                            <input type="number" className="form-control" value={classForm.maxStudents} onChange={e => setClassForm({...classForm, maxStudents: Number(e.target.value)})} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">Cố vấn học tập (Giảng viên)</label>
                                        <select className="form-select" value={classForm.advisorTeacherId} onChange={e => setClassForm({...classForm, advisorTeacherId: e.target.value})}>
                                            <option value="">-- Chọn Cố vấn --</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary fw-bold">Lưu thông tin</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animation-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .card-hover:hover { transform: translateY(-4px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; border-color: #0d6efd !important;}
            `}</style>
        </div>
    );
};

export default ClassManager;