import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studyHubApi } from '../../services/studyHubApi';
import {
    BarChart3, TrendingUp, BookOpen, Zap, Target,
    AlertCircle, CheckCircle2, Calendar, Flame,
    Brain, RefreshCw, Printer, ChevronRight, Award,
    Activity, ShieldCheck, Sparkles
} from 'lucide-react';
import LoadingOverlay from '../../components/common/LoadingOverlay';

// ─── Interfaces ───
interface Stats {
    dueToday: number;
    newCards: number;
    overallStats: any;
}

interface PracticeHistory {
    id: string;
    sessionId?: string;
    subjectName: string;
    score: number;
    totalQuestions: number;
    numQuestions?: number;
    completedAt: string;
    endTime?: string;
}

interface SubjectAnalysis {
    subjectName: string;
    accuracy: number;
    questionsAttempted: number;
    performanceLevel: string;
}

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

const LearningAnalyticsHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [flashcardStats, setFlashcardStats] = useState<Stats | null>(null);
    const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>([]);
    const [competencyData, setCompetencyData] = useState<CompetencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

            // Normalize history (support different backend response keys)
            const rawHistory = historyRes.data?.sessions || historyRes.data || [];
            setPracticeHistory(rawHistory);

            setCompetencyData(compRes.data);
        } catch (err) {
            console.error("Error fetching analytics data:", err);
            setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ─── Helpers ───
    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10B981'; // Green
        if (score >= 60) return '#4F46E5'; // Indigo
        if (score >= 40) return '#F59E0B'; // Amber
        return '#EF4444'; // Red
    };

    const levelMeta: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
        EXCELLENT: { label: 'Xuất sắc', color: '#059669', bg: '#D1FAE5', emoji: '🌟' },
        GOOD: { label: 'Tốt', color: '#4F46E5', bg: '#EEF2FF', emoji: '⭐' },
        AVERAGE: { label: 'Trung bình', color: '#F59E0B', bg: '#FEF3C7', emoji: '📈' },
        NEEDS_IMPROVEMENT: { label: 'Cần cải thiện', color: '#EF4444', bg: '#FEE2E2', emoji: '⚠️' },
    };

    const getLevelMeta = (level: string) =>
        levelMeta[level] ?? { label: level, color: '#6B7280', bg: '#F3F4F6', emoji: '—' };

    const practiceAvg = useMemo(() => {
        if (practiceHistory.length === 0) return 0;
        const sum = practiceHistory.reduce((acc, p) => acc + (p.score || 0), 0);
        return (sum / practiceHistory.length).toFixed(1);
    }, [practiceHistory]);

    if (loading) return (
        <div className="analytics-hub-page" style={{ position: 'relative', minHeight: '80vh' }}>
            <LoadingOverlay show={loading} message="Đang tổng hợp dữ liệu học tập của bạn..." />
        </div>
    );

    if (error) return (
        <div className="analytics-error-state">
            <AlertCircle size={48} color="#EF4444" />
            <h3>Rất tiếc!</h3>
            <p>{error}</p>
            <button className="hub-btn-primary" onClick={fetchAllData}>Thử lại ngay</button>
        </div>
    );

    const kpiCards = [
        { label: 'Flashcard đến hạn', value: flashcardStats?.dueToday ?? 0, unit: 'thẻ', icon: <Zap size={20} />, accent: '#F59E0B', bg: '#FEF3C7' },
        { label: 'Flashcard mới', value: flashcardStats?.newCards ?? 0, unit: 'thẻ', icon: <BookOpen size={20} />, accent: '#4F46E5', bg: '#EEF2FF' },
        { label: 'Độ chính xác TB', value: practiceAvg, unit: '%', icon: <TrendingUp size={20} />, accent: '#10B981', bg: '#D1FAE5' },
        { label: 'Điểm năng lực', value: competencyData ? competencyData.overallScore.toFixed(0) : '—', unit: competencyData ? '%' : '', icon: <Target size={20} />, accent: '#7C3AED', bg: '#EDE9FE' },
    ];

    return (
        <div className="analytics-hub-page">
            {/* ── Header Area ── */}
            <div className="hub-header">
                <div className="hub-header-left">
                    <div className="hub-header-icon-main"><Activity size={24} /></div>
                    <div>
                        <h1 className="hub-title">Trung Tâm Phân Tích Học Tập</h1>
                        <p className="hub-subtitle">Khám phá tiềm năng và tối ưu hóa lộ trình của bạn</p>
                    </div>
                </div>
                <div className="hub-header-actions">
                    <button className="hub-btn-secondary" onClick={fetchAllData}>
                        <RefreshCw size={16} /> Cập nhật
                    </button>
                    <button className="hub-btn-secondary" onClick={() => window.print()}>
                        <Printer size={16} /> Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* ── KPI Grid ── */}
            <div className="hub-kpi-grid">
                {kpiCards.map((k, i) => (
                    <div className="hub-kpi-card" key={i}>
                        <div className="kpi-icon" style={{ background: k.bg, color: k.accent }}>{k.icon}</div>
                        <div className="kpi-content">
                            <span className="kpi-card-label">{k.label}</span>
                            <div className="kpi-card-value" style={{ color: k.accent }}>
                                {k.value}<span className="kpi-card-unit">{k.unit}</span>
                            </div>
                        </div>
                        <div className="kpi-glow" style={{ background: k.accent }} />
                    </div>
                ))}
            </div>

            {/* ── Tab Navigation ── */}
            <div className="hub-tabs">
                <button
                    className={`hub-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setSearchParams({ tab: 'overview' })}
                >
                    <BarChart3 size={18} /> Tổng quan tiến độ
                </button>
                <button
                    className={`hub-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setSearchParams({ tab: 'ai' })}
                >
                    <Sparkles size={18} /> Phân tích AI chuyên sâu
                </button>
            </div>

            {/* ── Content View ── */}
            <div className="hub-content-view">
                {activeTab === 'overview' ? (
                    <div className="hub-grid-2col">
                        {/* Left: Performance by Subject */}
                        <div className="hub-panel glass-card">
                            <div className="panel-head">
                                <Award size={18} />
                                <h2>Hiệu suất theo môn học</h2>
                            </div>

                            <div className="overall-score-banner">
                                <div className="banner-left">
                                    <div className="banner-score">{competencyData?.overallScore.toFixed(0)}%</div>
                                    <div className="banner-label">ĐIỂM NĂNG LỰC TRUNG BÌNH</div>
                                </div>
                                <div className="banner-right">
                                    <div className="level-pill" style={{
                                        background: competencyData ? getLevelMeta(competencyData.competencyLevel).bg : '#eee',
                                        color: competencyData ? getLevelMeta(competencyData.competencyLevel).color : '#888'
                                    }}>
                                        {competencyData ? getLevelMeta(competencyData.competencyLevel).emoji : ''}
                                        {competencyData ? getLevelMeta(competencyData.competencyLevel).label : '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="subject-bars-list">
                                {competencyData?.subjectAnalyses?.map((s, i) => (
                                    <div className="subject-bar-item" key={i}>
                                        <div className="subject-bar-info">
                                            <span className="subject-bar-name">{s.subjectName}</span>
                                            <span className="subject-bar-pct">{s.accuracy.toFixed(0)}%</span>
                                        </div>
                                        <div className="subject-bar-track">
                                            <div
                                                className="subject-bar-fill"
                                                style={{ width: `${s.accuracy}%`, background: getScoreColor(s.accuracy) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Practice History */}
                        <div className="hub-panel glass-card">
                            <div className="panel-head">
                                <Activity size={18} />
                                <h2>Lịch sử luyện tập gần đây</h2>
                                <div className="head-badge">{practiceHistory.length} phiên</div>
                            </div>

                            <div className="history-timeline">
                                {practiceHistory.length > 0 ? (
                                    practiceHistory.slice(0, 8).map((h, i) => {
                                        const color = getScoreColor(h.score);
                                        return (
                                            <div className="history-card" key={i}>
                                                <div className="h-card-accent" style={{ background: color }} />
                                                <div className="h-card-main">
                                                    <span className="h-card-title">{h.subjectName}</span>
                                                    <span className="h-card-meta">{h.totalQuestions || h.numQuestions} câu hỏi · {new Date(h.completedAt || h.endTime || '').toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="h-card-score" style={{ color, background: `${color}15` }}>
                                                    {h.score}%
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-state">
                                        <Calendar size={48} opacity={0.2} />
                                        <p>Chưa có dữ liệu luyện tập</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hub-ai-view">
                        {/* AI Hero Banner */}
                        <div className="ai-insight-hero">
                            <div className="ai-hero-content">
                                <div className="ai-hero-header">
                                    <div className="ai-badge-anim"><Sparkles size={16} /> AI INSIGHT</div>
                                    <h2>Dự đoán kết quả từ AI</h2>
                                </div>
                                <p className="ai-hero-text">
                                    {competencyData?.aiRecommendation || "Đang phân tích dữ liệu học tập của bạn để đưa ra những khuyến nghị chính xác nhất..."}
                                </p>
                            </div>
                            <div className="ai-hero-visual">
                                <Brain size={120} className="floating-brain" />
                            </div>
                        </div>

                        <div className="hub-grid-2col mt-4">
                            {/* Strengths */}
                            <div className="hub-panel glass-card border-green">
                                <div className="panel-head text-green">
                                    <ShieldCheck size={18} />
                                    <h2>Điểm mạnh tiêu biểu</h2>
                                </div>
                                <div className="sw-list">
                                    {competencyData?.strengths.map((s, i) => (
                                        <div className="sw-item" key={i}>
                                            <CheckCircle2 size={16} className="text-green" />
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="hub-panel glass-card border-red">
                                <div className="panel-head text-red">
                                    <AlertCircle size={18} />
                                    <h2>Cần tập trung cải thiện</h2>
                                </div>
                                <div className="sw-list">
                                    {competencyData?.weaknesses.map((w, i) => (
                                        <div className="sw-item" key={i}>
                                            <AlertCircle size={16} className="text-red" />
                                            <span>{w}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

                .analytics-hub-page {
                    padding: 2rem 2.5rem;
                    background: #F8FAFC;
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    color: #0F172A;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                @media (max-width: 768px) {
                    .analytics-hub-page {
                        padding: 1rem;
                    }
                }

                /* Header */
                .hub-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; }
                .hub-header-left { display: flex; align-items: center; gap: 1.25rem; }
                
                @media (max-width: 768px) {
                    .hub-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1.5rem;
                        margin-bottom: 1.5rem;
                    }
                    .hub-header-actions {
                        width: 100%;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.5rem;
                    }
                    .hub-btn-secondary {
                        justify-content: center;
                        padding: 0.5rem !important;
                        font-size: 0.8rem !important;
                    }
                }

                .hub-header-icon-main {
                    width: 52px; height: 52px; border-radius: 16px;
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    color: white; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 10px 25px rgba(79,70,229,0.3);
                }
                .hub-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
                
                @media (max-width: 576px) {
                    .hub-title { font-size: 1.4rem; }
                    .hub-subtitle { font-size: 0.85rem; }
                }

                .hub-subtitle { font-size: 0.9375rem; color: #64748B; margin: 4px 0 0; font-weight: 500; }
                .hub-header-actions { display: flex; gap: 0.75rem; }
                
                .hub-btn-secondary {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: white; border: 1.5px solid #E2E8F0;
                    color: #475569; border-radius: 12px; padding: 0.65rem 1.25rem;
                    font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .hub-btn-secondary:hover { background: #F1F5F9; border-color: #CBD5E1; color: #0F172A; }

                /* KPI Grid */
                .hub-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
                
                @media (max-width: 1200px) {
                    .hub-kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 576px) {
                    .hub-kpi-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    .hub-kpi-card {
                        padding: 1.25rem !important;
                    }
                    .kpi-card-value {
                        font-size: 1.75rem !important;
                    }
                }

                .hub-kpi-card {
                    background: white; border-radius: 24px; padding: 1.5rem;
                    display: flex; align-items: center; gap: 1.25rem;
                    border: 1px solid #F1F5F9; position: relative; overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .hub-kpi-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.04); }
                .kpi-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .kpi-card-label { font-size: 0.8125rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
                .kpi-card-value { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.25rem; font-weight: 800; line-height: 1; letter-spacing: -1px; }
                .kpi-card-unit { font-size: 1rem; font-weight: 700; margin-left: 2px; opacity: 0.6; }
                .kpi-glow { position: absolute; bottom: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; filter: blur(40px); opacity: 0.15; }

                /* Tabs */
                .hub-tabs { display: flex; gap: 8px; background: #EDF2F7; padding: 6px; border-radius: 16px; width: fit-content; margin-bottom: 2rem; }
                
                @media (max-width: 768px) {
                    .hub-tabs {
                        width: 100%;
                        overflow-x: auto;
                        white-space: nowrap;
                        padding: 4px;
                        gap: 4px;
                    }
                    .hub-tab-btn {
                        padding: 0.6rem 1rem !important;
                        font-size: 0.85rem !important;
                        flex: 1;
                        justify-content: center;
                    }
                }

                .hub-tab-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 0.75rem 1.5rem; border-radius: 12px; border: none;
                    background: transparent; color: #64748B; font-weight: 700;
                    cursor: pointer; transition: all 0.2s; font-size: 0.9375rem;
                }
                .hub-tab-btn.active { background: white; color: #4F46E5; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

                /* Layout Grids */
                .hub-grid-2col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.75rem; }
                @media (max-width: 1000px) { .hub-grid-2col { grid-template-columns: 1fr; } }
                
                .hub-panel { background: white; border-radius: 28px; padding: 1.75rem; border: 1px solid #F1F5F9; }
                
                @media (max-width: 576px) {
                    .hub-panel {
                        padding: 1.25rem;
                        border-radius: 20px;
                    }
                }

                .panel-head { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: #4F46E5; }
                .panel-head h2 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.125rem; font-weight: 800; color: #1E293B; flex: 1; }
                .head-badge { background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }

                /* Overall Banner */
                .overall-score-banner {
                    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                    border-radius: 20px; padding: 1.5rem 2rem; margin-bottom: 2rem;
                    display: flex; align-items: center; justify-content: space-between; color: white;
                    box-shadow: 0 12px 24px rgba(79,70,229,0.2);
                }
                
                @media (max-width: 576px) {
                    .overall-score-banner {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                        padding: 1.5rem;
                    }
                    .banner-score {
                        font-size: 2.25rem !important;
                    }
                }

                .banner-score { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 3rem; font-weight: 900; line-height: 1; margin-bottom: 4px; }
                .banner-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; opacity: 0.8; }
                .level-pill { padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 0.875rem; display: flex; align-items: center; gap: 6px; }

                /* Subject Bars */
                .subject-bars-list { display: flex; flex-direction: column; gap: 1.25rem; }
                .subject-bar-info { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .subject-bar-name { font-weight: 700; color: #1E293B; font-size: 0.9375rem; }
                .subject-bar-track { height: 10px; background: #F1F5F9; border-radius: 20px; overflow: hidden; }
                .subject-bar-fill { height: 100%; border-radius: 20px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .subject-bar-pct { font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; color: #4F46E5; }

                /* History Timeline */
                .history-timeline { display: flex; flex-direction: column; gap: 0.875rem; }
                .history-card {
                    display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
                    background: #F8FAFC; border-radius: 18px; transition: all 0.2s;
                    border: 1px solid transparent; cursor: default;
                }
                .history-card:hover { background: white; border-color: #E2E8F0; transform: translateX(6px); }
                .h-card-accent { width: 5px; height: 32px; border-radius: 4px; flex-shrink: 0; }
                .h-card-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .h-card-title { font-weight: 700; color: #1E293B; font-size: 0.9375rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .h-card-meta { font-size: 0.75rem; color: #94A3B8; font-weight: 600; }
                .h-card-score { font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 12px; border-radius: 10px; font-size: 0.875rem; }

                /* AI View */
                .ai-insight-hero {
                    background: #111827; border-radius: 32px; padding: 2.5rem 3rem;
                    display: flex; align-items: center; justify-content: space-between;
                    color: white; position: relative; overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }
                
                @media (max-width: 768px) {
                    .ai-insight-hero {
                        flex-direction: column;
                        padding: 2rem;
                        text-align: center;
                    }
                    .ai-hero-visual {
                        margin-top: 1.5rem;
                    }
                    .floating-brain {
                        width: 80px !important;
                        height: 80px !important;
                    }
                    .ai-insight-hero h2 {
                        font-size: 1.5rem !important;
                    }
                    .ai-hero-text {
                        font-size: 0.95rem !important;
                    }
                }

                .ai-hero-header { margin-bottom: 1.5rem; }
                .ai-badge-anim {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 6px 14px; border-radius: 20px; background: rgba(79,70,229,0.2);
                    color: #818CF8; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;
                    margin-bottom: 1rem; border: 1px solid rgba(79,70,229,0.3);
                }
                .ai-insight-hero h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-weight: 800; margin: 0; letter-spacing: -1px; }
                .ai-hero-text { font-size: 1.0625rem; line-height: 1.7; color: #D1D5DB; max-width: 600px; font-weight: 500; font-style: italic; }
                .floating-brain { color: #818CF8; opacity: 0.4; animation: float 6s ease-in-out infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

                .sw-list { display: flex; flex-direction: column; gap: 1rem; }
                .sw-item { display: flex; align-items: flex-start; gap: 12px; font-size: 0.9375rem; font-weight: 600; color: #334155; line-height: 1.5; }
                .text-green { color: #10B981 !important; }
                .text-red { color: #EF4444 !important; }
                .border-green { border-color: rgba(16,185,129,0.2) !important; box-shadow: 0 4px 20px rgba(16,185,129,0.05); }
                .border-red { border-color: rgba(239,68,68,0.2) !important; box-shadow: 0 4px 20px rgba(239,68,68,0.05); }

                .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; color: #94A3B8; font-weight: 600; text-align: center; }
                .analytics-error-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 1rem; }
                .analytics-error-state h3 { font-size: 1.5rem; font-weight: 800; color: #1E293B; margin: 0; }
                .hub-btn-primary { background: #4F46E5; color: white; border: none; padding: 0.75rem 2rem; border-radius: 12px; font-weight: 800; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default LearningAnalyticsHub;
