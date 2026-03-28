import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; 
import { studyHubApi } from '../../services/studyHubApi';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

const TeacherClasses: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        studyHubApi.getTeacherClasses()
            .then(res => setClasses(res.data.classes || []))
            .catch(err => console.error("Lỗi tải danh sách lớp:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-light min-vh-100 pb-5 animation-fade-in">
            {/* Header */}
            <div className="bg-white shadow-sm pt-4 mb-4 border-bottom">
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div className="mb-4">
                        <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
                            👨‍🏫 Quản lý Lớp học phần
                        </h2>
                        <p className="text-muted">
                            Chào mừng thầy/cô <span className="fw-bold text-primary">{user?.fullName}</span>. Đây là danh sách các lớp thầy/cô đang phụ trách trong học kỳ này.
                        </p>
                    </div>
                </div>
            </div>

            {/* Danh sách lớp */}
            <div className="container" style={{ maxWidth: '1200px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div>
                        <p className="mt-3 text-muted fw-bold">Đang tải dữ liệu lớp học...</p>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border shadow-sm mt-3">
                        <BookOpen size={64} className="text-muted opacity-25 mb-3 mx-auto" />
                        <h5 className="fw-bold">Chưa được phân công lớp nào</h5>
                        <p className="text-muted">Thầy/cô chưa được Khoa phân công giảng dạy lớp học phần nào hiện tại.</p>
                    </div>
                ) : (
                    <div className="row g-4 mt-1">
                        {classes.map(cls => (
                            <div key={cls.id} className="col-12 col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-translate-up">
                                    <div className="p-4 text-white position-relative" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', height: '120px' }}>
                                        <h5 className="fw-bold mb-1 text-truncate" title={cls.name}>{cls.name}</h5>
                                        <div className="opacity-75">{cls.code}</div>
                                        {/* Avatar chữ cái đầu */}
                                        <div className="position-absolute" style={{bottom: '-25px', right: '20px'}}>
                                            <div className="bg-white text-teal rounded-circle shadow-lg d-flex align-items-center justify-content-center fw-bold fs-4" style={{width: 60, height: 60, border: '4px solid #fff'}}>
                                                {cls.name.charAt(0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body pt-5 pb-4 px-4 bg-white">
                                        <div className="d-flex align-items-center gap-2 text-muted mb-4 bg-light p-2 rounded-3 w-fit-content px-3">
                                            <Users size={18} className="text-teal" />
                                            <span>Sĩ số: <b className="text-dark">{cls.studentCount || 0}</b> sinh viên</span>
                                        </div>
                                        
                                        {/* NÚT VÀO PHÒNG HỌC ẢO (Dùng chung Route Room với sinh viên) */}
                                        <button 
                                            className="btn btn-outline-teal w-100 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm"
                                            onClick={() => navigate(`/teacher/class-hub/${cls.id}`)}
                                        >
                                            Vào phòng học <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .animation-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .hover-translate-up { transition: all 0.3s ease; border: 1px solid #f8f9fa; }
                .hover-translate-up:hover { transform: translateY(-7px); box-shadow: 0 15px 30px rgba(13, 148, 136, 0.15) !important; border-color: #0d9488; }
                .text-teal { color: #0d9488; }
                .btn-outline-teal { color: #0f766e; border-color: #0d9488; background: transparent; }
                .btn-outline-teal:hover { background-color: #0d9488; color: white; }
                .w-fit-content { width: fit-content; }
            `}</style>
        </div>
    );
};

export default TeacherClasses;