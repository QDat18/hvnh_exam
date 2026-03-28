import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, BookOpen, LogOut, Menu,
    Settings, Database, Building, Layers, GraduationCap, X,
    ChevronDown, User
} from 'lucide-react';

// 🔥 IMPORT LOGO
import logoHVNH from '../assets/images/logo.jpg';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const getMenu = () => {
        if (user?.role === 'ADMIN') return [
            { path: '/admin', label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
            { path: '/admin/users', label: 'Người dùng', icon: <Users size={18} /> },
            { path: '/admin/subjects', label: 'Môn học', icon: <BookOpen size={18} /> },
            { path: '/admin/faculties', label: 'Khoa & Bộ môn', icon: <Building size={18} /> },
            { path: '/admin/settings', label: 'Cấu hình', icon: <Settings size={18} /> },
        ];

        if (user?.role === 'FACULTY_ADMIN') return [
            { path: '/faculty-admin', label: 'Tổng quan Khoa', icon: <LayoutDashboard size={18} /> },
            { path: '/faculty-admin/departments', label: 'Bộ môn', icon: <Layers size={18} /> },
            { path: '/faculty-admin/teachers', label: 'Giảng viên', icon: <Users size={18} /> },
            { path: '/faculty-admin/classes', label: 'Lớp niên chế', icon: <GraduationCap size={18} /> },
            { path: '/faculty-admin/course-classes', label: 'Lớp học phần', icon: <BookOpen size={18} /> },
        ];

        if (user?.role === 'TEACHER') return [
            { path: '/teacher/classes', label: 'Lớp giảng dạy', icon: <BookOpen size={18} /> },
            { path: '/teacher/homeroom-classes', label: 'Lớp chủ nhiệm', icon: <GraduationCap size={18} /> },
            { path: '/teacher/questions', label: 'Ngân hàng câu hỏi', icon: <Database size={18} /> },
        ];

        if (user?.role === 'STUDENT') return [
            { path: '/student', label: 'Góc học tập', icon: <LayoutDashboard size={18} /> },
            { path: '/student/my-classes', label: 'Lớp của tôi', icon: <BookOpen size={18} /> },
        ];

        return [];
    };

    const menuItems = getMenu();

    return (
        <div className="vh-100 d-flex flex-column bg-light overflow-hidden">
            <nav className="navbar navbar-expand-lg bg-white shadow-sm py-2 px-3 z-3 flex-shrink-0 border-bottom">
                <div className="container-fluid align-items-center">

                    {/* 🔥 LOGO MỚI TRÀN NỀN */}
                    <div className="navbar-brand d-flex align-items-center gap-3 fw-bold pe-4" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>

                        <img
                            src={logoHVNH}
                            alt="HVNH Logo"
                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />

                        <div className="d-none d-sm-flex flex-column justify-content-center">
                            <span style={{ color: '#0d6efd', fontWeight: '900', fontSize: '1.25rem', lineHeight: '1', letterSpacing: '0.5px' }}>
                                iReview
                            </span>
                            <span className="text-secondary" style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                                Học viện Ngân hàng
                            </span>
                        </div>
                    </div>

                    <button className="navbar-toggler border-0 shadow-none text-dark" type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show mt-4 pb-3' : ''}`}>
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 gap-lg-2">
                            {menuItems.map((item, index) => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                return (
                                    <li className="nav-item" key={index}>
                                        <div onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                                            className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 transition-all cursor-pointer fw-bold text-decoration-none
                                                ${isActive ? 'bg-primary bg-opacity-10 text-primary active-pill' : 'text-secondary hover-bg-light'}`}>
                                            {item.icon}
                                            <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="d-flex align-items-center justify-content-end mt-3 mt-lg-0 pt-3 pt-lg-0 border-top border-lg-0 position-relative" ref={profileRef}>
                            <div className="d-flex align-items-center gap-3 cursor-pointer p-2 rounded-4 hover-bg-light transition-all" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="text-end d-none d-xl-block">
                                    <div className="fw-bolder text-dark fs-6 lh-1">{user?.role === 'ADMIN' ? 'Học viện Ngân hàng' : (user?.fullName || 'Người dùng')}</div>
                                    <div className="text-muted mt-1 fw-medium" style={{ fontSize: '0.75rem' }}>
                                        {user?.role === 'ADMIN' ? 'Quản trị viên' :
                                            user?.role === 'FACULTY_ADMIN' ? (user?.facultyName || 'Quản lý Khoa') :
                                                user?.role === 'TEACHER' ? (user?.facultyName ? `Giảng viên Khoa ${user.facultyName}` : 'Giảng viên') :
                                                    (user?.facultyName ? `Khoa ${user.facultyName}` : 'Học viện Ngân hàng')}
                                    </div>
                                </div>
                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bolder overflow-hidden" style={{ width: 44, height: 44, fontSize: '1.2rem', border: '2px solid rgba(13, 110, 253, 0.15)' }}>
                                    {user?.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`}
                                            alt="Avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        (user?.role === 'ADMIN' ? 'H' : user?.fullName?.charAt(0)?.toUpperCase()) || 'U'
                                    )}
                                </div>
                                <ChevronDown size={18} className="text-muted d-none d-xl-block" style={{ transition: 'transform 0.2s', transform: isProfileOpen ? 'rotate(180deg)' : 'none' }} />
                            </div>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="position-absolute bg-white rounded-4 shadow-sm border p-2" style={{ top: '100%', right: '0', minWidth: '240px', zIndex: 1000, marginTop: '5px', animation: 'dropdownFade 0.2s ease-out' }}>
                                    <div className="d-xl-none p-3 border-bottom mb-2">
                                        <div className="fw-bolder text-dark">{user?.role === 'ADMIN' ? 'Học viện Ngân hàng' : (user?.fullName || 'Người dùng')}</div>
                                        <div className="text-muted small mt-1 fw-medium">
                                            {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
                                        </div>
                                    </div>
                                    <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="btn w-100 text-start px-3 py-2 text-dark fw-bold d-flex align-items-center gap-3 rounded-3 hover-bg-light mb-1 mt-1 border-0">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary"><User size={18} /></div> Hồ sơ cá nhân
                                    </button>
                                    <button onClick={handleLogout} className="btn w-100 text-start px-3 py-2 text-danger fw-bold d-flex align-items-center gap-3 rounded-3 hover-bg-danger-light transition-all border-0">
                                        <div className="bg-danger bg-opacity-10 p-2 rounded-3 text-danger"><LogOut size={18} /></div> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow-1 overflow-auto position-relative custom-scrollbar bg-light">
                <div className="container-fluid p-4 animation-fade-in" style={{ maxWidth: '1600px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>

            <style>{`
                .nav-link { text-decoration: none !important; }
                .nav-link:hover { text-decoration: none !important; }
                .hover-bg-light:hover { background-color: #f8f9fa; color: #0d6efd !important; }
                .hover-bg-danger-light:hover { background-color: #fce8e6; }
                .active-pill { color: #0d6efd !important; font-weight: 800 !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .cursor-pointer { cursor: pointer; }
                .hover-scale:hover { transform: scale(1.05); }
                .animation-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes dropdownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dcdcdc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #b0b0b0; }
                @media (max-width: 991.98px) {
                    .border-lg-0 { border-top: 1px solid rgba(0,0,0,0.1) !important; }
                    .nav-link { margin-bottom: 0.25rem; }
                }
            `}</style>
        </div>
    );
};

export default MainLayout;