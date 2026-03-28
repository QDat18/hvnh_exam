import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, Edit2, Trash2, ShieldCheck, Mail, BookOpen, AlertCircle, CheckCircle, UploadCloud, DownloadCloud, Calendar, Copy, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx'; 
import { useAuth } from '../../context/AuthContext'; 
import facultyAdminService, { type Teacher, type Department } from './faculty-admin.service';

const TeacherManager: React.FC = () => {
    const { user } = useAuth();
    
    // --- STATE DỮ LIỆU ---
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [facultyCode, setFacultyCode] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    
    // --- STATE LỌC & TÌM KIẾM ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState(''); 
    
    // --- STATE FORM ---
    const [showModal, setShowModal] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- STATE MẬT KHẨU ---
    const [newCredentials, setNewCredentials] = useState<{fullName: string, email: string, password: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==========================================
    // TẢI DỮ LIỆU KHỞI TẠO
    // ==========================================
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [deptRes, teacherRes, facultyRes] = await Promise.all([
                facultyAdminService.getMyDepartments(),
                facultyAdminService.getMyTeachers(),
                facultyAdminService.getMyFaculty()
            ]);
            setDepartments(deptRes.data);
            setTeachers(teacherRes.data);
            if (facultyRes.data && facultyRes.data.code) {
                setFacultyCode(facultyRes.data.code.toLowerCase()); 
            }
        } catch (error: any) {
            toast.error("Không thể tải dữ liệu từ máy chủ.");
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // LOGIC SINH EMAIL (CÓ SỐ 1, 2)
    // ==========================================
    const generateEmailFromName = (name: string, fCode: string, existingEmails: string[]) => {
        if (!name) return '';
        let nameWithoutTitle = name.replace(/^((pgs|gs|ts|ths)\.?\s*)+/i, '').trim();
        const cleanName = nameWithoutTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
        const words = cleanName.split(/\s+/); 
        if (words.length === 0) return '';
        
        const suffix = fCode ? `.${fCode}` : '';
        let basePrefix = '';
        if (words.length === 1) {
            basePrefix = words[0];
        } else {
            const lastName = words.pop(); 
            const initials = words.map(w => w.charAt(0)).join('');
            basePrefix = `${lastName}${initials}`;
        }

        let finalEmail = `${basePrefix}${suffix}@hvnh.edu.vn`;
        let counter = 1;

        while (existingEmails.includes(finalEmail)) {
            finalEmail = `${basePrefix}${counter}${suffix}@hvnh.edu.vn`;
            counter++;
        }
        return finalEmail;
    };

    // ==========================================
    // THÊM / SỬA / XÓA
    // ==========================================
    const openCreateModal = () => {
        setEditingId(null);
        setFullName(''); setEmail(''); setDepartmentId(''); setDateOfBirth('');
        setShowModal(true);
    };

    const openEditModal = (t: Teacher) => {
        setEditingId(t.id);
        setFullName(t.fullName);
        setEmail(t.email);
        setDepartmentId(t.departmentId || ''); 
        
        // 🔥 XỬ LÝ NGÀY SINH TỪ BACKEND TRẢ VỀ
        if (t.dateOfBirth) {
            try {
                // Nếu BE trả về dạng chuỗi ISO (VD: 1987-01-08T00:00:00) hoặc Date object
                const dateObj = new Date(t.dateOfBirth);
                // Ép về định dạng YYYY-MM-DD cho thẻ <input type="date">
                const formattedDate = dateObj.toISOString().split('T')[0];
                setDateOfBirth(formattedDate);
            } catch (e) {
                setDateOfBirth(''); // Nếu lỗi thì để rỗng
            }
        } else {
            setDateOfBirth('');
        }
        
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { 
                fullName: fullName.trim(), 
                email: email.trim(), 
                departmentId,
                dateOfBirth: dateOfBirth ? dateOfBirth : null
            };

            if (editingId) {
                await facultyAdminService.updateTeacher(editingId, payload);
                toast.success("Cập nhật thông tin thành công!");
            } else {
                const res = await facultyAdminService.createTeacher(payload);
                toast.success("Khởi tạo tài khoản Giảng viên thành công!");
                setNewCredentials({
                    fullName: fullName.trim(), email: email.trim(),
                    password: res.data.password || res.data.teacher?.password
                });
            }
            loadInitialData();
            setShowModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu giảng viên.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if(window.confirm(`Xóa giảng viên ${name}?`)) {
            try {
                await facultyAdminService.deleteTeacher(id);
                toast.success("Xóa giảng viên thành công!");
                setTeachers(prev => prev.filter(t => t.id !== id));
            } catch (error: any) {
                toast.error("Không thể xóa giảng viên này.");
            }
        }
    };

    const downloadCredentials = () => {
        if (!newCredentials) return;
        const content = `THÔNG TIN TÀI KHOẢN GIẢNG VIÊN\n================================\nHọ và tên: ${newCredentials.fullName}\nTên đăng nhập: ${newCredentials.email}\nMật khẩu: ${newCredentials.password}\n\nLưu ý: Yêu cầu đổi mật khẩu sau lần đăng nhập đầu tiên.`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `TaiKhoan_${newCredentials.fullName.replace(/\s+/g, '_')}.txt`;
        link.click();
        toast.success("📥 Đã tải file thông tin xuống máy!");
    };

    // ==========================================
    // EXCEL IMPORT / EXPORT
    // ==========================================
    const handleExportExcel = () => {
        if (teachers.length === 0) return toast.warning("Không có dữ liệu!");
        const exportData = filteredTeachers.map((t, index) => ({
            "STT": index + 1,
            "Họ và tên": t.fullName,
            "Ngày sinh": t.dateOfBirth || 'Trống',
            "Email": t.email,
            "Bộ môn trực thuộc": t.departmentName || 'Chưa phân bộ môn',
            "Trạng thái": "Đang công tác"
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "GiangVien");
        XLSX.writeFile(workbook, `DanhSachGiangVien_${facultyCode || 'Khoa'}.xlsx`);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                setIsLoading(true);
                const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
                
                let successCount = 0, errorCount = 0;
                let importedAccounts: string[] = []; 
                let currentUsedEmails = teachers.map(t => t.email); 

                for (const row of data) {
                    const excelName = row["Họ và tên"] || row["Name"];
                    const excelDob = row["Ngày sinh"] || row["DOB"];
                    const excelDept = row["Bộ môn"] || row["Department"];
                    
                    if (!excelName) continue; 
                    
                    const matchedDept = departments.find(d => d.departmentName.toLowerCase().trim() === excelDept?.toLowerCase().trim());
                    const generatedEmail = generateEmailFromName(excelName, facultyCode, currentUsedEmails);
                    currentUsedEmails.push(generatedEmail); 

                    let formattedDob = '';
                    if (excelDob) {
                        if (typeof excelDob === 'number') {
                            const date = new Date(Math.round((excelDob - 25569) * 86400 * 1000));
                            formattedDob = date.toISOString().split('T')[0];
                        } else {
                            const parts = String(excelDob).split(/[-/]/);
                            if(parts.length === 3) formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    }

                    try {
                        const res = await facultyAdminService.createTeacher({
                            fullName: excelName, email: generatedEmail,
                            departmentId: matchedDept ? (matchedDept.id || matchedDept.departmentId as string) : '',
                            dateOfBirth: formattedDob
                        });
                        successCount++;
                        importedAccounts.push(`- ${excelName} (${formattedDob}) | ${generatedEmail} | Pass: ${res.data.password || res.data.teacher?.password}`);
                    } catch (err) {
                        errorCount++;
                    }
                }

                toast.info(`Import hoàn tất: ${successCount} thành công, ${errorCount} thất bại.`);
                loadInitialData();

                if (successCount > 0) {
                    const blob = new Blob([`TỔNG HỢP TÀI KHOẢN IMPORT\n====================\n\n${importedAccounts.join('\n')}`], { type: 'text/plain;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `MatKhau_Import_${facultyCode}.txt`;
                    link.click();
                }

            } catch (error) {
                toast.error("File không đúng định dạng.");
            } finally {
                setIsLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = ''; 
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredTeachers = teachers.filter(t => {
        const matchName = t.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEmail = t.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = filterDept ? t.departmentId === filterDept : true;
        return (matchName || matchEmail) && matchDept;
    });

    return (
        <main className="container-fluid py-4 px-md-4 px-lg-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* INJECT PREMIUM CSS VỚI RESPONSIVE TWEAKS */}
            <style>{`
                .premium-card { border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .premium-input { border-radius: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; background: #f8fafc; transition: all 0.2s; }
                .premium-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); outline: none; }
                .btn-premium { border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.2s; }
                .btn-premium:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; max-height: 95vh; overflow-y: auto; }
                .btn-action-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s; background: white; border: 1px solid #e2e8f0; color: #64748b; flex-shrink: 0; }
                .btn-action-icon:hover { background: #f1f5f9; color: #0f172a; }
                .btn-action-icon.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
                .custom-label { color: #475569 !important; font-weight: 700; font-size: 0.875rem; margin-bottom: 0.5rem; display: block; }
                
                /* Custom Scrollbar cho Bảng */
                .table-responsive::-webkit-scrollbar { height: 8px; width: 8px; }
                .table-responsive::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
                .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
                .table-responsive::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            {/* HEADER RESPONSIVE: Chia dòng thông minh, không làm giãn nút */}
            <header className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="flex-grow-1">
                    <h1 className="h3 fw-bold text-dark mb-2">Nhân sự Giảng viên</h1>
                    <p className="text-secondary mb-0">Quản lý đội ngũ giảng dạy thuộc <strong className="text-primary">{user?.full_name || 'Khoa của bạn'}</strong></p>
                </div>
                
                {/* Khu vực nút bấm: Wrap linh hoạt, các nút không bị kéo dài */}
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <button className="btn btn-light btn-premium text-dark border shadow-sm d-flex align-items-center gap-2 flex-shrink-0" onClick={handleExportExcel} disabled={isLoading}>
                        <DownloadCloud size={18} className="text-success" /> <span className="d-none d-sm-inline">Xuất Excel</span>
                    </button>
                    
                    <button className="btn btn-light btn-premium text-dark border shadow-sm d-flex align-items-center gap-2 flex-shrink-0" onClick={handleImportClick} disabled={isLoading}>
                        <UploadCloud size={18} className="text-primary" /> <span className="d-none d-sm-inline">Nhập Excel</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="d-none" accept=".xlsx, .xls" onChange={handleFileUpload} />

                    <button className="btn btn-primary btn-premium shadow-sm d-flex align-items-center gap-2 flex-shrink-0" onClick={openCreateModal} disabled={isLoading}>
                        <Plus size={18} /> Thêm Giảng viên
                    </button>
                </div>
            </header>

            <section className="premium-card overflow-hidden">
                {/* TOOLBAR TÌM KIẾM */}
                <div className="p-3 p-md-4 border-bottom bg-white d-flex gap-3 align-items-center flex-wrap">
                    <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
                        <Search size={18} className="position-absolute text-muted" style={{ top: '14px', left: '16px' }} />
                        <input type="text" className="premium-input w-100" style={{ paddingLeft: '44px' }} placeholder="Tìm theo tên/email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="d-flex flex-grow-1 flex-md-grow-0" style={{ minWidth: '250px' }}>
                        <select className="premium-input w-100 form-select text-secondary cursor-pointer" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                            <option value="">-- Tất cả Bộ môn --</option>
                            {departments.map(d => <option key={d.id || d.departmentId} value={d.id || d.departmentId as string}>{d.departmentName}</option>)}
                        </select>
                    </div>
                </div>

                {/* BẢNG DỮ LIỆU RESPONSIVE */}
                <div className="table-responsive bg-white">
                    <table className="table align-middle mb-0 table-hover text-nowrap">
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th className="ps-4 py-3 text-secondary text-uppercase small fw-bold border-bottom-0">Giảng viên</th>
                                <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0">Ngày sinh</th>
                                <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0">Liên hệ</th>
                                <th className="py-3 text-secondary text-uppercase small fw-bold border-bottom-0">Trực thuộc</th>
                                <th className="text-end pe-4 py-3 text-secondary text-uppercase small fw-bold border-bottom-0">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-5 text-muted"><AlertCircle size={32} className="opacity-50 mb-2 mx-auto d-block"/><p className="mb-0">Chưa có dữ liệu.</p></td></tr>
                            ) : filteredTeachers.map(t => (
                                <tr key={t.id} className="border-bottom">
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                                                {t.fullName.charAt(0)}
                                            </div>
                                            <span className="fw-bold text-dark">{t.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-secondary">
                                        {t.dateOfBirth ? (
                                            <span className="d-flex align-items-center gap-2"><Calendar size={14}/> {new Date(t.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                                        ) : '---'}
                                    </td>
                                    <td className="py-3 text-secondary"><Mail size={14} className="me-2 text-muted"/>{t.email}</td>
                                    <td className="py-3">
                                        <span className="badge bg-light text-dark border px-2 py-1"><BookOpen size={12} className="text-primary me-1"/> {t.departmentName || 'Chưa phân bộ môn'}</span>
                                    </td>
                                    <td className="text-end pe-4 py-3">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button className="btn-action-icon" onClick={() => openEditModal(t)}><Edit2 size={14}/></button>
                                            <button className="btn-action-icon danger" onClick={() => handleDelete(t.id, t.fullName)}><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* =========================================
                MODAL THÊM / SỬA (LƯỚI RESPONSIVE)
            ========================================= */}
            {showModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3" style={{ zIndex: 1050 }}>
                    <div className="position-absolute w-100 h-100 bg-dark" style={{ opacity: 0.5, backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}></div>
                    <form className="glass-modal shadow-lg position-relative w-100 d-flex flex-column" style={{ maxWidth: '600px', animation: 'fadeInUp 0.3s ease-out' }} onSubmit={handleSave}>
                        
                        <div className="p-4 border-bottom bg-white rounded-top-4">
                            <h2 className="h5 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                <Users className="text-primary" /> {editingId ? 'Chỉnh sửa Giảng viên' : 'Khởi tạo Giảng viên'}
                            </h2>
                        </div>
                        
                        {/* Body Modal có thanh cuộn riêng nếu màn hình quá nhỏ */}
                        <div className="p-4 overflow-auto custom-scrollbar bg-white" style={{ flexShrink: 1 }}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="custom-label">Họ và tên <span className="text-danger">*</span></label>
                                    <input type="text" className="premium-input w-100" placeholder="VD: Nguyễn Văn A" value={fullName} 
                                        onChange={e => {
                                            const newName = e.target.value;
                                            setFullName(newName);
                                            if (!editingId) {
                                                const currentEmails = teachers.map(t => t.email);
                                                setEmail(generateEmailFromName(newName, facultyCode, currentEmails)); 
                                            }
                                        }} required />
                                </div>
                                
                                <div className="col-md-6 col-12">
                                    <label className="custom-label">Ngày sinh</label>
                                    <input type="date" className="premium-input w-100" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                                </div>
                                
                                <div className="col-md-6 col-12">
                                    <label className="custom-label">Bộ môn trực thuộc</label>
                                    <select className="premium-input w-100 form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                                        <option value="">-- Chọn bộ môn --</option>
                                        {departments.map(d => <option key={d.id || d.departmentId} value={d.id || d.departmentId as string}>{d.departmentName}</option>)}
                                    </select>
                                </div>

                                <div className="col-12">
                                    <label className="custom-label">Tên đăng nhập (Email HVNH) <span className="text-danger">*</span></label>
                                    <input type="email" className="premium-input w-100 font-monospace text-primary" value={email} onChange={e => setEmail(e.target.value)} required />
                                    <small className="text-muted mt-1 d-block">Hệ thống sẽ tự động cấp mật khẩu bảo mật sau khi lưu.</small>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-top bg-light rounded-bottom-4 d-flex justify-content-end gap-2 flex-shrink-0">
                            <button type="button" className="btn btn-light btn-premium bg-white border" onClick={() => setShowModal(false)}>Hủy</button>
                            <button type="submit" className="btn btn-primary btn-premium shadow-sm px-4">{editingId ? 'Lưu thay đổi' : 'Khởi tạo Tài khoản'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* =========================================
                MODAL MẬT KHẨU (CHỐNG ÉP KHUNG)
            ========================================= */}
            {newCredentials && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3" style={{ zIndex: 1060 }}>
                    <div className="position-absolute w-100 h-100 bg-dark" style={{ opacity: 0.7, backdropFilter: 'blur(8px)' }}></div>
                    <div className="glass-modal shadow-lg position-relative w-100 bg-white" style={{ maxWidth: '450px', animation: 'zoomIn 0.3s ease-out' }}>
                        
                        <div className="p-4 border-bottom bg-success bg-opacity-10 rounded-top-4 d-flex align-items-center gap-3">
                            <CheckCircle size={32} className="text-success flex-shrink-0" />
                            <div>
                                <h4 className="h5 fw-bold mb-1 text-success">Khởi tạo Thành công</h4>
                                <p className="small text-muted mb-0">Hệ thống đã sinh tài khoản bảo mật</p>
                            </div>
                        </div>
                        
                        <div className="p-4">
                            <div className="alert alert-warning border-0 bg-warning bg-opacity-10 text-warning-emphasis rounded-3 mb-4 d-flex gap-2 align-items-start p-3">
                                <AlertTriangle size={20} className="flex-shrink-0 mt-1"/>
                                <div className="small">Mật khẩu dưới đây chỉ hiển thị <strong>1 lần duy nhất</strong>. Vui lòng tải file hoặc sao chép ngay.</div>
                            </div>

                            <div className="mb-3">
                                <label className="custom-label text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>Tên đăng nhập</label>
                                <input type="text" className="premium-input w-100 fw-bold text-primary bg-light" readOnly value={newCredentials.email} />
                            </div>
                            
                            <div className="mb-4">
                                <label className="custom-label text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>Mật khẩu hệ thống</label>
                                {/* Dùng Flexbox chuẩn chống bóp kích thước */}
                                <div className="d-flex gap-2 align-items-stretch w-100">
                                    <input 
                                        type="text" 
                                        className="premium-input flex-grow-1 fw-bold font-monospace text-dark bg-light" 
                                        style={{ minWidth: 0 }} 
                                        readOnly 
                                        value={newCredentials.password} 
                                    />
                                    <button 
                                        className="btn btn-outline-primary rounded-3 d-flex align-items-center justify-content-center px-3 flex-shrink-0 shadow-sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`Tài khoản: ${newCredentials.email}\nMật khẩu: ${newCredentials.password}`);
                                            toast.info("📋 Đã copy mật khẩu!");
                                        }}
                                    >
                                        <Copy size={18}/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary btn-premium flex-grow-1 d-flex justify-content-center align-items-center gap-2 shadow-sm" onClick={downloadCredentials}>
                                    <Download size={18}/> <span className="d-none d-sm-inline">Tải File Text</span>
                                </button>
                                <button className="btn btn-dark btn-premium flex-grow-1 shadow-sm" onClick={() => setNewCredentials(null)}>
                                    Đóng lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default TeacherManager;