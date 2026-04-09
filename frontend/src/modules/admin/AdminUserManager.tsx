import React, { useState, useEffect, useCallback, memo } from 'react';
import { Search, Lock, Unlock, KeyRound, ChevronLeft, ChevronRight, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../../services/axiosClient';

interface UserItem {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    avatarUrl: string;
    facultyName: string;
    createdAt: string;
}

interface PageData {
    content: UserItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN: { label: 'Admin', color: '#6d28d9', bg: '#ede9fe' },
    FACULTY_ADMIN: { label: 'Trưởng khoa', color: '#0369a1', bg: '#e0f2fe' },
    TEACHER: { label: 'Giảng viên', color: '#b45309', bg: '#fef3c7' },
    STUDENT: { label: 'Sinh viên', color: '#15803d', bg: '#dcfce7' },
};

// ── TỐI ƯU: Tách Row thành Component riêng với React.memo ──
const UserRow = memo(({
    user,
    actionLoading,
    onToggleStatus,
    onResetPassword
}: {
    user: UserItem;
    actionLoading: string | null;
    onToggleStatus: (u: UserItem) => void;
    onResetPassword: (u: UserItem) => void;
}) => {
    const roleCfg = ROLE_LABELS[user.role] || { label: user.role, color: '#4b5563', bg: '#f3f4f6' };
    const isLocked = user.status === 'LOCKED';
    const busy = actionLoading === user.id || actionLoading === user.id + '-pw';

    return (
        <tr className="border-bottom">
            <td className="ps-4 py-3">
                <div className="d-flex align-items-center gap-3">
                    <img
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=e0e7ff&color=4f46e5`}
                        alt={user.fullName}
                        width={40} height={40}
                        loading="lazy"
                        className="rounded-circle flex-shrink-0 shadow-sm"
                        style={{ objectFit: 'cover' }}
                    />
                    <div className="min-vw-0">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{user.fullName}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
                    </div>
                </div>
            </td>
            <td className="py-3">
                <span className="badge rounded-pill px-3 py-2"
                    style={{ background: roleCfg.bg, color: roleCfg.color, fontSize: '0.75rem', fontWeight: 600 }}>
                    {roleCfg.label}
                </span>
            </td>
            <td className="text-muted py-3" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {user.facultyName || '—'}
            </td>
            <td className="py-3">
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isLocked ? '#ef4444' : '#22c55e' }} />
                    <span className={`fw-semibold ${isLocked ? 'text-danger' : 'text-success'}`} style={{ fontSize: '0.8rem' }}>
                        {isLocked ? 'Đã khoá' : 'Hoạt động'}
                    </span>
                </div>
            </td>
            <td className="text-end pe-4 py-3">
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center transition-all ${isLocked ? 'bg-success bg-opacity-10 text-success hover-bg-success hover-text-white' : 'bg-light text-muted hover-bg-danger hover-text-white'}`}
                        style={{ width: 32, height: 32, border: 'none' }}
                        title={isLocked ? 'Mở khoá' : 'Khoá tài khoản'}
                        disabled={busy || user.role === 'ADMIN'}
                        onClick={() => onToggleStatus(user)}
                    >
                        {busy && actionLoading === user.id
                            ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                            : isLocked ? <Unlock size={15} /> : <Lock size={15} />
                        }
                    </button>

                    <button
                        className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center transition-all bg-light text-muted hover-bg-warning hover-text-dark"
                        style={{ width: 32, height: 32, border: 'none' }}
                        title="Reset mật khẩu"
                        disabled={busy}
                        onClick={() => onResetPassword(user)}
                    >
                        {busy && actionLoading === user.id + '-pw'
                            ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                            : <KeyRound size={15} />
                        }
                    </button>
                </div>
            </td>
        </tr>
    );
});

// ── Component Chính ───────────────────────────────────────────────────────────
const AdminUserManager: React.FC = () => {
    const [pageData, setPageData] = useState<PageData | null>(null);

    // TÁCH 2 TRẠNG THÁI TẢI
    const [loading, setLoading] = useState(true);  // Lần đầu vào trang
    const [isFetching, setIsFetching] = useState(false); // Khi search / phân trang

    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (keyword !== searchInput.trim()) {
                setKeyword(searchInput.trim());
                setPage(0);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput, keyword]);

    const fetchUsers = useCallback(async () => {
        setIsFetching(true);
        try {
            const res = await axiosClient.get('/admin/users', {
                params: { page, size: 20, role: roleFilter || undefined, keyword: keyword || undefined }
            });
            setPageData(res.data);
        } catch (e) {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    }, [page, keyword, roleFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = (r: string) => {
        if (roleFilter !== r) {
            setRoleFilter(r);
            setPage(0);
        }
    };

    const handleToggleStatus = useCallback(async (user: UserItem) => {
        const newStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
        const action = newStatus === 'LOCKED' ? 'khoá' : 'mở khoá';
        if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản "${user.email}"?`)) return;

        setActionLoading(user.id);
        try {
            await axiosClient.patch(`/admin/users/${user.id}/status`, { status: newStatus });
            toast.success(`Đã ${action} tài khoản thành công`);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.error || `Lỗi ${action} tài khoản`);
        } finally {
            setActionLoading(null);
        }
    }, [fetchUsers]);

    const handleResetPassword = useCallback(async (user: UserItem) => {
        if (!window.confirm(`Reset mật khẩu cho "${user.email}"? Mật khẩu mới sẽ hiện 1 lần duy nhất.`)) return;

        setActionLoading(user.id + '-pw');
        try {
            const res = await axiosClient.post(`/admin/users/${user.id}/reset-password`);
            const { newPassword, email } = res.data;
            window.alert(`✅ Reset mật khẩu thành công!\n\nEmail: ${email}\nMật khẩu mới: ${newPassword}\n\n⚠️ Lưu lại ngay! Sẽ không hiển thị lại.`);
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Lỗi reset mật khẩu');
        } finally {
            setActionLoading(null);
        }
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="animation-fade-in container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-extrabold mb-1 d-flex align-items-center gap-2 text-dark">
                        <Users size={26} className="text-primary" /> Quản lý Người dùng
                    </h3>
                    <p className="text-muted mb-0">
                        {pageData ? `${pageData.totalElements.toLocaleString('vi-VN')} người dùng trong hệ thống` : 'Đang tải dữ liệu...'}
                    </p>
                </div>
            </div>

            {/* Filters Area */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
                <div className="position-relative" style={{ maxWidth: '400px', width: '100%' }}>
                    <Search className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '16px' }} size={18} />
                    <input
                        type="text"
                        className="form-control rounded-pill border-0 shadow-sm"
                        style={{ paddingLeft: '44px', paddingRight: '20px', height: '48px', backgroundColor: '#fff' }}
                        placeholder="Tìm kiếm theo tên, email..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                </div>

                <div className="bg-white p-1 rounded-pill shadow-sm d-flex overflow-auto hide-scrollbar" style={{ border: '1px solid #f1f5f9' }}>
                    {[
                        { value: '', label: 'Tất cả' },
                        { value: 'STUDENT', label: 'Sinh viên' },
                        { value: 'TEACHER', label: 'Giảng viên' },
                        { value: 'FACULTY_ADMIN', label: 'Trưởng khoa' },
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => handleRoleChange(tab.value)}
                            className={`btn rounded-pill fw-bold transition-all ${roleFilter === tab.value ? 'btn-dark text-white' : 'btn-light text-muted bg-transparent'}`}
                            style={{ padding: '8px 20px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white position-relative">

                {/* THANH LOADING CHẠY NGANG (Chỉ hiện khi fetch data ngầm, không phải lần đầu) */}
                {isFetching && !loading && (
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '3px', zIndex: 10 }}>
                        <div className="progress w-100 h-100 rounded-0 bg-transparent">
                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100" style={{ animationDuration: '0.8s' }}></div>
                        </div>
                    </div>
                )}

                {loading ? (
                    // Trạng thái Loading to chỉ dùng 1 lần duy nhất khi mới load trang
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary border-3" style={{ width: '3rem', height: '3rem' }} />
                        <div className="mt-3 text-muted fw-medium">Đang tải dữ liệu...</div>
                    </div>
                ) : (
                    // Bảng dữ liệu - Áp dụng Soft Loading: làm mờ khi isFetching
                    <div className={`table-responsive transition-all duration-300 ${isFetching ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.3s ease' }}>
                        <table className="table table-borderless align-middle mb-0">
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <tr>
                                    <th className="ps-4 py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Người dùng</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Vai trò</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Khoa</th>
                                    <th className="py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Trạng thái</th>
                                    <th className="text-end pe-4 py-3 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', width: 120 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData?.content.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <ShieldAlert size={48} className="text-muted opacity-25 mb-3 mx-auto" />
                                            <h6 className="fw-bold text-dark mb-1">Không tìm thấy kết quả</h6>
                                            <p className="text-muted small mb-0">Thử thay đổi từ khóa hoặc bộ lọc vai trò</p>
                                        </td>
                                    </tr>
                                ) : (
                                    pageData?.content.map(user => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            actionLoading={actionLoading}
                                            onToggleStatus={handleToggleStatus}
                                            onResetPassword={handleResetPassword}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pageData && pageData.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top" style={{ backgroundColor: '#fdfdfd' }}>
                        <span className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>
                            Trang <strong className="text-dark">{pageData.currentPage + 1}</strong> / {pageData.totalPages}
                        </span>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-light border rounded-circle d-flex align-items-center justify-content-center transition-all hover-bg-dark hover-text-white"
                                style={{ width: 36, height: 36 }}
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                className="btn btn-sm btn-light border rounded-circle d-flex align-items-center justify-content-center transition-all hover-bg-dark hover-text-white"
                                style={{ width: 36, height: 36 }}
                                disabled={page >= pageData.totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .hover-bg-success:hover { background-color: #22c55e !important; }
                .hover-bg-danger:hover { background-color: #ef4444 !important; }
                .hover-bg-warning:hover { background-color: #f59e0b !important; }
                .hover-bg-dark:hover { background-color: #1e293b !important; border-color: #1e293b !important; }
                .hover-text-white:hover { color: white !important; }
                .hover-text-dark:hover { color: #1e293b !important; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default AdminUserManager;