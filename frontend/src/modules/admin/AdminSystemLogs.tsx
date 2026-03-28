import React, { useState, useEffect } from 'react';
import { Database, Clock, User, Globe, Server, ChevronLeft, ChevronRight, Loader2, Activity, Filter } from 'lucide-react';
import axiosClient from '../../services/axiosClient';
import { toast } from 'react-toastify';

// Định nghĩa kiểu dữ liệu Log trả về từ MongoDB
interface ActionLog {
    id: string;
    email: string;
    role: string;
    action: string;
    ipAddress: string;
    endPoint: string;
    details: string;
    timestamp: string;
}

const AdminSystemLogs: React.FC = () => {
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Fetch dữ liệu mỗi khi đổi trang
    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Lấy 20 dòng log mỗi trang để tối ưu tốc độ render
            const res = await axiosClient.get(`/admin/logs?page=${page}&size=20`);
            setLogs(res.data.content || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalElements(res.data.totalElements || 0);
        } catch (error) {
            toast.error("Không thể tải nhật ký hệ thống. Vui lòng kiểm tra lại MongoDB!");
        } finally {
            setLoading(false);
        }
    };

    // Helper: Định dạng thời gian
    const formatDateTime = (dateString: string) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // Helper: Tô màu cho các Hành động (Action)
    const renderActionBadge = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('LOGIN')) return <span className="badge bg-info bg-opacity-10 text-info border border-info">ĐĂNG NHẬP</span>;
        if (act.includes('SUBMIT')) return <span className="badge bg-success bg-opacity-10 text-success border border-success">NỘP BÀI</span>;
        if (act.includes('UPDATE') || act.includes('SETTING')) return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning">CẬP NHẬT</span>;
        if (act.includes('DELETE') || act.includes('LOCK')) return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">XÓA / KHÓA</span>;
        return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">{action}</span>;
    };

    return (
        <div className="container-fluid py-4 animation-fade-in">
            {/* Header */}
            <header className="mb-4 pb-2 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-dark bg-opacity-10 p-3 rounded-circle text-dark border shadow-sm">
                        <Database size={32} />
                    </div>
                    <div>
                        <h1 className="fw-bold text-dark mb-1">Nhật ký Hệ thống (Audit Logs)</h1>
                        <p className="text-muted mb-0">Giám sát mọi hành vi thao tác trên hệ thống từ MongoDB.</p>
                    </div>
                </div>
                <div className="text-end">
                    <div className="fs-4 fw-bold text-primary">{totalElements.toLocaleString('vi-VN')}</div>
                    <div className="small text-muted text-uppercase fw-medium">Bản ghi được lưu trữ</div>
                </div>
            </header>

            {/* Bảng dữ liệu Logs */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ minWidth: '1000px' }}>
                        <thead className="table-light">
                            <tr>
                                <th className="px-4 py-3"><Clock size={16} className="me-2 text-muted"/>Thời gian</th>
                                <th><User size={16} className="me-2 text-muted"/>Người dùng</th>
                                <th><Activity size={16} className="me-2 text-muted"/>Hành động</th>
                                <th><Server size={16} className="me-2 text-muted"/>Endpoint (API)</th>
                                <th><Globe size={16} className="me-2 text-muted"/>IP Address</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-5"><Loader2 className="spin text-primary" size={30}/></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-5 text-muted fst-italic">Chưa có bản ghi nhật ký nào.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 text-muted small fw-medium">{formatDateTime(log.timestamp)}</td>
                                        <td>
                                            <div className="fw-bold text-dark">{log.email}</div>
                                            <div className="small text-muted">{log.role}</div>
                                        </td>
                                        <td>{renderActionBadge(log.action)}</td>
                                        <td><code className="bg-light px-2 py-1 rounded text-dark border">{log.endPoint}</code></td>
                                        <td><span className="badge bg-light text-dark border font-monospace">{log.ipAddress}</span></td>
                                        <td>
                                            <div className="text-truncate small text-secondary" style={{ maxWidth: '250px' }} title={log.details}>
                                                {log.details || '---'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Phân trang (Pagination) */}
                {!loading && totalPages > 1 && (
                    <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center px-4">
                        <span className="small text-muted fw-medium">Đang xem trang {page + 1} / {totalPages}</span>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft size={16} /> Mới hơn
                            </button>
                            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                                Cũ hơn <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSystemLogs;