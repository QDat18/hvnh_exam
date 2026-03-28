import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Search, Eye, GraduationCap } from 'lucide-react';
import { toast } from 'react-toastify';
import facultyAdminService, { type AdministrativeClass } from '../faculty-admin/faculty-admin.service';

const TeacherClassManager: React.FC = () => {
    const [classes, setClasses] = useState<AdministrativeClass[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showStudentListModal, setShowStudentListModal] = useState(false);
    const [currentClassStudents, setCurrentClassStudents] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Giảng viên gọi API này, Backend sẽ trả về danh sách lớp họ làm cố vấn (hoặc toàn bộ tùy logic backend của bác)
            const classRes = await facultyAdminService.getClasses();
            setClasses(classRes.data);
        } catch (error) {
            toast.error("Lỗi tải dữ liệu lớp chủ nhiệm!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenStudentModal = async (classId: string) => {
        try {
            const res = await facultyAdminService.getStudentsByClass(classId);
            setCurrentClassStudents(res.data);
            setShowStudentListModal(true);
        } catch (error) {
            toast.error("Không thể tải danh sách sinh viên");
        }
    };

    const filteredClasses = classes.filter(c => 
        c.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.classCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid py-4 animation-fade-in">
            <div className="mb-4">
                <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                    <GraduationCap size={28} className="text-primary"/> Lớp chủ nhiệm
                </h2>
                <p className="text-muted mb-0">Xem danh sách và thông tin sinh viên các lớp bạn làm Cố vấn học tập</p>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                    <div className="position-relative">
                        <Search className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} size={20} />
                        <input type="text" className="form-control bg-light border-0 py-2 ps-5" placeholder="Tìm kiếm lớp..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {isLoading ? (
                    <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
                ) : filteredClasses.length === 0 ? (
                    <div className="text-center py-5 text-muted">Bạn chưa được phân công làm cố vấn lớp nào.</div>
                ) : (
                    filteredClasses.map(cls => (
                        <div key={cls.id} className="col-md-6 col-lg-4">
                            <div className="card border shadow-sm rounded-4 h-100 card-hover transition-all">
                                <div className="card-body p-4">
                                    <span className="badge bg-primary bg-opacity-10 text-primary mb-2 fw-bold px-3 py-2 rounded-pill">
                                        {cls.classCode}
                                    </span>
                                    <h5 className="fw-bold text-dark mb-1">{cls.className}</h5>
                                    <small className="text-muted d-block mb-3">Khóa: {cls.academicYear}</small>
                                    
                                    <div className="d-flex align-items-center gap-2 text-muted small mb-4">
                                        <Users size={16}/> Sĩ số quy định: {cls.maxStudents}
                                    </div>
                                    
                                    <div className="border-top pt-3">
                                        <button className="btn btn-light text-primary fw-bold w-100 d-flex justify-content-center align-items-center gap-2" onClick={() => handleOpenStudentModal(cls.id)}>
                                            <Eye size={18}/> Xem danh sách sinh viên
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DANH SÁCH SINH VIÊN (CHỈ XEM) */}
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
                                                <tr><td colSpan={5} className="text-center py-5 text-muted">Chưa có sinh viên nào.</td></tr>
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
            <style>{`.animation-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .card-hover:hover { transform: translateY(-4px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; border-color: #0d6efd !important;}`}</style>
        </div>
    );
};

export default TeacherClassManager;