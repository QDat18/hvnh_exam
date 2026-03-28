import React, { useState, useEffect, useCallback } from 'react';
import { Search, Lock, Unlock, KeyRound, ChevronLeft, ChevronRight, Users } from 'lucide-react';
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
    ADMIN:         { label: 'Admin',        color: '#7c3aed', bg: '#ede9fe' },
    FACULTY_ADMIN: { label: 'Trưởng khoa',  color: '#1d4ed8', bg: '#dbeafe' },
    TEACHER:       { label: 'Giảng viên',   color: '#0369a1', bg: '#e0f2fe' },
    STUDENT:       { label: 'Sinh viên',    color: '#15803d', bg: '#dcfce7' },
};

// ── Component ─────────────────────────────────────────────────────────────────
const AdminUserManager: React.FC = () => {
    const [pageData, setPageData]   = useState<PageData | null>(null);
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(0);
    const [keyword, setKeyword]     = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null); // userId đang xử lý

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/admin/users', {
                params: { page, size: 20, role: roleFilter || undefined, keyword: keyword || undefined }
            });
            setPageData(res.data);
        } catch (e) {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [page, keyword, roleFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        setKeyword(searchInput.trim());
    };

    const handleRoleChange = (r: string) => {
        setPage(0);
        setRoleFilter(r);
    };

    const handleToggleStatus = async (user: UserItem) => {
        const newStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
        const action    = newStatus === 'LOCKED' ? 'khoá' : 'mở khoá';
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
    };

    const handleResetPassword = async (user: UserItem) => {
        if (!window.confirm(`Reset mật khẩu cho "${user.email}"? Mật khẩu mới sẽ hiện 1 lần duy nhất.`)) return;

        setActionLoading(user.id + '-pw');
        try {
            const res = await axiosClient.post(`/admin/users/${user.id}/reset-password`);
            const { newPassword, email } = res.data;
            // Hiện alert có thể copy — đủ cho admin nội bộ
            window.alert(`✅ Reset mật khẩu thành công!\n\nEmail: ${email}\nMật khẩu mới: ${newPassword}\n\n⚠️ Lưu lại ngay! Sẽ không hiển thị lại.`);
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Lỗi reset mật khẩu');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="animation-fade-in">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <Users size={22} className="text-primary"/> Quản lý Người dùng
                    </h4>
                    <small className="text-muted">
                        {pageData ? `${pageData.totalElements.toLocaleString('vi-VN')} người dùng trong hệ thống` : '…'}
                    </small>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                <div className="d-flex gap-3 flex-wrap align-items-center">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 380 }}>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0">
                                <Search size={16} className="text-muted"/>
                            </span>
                            <input
                                type="text"
                                className="form-control bg-light border-0"
                                placeholder="Tìm theo tên, email..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary rounded-3 px-3 fw-bold">Tìm</button>
                    </form>

                    {/* Role tabs */}
                    <div className="d-flex gap-2 flex-wrap">
                        {[
                            { value: '',             label: 'Tất cả' },
                            { value: 'STUDENT',      label: 'Sinh viên' },
                            { value: 'TEACHER',      label: 'Giảng viên' },
                            { value: 'FACULTY_ADMIN',label: 'Trưởng khoa' },
                        ].map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => handleRoleChange(tab.value)}
                                className={`btn btn-sm rounded-pill fw-semibold px-3 border-0 ${roleFilter === tab.value ? 'btn-primary' : 'btn-light text-muted'}`}
                                style={{ fontSize: '0.8rem' }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary"/>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr style={{ fontSize: '0.78rem' }}>
                                    <th className="ps-4 py-3">Người dùng</th>
                                    <th className="py-3">Vai trò</th>
                                    <th className="py-3">Khoa</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="text-center py-3" style={{ width: 120 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData?.content.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-muted">
                                            Không tìm thấy người dùng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    pageData?.content.map(user => {
                                        const roleCfg = ROLE_LABELS[user.role] || { label: user.role, color: '#374151', bg: '#f3f4f6' };
                                        const isLocked = user.status === 'LOCKED';
                                        const busy = actionLoading === user.id || actionLoading === user.id + '-pw';

                                        return (
                                            <tr key={user.id}>
                                                <td className="ps-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <img
                                                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=e0e7ff&color=4f46e5`}
                                                            alt={user.fullName}
                                                            width={38} height={38}
                                                            className="rounded-circle flex-shrink-0"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                        <div className="min-vw-0">
                                                            <div className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>{user.fullName}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge rounded-pill px-2 py-1"
                                                          style={{ background: roleCfg.bg, color: roleCfg.color, fontSize: '0.72rem', fontWeight: 600 }}>
                                                        {roleCfg.label}
                                                    </span>
                                                </td>
                                                <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                                                    {user.facultyName || '—'}
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill px-2 py-1 ${isLocked ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}
                                                          style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                        {isLocked ? '🔒 Đã khoá' : '✅ Hoạt động'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        {/* Khoá / Mở khoá */}
                                                        <button
                                                            className={`btn btn-sm rounded-3 border-0 ${isLocked ? 'btn-success' : 'btn-outline-danger'}`}
                                                            style={{ padding: '4px 8px' }}
                                                            title={isLocked ? 'Mở khoá' : 'Khoá tài khoản'}
                                                            disabled={busy || user.role === 'ADMIN'}
                                                            onClick={() => handleToggleStatus(user)}
                                                        >
                                                            {busy && actionLoading === user.id
                                                                ? <span className="spinner-border spinner-border-sm"/>
                                                                : isLocked
                                                                    ? <Unlock size={14}/>
                                                                    : <Lock size={14}/>
                                                            }
                                                        </button>

                                                        {/* Reset mật khẩu */}
                                                        <button
                                                            className="btn btn-sm btn-outline-warning rounded-3 border-0"
                                                            style={{ padding: '4px 8px' }}
                                                            title="Reset mật khẩu"
                                                            disabled={busy}
                                                            onClick={() => handleResetPassword(user)}
                                                        >
                                                            {busy && actionLoading === user.id + '-pw'
                                                                ? <span className="spinner-border spinner-border-sm"/>
                                                                : <KeyRound size={14}/>
                                                            }
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pageData && pageData.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light">
                        <small className="text-muted">
                            Trang {pageData.currentPage + 1} / {pageData.totalPages}
                            {' · '}{pageData.totalElements.toLocaleString('vi-VN')} bản ghi
                        </small>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-light border rounded-3"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={16}/>
                            </button>
                            <button
                                className="btn btn-sm btn-light border rounded-3"
                                disabled={page >= pageData.totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserManager;