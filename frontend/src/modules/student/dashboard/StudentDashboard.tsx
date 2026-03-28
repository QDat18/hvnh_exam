import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { 
  BookOpen, Target, BrainCircuit, BookMarked, 
  FolderOpen, BarChart3, Sparkles 
} from 'lucide-react';
// 🔥 IMPORT SUBJECT SERVICE ĐÃ CÓ SẴN CỦA BÁC
import subjectService from '../../../services/subject.service'; 
import AITutorSpace from '../AITutorSpace';
import StudentClassesTab from '../MyClasses';
import PracticeZoneTab from '../PracticeZoneTab';
import DocumentManagerTab from '../DocumentManagerTab';
import FloatingAITutor from '../FloatingAITutor'; 

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'documents' | 'ai-tutor' | 'practice' | 'analytics'>('classes');
  
  // 🔥 Đổi State thành quản lý Môn học
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 🔥 CHỐT CHẶN: Gọi API lấy toàn bộ môn học khi Mount
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        const res = await subjectService.getAllSubjects();
        if (!isMounted) return;
        
        // Tuỳ theo backend trả về Array trực tiếp hay bọc trong content
        const subjectList = res.data?.content || res.data || [];
        setSubjects(subjectList);
        
        // Mặc định chọn môn học đầu tiên
        if (subjectList.length > 0) {
          setSelectedSubjectId(subjectList[0].id); // Dùng field 'id' của entity Subject
        }
      } catch (err) {
        console.error("Lỗi tải danh sách môn học:", err);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // Memozied value để tránh re-render component con không cần thiết
  const currentSubjectId = useMemo(() => selectedSubjectId, [selectedSubjectId]);

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* HEADER & TABS */}
      <div className="bg-white shadow-sm pt-4 mb-4 border-bottom">
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
            <div>
              <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <span className="text-primary">🎓</span> Góc học tập
              </h2>
              <p className="text-muted mb-0">Xin chào, <span className="fw-bold text-primary">{user?.fullName}</span>!</p>
            </div>
            
            {activeTab !== 'classes' && (
                <div className="d-flex align-items-center bg-light rounded-pill p-1 border shadow-sm">
                    <div className="bg-white rounded-pill px-3 py-1.5 d-flex align-items-center text-muted fw-bold small me-1 shadow-sm">
                        <BookMarked size={16} className="text-primary me-2" /> Chọn môn:
                    </div>
                    {/* 🔥 GIAO DIỆN SELECT MÔN HỌC */}
                    <select 
                        className="form-select form-select-sm border-0 bg-transparent fw-bold text-dark shadow-none cursor-pointer"
                        value={currentSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        style={{ minWidth: '220px' }}
                    >
                        {isInitialLoading ? <option>Đang tải...</option> : 
                         subjects.length === 0 ? <option>Chưa có môn học</option> :
                         subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                         ))}
                    </select>
                </div>
            )}
          </div>

          <ul className="nav nav-tabs border-0 gap-2 flex-nowrap overflow-auto hide-scrollbar">
            {[
              { id: 'classes', label: 'Lớp của tôi', icon: <BookOpen size={18} /> },
              { id: 'documents', label: 'Kho Tài Liệu', icon: <FolderOpen size={18} /> },
              { id: 'ai-tutor', label: 'Gia Sư AI', icon: <BrainCircuit size={18} /> },
              { id: 'practice', label: 'Tự Luyện', icon: <Target size={18} /> },
              { id: 'analytics', label: 'Thống Kê', icon: <BarChart3 size={18} /> },
            ].map((tab) => (
              <li className="nav-item" key={tab.id}>
                <button 
                  className={`nav-link border-0 border-bottom border-4 fw-bold px-4 py-3 d-flex align-items-center transition-all ${
                    activeTab === tab.id ? 'active border-primary text-primary bg-primary bg-opacity-10 rounded-top-4' : 'border-transparent text-muted hover-bg-light'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <span className="me-2">{tab.icon}</span> {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px' }}>
        {isInitialLoading ? (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted fw-bold">Đang tải dữ liệu môn học...</p>
            </div>
        ) : (
            <div className="tab-content animation-slide-up">
                {activeTab === 'classes' && <StudentClassesTab />}
                
                {/* 🔥 HIỂN THỊ KHI CHƯA CÓ MÔN HỌC */}
                {activeTab !== 'classes' && !currentSubjectId && (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm border mt-3">
                        <BookMarked size={48} className="text-muted opacity-25 mb-3" />
                        <h5 className="fw-bold">Chưa có dữ liệu môn học</h5>
                        <p className="text-muted small">Hệ thống hiện chưa có môn học nào để hiển thị.</p>
                    </div>
                )}

                {activeTab === 'documents' && currentSubjectId && <DocumentManagerTab subjectId={currentSubjectId} />}
                {activeTab === 'ai-tutor' && currentSubjectId && <AITutorSpace subjectId={currentSubjectId} />}
                {activeTab === 'practice' && currentSubjectId && <PracticeZoneTab subjectId={currentSubjectId} />}
                {activeTab === 'analytics' && <div className="p-5 text-center bg-white rounded-4 shadow-sm border border-dashed mt-3 text-muted">Tính năng thống kê đang được phát triển...</div>}
            </div>
        )}
      </div>

      {/* Bong bóng AI */}
      <FloatingAITutor subjectId={currentSubjectId} />
    </div>
  );
};

export default StudentDashboard;