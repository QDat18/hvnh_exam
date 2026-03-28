import React, { useState, useEffect } from 'react';
import axiosClient from '../../../services/axiosClient';
import {
    Users, BookOpen, Activity, Server, Clock3, GraduationCap,
    BookCheck, AlertCircle, TrendingUp, ChevronRight, Loader2, Bot, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Định nghĩa kiểu dữ liệu cho hoạt động gần đây
interface RecentActivity {
    userName: string;
    avatarUrl?: string;
    action: string;
    timeAgo: string;
    timestamp: string; // LocalDateTime string from Java
}

const AdminDashboard: React.FC = () => {
    // States lưu dữ liệu API — khởi tạo rỗng an toàn
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    // Gọi API lấy dữ liệu song song
    useEffect(() => {
        setLoading(true);
        Promise.allSettled([
            axiosClient.get('/admin/statistics'),
            axiosClient.get('/admin/recent-activities')
        ]).then((results) => {
            const [statsRes, activitiesRes] = results;

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data);
            } else {
                // Lỗi API 404 hoặc Backend chưa viết
                console.warn("⚠️ API Thống kê lỗi hoặc chưa sẵn sàng.");
            }

            if (activitiesRes.status === 'fulfilled') {
                // 🔥 SỬA: Bọc thép kiểm tra mảng an toàn
                const activitiesData = activitiesRes.value.data;
                setActivities(Array.isArray(activitiesData) ? activitiesData : []);
            } else {
                console.warn("⚠️ API Hoạt động gần đây lỗi hoặc chưa sẵn sàng.");
            }
        }).catch(err => {
            console.error("Lỗi nghiêm trọng khi tải dữ liệu dashboard:", err);
            toast.error("Không thể kết nối với hệ thống thống kê!");
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <div className="container-fluid py-4 animation-fade-in">
            {/* Tiêu đề chào mừng */}
            <header className="mb-4 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                        <Bot size={32} />
                    </div>
                    <div>
                        <h1 className="fw-bold text-dark mb-1">Hệ thống Ôn Thi Trắc nghiệm — iReview</h1>
                        <p className="text-muted mb-0">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </header>

            {/* Metrics — 🔥 ĐÃ SỬA: Bọc Optional Chaining ?. và giá trị mặc định || 0 để chống sập */}
            <section className="row g-4 mb-4" aria-label="Các chỉ số thống kê">
                {[
                    {
                        title: "Tổng người dùng",
                        value: loading ? '…' : (stats?.totalUsers || 0).toLocaleString('vi-VN'),
                        icon: Users, color: "primary", badge: "", badgeClass: ""
                    },
                    {
                        title: "Môn học Active",
                        value: loading ? '…' : String(stats?.activeSubjects || 0),
                        icon: BookOpen, color: "warning", badge: "", badgeClass: ""
                    },
                    {
                        title: "Lượt thi toàn trường",
                        value: loading ? '…' : (stats?.examsTodayCount || 0).toLocaleString('vi-VN'), // Đã đổi key khớp backend
                        icon: Activity, color: "info", badge: "", badgeClass: ""
                    },
                    {
                        title: "System Uptime",
                        value: loading ? '…' : (stats?.uptime || '99.9% (HARDCODED)'),
                        icon: Server, color: "danger", badge: "Ổn định", badgeClass: "badge-soft-info"
                    },
                ].map((stat, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="ent-card h-100 card p-3 border-0">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className={`bg-${stat.color} bg-opacity-10 p-2 rounded-3 text-${stat.color}`}>
                                    <stat.icon size={24} aria-hidden="true" />
                                </div>
                                {stat.badge && <span className={`ent-badge ${stat.badgeClass}`}>{stat.badge}</span>}
                            </div>
                            <h2 className="fs-3 fw-bold text-dark mb-1">{stat.value}</h2>
                            <p className="text-muted small mb-0">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </section>

            {/* Các shortcut nhanh cho Admin */}
            <section className="row g-4 mb-4" aria-label="Thao tác nhanh">
                <div className="col-md-4">
                    <div
                        className="ent-card card p-4 border-0 d-flex align-items-center gap-3 flex-row hover-bg-light cursor-pointer"
                        onClick={() => navigate('/admin/logs')} // 🔥 CẮM DÂY CHUYỂN TRANG VÀO ĐÂY
                    >
                        <Shield size={36} className="text-danger" />
                        <div>
                            <h6 className="fw-bold text-dark mb-1">Kiểm tra Nhật ký hành vi</h6>
                            <p className="small text-muted mb-0">Xem log hoạt động MongoDB realtime</p>
                        </div>
                        <ChevronRight className="ms-auto text-muted" />
                    </div>
                </div>
                <div className="col-md-4">
                    <div
                        className="ent-card card p-4 border-0 d-flex align-items-center gap-3 flex-row hover-bg-light cursor-pointer"
                        onClick={() => navigate('/admin/active-exams')}
                    >
                        <AlertCircle size={36} className="text-warning" />
                        <div>
                            <h6 className="fw-bold text-dark mb-1">Giám sát kỳ thi đang diễn ra</h6>
                            <p className="small text-muted mb-0">Xem danh sách phòng thi Active</p>
                        </div>
                        <ChevronRight className="ms-auto text-muted" />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="ent-card card p-4 border-0 d-flex align-items-center gap-3 flex-row hover-bg-light cursor-pointer">
                        <BookCheck size={36} className="text-success" />
                        <div>
                            <h6 className="fw-bold text-dark mb-1">Xuất dữ liệu thống kê môn học</h6>
                            <p className="small text-muted mb-0">Xuất file Excel báo cáo học kỳ</p>
                        </div>
                        <ChevronRight className="ms-auto text-muted" />
                    </div>
                </div>
            </section>

            {/* Bảng hoạt động gần đây (Recent Activities) */}
            <section className="row">
                <div className="col-12">
                    <div className="ent-card card p-4 border-0">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <Activity className="text-primary" size={20} /> Hoạt động thi cử gần nhất (Realtime)
                            </h5>
                            <button className="btn btn-sm btn-light rounded-pill px-3 fw-bold">Xem tất cả</button>
                        </div>

                        <div className="activity-feed">
                            {loading ? (
                                <div className="text-center py-4"><Loader2 className="spin text-primary" /></div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-4 text-muted fst-italic fs-7 bg-light rounded-3 border">
                                    Chưa có hoạt động nộp bài nào được ghi nhận.
                                </div>
                            ) : (
                                activities.map((act, idx) => (
                                    <div key={idx} className="d-flex gap-3 align-items-center py-3 border-bottom-dashed">
                                        <div className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center fw-bold" style={{ width: '36px', height: '36px' }}>
                                            {act.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="text-dark small lh-base">{act.action}</div>
                                            <div className="d-flex align-items-center gap-2 text-muted x-small">
                                                <Clock3 size={12} /> {act.timeAgo}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;