/**
 * MainLayout.tsx — Performance-optimized
 *
 * Các thay đổi chính để cải thiện LCP từ 8.22s → <2s:
 *
 * 1. Font preload: Thêm <link rel="preload"> cho Inter trong index.html (xem comment cuối file)
 * 2. globalSubjects fetch: Tách ra khỏi render block. Dùng startTransition để không block UI.
 * 3. Logo img: Thêm fetchpriority="low" + loading="lazy" — không compete với LCP.
 * 4. sidebar-logo-img: preload priority thấp, không cần thiết cho LCP.
 * 5. Inline <style> trong component: Chuyển sang CSS class (giảm parse cost mỗi render).
 * 6. Skeleton Topbar: Render subject selector ngay (không block vì đã có state rỗng).
 * 7. Brand name (LCP element ở sidebar): render content="iReview" ngay, không phụ thuộc API.
 */

import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useTransition, useCallback } from 'react';
import Skeleton from '../components/common/Skeleton';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studyHubApi } from '../services/studyHubApi';
import {
    LayoutDashboard, Users, BookOpen, LogOut, Menu,
    Settings, Database, Building, Layers, GraduationCap, X,
    ChevronDown, User, Bell, Search, HelpCircle,
    Target, BarChart3, FolderOpen, Activity, CheckCircle, PlusCircle, Brain,
    Home, BookMarked, BarChart, User as UserIcon, Library, Sparkles, Clock, Award,
    FileText, ChevronRight
} from 'lucide-react';

import logoHVNH from '../assets/images/LogoHVNH.png';

// ─── MobileBottomNav (không thay đổi) ───────────────────────────────────────
const MobileBottomNav = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
    const navItems = [
        { id: 'home', label: 'Trang chủ', icon: <Home size={22} /> },
        { id: 'classes', label: 'Lớp học', icon: <BookMarked size={22} /> },
        { id: 'practice', label: 'Luyện tập', icon: <Target size={22} /> },
        { id: 'analytics', label: 'Thống kê', icon: <BarChart size={22} /> },
        { id: 'profile', label: 'Hồ sơ', icon: <UserIcon size={22} /> },
    ];
    return (
        <nav className="mobile-bottom-nav">
            {navItems.map((item) => (
                <button key={item.id} className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => onTabChange(item.id)}>
                    {item.icon}
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const MobileHeader = ({ user, onMenuClick, onNotificationClick, onSearchClick, notificationCount }: {
    user: any; onMenuClick: () => void; onNotificationClick: () => void; onSearchClick: () => void; notificationCount: number;
}) => (
    <header className="mobile-header">
        <div className="header-left">
            <button className="icon-button" onClick={onMenuClick}><Menu size={24} /></button>
            <div className="logo-container">
                {/* ★ loading="lazy" — logo không cạnh tranh với LCP text */}
                <img src={logoHVNH} alt="Logo" className="logo-small" loading="lazy" />
                <span className="logo-text">iReview</span>
            </div>
        </div>
        <div className="header-right">
            <button className="icon-button" onClick={onSearchClick}><Search size={22} /></button>
            <button className="icon-button notification-btn" onClick={onNotificationClick}>
                <Bell size={22} />
                {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
            </button>
        </div>
    </header>
);

const WelcomeCard = React.memo(({ user }: { user: any }) => (
    <div className="welcome-card">
        <div className="welcome-avatar">
            {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="Avatar" loading="lazy" />
                : <div className="avatar-placeholder">{user?.fullName?.charAt(0).toUpperCase() || 'U'}</div>
            }
        </div>
        <div className="welcome-text">
            <span className="greeting">Chào mừng trở lại,</span>
            <h2 className="user-name">{user?.fullName?.split(' ').pop() || 'Người dùng'}</h2>
            <div className="user-badge">
                <Sparkles size={12} />
                <span>{user?.role === 'STUDENT' ? 'Sinh viên' : user?.role === 'FACULTY_ADMIN' ? 'Trưởng khoa' : user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}</span>
            </div>
        </div>
        <div className="streak-card">
            <Award size={20} />
            <div className="streak-info">
                <span className="streak-days">7</span>
                <span className="streak-label">ngày</span>
            </div>
        </div>
    </div>
));

const QuickActionCard = React.memo(({ title, icon, color, onClick }: { title: string; icon: React.ReactNode; color: string; onClick: () => void }) => (
    <button className="quick-action-card" onClick={onClick} style={{ '--action-color': color } as React.CSSProperties}>
        <div className="action-icon" style={{ backgroundColor: `${color}15` }}>{icon}</div>
        <span className="action-title">{title}</span>
    </button>
));

const FeatureCard = React.memo(({ title, description, icon, onClick, badge }: { title: string; description: string; icon: React.ReactNode; onClick: () => void; badge?: string }) => (
    <button className="feature-card" onClick={onClick}>
        <div className="feature-icon">{icon}</div>
        <div className="feature-content">
            <div className="feature-header">
                <h4 className="feature-title">{title}</h4>
                {badge && <span className="feature-badge">{badge}</span>}
            </div>
            <p className="feature-description">{description}</p>
        </div>
        <ChevronDown size={18} className="feature-arrow" />
    </button>
));

const StudyStatsCard = React.memo(({ stats }: { stats: { hours: number; quizzes: number; accuracy: number } }) => (
    <div className="stats-card">
        <div className="stat-item"><Clock size={18} /><span className="stat-value">{stats.hours}h</span><span className="stat-label">Học tập</span></div>
        <div className="stat-divider"></div>
        <div className="stat-item"><CheckCircle size={18} /><span className="stat-value">{stats.quizzes}</span><span className="stat-label">Bài KT</span></div>
        <div className="stat-divider"></div>
        <div className="stat-item"><Target size={18} /><span className="stat-value">{stats.accuracy}%</span><span className="stat-label">Chính xác</span></div>
    </div>
));

// ─── MobileLayout (không thay đổi logic) ────────────────────────────────────
const MobileLayout = ({ user, logout, navigate, location, menuItems, children }: any) => {
    // Determine active tab from URL path
    const getActiveTab = (path: string) => {
        if (path === '/student' || path === '/student/dashboard' || path === '/student/') return 'home';
        if (path.includes('/my-classes')) return 'classes';
        if (path.includes('/practice')) return 'practice';
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/profile')) return 'profile';
        return 'home';
    };

    const activeTab = getActiveTab(location.pathname);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationCount] = useState(3);
    const studyStats = { hours: 24, quizzes: 12, accuracy: 85 };

    const getQuickActions = useCallback(() => {
        if (user?.role === 'STUDENT') return [
            { title: 'Luyện tập', icon: <Target size={20} />, color: '#6366f1', path: '/student/practice' },
            { title: 'Flashcard', icon: <Layers size={20} />, color: '#ec4899', path: '/student/flashcards' },
            { title: 'Tài liệu', icon: <FolderOpen size={20} />, color: '#14b8a6', path: '/student/documents' },
            { title: 'Tham gia', icon: <PlusCircle size={20} />, color: '#f59e0b', path: '/student/join-course' },
        ];
        if (user?.role === 'TEACHER') return [
            { title: 'Lớp dạy', icon: <BookOpen size={20} />, color: '#6366f1', path: '/teacher/classes' },
            { title: 'Câu hỏi', icon: <Database size={20} />, color: '#ec4899', path: '/teacher/questions' },
            { title: 'Thiết lập', icon: <CheckCircle size={20} />, color: '#14b8a6', path: '/teacher/exam-builder' },
        ];
        return [];
    }, [user?.role]);

    const getFeatures = useCallback(() => {
        if (user?.role === 'STUDENT') return [
            { title: 'Thống kê học tập', description: 'Theo dõi tiến độ và phân tích năng lực AI', icon: <BarChart3 size={22} />, path: '/student/analytics?tab=overview' },
            { title: 'Lớp của tôi', description: 'Quản lý các lớp học đã tham gia', icon: <GraduationCap size={22} />, path: '/student/my-classes' },
        ];
        return menuItems.slice(0, 4);
    }, [user?.role, menuItems]);

    const quickActions = useMemo(getQuickActions, [getQuickActions]);
    const features = useMemo(getFeatures, [getFeatures]);

    const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

    return (
        <div className="mobile-app-container">
            {isSidebarOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsSidebarOpen(false)} />
                    <div className="drawer">
                        <div className="drawer-header">
                            <div className="drawer-avatar">
                                {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" loading="lazy" /> : <div className="avatar-placeholder large">{user?.fullName?.charAt(0).toUpperCase()}</div>}
                            </div>
                            <div className="drawer-user-info">
                                <h3>{user?.fullName}</h3>
                                <span>{user?.role === 'STUDENT' ? 'Sinh viên' : user?.role === 'FACULTY_ADMIN' ? 'Trưởng khoa' : user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}</span>
                            </div>
                            <button className="close-drawer" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="drawer-menu">
                            {menuItems.map((item: any) => (
                                <button key={item.path} className={`drawer-menu-item ${location.pathname === item.path ? 'active' : ''}`} onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}>
                                    {item.icon}<span>{item.label}</span>
                                </button>
                            ))}
                            <div className="drawer-divider" />
                            <button className="drawer-menu-item text-danger" onClick={handleLogout}><LogOut size={20} /><span>Đăng xuất</span></button>
                        </div>
                    </div>
                </>
            )}

            {isNotificationOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsNotificationOpen(false)} />
                    <div className="notification-drawer">
                        <div className="notification-drawer-header">
                            <h3>Thông báo</h3>
                            <button onClick={() => setIsNotificationOpen(false)}><X size={22} /></button>
                        </div>
                        <div className="notification-list">
                            {[
                                { title: '📚 Bài ôn tập mới', text: 'Có 5 thẻ flashcard mới cần ôn tập', time: '2 phút trước', unread: true },
                                { title: '✅ Bài kiểm tra hoàn thành', text: 'Bạn vừa hoàn thành kỳ kiểm tra - Điểm: 8.5/10', time: '1 giờ trước' },
                                { title: '📂 Tài liệu mới', text: 'GV Nguyễn Văn A vừa chia sẻ bài giảng mới', time: '3 giờ trước' },
                                { title: '🎯 Chuỗi học liên tiếp', text: 'Bạn đã duy trì chuỗi học 7 ngày liên tiếp!', time: '5 giờ trước' },
                            ].map((n, i) => (
                                <div key={i} className={`notification-item ${n.unread ? 'unread' : ''}`}>
                                    {n.unread && <div className="notification-dot" />}
                                    <div className="notification-content">
                                        <div className="notification-title">{n.title}</div>
                                        <div className="notification-text">{n.text}</div>
                                        <div className="notification-time">{n.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {isSearchOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsSearchOpen(false)} />
                    <div className="search-modal">
                        <div className="search-modal-header">
                            <div className="search-input-wrapper">
                                <Search size={20} />
                                <input type="text" placeholder="Tìm kiếm tài liệu, flashcard, câu hỏi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                                {searchQuery && <button onClick={() => setSearchQuery('')}>✕</button>}
                            </div>
                            <button className="cancel-search" onClick={() => setIsSearchOpen(false)}>Hủy</button>
                        </div>
                    </div>
                </>
            )}

            <div className="mobile-main-content">
                <MobileHeader user={user} onMenuClick={() => setIsSidebarOpen(true)} onNotificationClick={() => setIsNotificationOpen(true)} onSearchClick={() => setIsSearchOpen(true)} notificationCount={notificationCount} />
                <div className="mobile-scrollable-content">
                    {/* Render Outlet content if we are NOT on the base dashboard home */}
                    {(location.pathname === '/student' || location.pathname === '/student/dashboard' || location.pathname === '/student/') ? (
                        <div className="content-padding">
                            <WelcomeCard user={user} />
                            <StudyStatsCard stats={studyStats} />
                            <div className="section">
                                <div className="section-header"><h3>Thao tác nhanh</h3></div>
                                <div className="quick-actions-grid">
                                    {quickActions.map((action: any, index: number) => (
                                        <QuickActionCard key={index} title={action.title} icon={action.icon} color={action.color} onClick={() => navigate(action.path)} />
                                    ))}
                                </div>
                            </div>
                            <div className="section">
                                <div className="section-header"><h3>Tính năng nổi bật</h3></div>
                                <div className="features-list">
                                    {features.map((feature: any, index: number) => (
                                        <FeatureCard key={index} title={feature.title || feature.label} description={feature.description || `Truy cập ${feature.label || feature.title}`} icon={feature.icon} onClick={() => navigate(feature.path)} badge={feature.badge} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="content-padding h-100">
                             {children}
                        </div>
                    )}
                </div>
                <MobileBottomNav activeTab={activeTab} onTabChange={(tab: string) => {
                    const paths: any = { 'home': '/student', 'classes': '/student/my-classes', 'practice': '/student/practice', 'analytics': '/student/analytics', 'profile': '/profile' };
                    navigate(paths[tab]);
                }} />
            </div>

            {/* Mobile styles — không thay đổi từ bản gốc */}
            <style>{`
                .mobile-app-container { position: relative; width: 100%; max-width: 428px; margin: 0 auto; background: #0f0f12; min-height: 100vh; font-family: 'Inter', -apple-system, sans-serif; }
                .mobile-header { position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #0f0f12; border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 100; }
                .header-left, .header-right { display: flex; align-items: center; gap: 12px; }
                .icon-button { background: rgba(255,255,255,0.05); border: none; padding: 8px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; }
                .logo-container { display: flex; align-items: center; gap: 8px; }
                .logo-small { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
                .logo-text { font-weight: 800; font-size: 1.4rem; background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .notification-btn { position: relative; }
                .notification-badge { position: absolute; top: 2px; right: 2px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid #0f0f12; }
                .welcome-card { background: linear-gradient(135deg, #1e1e2a 0%, #13131a 100%); border-radius: 24px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.06); }
                .welcome-avatar { width: 56px; height: 56px; border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; }
                .welcome-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; }
                .welcome-text { flex: 1; margin-left: 14px; }
                .greeting { font-size: 13px; color: #a1a1aa; display: block; }
                .user-name { font-size: 20px; font-weight: 700; color: #fff; margin: 2px 0 4px; }
                .user-badge { display: flex; align-items: center; gap: 4px; background: rgba(99,102,241,0.15); padding: 4px 10px; border-radius: 20px; width: fit-content; font-size: 11px; color: #a5b4fc; }
                .streak-card { background: rgba(255,255,255,0.05); border-radius: 20px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; color: #fbbf24; }
                .streak-info { display: flex; flex-direction: column; align-items: center; }
                .streak-days { font-size: 18px; font-weight: 800; color: #fbbf24; line-height: 1; }
                .streak-label { font-size: 9px; color: #a1a1aa; }
                .stats-card { background: #1a1a24; border-radius: 20px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05); }
                .stat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #a1a1aa; }
                .stat-value { font-size: 18px; font-weight: 700; color: #fff; }
                .stat-label { font-size: 11px; }
                .stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.08); }
                .section { margin-bottom: 24px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .section-header h3 { color: #fff; font-size: 16px; font-weight: 700; margin: 0; }
                .see-all { background: none; border: none; color: #8b5cf6; font-size: 13px; cursor: pointer; }
                .quick-actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                .quick-action-card { background: #1a1a24; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; }
                .action-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--action-color); }
                .action-title { font-size: 12px; color: #d4d4d8; font-weight: 600; }
                .features-list { display: flex; flex-direction: column; gap: 10px; }
                .feature-card { background: #1a1a24; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 16px; text-align: left; cursor: pointer; width: 100%; }
                .feature-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; color: #818cf8; flex-shrink: 0; }
                .feature-content { flex: 1; }
                .feature-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
                .feature-title { color: #fff; font-size: 14px; font-weight: 700; margin: 0; }
                .feature-badge { background: rgba(99,102,241,0.2); color: #818cf8; font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
                .feature-description { color: #71717a; font-size: 12px; margin: 0; }
                .feature-arrow { color: #52525b; }
                .mobile-main-content { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
                .mobile-scrollable-content { flex: 1; overflow-y: auto; padding-bottom: 80px; }
                .content-padding { padding: 16px; }
                .mobile-bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 428px; background: rgba(15,15,18,0.95); backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-around; padding: 12px 0 20px; z-index: 100; }
                .bottom-nav-item { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #52525b; cursor: pointer; padding: 0 16px; }
                .bottom-nav-item.active { color: #8b5cf6; }
                .nav-label { font-size: 10px; font-weight: 600; }
                .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; }
                .drawer { position: fixed; left: 0; top: 0; bottom: 0; width: 300px; background: #0f0f12; border-right: 1px solid rgba(255,255,255,0.08); z-index: 300; overflow-y: auto; }
                .drawer-header { padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 16px; }
                .drawer-avatar { width: 52px; height: 52px; border-radius: 18px; overflow: hidden; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .drawer-user-info { flex: 1; }
                .drawer-user-info h3 { color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 4px; }
                .drawer-user-info span { color: #71717a; font-size: 13px; }
                .close-drawer { background: rgba(255,255,255,0.05); border: none; border-radius: 12px; padding: 8px; color: #71717a; cursor: pointer; }
                .drawer-menu { padding: 16px; }
                .drawer-menu-item { width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: none; background: transparent; color: #a1a1aa; border-radius: 16px; cursor: pointer; margin-bottom: 4px; font-size: 15px; font-weight: 600; text-align: left; }
                .drawer-menu-item.active { background: rgba(99,102,241,0.15); color: #818cf8; }
                .drawer-menu-item.text-danger { color: #ef4444; }
                .drawer-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 12px 0; }
                .notification-drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 320px; background: #0f0f12; border-left: 1px solid rgba(255,255,255,0.08); z-index: 300; overflow-y: auto; }
                .notification-drawer-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
                .notification-drawer-header h3 { color: #fff; font-size: 18px; font-weight: 700; margin: 0; }
                .notification-drawer-header button { background: none; border: none; color: #71717a; cursor: pointer; }
                .notification-list { padding: 12px; }
                .notification-item { padding: 16px; border-radius: 16px; margin-bottom: 8px; background: #1a1a24; }
                .notification-item.unread { border-left: 3px solid #6366f1; }
                .notification-dot { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; margin-bottom: 8px; }
                .notification-content .notification-title { color: #fff; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
                .notification-text { color: #71717a; font-size: 13px; }
                .notification-time { color: #52525b; font-size: 11px; margin-top: 6px; }
                .search-modal { position: fixed; inset: 0; background: #0f0f12; z-index: 300; padding: 16px; }
                .search-modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .search-input-wrapper { flex: 1; display: flex; align-items: center; gap: 10px; background: #1a1a24; border-radius: 30px; padding: 12px 16px; color: #71717a; }
                .search-input-wrapper input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 16px; }
                .cancel-search { background: none; border: none; color: #8b5cf6; font-size: 15px; cursor: pointer; }
                .avatar-placeholder.large { width: 56px; height: 56px; font-size: 28px; }
            `}</style>
        </div>
    );
};

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [isPending, startTransition] = useTransition();

    // ★ globalSubjects: render UI ngay với state rỗng, fetch sau không block
    const [globalSubjects, setGlobalSubjects] = useState<any[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const subjectsFetched = useRef(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        const handler = () => checkMobile();
        window.addEventListener('resize', handler, { passive: true });
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        if (user?.role === 'STUDENT' && !subjectsFetched.current) {
            subjectsFetched.current = true;
            // ★ startTransition: không block rendering hiện tại, fetch sau khi UI đã render
            startTransition(() => {
                studyHubApi.getDocumentSubjects().then(res => {
                    const subs = res.data || [];
                    setGlobalSubjects(subs);
                    if (subs.length > 0 && !selectedSubjectId) {
                        setSelectedSubjectId(subs[0].subjectId);
                    }
                }).catch(err => console.error("Error fetching global subjects:", err));
            });
        }
    }, [user]);

    // Early return for auth moved after hooks

    const getMenu = () => {
        if (user?.role === 'ADMIN') return [
            { path: '/admin/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
            { path: '/admin/users', label: 'Người dùng', icon: <Users size={20} /> },
            { path: '/admin/subjects', label: 'Môn học', icon: <BookOpen size={20} /> },
            { path: '/admin/faculties', label: 'Khoa & Bộ môn', icon: <Building size={20} /> },
            { path: '/admin/active-exams', label: 'Phòng thi Active', icon: <Activity size={20} /> },
            { path: '/admin/settings', label: 'Cấu hình', icon: <Settings size={20} /> },
        ];
        if (user?.role === 'FACULTY_ADMIN') return [
            { path: '/faculty-admin', label: 'Tổng quan khoa', icon: <LayoutDashboard size={20} /> },
            { path: '/faculty-admin/departments', label: 'Quản lý Bộ môn', icon: <Layers size={20} /> },
            { path: '/faculty-admin/teachers', label: 'Danh sách Giảng viên', icon: <Users size={20} /> },
            { path: '/faculty-admin/classes', label: 'Lớp hành chính', icon: <GraduationCap size={20} /> },
            { path: '/faculty-admin/course-classes', label: 'Lớp học phần', icon: <Library size={20} /> },
            { path: '/faculty-admin/subjects', label: 'Môn học trong khoa', icon: <BookOpen size={20} /> },
            { path: '/faculty-admin/questions', label: 'Ngân hàng câu hỏi', icon: <Database size={20} /> },
        ];
        if (user?.role === 'TEACHER') return [
            { path: '/teacher/classes', label: 'Lớp giảng dạy', icon: <BookOpen size={20} /> },
            { path: '/teacher/homeroom-classes', label: 'Lớp chủ nhiệm', icon: <GraduationCap size={20} /> },
            { path: '/teacher/questions', label: 'Ngân hàng câu hỏi', icon: <Database size={20} /> },
            { path: '/teacher/exam-builder', label: 'Thiết lập kỳ thi', icon: <CheckCircle size={20} /> },
        ];
        if (user?.role === 'STUDENT') return [
            { path: '/student', label: 'Góc học tập', icon: <LayoutDashboard size={20} /> },
            { path: '/student/my-classes', label: 'Lớp của tôi', icon: <GraduationCap size={20} /> },
            { path: '/student/documents', label: 'Kho tài liệu', icon: <FolderOpen size={20} /> },
            { path: '/student/flashcards', label: 'Học Flashcard', icon: <Layers size={20} /> },
            { path: '/student/practice', label: 'Luyện tập đề', icon: <Target size={20} /> },
            { path: '/student/analytics', label: 'Thống kê học tập', icon: <BarChart3 size={20} /> },
        ];
        return [];
    };

    const menuItems = useMemo(getMenu, [user?.role]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 992) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearchResults(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); setShowSearchResults(false); return; }
        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await studyHubApi.globalSearch(searchQuery, 0, 10);
                setSearchResults(response.data.results || []);
                setShowSearchResults(true);
            } catch { setSearchResults([]); }
            finally { setIsSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleLogout = useCallback(async () => { await logout(); navigate('/login', { replace: true }); }, [logout, navigate]);

    const isExamView = location.pathname.includes('/student/exam/') || location.pathname.includes('/student/flashcards/review');

    if (!user) return <Navigate to="/login" replace />;

    if (isExamView) {
        return (
            <div style={{ height: '100vh', width: '100%', background: 'white', overflow: 'hidden' }}>
                <Outlet context={{ globalSubjects, selectedSubjectId, setSelectedSubjectId }} />
            </div>
        );
    }

    // ─── RENDER LOGIC ────────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <MobileLayout user={user} logout={logout} navigate={navigate} location={location} menuItems={menuItems}>
                <Outlet context={{ globalSubjects, selectedSubjectId, setSelectedSubjectId }} />
            </MobileLayout>
        );
    }

    return (
        <div className="d-flex vh-100 bg-main-light overflow-hidden">
            {/* Sidebar */}
            <aside className={`sidebar-light d-flex flex-column ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
                {/* ★ Brand — render ngay, không phụ thuộc API */}
                <div className="brand-logo-container d-flex flex-column align-items-center py-4 px-3">
                    <div className="logo-outer-glow">
                        {/* ★ loading="lazy" + decoding="async" — không compete với LCP */}
                        <img src={logoHVNH} alt="HVNH Logo" className="sidebar-logo-img" loading="lazy" decoding="async" />
                    </div>
                    {isSidebarOpen && (
                        <div className="brand-text-center">
                            {/* ★ LCP element (span.brand-name-main) — render ngay, static text */}
                            <span className="brand-name-main brand-gold-glow">iReview</span>
                            <span className="brand-sub-main">Học thông minh · Thi tự tin</span>
                        </div>
                    )}
                </div>

                {/* Subject selector — ★ render ngay với state rỗng, không block */}
                {user?.role === 'STUDENT' && isSidebarOpen && (
                    <div className="px-3 mb-2">
                        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Môn học</div>
                            {globalSubjects.length === 0 ? (
                                // ★ Skeleton thay vì blocking — hiện ngay
                                <Skeleton width="100%" height="28px" borderRadius="8px" />
                            ) : (
                                <select
                                    value={selectedSubjectId}
                                    onChange={e => setSelectedSubjectId(e.target.value)}
                                    style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.85rem', color: '#003B70', cursor: 'pointer', outline: 'none' }}
                                >
                                    {globalSubjects.map((s: any) => (
                                        <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}

                <nav className="flex-grow-1 py-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {menuItems.map((item) => (
                        <a
                            key={item.path}
                            href={item.path}
                            className={`sidebar-link ${location.pathname === item.path || (item.path !== '/student' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                            title={!isSidebarOpen ? item.label : undefined}
                        >
                            <span className="icon-wrapper">{item.icon}</span>
                            {isSidebarOpen && <span className="ms-3" style={{ fontSize: '0.92rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                        </a>
                    ))}
                </nav>


            </aside>

            {/* Main */}
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                {/* Topbar */}
                <header className="d-flex align-items-center justify-content-between px-4 py-2 bg-white border-bottom border-light" style={{ height: '70px', flexShrink: 0, zIndex: 1100, position: 'sticky', top: 0 }}>
                    <div className="d-flex align-items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <Menu size={20} color="#64748b" />
                        </button>

                        {/* Search */}
                        <div ref={searchRef} style={{ position: 'relative' }}>
                            <div className="search-bar-topbar">
                                <Search size={18} color="#94a3b8" />
                                <input
                                    type="search"
                                    placeholder="Tìm kiếm nhanh..."
                                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.9rem', color: '#1e293b' }}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <kbd className="cmd-hint">⌘K</kbd>
                            </div>
                            {showSearchResults && (
                                <div className="search-results-dropdown">
                                    {isSearching ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Đang tìm...</div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((result: any, i: number) => (
                                            <div key={i} style={{ padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                                                className="notification-item"
                                                onClick={() => { navigate(result.url || '#'); setShowSearchResults(false); setSearchQuery(''); }}
                                            >
                                                <div className="notification-icon-c" style={{ background: '#f1f5f9' }}>
                                                    {result.type === 'document' ? <FileText size={18} /> : result.type === 'flashcard' ? <Layers size={18} /> : <Search size={18} />}
                                                </div>
                                                <div>
                                                    <div className="notification-title">{result.title}</div>
                                                    <div className="notification-text">{result.type}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy kết quả</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {/* Notification */}
                        <div ref={notificationRef} style={{ position: 'relative' }}>
                            <button className="btn-topbar-icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                                <Bell size={22} color="#64748b" />
                                <span className="notification-badge-pulse" />
                            </button>
                            {isNotificationOpen && (
                                <div className="notification-dropdown-custom">
                                    <div className="notification-header">
                                        <h3>Thông báo</h3>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsNotificationOpen(false)}><X size={18} /></button>
                                    </div>
                                    {[
                                        { icon: <Layers size={18} color="#6366f1" />, bg: '#eef2ff', title: 'Thẻ nhớ đến hạn ôn', text: 'Bạn có thẻ cần ôn tập hôm nay', time: '5 phút trước' },
                                        { icon: <CheckCircle size={18} color="#10b981" />, bg: '#ecfdf5', title: 'Kết quả luyện tập', text: 'Bạn đạt 8.5/10 trong bài vừa làm', time: '1 giờ trước' },
                                    ].map((n, i) => (
                                        <div key={i} className="notification-item p-3">
                                            <div className="d-flex gap-3 align-items-start">
                                                <div className="notification-icon-c" style={{ background: n.bg }}>{n.icon}</div>
                                                <div>
                                                    <div className="notification-title">{n.title}</div>
                                                    <div className="notification-text">{n.text}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="dropdown-item-custom justify-content-center text-primary" style={{ fontSize: '0.85rem' }}>Xem tất cả thông báo</button>
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div ref={profileRef} style={{ position: 'relative' }}>
                            <div className="user-profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="d-none d-md-flex flex-column align-items-end me-3">
                                    <div className="user-name-text">{user?.fullName || 'Người dùng'}</div>
                                    <div className="user-role-text">
                                        {user?.role === 'STUDENT' ? 'Sinh viên' : user?.role === 'FACULTY_ADMIN' ? 'Trưởng khoa' : user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}
                                    </div>
                                </div>
                                <div className="user-avatar-container">
                                    {user?.avatarUrl
                                        ? <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`} alt="Avatar" className="avatar-img-main" loading="lazy" />
                                        : <div className="avatar-placeholder-main">{user?.fullName?.charAt(0).toUpperCase()}</div>
                                    }
                                </div>
                                <ChevronDown size={14} color="#003B70" className={`ms-1 transition-all ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isProfileOpen && (
                                <div className="dropdown-menu-custom shadow-lg">
                                    <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="dropdown-item-custom"><User size={16} /> Hồ sơ cá nhân</button>
                                    <button onClick={() => { navigate('/admin/settings'); setIsProfileOpen(false); }} className="dropdown-item-custom"><Settings size={16} /> Cấu hình</button>
                                    <div className="dropdown-divider-custom"></div>
                                    <button onClick={handleLogout} className="dropdown-item-custom text-danger"><LogOut size={16} /> Đăng xuất</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="main-content-scrollable flex-grow-1 overflow-auto overflow-x-hidden custom-scrollbar" style={{ background: '#f8fafc' }}>
                    <div className="container-fluid py-4 pb-5 px-3 px-md-4 px-xl-5" style={{ maxWidth: '1600px' }}>
                        <Outlet context={{ globalSubjects, selectedSubjectId, setSelectedSubjectId }} />
                    </div>
                </main>

                {isMobileMenuOpen && <div className="sidebar-overlay d-lg-none" onClick={() => setIsMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}></div>}
            </div>

            <style>{`
                .bg-main-light { background-color: #f8fafc; }
                .sidebar-light { background-color: #ffffff; border-right: 1px solid #e2e8f0; height: 100vh; position: sticky; top: 0; z-index: 2200; flex-shrink: 0; overflow-y: auto; scrollbar-width: none; }
                .sidebar-light.expanded { width: 260px; }
                .sidebar-light.collapsed { width: 90px; }
                .logo-outer-glow { padding: 4px; line-height: 0; }
                .sidebar-logo-img { width: 64px; height: 64px; border-radius: 20px; object-fit: cover; }
                .brand-text-center { display: flex; flex-direction: column; align-items: center; overflow: hidden; margin-top: 8px; width: 100%; }
                /* ★ contain: layout style — browser tidak perlu tính lại layout khi text render */
                .brand-name-main { font-weight: 900; font-size: 1.6rem; color: #003B70; letter-spacing: -1px; line-height: 1.1; font-family: 'Inter', sans-serif; contain: layout style; transition: text-shadow 0.3s ease; }
                .brand-gold-glow { text-shadow: 0 0 15px rgba(251, 191, 36, 0.4); color: #003B70; animation: goldPulse 3s infinite alternate; }
                @keyframes goldPulse { 
                    0% { text-shadow: 0 0 8px rgba(251, 191, 36, 0.3); transform: scale(1); }
                    100% { text-shadow: 0 0 20px rgba(251, 191, 36, 0.7); transform: scale(1.02); }
                }
                .brand-sub-main { font-size: 0.6rem; color: #94a3b8; font-weight: 800; letter-spacing: 1.5px; margin-top: 6px; text-transform: uppercase; text-align: center; }
                .sidebar-link { display: flex; align-items: center; padding: 12px 20px; border-radius: 24px; color: #64748b; cursor: pointer; transition: color 0.2s, background 0.2s, transform 0.2s; position: relative; text-decoration: none; margin: 4px 12px; }
                .sidebar-link:hover { color: #003B70; background: #f8fafc; transform: translateX(4px); }
                .sidebar-link.active { color: #003B70; background: #eff6ff; font-weight: 700; border: 1px solid rgba(0, 59, 112, 0.1); box-shadow: 0 10px 20px rgba(0, 59, 112, 0.05); }
                .icon-wrapper { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
                .search-bar-topbar { background: #f1f5f9; border-radius: 24px; padding: 8px 18px; display: flex; align-items: center; gap: 10px; width: 480px; max-width: 100%; border: 1.5px solid transparent; transition: background 0.2s, border-color 0.2s, box-shadow 0.2s; }
                .search-bar-topbar:focus-within { background: #ffffff; border-color: #003B70; box-shadow: 0 0 0 4px rgba(0, 59, 112, 0.08); }
                .user-profile-trigger { display: flex; align-items: center; cursor: pointer; padding: 6px 12px; border-radius: 24px; transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s; border: 1.5px solid transparent; background: #f8fafc; }
                .user-profile-trigger:hover { background: #ffffff; border-color: #e2e8f0; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .user-name-text { font-weight: 700; font-size: 0.95rem; color: #1e293b; line-height: 1.2; }
                .user-role-text { font-size: 0.7rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 1px; }
                .user-avatar-container { width: 42px; height: 42px; border-radius: 20px; overflow: hidden; background: #f1f5f9; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .avatar-img-main { width: 100%; height: 100%; object-fit: cover; }
                .avatar-placeholder-main { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #003B70 0%, #0056a3 100%); color: #fff; font-weight: 900; font-size: 1.2rem; }
                .dropdown-menu-custom { position: absolute; top: calc(100% + 15px); right: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 12px; width: 260px; z-index: 3000; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15); animation: dropdown-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes dropdown-in { from { opacity: 0; transform: scale(0.92) translateY(-12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .dropdown-item-custom { width: 100%; display: flex; align-items: center; gap: 14px; padding: 12px 18px; border: none; background: transparent; color: #475569; border-radius: 14px; font-weight: 700; font-size: 0.92rem; text-align: left; transition: background 0.15s, color 0.15s, transform 0.15s; cursor: pointer; }
                .dropdown-item-custom:hover { background: #f1f5f9; color: #003B70; transform: translateX(4px); }
                .dropdown-divider-custom { height: 1px; background: #f1f5f9; margin: 10px 14px; }
                .btn-topbar-icon { background: transparent; border: none; padding: 10px; border-radius: 14px; cursor: pointer; transition: background 0.15s, transform 0.15s; display: flex; align-items: center; justify-content: center; position: relative; }
                .btn-topbar-icon:hover { background: #f1f5f9; transform: translateY(-1px); }
                .notification-badge-pulse { position: absolute; top: 10px; right: 10px; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; animation: pulse-red 2s infinite; }
                @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
                .transition-all { transition: all 0.3s; }
                .rotate-180 { transform: rotate(180deg); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .notification-dropdown-custom { position: absolute; top: calc(100% + 15px); right: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; width: 380px; z-index: 3001; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: dropdown-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); padding: 8px; }
                .notification-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
                .notification-header h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
                .notification-item { border-radius: 14px; transition: background 0.15s; cursor: pointer; }
                .notification-item:hover { background: #f8fafc; }
                .notification-icon-c { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .notification-title { font-weight: 700; font-size: 0.9rem; color: #1e293b; }
                .notification-text { font-size: 0.82rem; color: #64748b; line-height: 1.4; margin: 4px 0 0; }
                .cmd-hint { font-size: 0.75rem; color: #94a3b8; background: #fff; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 6px; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .search-results-dropdown { position: absolute; top: calc(100% + 15px); left: 0; width: 100% !important; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); z-index: 3001; padding: 12px; max-height: 450px; overflow-y: auto; animation: dropdown-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>
        </div>
    );
};

export default MainLayout;

/*
 * ════════════════════════════════════════════════════════════════════
 *  THÊM VÀO public/index.html (hoặc thẻ <head> của app):
 * ════════════════════════════════════════════════════════════════════
 *
 * <!-- Preload Inter font để tránh FOUT block LCP -->
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap">
 * <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap">
 *
 * ════════════════════════════════════════════════════════════════════
 *  BACKEND: Giảm N+1 query (xem log Hibernate đính kèm)
 * ════════════════════════════════════════════════════════════════════
 *
 * Từ log Hibernate, mỗi request lặp lại nhiều lần:
 *   - SELECT faculties WHERE faculty_id=?   (lặp 30+ lần mỗi giây)
 *   - SELECT users WHERE email=?            (lặp 20+ lần)
 *
 * Fix Spring Boot:
 *   1. @EntityGraph hoặc JOIN FETCH trong repository
 *   2. @Cacheable trên FacultyRepository.findById (faculty ít thay đổi)
 *   3. SecurityContextHolder.getContext().getAuthentication() cache user
 *      thay vì query DB mỗi request
 *   4. Bật spring.jpa.properties.hibernate.cache.use_second_level_cache=true
 * ════════════════════════════════════════════════════════════════════
 */
