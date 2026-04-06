import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, Users, AlertTriangle, Search, 
  CheckCircle, Clock, Activity 
} from 'lucide-react';
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ĐANG_THI':
        return { 
          label: 'Đang thi', 
          color: '#22c55e', 
          bg: 'rgba(34, 197, 94, 0.1)', 
          glow: '0 0 15px rgba(34, 197, 94, 0.3)',
          icon: <span className="status-dot pulsing" />
        };
      case 'ĐÃ_NỘP':
      case 'ĐÃ_KẾT_THÚC':
        return { 
          label: 'Đã nộp', 
          color: '#3b82f6', 
          bg: 'rgba(59, 130, 246, 0.1)', 
          glow: 'none',
          icon: <CheckCircle size={14} />
        };
      case 'CHƯA_THAM_GIA':
      default:
        return { 
          label: 'Chưa thi', 
          color: '#94a3b8', 
          bg: 'rgba(148, 163, 184, 0.1)', 
          glow: 'none',
          icon: <Clock size={14} />
        };
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="dark-theme min-vh-100 pb-5" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
      {/* HEADER */}
      <div className="sticky-top py-4 shadow-sm" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 1000 }}>
        <div className="container px-3 px-md-4" style={{ maxWidth: '1200px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-link text-slate-400 p-0 mb-3 text-decoration-none d-flex align-items-center gap-2 opacity-75 hover-opacity-100 transition-all" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            <ArrowLeft size={16} /> Quay lại
          </button>
          
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="live-indicator"></span>
                <small className="text-uppercase fw-bold" style={{ color: '#6366f1', letterSpacing: '2px', fontSize: '0.7rem' }}>GIÁM SÁT TRỰC TUYẾN</small>
              </div>
              <h2 className="fw-bold mb-0" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: '#ffffff' }}>
                {loading && !data ? (
                  <span className="placeholder-glow"><span className="placeholder col-6 bg-slate-700 rounded"></span></span>
                ) : (
                  data?.roomName || 'Phòng thi'
                )}
              </h2>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="d-none d-md-block text-end me-2">
                <div className="text-white-50 small">Cập nhật cuối</div>
                <div className="fw-medium" style={{ color: '#94a3b8' }}>{lastRefreshed.toLocaleTimeString()}</div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-refresh d-flex align-items-center justify-content-center"
                title="Làm mới"
              >
                <RefreshCw size={20} className={isRefreshing ? 'spin-animation' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-3 px-md-4 mt-4" style={{ maxWidth: '1200px' }}>
        
        {/* DASHBOARD STATS */}
        {data && (
          <div className="row g-3 mb-5">
            {[
              { label: 'TỔNG SINH VIÊN', value: data.totalStudents, icon: <Users size={20} />, color: '#6366f1' },
              { label: 'ĐANG LÀM BÀI', value: countByStatus('ĐANG_THI'), icon: <Activity size={20} />, color: '#22c55e', pulse: true },
              { label: 'ĐÃ HOÀN THÀNH', value: countByStatus('ĐÃ_NỘP') + countByStatus('ĐÃ_KẾT_THÚC'), icon: <CheckCircle size={20} />, color: '#3b82f6' },
              { label: 'VI PHẠM', value: data.students.filter(s => s.violations > 0).length, icon: <AlertTriangle size={20} />, color: '#ef4444' }
            ].map((stat, i) => (
              <div className="col-6 col-md-3" key={i}>
                <div className="stats-card h-100" style={{ borderLeft: `4px solid ${stat.color}` }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="stats-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    {stat.pulse && <span className="status-dot pulsing" style={{ backgroundColor: stat.color }}></span>}
                  </div>
                  <div className="stats-value">{stat.value}</div>
                  <div className="stats-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTROLS */}
        <div className="row g-3 mb-4 align-items-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã sinh viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-8 text-md-end">
            <div className="filter-group d-inline-flex gap-2 p-1 rounded-3" style={{ backgroundColor: '#1e293b' }}>
              <button className="btn-filter active">Tất cả</button>
              <button className="btn-filter">Đang thi</button>
              <button className="btn-filter">Vi phạm</button>
            </div>
          </div>
        </div>

        {/* GRID VIEW */}
        {loading && !data ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="loading-pulsar"></div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const status = getStatusInfo(student.status);
                return (
                  <div className="col-12 col-sm-6 col-md-4 col-xl-3" key={student.studentId}>
                    <div 
                      className={`monitor-card ${student.violations > 0 ? 'border-danger' : ''} ${student.status === 'ĐANG_THI' ? 'active' : ''}`}
                      style={{ 
                        boxShadow: student.status === 'ĐANG_THI' ? status.glow : 'none',
                        borderColor: student.status === 'ĐANG_THI' ? status.color : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <div 
                          className="student-avatar" 
                          style={{ backgroundColor: getAvatarColor(student.studentName) }}
                        >
                          {student.studentName.charAt(0)}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="student-name text-truncate" title={student.studentName}>{student.studentName}</div>
                          <div className="student-code">{student.studentCode}</div>
                        </div>
                        <div className="status-tag" style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.icon}
                        </div>
                      </div>

                      <div className="card-metrics">
                        <div className="metric-item">
                          <label>Bắt đầu</label>
                          <span>{student.startTime ? new Date(student.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        </div>
                        <div className="metric-item">
                          <label>Lượt</label>
                          <span>{student.attemptCount}</span>
                        </div>
                        <div className="metric-item">
                          <label>Vi phạm</label>
                          <span className={student.violations > 0 ? 'text-danger fw-bold' : ''}>{student.violations}</span>
                        </div>
                      </div>

                      {student.violations > 0 && (
                        <div className="violation-alert mt-3 animate-head-shake">
                          <AlertTriangle size={14} /> Cảnh báo bất thường
                        </div>
                      )}

                      {student.status === 'ĐANG_THI' && (
                        <div className="card-progress mt-3">
                          <div className="progress-bar-animated" style={{ backgroundColor: status.color }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12 text-center py-5">
                <div className="empty-state">
                  <Users size={64} className="mb-3 opacity-20" />
                  <h4>Không tìm thấy dữ liệu</h4>
                  <p className="text-slate-400">Không có sinh viên nào khớp với tiêu chí tìm kiếm</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER NOTE */}
        <div className="text-center mt-5 opacity-50">
          <small className="d-flex align-items-center justify-content-center gap-2">
             <span className="pulsing" style={{ width: 8, height: 8, backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
             Hệ thường tự động cập nhật mỗi 10 giây
          </small>
        </div>
      </div>

      <style>{`
        .dark-theme {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .stats-card {
          background-color: #1e293b;
          border-radius: 16px;
          padding: 1.5rem;
          transition: transform 0.2s;
        }
        .stats-card:hover {
          transform: translateY(-5px);
        }
        .stats-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stats-value {
          font-size: 1.75rem;
          font-weight: 800;
          margin-top: 0.5rem;
        }
        .stats-label {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .search-box {
          position: relative;
          background-color: #1e293b;
          border-radius: 12px;
          padding: 2px;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        .search-input {
          width: 100%;
          background: transparent;
          border: none;
          color: white;
          padding: 0.75rem 1rem 0.75rem 3rem;
          outline: none;
        }

        .btn-filter {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .btn-filter.active {
          background-color: #334155;
          color: white;
        }

        .monitor-card {
          background-color: #1e293b;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.25rem;
          height: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .monitor-card:hover {
          transform: scale(1.02);
          background-color: #243144;
        }
        .monitor-card.active {
          background-color: #1a2538;
        }

        .student-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
          font-size: 1.2rem;
          box-shadow: inset 0 -4px 0 rgba(0,0,0,0.1);
        }

        .student-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #f8fafc;
        }
        .student-code {
          color: #64748b;
          font-size: 0.8rem;
        }

        .status-tag {
          padding: 4px 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .metric-item {
          display: flex;
          flex-direction: column;
        }
        .metric-item label {
          font-size: 0.65rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .metric-item span {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .violation-alert {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 8px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .card-progress {
          height: 3px;
          background-color: rgba(255,255,255,0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-animated {
          height: 100%;
          width: 100%;
          animation: progress-slide 2s linear infinite;
          transform-origin: left;
        }

        .btn-refresh {
          width: 44px;
          height: 44px;
          background-color: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #94a3b8;
          transition: all 0.2s;
        }
        .btn-refresh:hover:not(:disabled) {
          background-color: #334155;
          color: white;
          transform: rotate(30deg);
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        .pulsing {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .live-indicator {
           width: 10px;
           height: 10px;
           background-color: #ef4444;
           border-radius: 50%;
           display: inline-block;
           box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
           animation: live-blink 1.5s infinite;
        }

        @keyframes live-blink {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @keyframes progress-slide {
          0% { transform: scaleX(0); opacity: 0.1; }
          50% { transform: scaleX(0.5); opacity: 0.5; }
          100% { transform: scaleX(1); opacity: 0.1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(1.1); }
        }

        .loading-pulsar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #6366f1;
          animation: pulsar 1s infinite ease-out;
        }

        @keyframes pulsar {
          0% { transform: scale(0.1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ExamMonitorPage;
