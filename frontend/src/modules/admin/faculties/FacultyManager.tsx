import React, { useState, useEffect } from 'react';
import { Building, Layers, Plus, Trash2, ChevronRight, Copy, KeyRound, ShieldAlert, Edit2, UserCircle, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import facultyService, { type Faculty, type Department } from './faculty.service';

const FacultyManager: React.FC = () => {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState<'FACULTY' | 'EDIT_FACULTY' | 'DEPARTMENT' | null>(null);
    const [formName, setFormName] = useState<string>('');
    const [formCode, setFormCode] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [adminCredentials, setAdminCredentials] = useState<{
        email: string; password: string; facultyName: string; isReset?: boolean;
    } | null>(null);

    useEffect(() => { loadFaculties(); }, []);

    const loadFaculties = async () => {
        try {
            const res = await facultyService.getAllFaculties();
            setFaculties(res.data);
        } catch (error) {
            toast.error("Không thể tải danh sách khoa.");
        }
    };

    const handleSelectFaculty = async (faculty: Faculty) => {
        setSelectedFaculty(faculty);
        setIsLoading(true);
        try {
            const res = await facultyService.getDepartmentsByFaculty(faculty.id);
            setDepartments(res.data);
            
            // Tự động cuộn xuống phần chi tiết trên giao diện Mobile
            if (window.innerWidth < 992) {
                setTimeout(() => document.getElementById('details-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (error) {
            setDepartments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (showModal === 'FACULTY') {
                const res = await facultyService.createFaculty({ facultyCode: formCode.trim(), facultyName: formName.trim(), description: `Khoa ${formName.trim()}` });
                toast.success("Thêm Khoa thành công!");
                loadFaculties();
                if (res.data?.facultyAdmin) {
                    setAdminCredentials({ email: res.data.facultyAdmin.email, password: res.data.facultyAdmin.password, facultyName: formName, isReset: false });
                }
            } else if (showModal === 'EDIT_FACULTY' && editingId) {
                await facultyService.updateFaculty(editingId, { facultyCode: formCode.trim(), facultyName: formName.trim(), description: `Khoa ${formName.trim()}` });
                toast.success("Cập nhật thành công!");
                loadFaculties();
                if (selectedFaculty?.id === editingId) setSelectedFaculty({...selectedFaculty, facultyCode: formCode, facultyName: formName});
            } else if (showModal === 'DEPARTMENT' && selectedFaculty) {
                await facultyService.createDepartment({ departmentName: formName.trim(), facultyId: selectedFaculty.id });
                toast.success("Thêm Bộ môn thành công!");
                handleSelectFaculty(selectedFaculty);
            }
            closeModal();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi hệ thống.");
        }
    };

    const handleDeleteFaculty = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation(); 
        if (window.confirm(`⚠️ CẢNH BÁO: Xóa khoa "${name}" sẽ xóa toàn bộ dữ liệu liên quan. Tiếp tục?`)) {
            try {
                await facultyService.deleteFaculty(id);
                toast.success("Đã xóa khoa!");
                loadFaculties();
                if (selectedFaculty?.id === id) { setSelectedFaculty(null); setDepartments([]); }
            } catch (error: any) { toast.error(error.response?.data?.message || "Khoa đang có dữ liệu ràng buộc."); }
        }
    };

    const handleDeleteDepartment = async (id: string, name: string) => {
        if(window.confirm(`Xóa bộ môn ${name}?`)) {
            try {
                await facultyService.deleteDepartment(id);
                toast.success("Đã xóa bộ môn!");
                if (selectedFaculty) handleSelectFaculty(selectedFaculty);
            } catch (error) { toast.error("Không thể xóa bộ môn này."); }
        }
    };

    const handleResetPassword = async () => {
        if (!selectedFaculty || !window.confirm(`🔐 Cấp lại mật khẩu cho ${selectedFaculty.facultyName}? Mật khẩu cũ sẽ bị vô hiệu hóa ngay lập tức.`)) return;
        try {
            const res = await facultyService.resetAdminPassword(selectedFaculty.id);
            if (res.data?.email) setAdminCredentials({ email: res.data.email, password: res.data.newPassword, facultyName: selectedFaculty.facultyName, isReset: true });
        } catch (error: any) { toast.error(error.response?.data?.message || "Lỗi cấp lại mật khẩu."); }
    };

    const closeModal = () => { setShowModal(null); setFormName(''); setFormCode(''); setEditingId(null); };

    const copyToClipboard = () => {
        if(adminCredentials) {
            navigator.clipboard.writeText(`Khoa: ${adminCredentials.facultyName}\nTài khoản: ${adminCredentials.email}\nMật khẩu: ${adminCredentials.password}`);
            toast.info("📋 Đã copy vào khay nhớ tạm!");
        }
    };

    const filteredFaculties = faculties.filter(f => f.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) || f.facultyCode.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <main className="container-fluid py-4 px-md-4 px-lg-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* INJECT PREMIUM CSS VỚI MEDIA QUERIES CHO RESPONSIVE */}
            <style>{`
                .premium-card { border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden; }
                .list-item-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 12px; margin-bottom: 8px; border: 1px solid transparent; }
                .list-item-hover:hover { background-color: #f1f5f9; transform: translateY(-1px); }
                .list-item-active { background-color: #eff6ff !important; border-color: #bfdbfe !important; box-shadow: 0 2px 10px rgba(59, 130, 246, 0.1); }
                .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.2); max-height: 90vh; overflow-y: auto; }
                .premium-input { border-radius: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; background: #f8fafc; transition: all 0.2s; }
                .premium-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); outline: none; }
                .btn-premium { border-radius: 12px; padding: 10px 20px; font-weight: 600; transition: all 0.2s; }
                .btn-premium:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .btn-action-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s; background: white; border: 1px solid #e2e8f0; color: #64748b; flex-shrink: 0; }
                .btn-action-icon:hover { background: #f1f5f9; color: #0f172a; }
                .btn-action-icon.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                
                /* Responsive Layout Tweaks */
                .list-container-height { height: calc(100vh - 280px); min-height: 400px; }
                .admin-card-email { word-break: break-all; }
                @media (max-width: 991.98px) {
                    .list-container-height { height: 400px; }
                    .admin-card-flex { flex-direction: column !important; align-items: stretch !important; }
                    .admin-card-btn { width: 100%; margin-top: 1rem; justify-content: center; }
                }
            `}</style>

            <header className="mb-4 mb-md-5 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-2" style={{ letterSpacing: '-0.5px' }}>Cơ cấu Tổ chức</h1>
                    <p className="text-secondary mb-0">Quản lý không gian làm việc của các Khoa và Bộ môn</p>
                </div>
            </header>

            <section className="row g-4">
                {/* ---------- CỘT TRÁI: DANH SÁCH KHOA ---------- */}
                <article className="col-12 col-lg-4 col-md-5">
                    <div className="premium-card d-flex flex-column h-100">
                        <div className="p-3 p-md-4 border-bottom bg-white">
                            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                                <h2 className="h6 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                    <Building size={18} className="text-primary"/> Danh mục Khoa
                                </h2>
                                <button className="btn btn-primary btn-premium btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={() => { setShowModal('FACULTY'); setFormName(''); setFormCode(''); }}>
                                    <Plus size={16}/> Thêm mới
                                </button>
                            </div>
                            <div className="position-relative">
                                <Search size={16} className="position-absolute text-muted" style={{ top: '14px', left: '14px' }}/>
                                <input 
                                    type="text" 
                                    className="premium-input w-100" 
                                    style={{ paddingLeft: '40px' }} 
                                    placeholder="Tìm kiếm khoa..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="p-2 p-md-3 overflow-auto custom-scrollbar list-container-height">
                            {filteredFaculties.length === 0 ? (
                                <div className="text-center py-5 text-muted opacity-75">
                                    <Building size={40} className="mb-3 mx-auto text-secondary opacity-50"/>
                                    <p>Không tìm thấy khoa nào.</p>
                                </div>
                            ) : (
                                filteredFaculties.map(f => {
                                    const isSelected = selectedFaculty?.id === f.id;
                                    return (
                                        <div 
                                            key={f.id}
                                            role="button"
                                            className={`list-item-hover d-flex justify-content-between align-items-center p-3 ${isSelected ? 'list-item-active' : ''}`}
                                            onClick={() => handleSelectFaculty(f)}
                                        >
                                            {/* Phần Text (Tránh đè nút bằng min-width-0 và flex-grow-1) */}
                                            <div className="d-flex align-items-center gap-3 overflow-hidden flex-grow-1 pe-2" style={{ minWidth: 0 }}>
                                                <div className={`d-flex align-items-center justify-content-center flex-shrink-0 rounded-3 ${isSelected ? 'bg-primary text-white' : 'bg-light text-secondary'}`} style={{ width: '42px', height: '42px', fontWeight: 700, fontSize: '12px' }}>
                                                    {f.facultyCode}
                                                </div>
                                                <div className="text-truncate flex-grow-1" style={{ minWidth: 0 }}>
                                                    <h6 className={`mb-0 fw-bold text-truncate ${isSelected ? 'text-primary' : 'text-dark'}`}>{f.facultyName}</h6>
                                                    <small className="text-muted text-truncate d-block">{f.facultyCode}</small>
                                                </div>
                                            </div>
                                            
                                            {/* Phần Nút bấm (Luôn giữ nguyên kích thước bằng flex-shrink-0) */}
                                            <div className="d-flex align-items-center gap-1 opacity-75 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                <button className="btn-action-icon" onClick={(e) => { e.stopPropagation(); setFormCode(f.facultyCode); setFormName(f.facultyName); setEditingId(f.id); setShowModal('EDIT_FACULTY'); }}><Edit2 size={14}/></button>
                                                <button className="btn-action-icon danger" onClick={(e) => handleDeleteFaculty(e, f.id, f.facultyName)}><Trash2 size={14}/></button>
                                                {isSelected && <ChevronRight size={18} className="text-primary ms-1 d-none d-md-block"/>}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </article>

                {/* ---------- CỘT PHẢI: CHI TIẾT ---------- */}
                <article className="col-12 col-lg-8 col-md-7" id="details-section">
                    {!selectedFaculty ? (
                        <div className="premium-card h-100 d-flex justify-content-center align-items-center p-5" style={{ backgroundColor: '#f8fafc', borderStyle: 'dashed', minHeight: '400px' }}>
                            <div className="text-center text-muted">
                                <div className="bg-white p-4 rounded-circle shadow-sm d-inline-block mb-3">
                                    <Layers size={40} className="text-primary opacity-50"/>
                                </div>
                                <h5 className="fw-bold text-dark">Chưa chọn Khoa</h5>
                                <p>Nhấp vào một khoa bên trái để quản lý bộ môn và tài khoản.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4 h-100 animate__animated animate__fadeIn">
                            
                            {/* CARD TÀI KHOẢN QUẢN TRỊ */}
                            <div className="premium-card overflow-hidden position-relative border-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
                                <div className="position-absolute" style={{ top: '-50px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                                
                                <div className="card-body p-3 p-md-4 admin-card-flex d-flex justify-content-between align-items-center position-relative z-1">
                                    <div className="d-flex gap-3 gap-md-4 align-items-center w-100" style={{ minWidth: 0 }}>
                                        <div className="bg-white bg-opacity-10 p-2 p-md-3 rounded-4 backdrop-blur flex-shrink-0">
                                            <ShieldAlert size={24} className="text-warning"/>
                                        </div>
                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                            <h3 className="h6 fw-bold mb-1 text-white opacity-75 text-uppercase tracking-wide" style={{ letterSpacing: '1px', fontSize: '11px' }}>
                                                Tài khoản Quản trị viên
                                            </h3>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                <UserCircle size={18} className="text-info flex-shrink-0"/>
                                                <span className="fs-6 fw-bold font-monospace admin-card-email text-truncate">{selectedFaculty.adminEmail || `khoa.${selectedFaculty.facultyCode.toLowerCase()}@hvnh.edu.vn`}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-light btn-premium admin-card-btn fw-bold text-dark d-flex align-items-center gap-2 flex-shrink-0" onClick={handleResetPassword}>
                                        <KeyRound size={16}/> Cấp lại Mật khẩu
                                    </button>
                                </div>
                            </div>

                            {/* BẢNG BỘ MÔN */}
                            <div className="premium-card flex-grow-1 d-flex flex-column">
                                <div className="p-3 p-md-4 border-bottom d-flex flex-wrap justify-content-between align-items-center bg-white gap-3">
                                    <h2 className="h6 mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                        <Layers size={18} className="text-primary"/> Phân nhánh Bộ môn
                                    </h2>
                                    <button className="btn btn-outline-primary btn-premium btn-sm d-flex align-items-center gap-1" onClick={() => { setShowModal('DEPARTMENT'); setFormName(''); }}>
                                        <Plus size={16}/> Thêm Bộ môn
                                    </button>
                                </div>

                                <div className="flex-grow-1 p-0 overflow-auto custom-scrollbar bg-white" style={{ minHeight: '300px' }}>
                                    {isLoading ? (
                                        <div className="d-flex justify-content-center py-5 text-primary">
                                            <div className="spinner-border spinner-border-sm me-2"/> Đồng bộ dữ liệu...
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle mb-0 border-0">
                                                <thead style={{ background: '#f8fafc' }}>
                                                    <tr>
                                                        <th className="ps-3 ps-md-4 py-3 text-secondary text-uppercase text-nowrap" style={{ fontSize: '12px', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>Tên Bộ môn</th>
                                                        <th className="text-end pe-3 pe-md-4 py-3 text-secondary text-uppercase text-nowrap" style={{ fontSize: '12px', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', width: '100px' }}>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {departments.length === 0 ? (
                                                        <tr><td colSpan={2} className="text-center py-5 text-muted">Chưa có bộ môn nào được cấu hình.</td></tr>
                                                    ) : departments.map(d => (
                                                        <tr key={d.id} className="border-bottom" style={{ transition: 'background 0.2s' }}>
                                                            <td className="ps-3 ps-md-4 py-3 fw-bold text-dark">{d.departmentName}</td>
                                                            <td className="text-end pe-3 pe-md-4 py-3">
                                                                <button className="btn-action-icon danger ms-auto" onClick={() => handleDeleteDepartment(d.id, d.departmentName)}><Trash2 size={14}/></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </article>
            </section>

            {/* ---------- MODAL NHẬP LIỆU ---------- */}
            {showModal && (
                <div role="dialog" className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3" style={{ zIndex: 1050 }}>
                    <div className="position-absolute w-100 h-100 bg-dark" style={{ opacity: 0.4, backdropFilter: 'blur(4px)' }} onClick={closeModal}></div>
                    <form className="glass-modal shadow-lg position-relative w-100" style={{ maxWidth: '450px', animation: 'fadeInUp 0.3s ease-out' }} onSubmit={handleSave}>
                        <div className="p-3 p-md-4 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            <h2 className="h5 fw-bold text-dark mb-0">
                                {showModal === 'FACULTY' ? '✨ Tạo Khoa Mới' : showModal === 'EDIT_FACULTY' ? '✏️ Điều chỉnh Khoa' : '📁 Bổ sung Bộ môn'}
                            </h2>
                        </div>
                        
                        <div className="p-3 p-md-4">
                            {(showModal === 'FACULTY' || showModal === 'EDIT_FACULTY') && (
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-secondary mb-2">Mã định danh (Code) <span className="text-danger">*</span></label>
                                    <input type="text" className="premium-input w-100 fw-bold font-monospace" value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} placeholder="VD: CNTT" autoFocus required />
                                </div>
                            )}
                            <div className="mb-2">
                                <label className="form-label small fw-bold text-secondary mb-2">Tên {showModal === 'DEPARTMENT' ? 'Bộ môn' : 'Khoa'} <span className="text-danger">*</span></label>
                                <input type="text" className="premium-input w-100" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nhập tên đầy đủ..." autoFocus={showModal === 'DEPARTMENT'} required />
                            </div>
                        </div>

                        <div className="p-3 p-md-4 pt-0 pt-md-2 d-flex justify-content-end gap-2">
                            <button type="button" className="btn btn-light btn-premium text-secondary" onClick={closeModal}>Hủy bỏ</button>
                            <button type="submit" className="btn btn-primary btn-premium shadow-sm" disabled={!formName.trim() || ((showModal === 'FACULTY' || showModal === 'EDIT_FACULTY') && !formCode.trim())}>
                                Cập nhật hệ thống
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ---------- MODAL MẬT KHẨU ---------- */}
            {adminCredentials && (
                <div role="dialog" className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3" style={{ zIndex: 1060 }}>
                    <div className="position-absolute w-100 h-100 bg-dark" style={{ opacity: 0.6, backdropFilter: 'blur(8px)' }}></div>
                    <div className="glass-modal shadow-lg position-relative w-100" style={{ maxWidth: '500px', animation: 'zoomIn 0.3s ease-out' }}>
                        <div className={`p-3 p-md-4 border-bottom d-flex align-items-center gap-3 ${adminCredentials.isReset ? 'bg-warning bg-opacity-10' : 'bg-success bg-opacity-10'}`} style={{ borderRadius: '24px 24px 0 0' }}>
                            <div className={`p-2 p-md-3 rounded-circle flex-shrink-0 ${adminCredentials.isReset ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                                {adminCredentials.isReset ? <KeyRound size={24}/> : <ShieldAlert size={24}/>}
                            </div>
                            <div>
                                <h4 className={`h5 fw-bold mb-1 ${adminCredentials.isReset ? 'text-warning-emphasis' : 'text-success'}`}>
                                    {adminCredentials.isReset ? 'Đã cấp lại Khóa bảo mật' : 'Hệ thống Ghi nhận Thành công'}
                                </h4>
                                <p className="small text-muted mb-0">Bảo mật cấp độ Quản trị viên (Admin)</p>
                            </div>
                        </div>
                        
                        <div className="p-3 p-md-4">
                            <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger-emphasis rounded-3 mb-4 d-flex gap-2 align-items-start p-3">
                                <AlertTriangle size={20} className="flex-shrink-0 mt-1"/>
                                <div className="small">
                                    <strong>Chỉ hiển thị DUY NHẤT 1 LẦN.</strong> Vui lòng sao chép và lưu trữ an toàn ngay bây giờ.
                                </div>
                            </div>
                            
                            <div className="bg-light p-3 p-md-4 rounded-4 border border-light">
                                <div className="mb-3">
                                    <label className="text-secondary small fw-bold text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Tên đăng nhập</label>
                                    <input type="text" className="premium-input w-100 fw-bold text-primary bg-white" readOnly value={adminCredentials.email} />
                                </div>
                                <div>
                                    <label className="text-secondary small fw-bold text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Mật khẩu hệ thống</label>
                                    
                                    {/* SỬA LỖI ĐÈ NÚT COPY: Dùng flexbox thay vì position absolute */}
                                <div className="d-flex gap-2 align-items-center w-100">
                                    <input 
                                        type="text" 
                                        className="premium-input flex-grow-1 fw-bold font-monospace text-dark bg-white" 
                                        style={{ minWidth: '0' }} 
                                        readOnly 
                                        value={adminCredentials.password} 
                                    />
                                    <button 
                                        className="btn btn-primary rounded-3 d-flex align-items-center justify-content-center gap-2 px-3 flex-shrink-0" 
                                        style={{ height: '46px' }}
                                        onClick={copyToClipboard}
                                    >
                                        <Copy size={16}/> <span className="d-none d-sm-inline">Sao chép</span>
                                    </button>
                                </div>
                                    
                                </div>
                            </div>
                        </div>

                        <div className="p-3 p-md-4 pt-0">
                            <button className="btn btn-dark btn-premium w-100 py-3 text-uppercase tracking-wide" style={{ letterSpacing: '1px' }} onClick={() => setAdminCredentials(null)}>
                                Tôi đã lưu trữ an toàn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default FacultyManager;