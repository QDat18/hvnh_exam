import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, Zap, Trophy, ArrowRight, FileText, Calendar, User as UserIcon, Brain, ChevronRight } from 'lucide-react';
import StudentClassesTab from '../MyClasses';
import DocumentManagerTab from '../DocumentManagerTab';
import AITutorSpace from '../AITutorSpace';
import PracticeZoneTab from '../PracticeZoneTab';
import FloatingAITutor from '../FloatingAITutor';
import { studyHubApi } from '../../../services/studyHubApi';
import { toast } from 'react-toastify';
import Skeleton from '../../../components/common/Skeleton';

interface StudentDashboardProps {
    activeTabDefault?: 'classes' | 'documents' | 'flashcards' | 'practice' | 'analytics';
}

// ─── Hero render NGAY — không block bởi bất kỳ loading state nào ───
const HeroSection = React.memo(({ userName, greeting, onStartPractice, onFlashcard, dueCount }: {
    userName: string;
    greeting: string;
    onStartPractice: () => void;
    onFlashcard: () => void;
    dueCount: number;
}) => (
    <div className="hero-card-navy mb-4 p-4 p-lg-5" style={{ borderRadius: '56px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0, 59, 112, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 59, 112, 0.25)' }}>
        <div className="hero-bg-brain" aria-hidden="true" />
        <div className="relative z-20 row align-items-center">
            <div className="col-lg-7">
                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-full mb-4 border border-white/30" style={{ background: 'rgba(255, 215, 0, 0.15)' }}>
                    <Zap size={14} style={{ color: '#ffd700' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', color: '#ffd700' }}>HỆ THỐNG ÔN TẬP THÔNG MINH</span>
                </div>
                {/* ★ LCP element — render ngay, không bị block bởi loading state */}
                <h1 className="text-white mb-2 hero-title">
                    {greeting}, <span className="text-highlight-gold">{userName}</span>!
                </h1>
                <p className="text-white/80 text-lg mb-4 opacity-95 max-w-lg fw-500">
                    Sẵn sàng bứt phá hôm nay chưa? Các lộ trình ôn tập AI đã được chuẩn bị riêng cho môn học này.
                </p>
                <div className="d-flex gap-3">
                    <button className="btn-v4-primary-navy" onClick={onStartPractice}>
                        Bắt đầu luyện tập <ArrowRight size={18} />
                    </button>
                    <button className="btn-v4-outline-white" onClick={onFlashcard}>
                        Ôn tập thẻ nhớ
                    </button>
                </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block text-center mt-4 mt-lg-0">
                <div className="ai-advisor-navy glass-card-navy p-4 text-center" style={{ borderRadius: '40px' }}>
                    <div className="brain-pulse-navy mb-3 mx-auto"><Brain size={32} color="#fff" /></div>
                    <h5 className="text-white fw-bold mb-2">Cố vấn AI đề xuất</h5>
                    <p className="text-white/70 small mb-0 px-4 lh-lg">
                        Ôn tập <b>{dueCount} thẻ</b> đến hạn để duy trì trí nhớ dài hạn hiệu quả nhất.
                    </p>
                </div>
            </div>
        </div>
    </div>
));

// ─── Stat card với skeleton riêng ───
const StatCard = React.memo(({ icon, value, label, loading, extraClass = '' }: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    loading: boolean;
    extraClass?: string;
}) => (
    <div className={`stat-card-navy p-4 h-100 ${extraClass}`}>
        {loading ? (
            <>
                <Skeleton width="48px" height="48px" borderRadius="14px" />
                <div className="mt-4">
                    <Skeleton width="60%" height="40px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height="20px" />
                </div>
            </>
        ) : (
            <>
                <div className="icon-v4 bg-navy/10 text-navy">{icon}</div>
                <div className="mt-4">
                    <div className="stat-val-v4 text-navy">{value}</div>
                    <div className="stat-label-v4 text-slate-500">{label}</div>
                </div>
            </>
        )}
    </div>
));

const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTabDefault = 'classes' }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { globalSubjects, selectedSubjectId } = useOutletContext<any>();

    // Tách loading thành 2 phase: stats (ưu tiên cao) và activities (lazy)
    const [statsLoading, setStatsLoading] = useState(true);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [stats, setStats] = useState({ classes: 0, documents: 0, flashcards: 0, avgScore: 0, dueCount: 0 });
    const [subjects, setSubjects] = useState<any[]>([]);
    const mountedRef = useRef(true);

    const getGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng";
        if (hour < 18) return "Chào buổi chiều";
        return "Chào buổi tối";
    }, []);

    const userName = user?.fullName?.split(' ').pop() || 'Bạn';
    const greeting = getGreeting();

    useEffect(() => {
        mountedRef.current = true;
        if (!selectedSubjectId) return;

        // PHASE 1: Load stats nhanh — chỉ 3 request, bỏ getPracticeHistory (chậm nhất)
        const loadCriticalData = async () => {
            setStatsLoading(true);
            try {
                const [classesRes, docsRes, dueRes] = await Promise.all([
                    studyHubApi.getMyClasses(),
                    studyHubApi.getDocuments(selectedSubjectId, 0, 100),
                    studyHubApi.getDueFlashcards()
                ]);
                if (!mountedRef.current) return;

                const classList = classesRes.data?.classes || [];
                setSubjects(classList);
                const docs = docsRes.data?.documents || [];
                const dueInfo = dueRes.data || { dueCount: 0 };

                setStats(prev => ({
                    ...prev,
                    classes: classList.length,
                    documents: docs.length,
                    flashcards: docs.reduce((acc: number, d: any) => acc + (d.flashcardCount || 0), 0),
                    dueCount: dueInfo.dueCount || 0,
                }));
            } catch (err) {
                console.error("Error loading critical dashboard data:", err);
            } finally {
                if (mountedRef.current) setStatsLoading(false);
            }
        };

        // PHASE 2: Load history lazily — defer sau khi LCP đã paint
        const loadDeferredData = async () => {
            setActivitiesLoading(true);
            try {
                // Defer 150ms để browser ưu tiên LCP render trước
                await new Promise(r => setTimeout(r, 150));
                if (!mountedRef.current) return;

                const historyRes = await studyHubApi.getPracticeHistory();
                if (!mountedRef.current) return;

                const fullHistory = historyRes.data?.sessions || historyRes.data || [];
                const avgScoreValue = fullHistory.length > 0
                    ? (fullHistory.reduce((acc: number, h: any) => acc + (h.score || 0), 0) / fullHistory.length)
                    : 0;

                setStats(prev => ({ ...prev, avgScore: avgScoreValue }));

                const mappedActivities = fullHistory.slice(0, 5).map((h: any) => {
                    const isHighScorer = (h.score || 0) >= 8;
                    return {
                        id: h.sessionId || h.id,
                        title: `Luyện tập: ${h.subjectName || 'Môn học'}`,
                        subject: `Đúng: ${h.correctAnswers || 0}/${h.numQuestions || 0}`,
                        time: h.endTime ? new Date(h.endTime).toLocaleDateString('vi-VN') : 'Đang làm',
                        icon: isHighScorer ? <Trophy size={14} /> : <FileText size={14} />,
                        color: isHighScorer ? '#10b981' : '#6366f1'
                    };
                });
                setActivities(mappedActivities);
            } catch (err) {
                console.error("Error loading deferred data:", err);
            } finally {
                if (mountedRef.current) setActivitiesLoading(false);
            }
        };

        loadCriticalData();
        loadDeferredData();

        return () => { mountedRef.current = false; };
    }, [selectedSubjectId]);

    const getIdxColor = useCallback((_idx: number) => ['#6366f1', '#0ea5e9', '#06b6d4', '#10b981'][_idx % 4], []);

    const renderDashboardOverview = () => (
        <div className="animation-fade-in relative overflow-x-hidden">
            <div className="relative z-10 px-1 py-4">

                {/* Hero render NGAY — không block bởi loading state */}
                <HeroSection
                    userName={userName}
                    greeting={greeting}
                    onStartPractice={() => navigate('/student/dashboard?tab=practice')}
                    onFlashcard={() => navigate('/student/flashcards')}
                    dueCount={stats.dueCount}
                />

                {/* STATS — skeleton từng card, không block cả trang */}
                <div className="row g-4 mb-4">
                    {[
                        { icon: <BookOpen size={20} />, value: stats.classes, label: 'Lớp học đăng ký' },
                        { icon: <FileText size={20} />, value: stats.documents, label: 'Tài liệu đã tải lên' },
                        { icon: <Zap size={20} />, value: stats.flashcards, label: 'Thẻ nhớ đã tạo' },
                        { icon: <Trophy size={20} />, value: `${stats.avgScore.toFixed(1)}/10`, label: 'Điểm đánh giá TB', extraClass: 'score-navy-gradient' },
                    ].map((s, i) => (
                        <div key={i} className="col-12 col-md-6 col-xl-3">
                            <StatCard
                                icon={s.icon}
                                value={s.value}
                                label={s.label}
                                loading={i < 3 ? statsLoading : activitiesLoading}
                                extraClass={(s as any).extraClass}
                            />
                        </div>
                    ))}
                </div>

                {/* COURSES & ACTIVITY */}
                <div className="row g-4">
                    <div className="col-12 col-xl-8">
                        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                            <div>
                                <h3 className="section-header-navy mb-1">Khóa học của tôi</h3>
                                <p className="text-slate-400 small mb-0">Học phần đang theo học kỳ này</p>
                            </div>
                            <button className="btn-explore-navy" onClick={() => navigate('/student/my-classes')}>
                                Xem tất cả <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="row g-4">
                            {statsLoading ? (
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="col-12 col-md-6">
                                        <div className="course-card-navy h-100 p-4">
                                            <Skeleton width="100%" height="120px" borderRadius="16px" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                subjects.slice(0, 4).map((sub: any, idx: number) => (
                                    <div key={sub.id} className="col-12 col-md-6">
                                        <div className="course-card-navy h-100 p-4" onClick={() => navigate(`/student/class-hub/${sub.id}`)}>
                                            <div className="d-flex justify-content-between align-items-start mb-4">
                                                <div className="idx-dot-navy" style={{ background: getIdxColor(idx) }}></div>
                                                <div className="course-code-navy">MÃ: {sub.code || '---'}</div>
                                            </div>
                                            <h4 className="course-name-navy text-navy mb-4">{sub.name}</h4>
                                            <div className="d-flex justify-content-between align-items-center mt-auto">
                                                <div className="teacher-navy text-slate-500">
                                                    <UserIcon size={14} className="me-1" /> {sub.teacher || 'HVNH Lecturer'}
                                                </div>
                                                <div className="meta-navy text-navy">
                                                    <FileText size={14} className="me-1" /> {sub.totalDocs || 0} tài liệu
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="col-12 col-xl-4">
                        <div className="activity-container-navy p-5 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 h-100">
                            <h3 className="section-header-navy mb-4">Hoạt động gần đây</h3>
                            <div className="activity-list-v4">
                                {activitiesLoading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="activity-item-navy mb-4">
                                            <Skeleton width="42px" height="42px" borderRadius="14px" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <Skeleton width="80%" height="18px" style={{ marginBottom: '6px' }} />
                                                <Skeleton width="55%" height="14px" />
                                            </div>
                                        </div>
                                    ))
                                ) : activities.length > 0 ? (
                                    activities.slice(0, 5).map((act: any) => (
                                        <div key={act.id} className="activity-item-navy mb-4">
                                            <div className="act-marker-navy" style={{ backgroundColor: act.color }}>{act.icon}</div>
                                            <div className="act-content-v4">
                                                <div className="act-title text-navy">{act.title}</div>
                                                <div className="act-meta text-slate-400">
                                                    <span>{act.time}</span><span className="dot mx-2"></span><span>{act.subject}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5 opacity-40">
                                        <Calendar size={40} strokeWidth={1} className="mx-auto mb-3" />
                                        <div className="small fw-semibold">Chưa có hoạt động</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .student-dashboard-v2 { font-family: 'Inter', sans-serif; background-color: #fff; color: #1e293b; }
                :root { --navy: #003b70; --navy-light: #f0f4f8; --gold: #fbbf24; --slate-soft: #f8fafc; }
                .icon-box-sm { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .bg-navy-light { background-color: var(--navy-light); }
                .text-navy { color: var(--navy); }

                /* ★ Dùng CSS pseudo thay vì <Brain size={240}> → không tốn paint budget */
                .hero-card-navy { background: linear-gradient(135deg, #001f3f 0%, #003b70 100%); border-radius: 56px !important; }
                .hero-bg-brain {
                    position: absolute; top: -20%; right: -10%; width: 280px; height: 280px;
                    background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
                    border-radius: 50%; pointer-events: none;
                }

                /* ★ Bỏ animation-delay & opacity:0 khởi tạo — LCP element paint ngay */
                .hero-title {
                    font-size: clamp(2rem, 5vw, 3.5rem);
                    font-weight: 900;
                    letter-spacing: -2px;
                    line-height: 1.1;
                    contain: layout style;
                }
                .text-highlight-gold { color: var(--gold); text-shadow: 0 0 25px rgba(251, 191, 36, 0.4); }

                .btn-v4-primary-navy {
                    background: var(--gold); color: #001f3f; border: none; padding: 16px 36px; border-radius: 20px;
                    font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 12px;
                    transition: transform 0.3s, box-shadow 0.3s;
                    box-shadow: 0 12px 24px -8px rgba(251, 191, 36, 0.5);
                }
                .btn-v4-primary-navy:hover { transform: translateY(-4px); box-shadow: 0 20px 30px -10px rgba(251, 191, 36, 0.6); background: #facc15; }
                .btn-v4-outline-white {
                    background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 16px 36px; border-radius: 20px; font-weight: 700; font-size: 1.05rem;
                    transition: background 0.2s, transform 0.2s; backdrop-filter: blur(12px);
                }
                .btn-v4-outline-white:hover { background: rgba(255, 255, 255, 0.2); border-color: white; transform: translateY(-2px); }
                .glass-card-navy { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 40px; }

                /* ★ Bỏ animation opacity:0 — stat cards không gây CLS */
                .stat-card-navy {
                    background: #fff; border: 1px solid #f1f5f9; border-radius: 42px;
                    box-shadow: 0 10px 40px -15px rgba(0,0,0,0.04);
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s, border-color 0.4s;
                }
                .stat-card-navy:hover { transform: translateY(-8px) scale(1.02); border-color: rgba(0, 59, 112, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 59, 112, 0.12); }
                .stat-val-v4 { font-size: 2.5rem; font-weight: 800; letter-spacing: -2px; color: var(--navy); }
                .stat-label-v4 { color: #64748b; font-weight: 600; font-size: 0.95rem; }
                .score-navy-gradient { background: linear-gradient(135deg, #fff 0%, #f8faff 100%); }

                .section-header-navy { font-weight: 800; font-size: 1.85rem; color: var(--navy); letter-spacing: -0.5px; }
                .btn-explore-navy { background: transparent; border: none; color: var(--navy); font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 8px; transition: gap 0.2s, opacity 0.2s; }
                .btn-explore-navy:hover { gap: 12px; opacity: 0.8; }

                /* ★ Bỏ animation opacity:0 — không delay render course cards */
                .course-card-navy {
                    background: #fff; border: 1px solid #f1f5f9; border-radius: 48px; cursor: pointer;
                    transition: box-shadow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.4s, border-color 0.4s;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                }
                .course-card-navy:hover { box-shadow: 0 30px 60px -12px rgba(0, 59, 112, 0.15); transform: translateY(-10px) scale(1.01); border-color: #cbd5e1; }
                .idx-dot-navy { width: 14px; height: 14px; border-radius: 50%; }
                .course-code-navy { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .course-name-navy { font-size: 1.4rem; font-weight: 800; line-height: 1.3; color: #1e293b; }

                .activity-container-navy { border-radius: 56px !important; }
                .activity-item-navy { display: flex; align-items: start; gap: 20px; position: relative; }
                .act-marker-navy { width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .activity-item-navy:not(:last-child)::after { content: ''; position: absolute; left: 21px; top: 48px; bottom: -20px; width: 2px; background: #f1f5f9; border-radius: 1px; }
                .act-title { font-weight: 700; font-size: 1.05rem; margin-bottom: 4px; color: #1e293b; }
                .act-meta { color: #64748b; font-weight: 500; }

                /* ★ fade-in nhẹ hơn, không dùng translateY để tránh reflow */
                .animation-fade-in { animation: fadeInOnly 0.35s ease forwards; }
                @keyframes fadeInOnly { from { opacity: 0.3; } to { opacity: 1; } }

                .icon-v4 { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .bg-navy { background-color: var(--navy); }
                .brain-pulse-navy { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    );

    const renderContent = () => {
        if (activeTabDefault === 'classes') return renderDashboardOverview();
        switch (activeTabDefault) {
            case 'documents': return <DocumentManagerTab subjectId={selectedSubjectId} />;
            case 'flashcards': return <AITutorSpace subjectId={selectedSubjectId} />;
            case 'practice': return <PracticeZoneTab subjectId={selectedSubjectId} />;
            case 'analytics': return (
                <div className="p-5 text-center bg-white rounded-5 border border-slate-200 shadow-sm">
                    <Trophy size={48} color="#6366f1" className="mb-3 opacity-20" />
                    <h4 className="fw-900" style={{ color: '#1e293b' }}>Phân tích năng lực</h4>
                    <p className="text-slate-500">Hệ thống đang tổng hợp dữ liệu luyện tập của bạn.</p>
                </div>
            );
            default: return <StudentClassesTab />;
        }
    };

    return (
        <div className="student-dashboard-v2 h-100" style={{ backgroundColor: 'transparent', color: '#0f172a' }}>
            <div className="dashboard-content-area-main h-100 flex-grow-1 overflow-auto">
                <div key={activeTabDefault} className="animation-fade-in h-100">
                    {renderContent()}
                </div>
            </div>
            <FloatingAITutor subjectId={selectedSubjectId} />
        </div>
    );
};

export default StudentDashboard;