import React from 'react';
import { 
    Users, BookOpen, TrendingUp, Settings, 
    Database, FileQuestion, ChevronRight, Activity, Calendar, Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- RENDER NỘI DUNG CHÍNH THEO ROLE ---
    const renderContent = () => {
        switch (user?.role) {
            case 'ADMIN':
                return (
                    <div style={{ padding: '32px', backgroundColor: '#0f172a', minHeight: '100vh' }}>
                        <div className="d-flex justify-content-between align-items-center mb-5">
                            <div>
                                <h1 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '2rem', marginBottom: '8px' }}>Hệ thống Quản lý</h1>
                                <p style={{ color: '#94a3b8', margin: 0 }}>Chào mừng Admin trở lại phiên làm việc.</p>
                            </div>
                            <button className="dashboard-btn-primary" onClick={() => navigate('/admin')}>Bảng điều khiển chi tiết</button>
                        </div>

                        <div style={styles.gridStats}>
                            <StatCard title="Tổng Người dùng" value="5,240" sub="+12% tuần này" icon={<Users />} color="indigo" />
                            <StatCard title="Môn học Active" value="48" sub="Trên tổng số 52" icon={<BookOpen />} color="amber" />
                            <StatCard title="Lượt truy cập" value="12.5K" sub="Hôm nay" icon={<TrendingUp />} color="emerald" />
                            <StatCard title="Uptime" value="99.9%" sub="Hệ thống ổn định" icon={<Settings />} color="blue" />
                        </div>

                        <div className="row g-4">
                            <div className="col-lg-8">
                                <div style={styles.sectionTitle}>Hoạt động hệ thống gần đây</div>
                                <div style={styles.card}>
                                    <ActivityItem time="10:30 AM" user="Nguyễn Văn A" action="Đã đăng ký tài khoản mới" />
                                    <ActivityItem time="10:15 AM" user="Trần Thị B" action="Đã cập nhật đề cương môn Toán" />
                                    <ActivityItem time="09:45 AM" user="Admin" action="Đã sao lưu cơ sở dữ liệu" />
                                    <ActivityItem time="08:20 AM" user="Lê Văn C" action="Đã nộp bài thi môn Triết học" />
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <div style={styles.sectionTitle}>Phím tắt nhanh</div>
                                <div style={styles.card}>
                                    <QuickAction icon={<Database />} title="Quản lý Ngân hàng" desc="Tạo và duyệt câu hỏi" />
                                    <QuickAction icon={<Users />} title="Quản lý Sinh viên" desc="Danh sách và phân lớp" />
                                    <QuickAction icon={<Bot />} title="Cấu hình AI" desc="Thiết lập giám sát tự động" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'TEACHER':
                return (
                    <div style={{ padding: '32px', backgroundColor: '#0f172a', minHeight: '100vh' }}>
                         <div className="mb-5">
                            <h1 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '2rem', marginBottom: '8px' }}>Portal Giảng viên</h1>
                            <p style={{ color: '#94a3b8', margin: 0 }}>Quản lý lớp học và giám sát thi trực tuyến.</p>
                         </div>

                         <div style={styles.gridStats}>
                            <StatCard title="Lớp phụ trách" value="03" sub="HK1 - 2026" icon={<GraduationCapIcon />} color="indigo" />
                            <StatCard title="Ngân hàng câu hỏi" value="1,250" sub="+50 câu mới" icon={<Database />} color="emerald" />
                            <StatCard title="Bài chờ duyệt" value="12" sub="Cần xử lý ngay" icon={<FileQuestion />} color="amber" />
                            <StatCard title="Sinh viên online" value="86" sub="Đang trong phòng thi" icon={<Activity />} color="rose" />
                        </div>
                        
                        <div style={styles.sectionTitle}>Lớp học đang diễn ra</div>
                        <div className="row g-4">
                            {[1, 2].map(i => (
                                <div className="col-md-6" key={i}>
                                    <div style={styles.card}>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h5 style={{ color: '#f8fafc', fontWeight: 700, margin: 0 }}>Toán Cao Cấp A1 - Nhóm {i}</h5>
                                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Phòng: P.30{i} | Giờ thi: 08:30 - 10:00</span>
                                            </div>
                                            <span className="badge-live">LIVE</span>
                                        </div>
                                        <div className="d-flex gap-3 mb-4">
                                            <div className="text-center">
                                                <div style={{ color: '#f8fafc', fontWeight: 700 }}>45</div>
                                                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Sĩ số</div>
                                            </div>
                                            <div className="text-center">
                                                <div style={{ color: '#22c55e', fontWeight: 700 }}>42</div>
                                                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Có mặt</div>
                                            </div>
                                            <div className="text-center">
                                                <div style={{ color: '#ef4444', fontWeight: 700 }}>0</div>
                                                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Vi phạm</div>
                                            </div>
                                        </div>
                                        <button className="dashboard-btn-outline" onClick={() => navigate(`/teacher/monitor/class-${i}/room-${i}`)}>
                                            Vào Giám sát <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'STUDENT':
            default:
                return (
                    <div style={{ padding: '32px', backgroundColor: '#0f172a', minHeight: '100vh' }}>
                        <div style={styles.welcomeBanner}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: 800 }}>Chào {user?.fullName || 'Sinh viên'}! 👋</h2>
                                <p style={{ margin: 0, opacity: 0.8, fontSize: '1.1rem', maxWidth: '500px' }}>
                                    Hôm nay bạn có bài kiểm tra <strong>Kinh tế lượng</strong> lúc 14:00. Đừng quên chuẩn bị thiết bị thật tốt nhé!
                                </p>
                                <div className="d-flex gap-3 mt-4">
                                    <button className="dashboard-btn-light">Vào thi ngay</button>
                                    <button className="dashboard-btn-glass">Xem lịch thi</button>
                                </div>
                            </div>
                            <div style={styles.bannerDecoration} />
                        </div>
                        
                        <div className="row g-4">
                            <div className="col-md-8">
                                <div style={styles.sectionTitle}>Kết quả thi gần đây</div>
                                <div style={styles.card}>
                                    <ResultItem subject="Pháp luật đại cương" score="8.5" date="25/03/2026" status="Đạt" />
                                    <ResultItem subject="Tin học văn phòng" score="9.0" date="20/03/2026" status="Đạt" />
                                    <ResultItem subject="Anh văn chuyên ngành" score="7.8" date="15/03/2026" status="Đạt" />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div style={styles.sectionTitle}>Thông báo</div>
                                <div style={styles.card}>
                                    <div className="notification-item">
                                        <div className="dot blue"></div>
                                        <div className="small text-slate-300">Nhắc hẹn: Thi cuối kỳ môn Marketing</div>
                                    </div>
                                    <div className="notification-item">
                                        <div className="dot gold"></div>
                                        <div className="small text-slate-300">Thông báo: Bảo trì hệ thống chủ nhật</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-root">
            {renderContent()}
            <style>{`
                .dashboard-root {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                .dashboard-btn-primary {
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    transition: all 0.2s;
                }
                .dashboard-btn-primary:hover {
                    background: #4f46e5;
                    transform: translateY(-2px);
                }
                .dashboard-btn-outline {
                    background: rgba(255,255,255,0.05);
                    color: #f8fafc;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .dashboard-btn-outline:hover {
                    background: rgba(255,255,255,0.1);
                }
                .dashboard-btn-light {
                    background: white;
                    color: #1e293b;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-weight: 800;
                }
                .dashboard-btn-glass {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-weight: 800;
                    backdrop-filter: blur(5px);
                }
                .badge-live {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    animation: pulse-red 2s infinite;
                }
                @keyframes pulse-red {
                    0% { opacity: 1; }
                    50% { opacity: 0.6; }
                    100% { opacity: 1; }
                }
                .notification-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .dot.blue { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
                .dot.gold { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
            `}</style>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
     gridStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
     sectionTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: '#f8fafc', letterSpacing: '-0.5px' },
     card: { background: '#1e293b', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' },
     welcomeBanner: { background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', borderRadius: '28px', padding: '48px', color: 'white', marginBottom: '40px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(67, 56, 202, 0.2)' },
     bannerDecoration: { position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' },
};

const colorMap: Record<string, { bg: string; text: string }> = {
    indigo:   { bg: 'rgba(99, 102, 241, 0.1)', text: '#818cf8' },
    emerald:  { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399' },
    rose:     { bg: 'rgba(244, 63, 94, 0.1)', text: '#fb7185' },
    amber:    { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24' },
    blue:     { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa' },
};

const StatCard = ({ title, value, sub, icon, color }: {
    title: string; value: string; sub: string;
    icon: React.ReactNode; color: string;
}) => {
    const c = colorMap[color] || colorMap.indigo;
    return (
        <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8', marginTop: 8 }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{sub}</div>
            </div>
        </div>
    );
};

const ActivityItem = ({ time, user, action }: { time: string; user: string; action: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 40, height: 40, background: '#334155', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#f8fafc' }}>
            {user.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>{user}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 1 }}>{action}</div>
        </div>
        <time style={{ fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }}>{time}</time>
    </div>
);

const QuickAction = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', padding: '8px', borderRadius: '12px', transition: 'background 0.2s' }} className="quick-action-hover">
        <div style={{ color: '#6366f1' }}>{icon}</div>
        <div>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>{title}</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{desc}</div>
        </div>
    </div>
);

const ResultItem = ({ subject, score, date, status }: { subject: string, score: string, date: string, status: string }) => (
    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1 }}>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>{subject}</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{date}</div>
        </div>
        <div className="text-end">
            <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '1.2rem' }}>{score}</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{status}</div>
        </div>
    </div>
);

const GraduationCapIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);

const GraduationCap = () => <GraduationCapIcon />;

export default DashboardHome;