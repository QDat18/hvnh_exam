import React from 'react';
import { 
    Users, BookOpen, TrendingUp, Settings, 
    Database, FileQuestion, Zap, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardHome = () => {
    const { user } = useAuth();

    // --- RENDER NỘI DUNG CHÍNH THEO ROLE ---
    const renderContent = () => {
        switch (user?.role) {
            case 'ADMIN':
                return (
                    <div style={{ padding: '32px' }}>
                        <div style={styles.gridStats}>
                            <StatCard title="Tổng Người dùng" value="5,240" sub="+12% tuần này" icon={<Users />} color="blue" />
                            <StatCard title="Môn học Active" value="48" sub="Trên tổng số 52" icon={<BookOpen />} color="green" />
                            <StatCard title="Lượt truy cập" value="12.5K" sub="Hôm nay" icon={<TrendingUp />} color="purple" />
                            <StatCard title="Hệ thống" value="99.9%" sub="Uptime" icon={<Settings />} color="orange" />
                        </div>
                        <div style={styles.sectionTitle}>Hoạt động hệ thống gần đây</div>
                        <div style={styles.card}>
                            <ActivityItem time="10:30 AM" user="Nguyễn Văn A" action="Đã đăng ký tài khoản mới" />
                            <ActivityItem time="10:15 AM" user="Trần Thị B" action="Đã cập nhật đề cương môn Toán" />
                            <ActivityItem time="09:45 AM" user="Admin" action="Đã sao lưu cơ sở dữ liệu" />
                        </div>
                    </div>
                );
            case 'TEACHER':
                return (
                    <div style={{ padding: '32px' }}>
                         <div style={styles.gridStats}>
                            <StatCard title="Lớp phụ trách" value="03" sub="HK1 - 2026" icon={<BookOpen />} color="blue" />
                            <StatCard title="Ngân hàng câu hỏi" value="1,250" sub="+50 câu mới" icon={<Database />} color="green" />
                            <StatCard title="Bài chờ duyệt" value="12" sub="Cần xử lý" icon={<FileQuestion />} color="orange" />
                        </div>
                        {/* ... Các phần khác của Teacher giữ nguyên ... */}
                    </div>
                );
            case 'STUDENT':
            default:
                return (
                    <div style={{ padding: '32px' }}>
                        <div style={styles.welcomeBanner}>
                            <div>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>Chào {user?.fullName}, sẵn sàng chưa? 🚀</h2>
                                <p style={{ margin: 0, opacity: 0.9 }}>Bạn có bài kiểm tra <strong>Kinh tế lượng</strong> sắp tới.</p>
                                <button style={styles.bannerBtn}>Ôn tập ngay</button>
                            </div>
                            <div style={styles.bannerDecoration} />
                        </div>
                        {/* ... Các phần thống kê của Student ... */}
                    </div>
                );
        }
    };

    return <>{renderContent()}</>;
};

// --- Copy lại các component con và styles cần thiết từ file cũ vào đây ---
// (StatCard, ActivityItem, styles...)
// ...

const styles: { [key: string]: React.CSSProperties } = {
     // Copy styles liên quan đến nội dung dashboard (gridStats, card, welcomeBanner...) vào đây
     gridStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
     sectionTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#111827' },
     card: { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
     // ...
     welcomeBanner: { background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 20px rgba(26, 35, 126, 0.2)' },
     bannerBtn: { background: '#FDB913', color: '#1a237e', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
     bannerDecoration: { position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' },
};

// ── Component StatCard thật (thay placeholder cũ) ────────────────────────────
const colorMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: '#eff6ff', text: '#1d4ed8' },
    green:  { bg: '#f0fdf4', text: '#16a34a' },
    purple: { bg: '#f5f3ff', text: '#7c3aed' },
    orange: { bg: '#fff7ed', text: '#ea580c' },
};

const StatCard = ({ title, value, sub, icon, color }: {
    title: string; value: string; sub: string;
    icon: React.ReactNode; color: string;
}) => {
    const c = colorMap[color] || colorMap.blue;
    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginTop: 4 }}>{title}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>
            </div>
        </div>
    );
};

// ── Component ActivityItem thật ───────────────────────────────────────────────
const ActivityItem = ({ time, user, action }: { time: string; user: string; action: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
        <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user)}&background=e0e7ff&color=4f46e5&size=36`}
            style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
            alt={user}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{user}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 1 }}>{action}</div>
        </div>
        <time style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0 }}>{time}</time>
    </div>
);

export default DashboardHome;