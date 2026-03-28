import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Clock, Users, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import axiosClient from '../../../services/axiosClient';

interface ActiveRoom {
  roomId: string;
  roomName: string;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  classId: string;
  className: string;
  classCode: string;
  subjectName: string;
}

const AdminActiveExams: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/admin/active-exam-rooms')
      .then(res => {
        setRooms(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error('Lỗi tải dữ liệu:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-fluid py-4 animation-fade-in">
      {/* Header */}
      <header className="mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <Eye size={24} className="text-warning" /> Giám sát kỳ thi đang diễn ra
            </h2>
            <p className="text-muted mb-0 small">Chọn phòng thi bên dưới để xem chi tiết sinh viên</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-5">
          <Loader2 className="spin text-primary" size={40} />
          <p className="text-muted mt-3">Đang tải danh sách phòng thi...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-light text-center rounded-4 py-5 px-4 border">
          <AlertCircle size={48} className="text-muted opacity-50 mb-3" />
          <h5 className="fw-bold text-dark mb-1">Không có phòng thi nào đang Active</h5>
          <p className="text-muted small mb-0">Khi GV tạo phòng thi, chúng sẽ xuất hiện ở đây</p>
        </div>
      ) : (
        <div className="row g-4">
          {rooms.map((room) => (
            <div className="col-md-6 col-lg-4" key={room.roomId}>
              <div
                className="ent-card card border-0 h-100 p-0 overflow-hidden hover-shadow cursor-pointer"
                onClick={() => navigate(`/teacher/class-hub/${room.classId}/exam/${room.roomId}/monitor`)}
                style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Top accent bar */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, #0d6efd, #6f42c1)' }} />

                <div className="p-4">
                  {/* Room Name */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <h5 className="fw-bold text-dark mb-0 lh-base">{room.roomName}</h5>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold">
                      ACTIVE
                    </span>
                  </div>

                  {/* Class Info */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <BookOpen size={14} className="text-primary" />
                      <span className="fw-medium">{room.className}</span>
                      <span className="badge bg-light text-dark border rounded-pill px-2" style={{ fontSize: '0.7rem' }}>{room.classCode}</span>
                    </div>
                    {room.subjectName && (
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <Users size={14} className="text-info" />
                        <span>{room.subjectName}</span>
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="d-flex align-items-center gap-2 pt-3 border-top">
                    <Clock size={14} className="text-warning" />
                    <span className="small text-muted">{room.durationMinutes} phút</span>
                    {room.startTime && (
                      <>
                        <span className="text-muted mx-1">•</span>
                        <span className="small text-muted">Bắt đầu: {new Date(room.startTime).toLocaleString('vi-VN')}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="bg-primary bg-opacity-10 text-primary text-center py-2 fw-bold small">
                  🔍 Nhấn để giám sát chi tiết
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminActiveExams;
