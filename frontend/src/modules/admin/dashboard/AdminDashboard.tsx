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
    { name: 'Chưa tham gia', value: 300, color: '#64748b' },
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
        <div className="admin-dashboard-dark min-vh-100 p-4" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
            {/* WELCOME HEADER */}
            <header className="mb-5 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-4">
                    <div className="dashboard-logo pulsate">
                        <Bot size={36} color="#6366f1" />
                    </div>
                    <div>
                        <h1 className="fw-bold mb-1" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>iReview Control Center</h1>
                        <div className="d-flex align-items-center gap-3 text-slate-400 small">
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
            <section className="row g-4 mb-5">
                {[
                    { title: "Tổng người dùng", value: stats?.totalUsers || 0, icon: Users2, color: "#6366f1", trend: "+12.5%" },
                    { title: "Môn học Active", value: stats?.activeSubjects || 0, icon: BookOpen, color: "#f59e0b", trend: "+3.2%" },
                    { title: "Lượt thi hôm nay", value: stats?.examsTodayCount || 0, icon: Activity, color: "#10b981", trend: "+8.4%" },
                    { title: "Uptime hệ thống", value: stats?.uptime || '99.9%', icon: Server, color: "#3b82f6", trend: "0.0%" },
                ].map((stat, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="metric-card">
                            <div className="d-flex justify-content-between mb-4">
                                <div className="metric-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="trend-badge d-flex align-items-center gap-1">
                                    <ArrowUpRight size={12} /> {stat.trend}
                                </div>
                            </div>
                            <h2 className="display-6 fw-extrabold mb-1">{loading ? '...' : (typeof stat.value === 'number' ? stat.value.toLocaleString('vi-VN') : stat.value)}</h2>
                            <span className="text-slate-400 fw-medium small text-uppercase" style={{ letterSpacing: '1px' }}>{stat.title}</span>
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
                            <select className="dark-select">
                                <option>7 ngày qua</option>
                                <option>30 ngày qua</option>
                            </select>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
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
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
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
                                    <Activity size={40} className="mb-2 opacity-20" />
                                    <p className="text-slate-500 italic">Chưa có hành động nào gần đây</p>
                                </div>
                            ) : (
                                activities.map((act, idx) => (
                                    <div key={idx} className="activity-item">
                                        <div className="activity-avatar">
                                            {act.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="activity-desc text-slate-200">{act.action}</div>
                                            <div className="activity-time">{act.timeAgo}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-600" />
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
                                <BarChart data={mockFacultyData} layout="vertical" margin={{ left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{fill: '#334155', opacity: 0.4}}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                    />
                                    <Bar dataKey="active" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                                    <Bar dataKey="inactive" fill="#334155" radius={[0, 4, 4, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                .admin-dashboard-dark {
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
                    box-shadow: 0 0 8px #10b981;
                }

                .btn-action {
                    padding: 8px 18px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    border: 1px solid #334155;
                    background: #1e293b;
                    color: white;
                    transition: all 0.2s;
                }
                .btn-action:hover {
                    background: #334155;
                }
                .btn-action.primary {
                    background: #6366f1;
                    border-color: #6366f1;
                }
                .btn-action.primary:hover {
                    background: #4f46e5;
                }

                .metric-card {
                    background: #1e293b;
                    border-radius: 20px;
                    padding: 24px;
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: transform 0.2s;
                }
                .metric-card:hover {
                    transform: translateY(-5px);
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
                    background: #1e293b;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .dark-select {
                    background: #0f172a;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    outline: none;
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
                    background: rgba(255,255,255,0.03);
                }
                .activity-avatar {
                    width: 36px;
                    height: 36px;
                    background: #334155;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: white;
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
                    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
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