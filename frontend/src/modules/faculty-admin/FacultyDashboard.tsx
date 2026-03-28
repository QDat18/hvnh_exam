import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import facultyAdminService from './faculty-admin.service';
import { toast } from 'react-toastify';

const FacultyDashboard: React.FC = () => {
    const { user } = useAuth();
    
    // State lưu trữ số liệu thống kê
    const [stats, setStats] = useState({
        departments: 0,
        teachers: 0,
        classes: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Gọi 3 API cùng lúc để tăng tốc độ tải
            const [deptRes, teacherRes, classRes] = await Promise.all([
                facultyAdminService.getDepartments(),
                facultyAdminService.getMyTeachers(),
                facultyAdminService.getClasses()
            ]);

            setStats({
                departments: deptRes.data.length || 0,
                teachers: teacherRes.data.length || 0,
                classes: classRes.data.length || 0
            });
        } catch (error) {
            console.error("Lỗi lấy dữ liệu Dashboard:", error);
            toast.error("Không thể tải dữ liệu thống kê!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container-fluid py-4 px-md-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <header className="mb-5 d-flex justify-content-between align-items-end animate__animated animate__fadeInDown">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-2">Không gian Quản trị Khoa</h1>
                    <p className="text-secondary mb-0">
                        Học viện Ngân hàng. 
                        Bạn đang quản lý hệ thống của: <strong className="text-primary">{user?.full_name || 'Khoa của bạn'}</strong>
                    </p>
                </div>
                <div className="bg-white p-2 px-3 rounded-pill shadow-sm border d-flex align-items-center gap-2">
                    <ShieldCheck size={18} className="text-success" />
                    <span className="small fw-bold text-success">Quyền: Trưởng Khoa</span>
                </div>
            </header>

            <section className="row g-4 animate__animated animate__fadeInUp">
                {/* Thẻ Thống kê 1: Bộ môn */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-3 bg-primary bg-opacity-10 rounded-3">
                                <Layers size={24} className="text-primary" />
                            </div>
                            <h2 className="h6 fw-bold mb-0 text-dark">Bộ môn trực thuộc</h2>
                        </div>
                        <h3 className="display-5 fw-bold text-primary mb-0">
                            {isLoading ? <span className="spinner-border spinner-border-sm text-primary" /> : stats.departments}
                        </h3>
                        <p className="text-muted small mt-2">Tổng số bộ môn trong khoa</p>
                    </div>
                </div>

                {/* Thẻ Thống kê 2: Giảng viên */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-3 bg-success bg-opacity-10 rounded-3">
                                <Users size={24} className="text-success" />
                            </div>
                            <h2 className="h6 fw-bold mb-0 text-dark">Giảng viên</h2>
                        </div>
                        <h3 className="display-5 fw-bold text-success mb-0">
                            {isLoading ? <span className="spinner-border spinner-border-sm text-success" /> : stats.teachers}
                        </h3>
                        <p className="text-muted small mt-2">Giảng viên đang công tác</p>
                    </div>
                </div>

                {/* Thẻ Thống kê 3: Lớp hành chính */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)' }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-3 bg-warning bg-opacity-10 rounded-3">
                                <BookOpen size={24} className="text-warning" />
                            </div>
                            <h2 className="h6 fw-bold mb-0 text-dark">Lớp hành chính</h2>
                        </div>
                        <h3 className="display-5 fw-bold text-warning mb-0">
                            {isLoading ? <span className="spinner-border spinner-border-sm text-warning" /> : stats.classes}
                        </h3>
                        <p className="text-muted small mt-2">Lớp sinh viên do khoa quản lý</p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default FacultyDashboard;