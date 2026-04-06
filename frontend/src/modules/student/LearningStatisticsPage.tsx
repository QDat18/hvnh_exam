import React, { useEffect, useState } from 'react';
import { studyHubApi } from '../../services/studyHubApi';
import {
    BarChart3, TrendingUp, BookOpen, Zap, Target,
    AlertCircle, CheckCircle2, Calendar, Flame
} from 'lucide-react';

interface Stats {
    dueToday: number;
    newCards: number;
    overallStats: any;
}

interface PracticeHistory {
    id: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
}

interface CompetencyData {
    studentName: string;
    overallScore: number;
    competencyLevel: string;
    subjectAnalyses: any[];
    totalFlashcardsReviewed: number;
    totalQuestionsAnswered: number;
    averageAccuracy: number;
}

const LearningStatisticsPage: React.FC = () => {
    const [flashcardStats, setFlashcardStats] = useState<Stats | null>(null);
    const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>([]);
    const [competencyData, setCompetencyData] = useState<CompetencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [statsRes, historyRes, compRes] = await Promise.all([
                    studyHubApi.getDetailedStats(),
                    studyHubApi.getPracticeHistory(),
                    studyHubApi.getCompetencyAnalysis(),
                ]);
                setFlashcardStats(statsRes.data);
                setPracticeHistory(historyRes.data || []);
                setCompetencyData(compRes.data);
            } catch (err) {
                setError('Không thể tải dữ liệu thống kê');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#4F46E5';
        if (score >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const getCompetencyLabel = (level: string) => {
        const map: Record<string, string> = {
            EXCELLENT: 'Xuất sắc', GOOD: 'Tốt',
            AVERAGE: 'Trung bình', NEEDS_IMPROVEMENT: 'Cần cải thiện',
        };
        return map[level] || level;
    };

    const getPerformanceLevel = (score: number) => {
        if (score >= 80) return 'Thành thạo';
        if (score >= 60) return 'Đủ tiêu chuẩn';
        if (score >= 40) return 'Đang phát triển';
        return 'Bắt đầu';
    };

    const practiceAvg = practiceHistory.length > 0
        ? (practiceHistory.reduce((sum, p) => sum + (p.score || 0), 0) / practiceHistory.length).toFixed(1)
        : '0';

    if (loading) return (
        <div className="stat-loading">
            <div className="stat-spinner" />
            <p>Đang tải thống kê học tập...</p>
        </div>
    );

    if (error) return (
        <div className="stat-error">
            <AlertCircle size={32} />
            <span>{error}</span>
        </div>
    );

    const kpiCards = [
        { label: 'Flashcard đến hạn', value: flashcardStats?.dueToday ?? 0, unit: 'thẻ', icon: <Zap size={20} />, accent: '#F59E0B', bg: '#FEF3C7' },
        { label: 'Flashcard mới', value: flashcardStats?.newCards ?? 0, unit: 'thẻ', icon: <BookOpen size={20} />, accent: '#4F46E5', bg: '#EEF2FF' },
        { label: 'Độ chính xác TB', value: practiceAvg, unit: '%', icon: <TrendingUp size={20} />, accent: '#10B981', bg: '#D1FAE5' },
        { label: 'Điểm năng lực', value: competencyData ? competencyData.overallScore.toFixed(1) : '—', unit: competencyData ? '%' : '', icon: <Target size={20} />, accent: '#7C3AED', bg: '#EDE9FE' },
    ];

    return (
        <div className="stat-page">
            {/* ── Page Header ── */}
            <div className="stat-header">
                <div className="stat-header-left">
                    <div className="stat-header-icon"><BarChart3 size={22} /></div>
                    <div>
                        <h1 className="stat-title">Thống Kê Học Tập</h1>
                        <p className="stat-subtitle">Tổng quan tiến độ và năng lực của bạn</p>
                    </div>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="stat-kpi-grid">
                {kpiCards.map((k, i) => (
                    <div className="stat-kpi-card" key={i} style={{ '--accent': k.accent, '--bg': k.bg } as React.CSSProperties}>
                        <div className="kpi-icon-wrap" style={{ background: k.bg, color: k.accent }}>{k.icon}</div>
                        <div className="kpi-body">
                            <span className="kpi-label">{k.label}</span>
                            <div className="kpi-value" style={{ color: k.accent }}>
                                {k.value}<span className="kpi-unit">{k.unit}</span>
                            </div>
                        </div>
                        <div className="kpi-stripe" style={{ background: k.accent }} />
                    </div>
                ))}
            </div>

            {/* ── Main 2-col ── */}
            <div className="stat-main-grid">

                {/* LEFT: Năng lực theo môn */}
                {competencyData && (
                    <div className="stat-panel">
                        <div className="stat-panel-head">
                            <BarChart3 size={18} />
                            <h2>Hiệu suất theo môn học</h2>
                        </div>

                        {/* Overall score pill */}
                        <div className="stat-score-pill">
                            <div>
                                <div className="score-pill-num">{competencyData.overallScore.toFixed(1)}%</div>
                                <div className="score-pill-label">{getCompetencyLabel(competencyData.competencyLevel)}</div>
                            </div>
                            <div className="score-pill-ring">
                                <svg viewBox="0 0 56 56" width="56" height="56">
                                    <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                                    <circle cx="28" cy="28" r="24" fill="none" stroke="white" strokeWidth="5"
                                        strokeDasharray={`${2 * Math.PI * 24}`}
                                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - competencyData.overallScore / 100)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 28 28)" />
                                </svg>
                            </div>
                        </div>

                        <div className="stat-subject-list">
                            {competencyData.subjectAnalyses?.slice(0, 6).map((s: any, i: number) => (
                                <div className="stat-subject-row" key={i}>
                                    <div className="subject-row-info">
                                        <span className="subject-row-name">{s.subjectName}</span>
                                        <span className="subject-row-level">{getPerformanceLevel(s.accuracy)}</span>
                                    </div>
                                    <div className="subject-bar-track">
                                        <div className="subject-bar-fill"
                                            style={{ width: `${Math.min(s.accuracy, 100)}%`, background: getScoreColor(s.accuracy) }} />
                                    </div>
                                    <span className="subject-row-pct" style={{ color: getScoreColor(s.accuracy) }}>
                                        {s.accuracy.toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RIGHT: Lịch sử luyện tập */}
                <div className="stat-panel stat-history-panel">
                    <div className="stat-panel-head">
                        <Calendar size={18} />
                        <h2>Lịch sử luyện tập</h2>
                        <span className="stat-panel-badge">{practiceHistory.length} phiên</span>
                    </div>

                    {practiceHistory.length > 0 ? (
                        <div className="stat-history-list">
                            {practiceHistory.map((s, i) => {
                                const col = getScoreColor(s.score);
                                return (
                                    <div className="stat-history-item" key={i}>
                                        <div className="history-score-bar" style={{ background: col }} />
                                        <div className="history-info">
                                            <span className="history-subject">{s.subjectName}</span>
                                            <span className="history-meta">{s.totalQuestions} câu · {new Date(s.completedAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="history-score" style={{ color: col, background: `${col}15` }}>
                                            {s.score}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="stat-empty">
                            <Calendar size={40} opacity={0.3} />
                            <p>Chưa có lịch sử luyện tập</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Gợi ý học tập ── */}
            {competencyData && (
                <div className="stat-tips">
                    <div className="stat-tips-head">
                        <Flame size={18} color="#10B981" />
                        <h2>Gợi ý học tập hôm nay</h2>
                    </div>
                    <div className="stat-tips-grid">
                        {[
                            { icon: <CheckCircle2 size={18} />, label: 'Ôn tập hôm nay', value: `${flashcardStats?.dueToday || 0} flashcard đang chờ`, accent: '#10B981' },
                            { icon: <BookOpen size={18} />, label: 'Học thêm mới', value: `${flashcardStats?.newCards || 0} flashcard chưa học`, accent: '#4F46E5' },
                            { icon: <Target size={18} />, label: 'Mục tiêu', value: 'Ôn tập đều đặn mỗi ngày', accent: '#F59E0B' },
                        ].map((t, i) => (
                            <div className="stat-tip-card" key={i}>
                                <div className="tip-icon" style={{ color: t.accent, background: `${t.accent}15` }}>{t.icon}</div>
                                <div>
                                    <div className="tip-label" style={{ color: t.accent }}>{t.label}</div>
                                    <div className="tip-value">{t.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

                .stat-page {
                    padding: 1.75rem 2rem;
                    background: #F5F3FF;
                    min-height: 100vh;
                    font-family: 'Nunito', sans-serif;
                    color: #1E1B4B;
                }

                /* Header */
                .stat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
                .stat-header-left { display: flex; align-items: center; gap: 1rem; }
                .stat-header-icon {
                    width: 48px; height: 48px; border-radius: 16px;
                    background: #4F46E5; color: white;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 20px rgba(79,70,229,0.3);
                }
                .stat-title { font-size: 1.6rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; font-family: 'DM Sans', sans-serif; }
                .stat-subtitle { font-size: 0.875rem; color: #6B7280; margin: 2px 0 0; font-weight: 600; }

                /* KPI Grid */
                .stat-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                    gap: 1.25rem;
                    margin-bottom: 1.75rem;
                }
                .stat-kpi-card {
                    background: white;
                    border-radius: 22px;
                    padding: 1.4rem 1.4rem 1.4rem 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1.5px solid rgba(79,70,229,0.1);
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
                }
                .stat-kpi-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(79,70,229,0.12); }
                .kpi-stripe {
                    position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
                    border-radius: 4px 0 0 4px;
                }
                .kpi-icon-wrap {
                    width: 44px; height: 44px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .kpi-body { flex: 1; }
                .kpi-label { font-size: 0.78rem; color: #6B7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
                .kpi-value { font-size: 2rem; font-weight: 900; line-height: 1; font-family: 'DM Sans', sans-serif; letter-spacing: -1px; }
                .kpi-unit { font-size: 0.9rem; font-weight: 700; margin-left: 2px; opacity: 0.7; }

                /* Main Grid */
                .stat-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.75rem;
                }
                @media (max-width: 900px) { .stat-main-grid { grid-template-columns: 1fr; } }

                /* Panel */
                .stat-panel {
                    background: white;
                    border-radius: 24px;
                    padding: 1.5rem;
                    border: 1.5px solid rgba(79,70,229,0.1);
                    box-shadow: 0 4px 16px rgba(79,70,229,0.05);
                }
                .stat-panel-head {
                    display: flex; align-items: center; gap: 8px;
                    margin-bottom: 1.25rem; color: #4F46E5;
                }
                .stat-panel-head h2 { margin: 0; font-size: 1rem; font-weight: 800; color: #1E1B4B; flex: 1; }
                .stat-panel-badge {
                    font-size: 0.72rem; font-weight: 800;
                    background: #EEF2FF; color: #4F46E5;
                    padding: 3px 10px; border-radius: 20px;
                }

                /* Score Pill */
                .stat-score-pill {
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    border-radius: 16px;
                    padding: 1.25rem 1.5rem;
                    margin-bottom: 1.25rem;
                    display: flex; align-items: center; justify-content: space-between;
                    color: white;
                }
                .score-pill-num { font-size: 2.2rem; font-weight: 900; letter-spacing: -1px; line-height: 1; font-family: 'DM Sans', sans-serif; }
                .score-pill-label { font-size: 0.8rem; opacity: 0.85; font-weight: 700; margin-top: 4px; }

                /* Subject rows */
                .stat-subject-list { display: flex; flex-direction: column; gap: 0.875rem; }
                .stat-subject-row { display: grid; grid-template-columns: 1fr 120px 40px; align-items: center; gap: 12px; }
                .subject-row-info { min-width: 0; }
                .subject-row-name { font-size: 0.85rem; font-weight: 700; color: #1E1B4B; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .subject-row-level { font-size: 0.72rem; color: #9CA3AF; font-weight: 600; }
                .subject-bar-track { height: 7px; background: #EEF2FF; border-radius: 10px; overflow: hidden; }
                .subject-bar-fill { height: 100%; border-radius: 10px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
                .subject-row-pct { font-size: 0.82rem; font-weight: 800; text-align: right; font-family: 'DM Sans', sans-serif; }

                /* History */
                .stat-history-panel { display: flex; flex-direction: column; }
                .stat-history-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 380px; overflow-y: auto; padding-right: 4px; scrollbar-width: thin; }
                .stat-history-item {
                    display: flex; align-items: center; gap: 12px;
                    background: #F9F7FF; border-radius: 14px;
                    padding: 0.875rem 1rem;
                    transition: background 0.2s, transform 0.2s;
                    cursor: default;
                }
                .stat-history-item:hover { background: #EEF2FF; transform: translateX(4px); }
                .history-score-bar { width: 4px; height: 36px; border-radius: 4px; flex-shrink: 0; }
                .history-info { flex: 1; min-width: 0; }
                .history-subject { font-size: 0.875rem; font-weight: 700; color: #1E1B4B; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .history-meta { font-size: 0.75rem; color: #9CA3AF; font-weight: 600; margin-top: 2px; display: block; }
                .history-score { font-size: 0.875rem; font-weight: 900; padding: 4px 12px; border-radius: 10px; font-family: 'DM Sans', sans-serif; }

                /* Tips */
                .stat-tips {
                    background: white;
                    border-radius: 24px;
                    padding: 1.5rem;
                    border: 1.5px solid rgba(16,185,129,0.2);
                    box-shadow: 0 4px 16px rgba(16,185,129,0.06);
                }
                .stat-tips-head { display: flex; align-items: center; gap: 8px; margin-bottom: 1.25rem; }
                .stat-tips-head h2 { margin: 0; font-size: 1rem; font-weight: 800; color: #1E1B4B; }
                .stat-tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
                .stat-tip-card {
                    display: flex; align-items: flex-start; gap: 12px;
                    background: #F9F7FF; border-radius: 16px;
                    padding: 1rem 1.1rem;
                    transition: transform 0.25s;
                }
                .stat-tip-card:hover { transform: translateY(-3px); }
                .tip-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .tip-label { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .tip-value { font-size: 0.875rem; color: #4B5563; font-weight: 600; }

                /* Loading & Error */
                .stat-loading, .stat-error {
                    min-height: 60vh; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 16px;
                    color: #6B7280; font-weight: 700;
                }
                .stat-spinner {
                    width: 40px; height: 40px; border-radius: 50%;
                    border: 4px solid #EEF2FF;
                    border-top-color: #4F46E5;
                    animation: spin 0.8s linear infinite;
                }
                .stat-error { color: #EF4444; }
                .stat-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 3rem 1rem; color: #9CA3AF; font-weight: 600; }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default LearningStatisticsPage;