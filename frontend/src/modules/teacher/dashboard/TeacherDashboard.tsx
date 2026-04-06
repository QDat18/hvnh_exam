import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { studyHubApi } from '../../../services/studyHubApi';
import { 
    BookOpen, Users, ArrowRight, GraduationCap, 
    Calendar, LayoutDashboard, Clock, CheckCircle2, 
    Search, Filter, Plus
} from 'lucide-react';

const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        studyHubApi.getTeacherClasses()
            .then(res => setClasses(res.data.classes || []))
            .catch(err => console.error("Lỗi tải danh sách lớp:", err))
            .finally(() => setLoading(false));
    }, []);

    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="teacher-dashboard-dark min-vh-100 pb-5" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
            {/* TOP HEADER */}
            <div className="py-5" style={{ background: 'linear-gradient(180deg, rgba(15, 118, 110, 0.1) 0%, rgba(15, 23, 42, 0) 100%)' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div className="d-flex justify-content-between align-items-end flex-wrap gap-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="p-2 rounded-3" style={{ background: 'rgba(15, 118, 110, 0.2)', color: '#2dd4bf' }}>
                                    <LayoutDashboard size={20} />
                                </div>
                                <span style={{ color: '#2dd4bf', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px' }}>TEACHER CONSOLE</span>
                            </div>
                            <h1 className="fw-bold mb-2" style={{ fontSize: '2.4rem', letterSpacing: '-1px' }}>Bảng điều khiển</h1>
                            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                                Chào mừng <span style={{ color: '#2dd4bf', fontWeight: 700 }}>{user?.fullName}</span>. Bạn có <span className="text-white fw-bold">{classes.length}</span> lớp học phần trong kỳ này.
                            </p>
                        </div>
                        <div className="d-flex gap-3">
                            <button className="btn-teacher-primary">
                                <Plus size={18} /> Tạo học phần mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '1200px' }}>
                {/* QUICK STATS */}
                <div className="row g-4 mb-5">
                    {[
                        { label: 'Lớp phụ trách', value: classes.length, icon: <GraduationCap size={22} />, color: '#2dd4bf' },
                        { label: 'Tổng sinh viên', value: classes.reduce((acc, c) => acc + (c.studentCount || 0), 0), icon: <Users size={22} />, color: '#6366f1' },
                        { label: 'Học kỳ hiện tại', value: 'HKII-2026', icon: <Calendar size={22} />, color: '#f59e0b' },
                        { label: 'Bài tập/Kỳ thi', value: '12 Active', icon: <CheckCircle2 size={22} />, color: '#3b82f6' },
                    ].map((stat, i) => (
                        <div className="col-6 col-md-3" key={i}>
                            <div className="teacher-stat-card">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SEARCH & FILTERS */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <div className="search-wrapper flex-grow-1" style={{ maxWidth: '400px' }}>
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm lớp học..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="teacher-search-input"
                        />
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn-filter-dark active">Tất cả</button>
                        <button className="btn-filter-dark">Đang hoạt động</button>
                        <button className="btn-filter-dark"><Filter size={14} /></button>
                    </div>
                </div>

                {/* CLASS GRID */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-grow text-teal" role="status"></div>
                        <p className="mt-3 text-slate-500 fw-medium">Đang đồng bộ dữ liệu lớp học...</p>
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <div className="empty-state-dark py-5 text-center rounded-4">
                        <BookOpen size={64} className="mb-4 opacity-20" />
                        <h3>Không tìm thấy lớp học</h3>
                        <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại phân công.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredClasses.map((cls) => (
                            <div key={cls.id} className="col-12 col-md-6 col-xl-4">
                                <div className="class-card-dark h-100" onClick={() => navigate(`/teacher/class-hub/${cls.id}`)}>
                                    <div className="class-card-header">
                                        <div className="header-highlight"></div>
                                        <div className="d-flex justify-content-between align-items-start mb-3 relative">
                                            <div className="class-badge-pill">{cls.code}</div>
                                            <div className="more-btn">•••</div>
                                        </div>
                                        <h4 className="class-title text-truncate" title={cls.name}>{cls.name}</h4>
                                    </div>
                                    <div className="class-card-body">
                                        <div className="d-flex align-items-center gap-4 mb-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <Users size={16} className="text-slate-400" />
                                                <span className="fw-bold">{cls.studentCount || 0}</span>
                                                <small className="text-slate-500">SV</small>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Clock size={16} className="text-slate-400" />
                                                <span className="fw-bold">45m</span>
                                                <small className="text-slate-500">/ca</small>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="teacher-avatars">
                                                <div className="avatar-mini" style={{ background: '#0d9488' }}>{user?.fullName.charAt(0)}</div>
                                            </div>
                                            <button className="btn-manage"> Quản lý <ArrowRight size={14} /> </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .btn-teacher-primary {
                    background: #0d9488;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .btn-teacher-primary:hover {
                    background: #14b8a6;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.3);
                }

                .teacher-stat-card {
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 1.5rem;
                    transition: all 0.2s;
                }
                .teacher-stat-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.1); }
                .stat-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-value { font-size: 1.75rem; font-weight: 800; margin-top: 0.5rem; color: #f8fafc; }
                .stat-label { color: #94a3b8; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; }

                .search-wrapper { position: relative; }
                .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }
                .teacher-search-input {
                    width: 100%;
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 14px;
                    padding: 0.75rem 1rem 0.75rem 3rem;
                    color: white;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .teacher-search-input:focus { border-color: #0d9488; }

                .btn-filter-dark { background: transparent; border: 1px solid rgba(255,255,255,0.05); color: #94a3b8; padding: 0.5rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.85rem; }
                .btn-filter-dark.active { background: #334155; color: white; border-color: #475569; }

                .class-card-dark {
                    background: #1e293b;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.05);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }
                .class-card-dark:hover {
                    background: #243144;
                    transform: scale(1.02);
                    border-color: #0d9488;
                    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
                }

                .class-card-header {
                    padding: 24px;
                    background: linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, transparent 100%);
                    position: relative;
                }
                .header-highlight { position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #0d9488; }
                .class-badge-pill { background: rgba(255,255,255,0.05); color: #94a3b8; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.05); }
                .class-title { font-weight: 800; font-size: 1.25rem; color: #f8fafc; margin-top: 10px; letter-spacing: -0.5px; }

                .class-card-body { padding: 24px; flex-grow: 1; }
                .btn-manage { background: #0d948815; color: #2dd4bf; border: 1px solid #0d948840; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
                .class-card-dark:hover .btn-manage { background: #0d9488; color: white; }

                .avatar-mini { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: white; border: 2px solid #1e293b; }

                .empty-state-dark { border: 2px dashed rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); }
                .relative { position: relative; }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;