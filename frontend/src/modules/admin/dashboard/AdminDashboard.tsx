import React, { useState, useEffect } from 'react';
import axiosClient from '../../../services/axiosClient';
import {
    Users, BookOpen, Activity, Server, Clock3, GraduationCap,
    BookCheck, AlertCircle, TrendingUp, ChevronRight, Loader2, Bot, Shield,
    ArrowUpRight, Users2, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// Mock data for charts if API doesn't provide historical data yet
const mockTrendData = [
    { name: 'Mon', exams: 120, students: 450 },
    { name: 'Tue', exams: 150, students: 520 },
    { name: 'Wed', exams: 220, students: 680 },
    { name: 'Thu', exams: 180, students: 610 },
    { name: 'Fri', exams: 250, students: 820 },
    { name: 'Sat', exams: 310, students: 940 },
    { name: 'Sun', exams: 280, students: 860 },
];

const mockStatusData = [
    { name: 'Hoàn thành', value: 400, color: '#3b82f6' },
    { name: 'Đang thi', value: 300, color: '#22c55e' },
    { name: 'Chưa tham gia', value: 300, color: '#94a3b8' }, // Lightened gray
];

const mockFacultyData = [
    { name: 'CNTT', active: 45, inactive: 12 },
    { name: 'Kinh tế', active: 38, inactive: 15 },
    { name: 'Ngân hàng', active: 52, inactive: 8 },
    { name: 'Luật', active: 24, inactive: 20 },
    { name: 'Ngoại ngữ', active: 31, inactive: 14 },
];

interface RecentActivity {
    userName: string;
    avatarUrl?: string;
    action: string;
    timeAgo: string;
    timestamp: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.allSettled([
            axiosClient.get('/admin/statistics'),
            axiosClient.get('/admin/recent-activities')
        ]).then((results) => {
            const [statsRes, activitiesRes] = results;

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data);
            }

            if (activitiesRes.status === 'fulfilled') {
                const activitiesData = activitiesRes.value.data;
                setActivities(Array.isArray(activitiesData) ? activitiesData : []);
            }
        }).catch(err => {
            console.error("Dashboard error:", err);
            toast.error("Không thể kết nối với hệ thống thống kê!");
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <div className="admin-dashboard-light min-vh-100 p-4" style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}>
            {/* WELCOME HEADER */}
            <header className="mb-5 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-4">
                    <div className="dashboard-logo pulsate">
                        <Bot size={36} color="#6366f1" />
                    </div>
                    <div>
                        <h1 className="fw-bold mb-1" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>iReview Control Center</h1>
                        <div className="d-flex align-items-center gap-3 text-slate-500 small">
                            <span className="d-flex align-items-center gap-1"><Calendar size={14} /> {new Date().toLocaleDateString('vi-VN')}</span>
                            <span className="status-indicator">Hệ thống đang hoạt động ổn định</span>
                        </div>
                    </div>
                </div>
                <div className="d-none d-md-flex gap-2">
                    <button className="btn-action">Tải báo cáo</button>
                    <button className="btn-action primary" onClick={() => navigate('/admin/settings')}>Cấu hình</button>
                </div>
            </header>

            {/* KEY METRICS */}
            {/* KEY METRICS */}
            <section className="row g-4 mb-5">
                {[
                    { title: "Tổng người dùng", value: stats?.totalUsers || 0, icon: Users2, color: "#6366f1", trend: "+12.5%" },
                    { title: "Môn học Active", value: stats?.activeSubjects || 0, icon: BookOpen, color: "#f59e0b", trend: "+3.2%" },
                    { title: "Lượt thi hôm nay", value: stats?.examsTodayCount || 0, icon: Activity, color: "#10b981", trend: "+8.4%" },
                    // Đã thay thế Uptime bằng "Đang thi trực tuyến"
                    { title: "Đang thi trực tuyến", value: stats?.activeSessions || 42, icon: Clock3, color: "#ec4899", trend: "Live" },
                ].map((stat, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="metric-card">
                            <div className="d-flex justify-content-between mb-4">
                                <div className="metric-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="trend-badge d-flex align-items-center gap-1" style={stat.trend === 'Live' ? { backgroundColor: '#fce7f3', color: '#ec4899' } : {}}>
                                    {stat.trend !== 'Live' && <ArrowUpRight size={12} />}
                                    {stat.trend === 'Live' && <span className="spinner-grow spinner-grow-sm" style={{ width: '8px', height: '8px', marginRight: '2px' }}></span>}
                                    {stat.trend}
                                </div>
                            </div>
                            <h2 className="display-6 fw-extrabold mb-1">{loading ? '...' : (typeof stat.value === 'number' ? stat.value.toLocaleString('vi-VN') : stat.value)}</h2>
                            <span className="text-slate-500 fw-medium small text-uppercase" style={{ letterSpacing: '1px' }}>{stat.title}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* CHARTS SECTION */}
            <section className="row g-4 mb-5">
                <div className="col-lg-8">
                    <div className="dashboard-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0">Xu hướng tham gia thi</h5>
                            <select className="light-select">
                                <option>7 ngày qua</option>
                                <option>30 ngày qua</option>
                            </select>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Area type="monotone" dataKey="exams" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorExams)" />
                                    <Area type="monotone" dataKey="students" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="dashboard-card h-100">
                        <h5 className="fw-bold mb-4">Trạng thái thi tuyển</h5>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={mockStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {mockStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* LOWER SECTION: ACTIVITY & FACULTY */}
            <section className="row g-4 mb-4">
                <div className="col-lg-7">
                    <div className="dashboard-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0">Hoạt động Realtime</h5>
                            <button className="btn-link-slate" onClick={() => navigate('/admin/logs')}>Xem log hệ thống</button>
                        </div>
                        <div className="activity-list">
                            {loading ? (
                                <div className="text-center py-5"><Loader2 className="spin text-indigo-500" /></div>
                            ) : activities.length === 0 ? (
                                <div className="empty-activity text-center py-5">
                                    <Activity size={40} className="mb-2 opacity-20 text-slate-400" />
                                    <p className="text-slate-500 italic">Chưa có hành động nào gần đây</p>
                                </div>
                            ) : (
                                activities.map((act, idx) => (
                                    <div key={idx} className="activity-item">
                                        <div className="activity-avatar">
                                            {act.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="activity-desc text-slate-800">{act.action}</div>
                                            <div className="activity-time">{act.timeAgo}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="dashboard-card h-100">
                        <h5 className="fw-bold mb-4">Phân bổ theo Khoa</h5>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Thêm barGap={6} để tách 2 cột xanh/xám ra một chút */}
                                <BarChart data={mockFacultyData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barGap={6}>
                                    {/* Lưới ngang làm mờ hẳn đi (#f1f5f9) để tránh rối mắt */}
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />

                                    {/* Tinh chỉnh dx=-10 để chữ cách xa cột một chút, font chữ xám thanh lịch */}
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                        tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600, dx: -10 }}
                                    />

                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px 14px' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 500, fontSize: '13px' }}
                                        labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '6px' }}
                                    />

                                    {/* Thu nhỏ barSize xuống 10 để nhìn thanh thoát hơn */}
                                    <Bar dataKey="active" name="Hoạt động" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={10} />
                                    <Bar dataKey="inactive" name="Tạm khóa" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                .admin-dashboard-light {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .dashboard-logo {
                    width: 60px;
                    height: 60px;
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .status-indicator::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
                }

                .btn-action {
                    padding: 8px 18px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #1e293b;
                    transition: all 0.2s;
                }
                .btn-action:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                }
                .btn-action.primary {
                    background: #6366f1;
                    border-color: #6366f1;
                    color: white;
                }
                .btn-action.primary:hover {
                    background: #4f46e5;
                }

                .metric-card {
                    background: #ffffff;
                    border-radius: 20px;
                    padding: 24px;
                    border: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .metric-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                }

                .metric-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .trend-badge {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 4px 8px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .dashboard-card {
                    background: #ffffff;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                }

                .light-select {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    outline: none;
                    cursor: pointer;
                }
                .light-select:hover {
                    border-color: #cbd5e1;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    border-radius: 12px;
                    transition: background 0.2s;
                    cursor: pointer;
                }
                .activity-item:hover {
                    background: #f8fafc;
                }
                .activity-avatar {
                    width: 36px;
                    height: 36px;
                    background: #e2e8f0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: #475569;
                }
                .activity-desc {
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .activity-time {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .btn-link-slate {
                    background: transparent;
                    border: none;
                    color: #6366f1;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .btn-link-slate:hover {
                    text-decoration: underline;
                }

                .fw-extrabold { font-weight: 800; }
                
                .pulsate {
                    animation: pulsate-indigo 3s infinite ease-in-out;
                }
                @keyframes pulsate-indigo {
                    0%, 100% { box-shadow: 0 0 0 rgba(99, 102, 241, 0); }
                    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); }
                }

                .loader-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;