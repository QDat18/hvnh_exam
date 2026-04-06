import React, { useState, useEffect } from 'react';
import { studyHubApi } from '../../services/studyHubApi';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Brain, Target, RefreshCw, Printer } from 'lucide-react';

interface CompetencyData {
    studentName: string;
    overallScore: number;
    competencyLevel: string;
    subjectAnalyses: SubjectAnalysis[];
    strengths: string[];
    weaknesses: string[];
    aiRecommendation: string;
    totalFlashcardsReviewed: number;
    totalQuestionsAnswered: number;
    averageAccuracy: number;
}

interface SubjectAnalysis {
    subjectName: string;
    accuracy: number;
    questionsAttempted: number;
    performanceLevel: string;
}

const CompetencyAnalysisPage: React.FC = () => {
    const [data, setData] = useState<CompetencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchAnalysis(); }, []);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const response = await studyHubApi.getCompetencyAnalysis();
            setData(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const levelMeta: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
        EXCELLENT: { label: 'Xuất sắc', color: '#059669', bg: '#D1FAE5', emoji: '🌟' },
        GOOD: { label: 'Tốt', color: '#4F46E5', bg: '#EEF2FF', emoji: '⭐' },
        AVERAGE: { label: 'Trung bình', color: '#F59E0B', bg: '#FEF3C7', emoji: '📈' },
        NEEDS_IMPROVEMENT: { label: 'Cần cải thiện', color: '#EF4444', bg: '#FEE2E2', emoji: '⚠️' },
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#059669';
        if (score >= 60) return '#4F46E5';
        if (score >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const getLevelMeta = (level: string) =>
        levelMeta[level] ?? { label: level, color: '#6B7280', bg: '#F3F4F6', emoji: '—' };

    if (loading) return (
        <div className="ca-loading">
            <div className="ca-spinner" />
            <p>Đang phân tích hồ sơ năng lực...</p>
        </div>
    );

    if (error || !data) return (
        <div className="ca-error">
            <AlertCircle size={40} />
            <p>{error || 'Không có dữ liệu'}</p>
            <button className="ca-btn-primary" onClick={fetchAnalysis}>Thử lại</button>
        </div>
    );

    const meta = getLevelMeta(data.competencyLevel);

    return (
        <div className="ca-page">

            {/* ── Page Header ── */}
            <div className="ca-header">
                <div className="ca-header-left">
                    <div className="ca-header-icon"><Brain size={22} /></div>
                    <div>
                        <h1 className="ca-title">Phân Tích Năng Lực</h1>
                        <p className="ca-subtitle">Sinh viên: <strong>{data.studentName}</strong></p>
                    </div>
                </div>
                <div className="ca-header-actions">
                    <button className="ca-btn-ghost" onClick={fetchAnalysis}>
                        <RefreshCw size={16} /> Cập nhật
                    </button>
                    <button className="ca-btn-ghost" onClick={() => window.print()}>
                        <Printer size={16} /> In báo cáo
                    </button>
                </div>
            </div>

            {/* ── Hero Score Banner ── */}
            <div className="ca-hero">
                <div className="ca-hero-score">
                    {/* Ring Chart */}
                    <div className="ca-ring-wrap">
                        <svg viewBox="0 0 120 120" width="120" height="120" className="ca-ring-svg">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                            <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="10"
                                strokeDasharray={`${2 * Math.PI * 52}`}
                                strokeDashoffset={`${2 * Math.PI * 52 * (1 - data.overallScore / 100)}`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
                            />
                            <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="DM Sans, sans-serif">
                                {data.overallScore.toFixed(0)}%
                            </text>
                            <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="700">
                                ĐIỂM CHUNG
                            </text>
                        </svg>
                    </div>

                    <div className="ca-hero-info">
                        <div className="ca-level-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                            {meta.emoji} {meta.label}
                        </div>
                        <div className="ca-hero-stats">
                            <div className="ca-hero-stat">
                                <span className="hero-stat-val">{data.totalFlashcardsReviewed}</span>
                                <span className="hero-stat-lab">Flashcards ôn</span>
                            </div>
                            <div className="ca-hero-divider" />
                            <div className="ca-hero-stat">
                                <span className="hero-stat-val">{data.totalQuestionsAnswered}</span>
                                <span className="hero-stat-lab">Câu hỏi làm</span>
                            </div>
                            <div className="ca-hero-divider" />
                            <div className="ca-hero-stat">
                                <span className="hero-stat-val">{data.averageAccuracy?.toFixed(1)}%</span>
                                <span className="hero-stat-lab">Chính xác TB</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* decorative orb */}
                <div className="ca-hero-orb" />
            </div>

            {/* ── Strengths & Weaknesses ── */}
            <div className="ca-sw-grid">
                <div className="ca-sw-card ca-sw-strong">
                    <div className="ca-sw-head">
                        <CheckCircle2 size={18} color="#059669" />
                        <h3>Điểm mạnh</h3>
                    </div>
                    <ul className="ca-sw-list">
                        {data.strengths.map((s, i) => (
                            <li key={i}><span className="ca-sw-dot ca-sw-dot-green" />{s}</li>
                        ))}
                    </ul>
                </div>
                <div className="ca-sw-card ca-sw-weak">
                    <div className="ca-sw-head">
                        <AlertCircle size={18} color="#EF4444" />
                        <h3>Cần cải thiện</h3>
                    </div>
                    <ul className="ca-sw-list">
                        {data.weaknesses.map((w, i) => (
                            <li key={i}><span className="ca-sw-dot ca-sw-dot-red" />{w}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ── AI Recommendation ── */}
            {data.aiRecommendation && (
                <div className="ca-ai-box">
                    <div className="ca-ai-head">
                        <div className="ca-ai-icon"><Target size={18} /></div>
                        <h3>Khuyến nghị từ AI</h3>
                        <span className="ca-ai-badge">AI</span>
                    </div>
                    <p className="ca-ai-text">{data.aiRecommendation}</p>
                </div>
            )}

            {/* ── Subject Performance ── */}
            <div className="ca-subjects">
                <div className="ca-section-head">
                    <BarChart3 size={18} color="#4F46E5" />
                    <h2>Phân tích theo môn học</h2>
                    <span className="ca-section-count">{data.subjectAnalyses?.length || 0} môn</span>
                </div>
                <div className="ca-subjects-grid">
                    {data.subjectAnalyses?.map((s, i) => {
                        const subMeta = getLevelMeta(s.performanceLevel);
                        const col = getScoreColor(s.accuracy);
                        return (
                            <div className="ca-subject-card" key={i}>
                                <div className="ca-subject-top">
                                    <span className="ca-subject-name">{s.subjectName}</span>
                                    <span className="ca-subject-badge" style={{ color: subMeta.color, background: subMeta.bg }}>
                                        {subMeta.emoji} {subMeta.label}
                                    </span>
                                </div>
                                <div className="ca-subject-bar-track">
                                    <div className="ca-subject-bar-fill" style={{ width: `${s.accuracy}%`, background: col }} />
                                </div>
                                <div className="ca-subject-foot">
                                    <span className="ca-subject-pct" style={{ color: col }}>{s.accuracy.toFixed(1)}%</span>
                                    <span className="ca-subject-q">{s.questionsAttempted} câu hỏi</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700;900&display=swap');

                .ca-page {
                    padding: 1.75rem 2rem;
                    background: #F5F3FF;
                    min-height: 100vh;
                    font-family: 'Nunito', sans-serif;
                    color: #1E1B4B;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* Header */
                .ca-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 12px; }
                .ca-header-left { display: flex; align-items: center; gap: 1rem; }
                .ca-header-icon {
                    width: 48px; height: 48px; border-radius: 16px;
                    background: #4F46E5; color: white;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 20px rgba(79,70,229,0.3);
                }
                .ca-title { font-size: 1.6rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; font-family: 'DM Sans', sans-serif; }
                .ca-subtitle { font-size: 0.875rem; color: #6B7280; margin: 2px 0 0; font-weight: 600; }
                .ca-header-actions { display: flex; gap: 0.75rem; }
                .ca-btn-ghost {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: white; border: 1.5px solid rgba(79,70,229,0.2);
                    color: #4F46E5; border-radius: 12px; padding: 0.6rem 1.1rem;
                    font-size: 0.875rem; font-weight: 700; font-family: 'Nunito', sans-serif;
                    cursor: pointer; transition: all 0.2s;
                }
                .ca-btn-ghost:hover { background: #EEF2FF; border-color: #4F46E5; transform: translateY(-1px); }
                .ca-btn-primary {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: #4F46E5; color: white; border: none;
                    border-radius: 12px; padding: 0.75rem 1.5rem;
                    font-size: 0.9rem; font-weight: 800; font-family: 'Nunito', sans-serif;
                    cursor: pointer;
                }

                /* Hero */
                .ca-hero {
                    background: linear-gradient(135deg, #1E1B4B 0%, #4F46E5 60%, #7C3AED 100%);
                    border-radius: 28px;
                    padding: 2rem 2.5rem;
                    margin-bottom: 1.75rem;
                    position: relative;
                    overflow: hidden;
                }
                .ca-hero-orb {
                    position: absolute; top: -60px; right: -60px;
                    width: 220px; height: 220px;
                    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }
                .ca-hero-score { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; position: relative; z-index: 1; }
                .ca-ring-wrap { flex-shrink: 0; }
                .ca-hero-info { flex: 1; min-width: 220px; }
                .ca-level-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 6px 16px; border-radius: 20px;
                    font-size: 0.875rem; font-weight: 800;
                    margin-bottom: 1.25rem;
                }
                .ca-hero-stats { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
                .ca-hero-stat { display: flex; flex-direction: column; gap: 3px; }
                .hero-stat-val { font-size: 1.6rem; font-weight: 900; color: white; line-height: 1; font-family: 'DM Sans', sans-serif; letter-spacing: -1px; }
                .hero-stat-lab { font-size: 0.72rem; color: rgba(255,255,255,0.65); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .ca-hero-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

                /* Strengths & Weaknesses */
                .ca-sw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.75rem; }
                @media (max-width: 700px) { .ca-sw-grid { grid-template-columns: 1fr; } }
                .ca-sw-card { border-radius: 20px; padding: 1.4rem; }
                .ca-sw-strong { background: #F0FDF4; border: 1.5px solid #86EFAC; }
                .ca-sw-weak { background: #FFF1F2; border: 1.5px solid #FECDD3; }
                .ca-sw-head { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
                .ca-sw-head h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #1E1B4B; }
                .ca-sw-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
                .ca-sw-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; line-height: 1.5; color: #374151; font-weight: 600; }
                .ca-sw-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
                .ca-sw-dot-green { background: #10B981; }
                .ca-sw-dot-red { background: #EF4444; }

                /* AI Box */
                .ca-ai-box {
                    background: white;
                    border: 1.5px solid rgba(79,70,229,0.2);
                    border-radius: 20px;
                    padding: 1.5rem;
                    margin-bottom: 1.75rem;
                    position: relative;
                    overflow: hidden;
                }
                .ca-ai-box::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, #4F46E5, #7C3AED);
                }
                .ca-ai-head { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
                .ca-ai-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: #EEF2FF; color: #4F46E5;
                    display: flex; align-items: center; justify-content: center;
                }
                .ca-ai-head h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #1E1B4B; flex: 1; }
                .ca-ai-badge {
                    font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;
                    background: linear-gradient(135deg, #4F46E5, #7C3AED);
                    color: white; padding: 3px 10px; border-radius: 20px;
                }
                .ca-ai-text { font-size: 0.9rem; color: #374151; line-height: 1.8; white-space: pre-wrap; margin: 0; font-weight: 600; }

                /* Subjects */
                .ca-subjects { margin-bottom: 1.75rem; }
                .ca-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 1.25rem; }
                .ca-section-head h2 { margin: 0; font-size: 1rem; font-weight: 800; color: #1E1B4B; flex: 1; }
                .ca-section-count {
                    font-size: 0.72rem; font-weight: 800;
                    background: #EEF2FF; color: #4F46E5;
                    padding: 3px 10px; border-radius: 20px;
                }
                .ca-subjects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 1.1rem;
                }
                .ca-subject-card {
                    background: white;
                    border-radius: 18px;
                    padding: 1.25rem;
                    border: 1.5px solid rgba(79,70,229,0.1);
                    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
                }
                .ca-subject-card:hover { transform: translateY(-5px); box-shadow: 0 16px 32px rgba(79,70,229,0.1); }
                .ca-subject-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 1rem; }
                .ca-subject-name { font-size: 0.9rem; font-weight: 800; color: #1E1B4B; line-height: 1.3; flex: 1; }
                .ca-subject-badge { font-size: 0.7rem; font-weight: 800; padding: 3px 10px; border-radius: 10px; white-space: nowrap; }
                .ca-subject-bar-track { height: 8px; background: #EEF2FF; border-radius: 10px; overflow: hidden; margin-bottom: 10px; }
                .ca-subject-bar-fill { height: 100%; border-radius: 10px; transition: width 0.7s cubic-bezier(0.34,1.56,0.64,1); }
                .ca-subject-foot { display: flex; justify-content: space-between; align-items: center; }
                .ca-subject-pct { font-size: 1rem; font-weight: 900; font-family: 'DM Sans', sans-serif; }
                .ca-subject-q { font-size: 0.75rem; color: #9CA3AF; font-weight: 600; }

                /* Loading & Error */
                .ca-loading, .ca-error {
                    min-height: 60vh; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 16px;
                    color: #6B7280; font-weight: 700;
                }
                .ca-spinner {
                    width: 42px; height: 42px; border-radius: 50%;
                    border: 4px solid #EEF2FF; border-top-color: #4F46E5;
                    animation: ca-spin 0.8s linear infinite;
                }
                .ca-error { color: #EF4444; }
                @keyframes ca-spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default CompetencyAnalysisPage;