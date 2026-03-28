import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { studyHubApi } from '../../../services/studyHubApi';
import { BookOpen, Users, ArrowRight } from 'lucide-react';
import { studentService } from '../../../services/student.service';

const TeacherDashboard: React.FC = () => {
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
        <div className="bg-light min-vh-100 pb-5">
            {/* Header */}
            <div className="bg-white shadow-sm pt-4 mb-4 border-bottom">
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div className="mb-4">
                        <h2 className="fw-bold mb-1">👨‍🏫 Bảng điều khiển Giảng viên</h2>
                        <p className="text-muted">Chào mừng thầy/cô <span className="fw-bold text-primary">{user?.fullName}</span>. Đây là danh sách các lớp thầy/cô đang phụ trách.</p>
                    </div>
                </div>
            </div>

            {/* Danh sách lớp */}
            <div className="container" style={{ maxWidth: '1200px' }}>
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
                        <BookOpen size={48} className="text-muted opacity-50 mb-3" />
                        <h5 className="fw-bold">Chưa có lớp học phần nào</h5>
                        <p className="text-muted">Thầy/cô chưa được Khoa phân công giảng dạy lớp nào trong học kỳ này.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {classes.map(cls => (
                            <div key={cls.id} className="col-12 col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-translate-up">
                                    <div className="p-4 text-white position-relative" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)' }}>
                                        <h5 className="fw-bold mb-1 text-truncate">{cls.name}</h5>
                                        <div className="opacity-75">{cls.code}</div>
                                        <div className="position-absolute" style={{bottom: '-20px', right: '20px'}}>
                                            <div className="bg-white text-teal rounded-circle shadow d-flex align-items-center justify-content-center fw-bold" style={{width: 50, height: 50}}>
                                                {cls.name.charAt(0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body pt-4">
                                        <div className="d-flex align-items-center gap-2 text-muted mb-4">
                                            <Users size={18} />
                                            <span>Sĩ số: <b>{cls.studentCount || 0}</b> sinh viên</span>
                                        </div>
                                        {/* NÚT VÀO PHÒNG HỌC (Dùng chung route với sinh viên) */}
                                        <button 
                                            className="btn btn-outline-teal w-100 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2"
                                            onClick={() => navigate(`/teacher/class-hub/${cls.id}`)}
                                        >
                                            Vào lớp quản lý <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .hover-translate-up:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
                .text-teal { color: #0d9488; }
                .btn-outline-teal { color: #0f766e; border-color: #0f766e; }
                .btn-outline-teal:hover { background-color: #0f766e; color: white; }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;