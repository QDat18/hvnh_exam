import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Users, AlertTriangle, Search, CheckCircle, Clock } from 'lucide-react';
import { studyHubApi } from '../../services/studyHubApi';

interface StudentMonitor {
  studentId: string;
  studentCode: string;
  studentName: string;
  status: 'CHƯA_THAM_GIA' | 'ĐANG_THI' | 'ĐÃ_NỘP' | 'ĐÃ_KẾT_THÚC';
  startTime: string | null;
  attemptCount: number;
  violations: number;
}

interface MonitorData {
  success: boolean;
  roomName: string;
  totalStudents: number;
  students: StudentMonitor[];
}

const ExamMonitorPage: React.FC = () => {
  const { classId, roomId } = useParams<{ classId: string; roomId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchMonitorData = async (showLoading = true) => {
    if (!classId || !roomId) return;
    if (showLoading) setLoading(true);
    try {
      const response = await studyHubApi.monitorExamRoom(classId, roomId);
      setData(response.data);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch monitor data:', error);
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(() => {
      fetchMonitorData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [classId, roomId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMonitorData(false);
  };

  const filteredStudents = data?.students.filter(student =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Stats
  const countByStatus = (status: string) => data?.students.filter(s => s.status === status).length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ĐANG_THI':
        return <span className="badge bg-primary px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1"><span className="spinner-grow spinner-grow-sm" role="status" /> Đang thi</span>;
      case 'ĐÃ_NỘP':
        return <span className="badge bg-success px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1"><CheckCircle size={14} /> Đã nộp</span>;
      case 'ĐÃ_KẾT_THÚC':
        return <span className="badge bg-secondary px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1"><CheckCircle size={14} /> Kết thúc</span>;
      case 'CHƯA_THAM_GIA':
      default:
        return <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-bold">Chưa thi</span>;
    }
  };

  const formatDuration = (startTime: string | null) => {
    if (!startTime) return '-';
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - start) / 60000);
    if (diffMins < 1) return 'Vừa xong';
    return `${diffMins} phút trước`;
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* HEADER */}
      <div className="text-white py-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 50%, #084298 100%)' }}>
        <div className="container px-3 px-md-4" style={{ maxWidth: '1100px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-link text-white p-0 mb-3 text-decoration-none d-flex align-items-center gap-2 opacity-75" style={{ fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <small className="text-white-50 text-uppercase fw-bold" style={{ letterSpacing: '2px', fontSize: '0.7rem' }}>Giám sát kỳ thi</small>
              <h2 className="fw-bold mb-0" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>
                {loading && !data ? (
                  <span className="placeholder-glow"><span className="placeholder col-6 bg-light rounded"></span></span>
                ) : (
                  data?.roomName || 'Phòng thi'
                )}
              </h2>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-white bg-opacity-25 text-white px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                <Clock size={14} /> {lastRefreshed.toLocaleTimeString()}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-outline-light rounded-pill px-3 py-2 d-flex align-items-center gap-1 fw-bold"
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} /> Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-3 px-md-4 mt-4" style={{ maxWidth: '1100px' }}>

        {/* STATS CARDS */}
        {data && (
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 text-center p-3">
                <h3 className="fw-bolder text-primary mb-0">{data.totalStudents}</h3>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Tổng SV</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 text-center p-3 border-start border-primary border-4">
                <h3 className="fw-bolder text-primary mb-0">{countByStatus('ĐANG_THI')}</h3>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Đang thi</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 text-center p-3 border-start border-success border-4">
                <h3 className="fw-bolder text-success mb-0">{countByStatus('ĐÃ_NỘP') + countByStatus('ĐÃ_KẾT_THÚC')}</h3>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Đã nộp</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 text-center p-3 border-start border-warning border-4">
                <h3 className="fw-bolder text-warning mb-0">{countByStatus('CHƯA_THAM_GIA')}</h3>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Chưa thi</small>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div className="position-relative mb-4">
          <div className="position-absolute top-50 translate-middle-y ps-3" style={{ zIndex: 2 }}>
            <Search size={18} className="text-muted" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã SV hoặc họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control form-control-lg ps-5 rounded-4 border shadow-sm"
            style={{ fontSize: '0.95rem' }}
          />
        </div>

        {/* TABLE */}
        {loading && !data ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary border-4" style={{ width: '3rem', height: '3rem' }}></div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-muted" style={{ fontSize: '0.8rem' }}>
                  <tr>
                    <th className="ps-4 text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>#</th>
                    <th className="text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>Mã SV</th>
                    <th className="text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>Họ & Tên</th>
                    <th className="text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>Trạng thái</th>
                    <th className="text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>Thời gian bắt đầu</th>
                    <th className="text-center text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>Vi phạm</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                      <tr key={student.studentId}>
                        <td className="ps-4 text-muted fw-bold">{index + 1}</td>
                        <td>
                          <span className="badge bg-light text-dark border fw-bold px-3 py-2 rounded-pill" style={{ fontSize: '0.85rem' }}>
                            {student.studentCode}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{student.studentName}</div>
                          {student.attemptCount > 1 && (
                            <small className="text-muted">Lượt thi thứ {student.attemptCount}</small>
                          )}
                        </td>
                        <td>{getStatusBadge(student.status)}</td>
                        <td>
                          {student.startTime ? (
                            <div>
                              <div className="fw-medium">{new Date(student.startTime).toLocaleTimeString('vi-VN')}</div>
                              <small className="text-muted">{formatDuration(student.startTime)}</small>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          {student.violations > 0 ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1 border border-danger border-opacity-25">
                              <AlertTriangle size={14} /> {student.violations}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <Users size={48} className="text-muted opacity-50 mb-3" />
                        <p className="fw-bold text-dark mb-1">Không tìm thấy sinh viên nào</p>
                        <small className="text-muted">Thử thay đổi từ khóa tìm kiếm</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Auto-refresh note */}
        <div className="text-center mt-3">
          <small className="text-muted d-flex align-items-center justify-content-center gap-1">
            <RefreshCw size={12} /> Tự động cập nhật mỗi 10 giây
          </small>
        </div>
      </div>

      {/* Spin animation CSS */}
      <style>{`
        .spin-animation {
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

export default ExamMonitorPage;
