import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Book, BarChart2, Zap,
    ChevronRight, TrendingUp, Brain, Award, Plus,
    Target, PlayCircle, RotateCcw,
    Settings, Search, Edit3, Trash2, FileText,
    Flame, Sparkles, BookOpen
} from 'lucide-react';
import { studyHubApi } from '../../../services/studyHubApi';
import './FlashcardLearningHub.css';
import { toast } from 'react-toastify';
import Skeleton from '../../../components/common/Skeleton';
import { type Flashcard } from '../../../types/study';

const FlashcardLearningHub: React.FC = () => {
    const navigate = useNavigate();
    const { globalSubjects, selectedSubjectId } = useOutletContext<any>();

    const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'manage'>('overview');
    const [stats, setStats] = useState<any>(null);
    const [recentCards, setRecentCards] = useState<Flashcard[]>([]);
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const [documents, setDocuments] = useState<any[]>([]);
    const [filterDocId, setFilterDocId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState({
        subjectId: selectedSubjectId || '',
        limit: 20,
        mode: 'mixed' as 'new' | 'review' | 'mixed'
    });

    const [showCardModal, setShowCardModal] = useState(false);
    const [editingCard, setEditingCard] = useState<Partial<Flashcard> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedSubjectId) return;
        fetchData();
        setConfig(prev => ({ ...prev, subjectId: selectedSubjectId }));
    }, [selectedSubjectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, cardsRes, docsRes, countsRes] = await Promise.all([
                studyHubApi.getDetailedStats(),
                studyHubApi.getFlashcardsBySubject(selectedSubjectId, 100, 'mixed'),
                studyHubApi.getDocuments(selectedSubjectId, 0, 50),
                studyHubApi.getFlashcardSubjectCounts().catch(() => ({ data: {} }))
            ]);

            setStats(statsRes.data);
            const fetchedCards = cardsRes.data.flashcards || cardsRes.data || [];
            setAllCards(fetchedCards);
            setRecentCards(fetchedCards.slice(0, 8));
            setDocuments(docsRes.data.documents || []);
            setSubjectCounts(countsRes.data || {});
        } catch (error) {
            console.error("Error loading hub data:", error);
            toast.error("Không thể tải dữ liệu thẻ.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartReview = () => setShowConfig(true);
    const confirmStartReview = () => {
        const { subjectId, limit, mode } = config;
        let url = `/student/flashcards/review?limit=${limit}&mode=${mode}`;
        if (subjectId) url += `&subjectId=${subjectId}`;
        navigate(url);
    };

    const handleOpenAddModal = () => {
        setEditingCard({ frontText: '', backText: '', difficulty: 'MEDIUM' });
        setShowCardModal(true);
    };

    const handleOpenEditModal = (card: Flashcard) => {
        setEditingCard({ ...card });
        setShowCardModal(true);
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ này?')) return;
        toast.success("Đã xóa thẻ thành công!");
        setAllCards(prev => prev.filter(c => c.flashcardId !== cardId));
        setRecentCards(prev => prev.filter(c => c.flashcardId !== cardId));
    };

    const handleSaveCard = async () => {
        if (!editingCard?.frontText || !editingCard?.backText) {
            toast.warning("Vui lòng nhập đủ câu hỏi và đáp án.");
            return;
        }
        setIsSaving(true);
        try {
            if (editingCard.flashcardId) {
                setAllCards(prev => prev.map(c => c.flashcardId === editingCard.flashcardId ? { ...c, ...editingCard } as Flashcard : c));
                toast.success("Cập nhật thẻ thành công!");
            } else {
                const mockNewCard = { ...editingCard, flashcardId: `temp-${Date.now()}` } as Flashcard;
                setAllCards(prev => [mockNewCard, ...prev]);
                toast.success("Tạo thẻ mới thành công!");
            }
            setShowCardModal(false);
        } finally {
            setIsSaving(false);
        }
    };

    // --- OVERVIEW TAB ---
    const renderOverview = () => (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Hero Banner */}
            <div className="hero-bento">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="hero-badge">
                        <Zap size={12} color="#FCD34D" fill="#FCD34D" />
                        HỆ THỐNG AI SẴN SÀNG
                    </div>
                    <h1 className="hero-title">Chinh phục kiến thức<br />cùng flashcard! 🚀</h1>
                    <p className="hero-subtitle">
                        Ôn luyện thông minh với hệ thống ghi nhớ lặp lại — giúp bạn nhớ lâu hơn x4 lần.
                    </p>
                    <button className="btn-hero" onClick={handleStartReview}>
                        <PlayCircle size={18} />
                        BẮT ĐẦU ÔN TẬP NGAY
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="stat-card streak">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="stat-icon orange"><Flame size={22} /></div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F59E0B', background: '#FEF3C7', padding: '3px 10px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                            ỔN ĐỊNH
                        </span>
                    </div>
                    <div>
                        <div className="stat-label">Chuỗi Học Tập</div>
                        <div className="stat-value orange">{stats?.overallStats?.streakCount || 0} <span style={{ fontSize: '1rem', fontWeight: 700 }}>ngày</span></div>
                        <div className="stat-sub">Duy trì phong độ mỗi ngày!</div>
                    </div>
                </div>

                <div className="stat-card mastered">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="stat-icon green"><Award size={22} /></div>
                    </div>
                    <div>
                        <div className="stat-label">Đã Thuộc Lòng</div>
                        <div className="stat-value green">{stats?.overallStats?.mastered || 0}</div>
                        <div className="stat-sub">Trên tổng {stats?.overallStats?.total || 0} thẻ</div>
                    </div>
                </div>

                <div className="stat-card studying">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="stat-icon purple"><Target size={22} /></div>
                    </div>
                    <div>
                        <div className="stat-label">Thẻ Đang Học</div>
                        <div className="stat-value purple">{stats?.newCards || 0}</div>
                        <div className="stat-sub">Kiến thức đang chờ nạp</div>
                    </div>
                </div>
            </div>

            {/* Recent Cards */}
            <div>
                <div className="section-header">
                    <h2 className="section-title">✨ Thẻ nhớ mới tạo</h2>
                    <button className="section-link" onClick={() => setActiveTab('manage')}>
                        Xem tất cả <ChevronRight size={14} />
                    </button>
                </div>

                <div className="cards-grid">
                    {recentCards.length > 0 ? recentCards.map((card, idx) => (
                        <div key={card.flashcardId || idx} className="card-preview" onClick={handleStartReview}>
                            <div className="card-preview-header">
                                <span className={`difficulty-tag tag-${card.difficulty?.toLowerCase() || 'medium'}`}>
                                    {card.difficulty === 'EASY' ? '🟢 Dễ' : card.difficulty === 'HARD' ? '🔴 Khó' : '🟡 Vừa'}
                                </span>
                                <span className="card-preview-number">#{idx + 1}</span>
                            </div>
                            <p className="card-preview-text">{card.frontText}</p>
                        </div>
                    )) : (
                        <div className="glass-card empty-state" style={{ gridColumn: '1/-1', border: '1.5px dashed var(--border-strong)', background: 'var(--primary-light)' }}>
                            <div className="empty-icon"><BookOpen size={32} /></div>
                            <p className="empty-text">Môn học này chưa có thẻ nhớ nào. Hãy tạo thẻ đầu tiên!</p>
                            <button className="btn-primary" onClick={handleOpenAddModal}>
                                <Plus size={16} /> Tạo thẻ ngay
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // --- MANAGE TAB ---
    const renderManage = () => {
        const filteredCards = allCards.filter(c => {
            const front = c.frontText || '';
            const back = c.backText || '';
            const matchSearch = front.toLowerCase().includes(searchQuery.toLowerCase()) || back.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDoc = filterDocId ? c.studentDocId === filterDocId : true;
            return matchSearch && matchDoc;
        });

        return (
            <div className="animate-fade-up">
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 className="section-title">⚙️ Quản lý thẻ nhớ</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                        {allCards.length} thẻ · Tìm kiếm, chỉnh sửa và quản lý kho kiến thức của bạn
                    </p>
                </div>

                <div className="management-toolbar">
                    <div style={{ display: 'flex', gap: '0.875rem', flex: 1, flexWrap: 'wrap' }}>
                        <div className="search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                className="config-input"
                                style={{ paddingLeft: '2.75rem', width: '100%', height: '46px', borderRadius: '12px' }}
                                placeholder="Tìm kiếm câu hỏi, đáp án..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: '0 1 230px', position: 'relative' }}>
                            <FileText size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                            <select
                                className="config-input"
                                style={{ paddingLeft: '2.5rem', width: '100%', height: '46px', borderRadius: '12px', fontWeight: 600 }}
                                value={filterDocId}
                                onChange={e => setFilterDocId(e.target.value)}
                            >
                                <option value="">Tất cả tài liệu</option>
                                {documents.map(doc => (
                                    <option key={doc.studentDocId} value={doc.studentDocId}>{doc.documentTitle}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="btn-success" onClick={handleOpenAddModal}>
                        <Plus size={18} /> Thêm Thẻ Mới
                    </button>
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>Câu hỏi (Mặt trước)</th>
                                    <th style={{ width: '35%' }}>Đáp án (Mặt sau)</th>
                                    <th style={{ width: '15%' }}>Độ khó</th>
                                    <th style={{ width: '15%', textAlign: 'right' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCards.length > 0 ? filteredCards.map((card) => (
                                    <tr key={card.flashcardId}>
                                        <td><div className="line-clamp-2" style={{ fontWeight: 700 }}>{card.frontText}</div></td>
                                        <td><div className="line-clamp-2" style={{ color: 'var(--text-muted)' }}>{card.backText}</div></td>
                                        <td>
                                            <span className={`difficulty-tag tag-${card.difficulty?.toLowerCase() || 'medium'}`}>
                                                {card.difficulty === 'EASY' ? '🟢 Dễ' : card.difficulty === 'HARD' ? '🔴 Khó' : '🟡 Vừa'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="table-action-btn btn-edit" onClick={() => handleOpenEditModal(card)}><Edit3 size={15} /></button>
                                            <button className="table-action-btn btn-delete" onClick={() => handleDeleteCard(card.flashcardId)}><Trash2 size={15} /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            Không tìm thấy thẻ nào phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="hub-container">
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Góc học tập</span>
                <ChevronRight size={13} />
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {activeTab === 'overview' ? 'Tổng quan' : activeTab === 'manage' ? 'Quản lý thẻ' : 'Tiến độ cá nhân'}
                </span>
            </div>

            <div className="hub-layout">
                {/* Sidebar */}
                <aside className="hub-sidebar">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">🧠</div>
                        <span className="sidebar-brand-text">Flashcard</span>
                    </div>

                    <nav className="sidebar-nav">
                        {[
                            { tab: 'overview', icon: <BarChart2 size={18} />, label: 'Tổng quan' },
                            { tab: 'manage', icon: <Settings size={18} />, label: 'Quản lý thẻ' },
                            { tab: 'stats', icon: <TrendingUp size={18} />, label: 'Tiến độ' },
                        ].map(({ tab, icon, label }) => (
                            <button
                                key={tab}
                                className={`sidebar-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab as any)}
                            >
                                <div className="nav-icon">{icon}</div>
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="ai-coach-card">
                        <div className="coach-tag">
                            <Brain size={12} /> Cố vấn AI
                        </div>
                        <p className="coach-text">
                            Duy trì thói quen ôn tập hàng ngày sẽ giúp bạn ghi nhớ lâu hơn <strong>x4 lần</strong>.
                        </p>
                        <button className="coach-cta" onClick={handleStartReview}>
                            <Sparkles size={16} /> BẮT ĐẦU ÔN
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{ minWidth: 0 }}>
                    {loading ? (
                        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Skeleton width="100%" height="220px" borderRadius="28px" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                                <Skeleton height="140px" borderRadius="20px" />
                                <Skeleton height="140px" borderRadius="20px" />
                                <Skeleton height="140px" borderRadius="20px" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'manage' && renderManage()}
                            {activeTab === 'stats' && (
                                <div className="animate-fade-up">
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h2 className="section-title">📈 Tiến độ học tập</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                                            Theo dõi hành trình chinh phục kiến thức của bạn
                                        </p>
                                    </div>
                                    <div className="stats-grid">
                                        <div className="progress-stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
                                            <div className="big-num" style={{ color: 'var(--primary)' }}>
                                                {stats?.overallStats?.masteryPercentage || 0}%
                                            </div>
                                            <div className="stat-desc">🎯 Tỷ lệ thuộc lòng</div>
                                        </div>
                                        <div className="progress-stat-card" style={{ borderTop: '3px solid #10B981' }}>
                                            <div className="big-num" style={{ color: '#10B981' }}>
                                                {stats?.overallStats?.mastered || 0}
                                            </div>
                                            <div className="stat-desc">✅ Thẻ đã thuộc</div>
                                        </div>
                                        <div className="progress-stat-card" style={{ borderTop: '3px solid #F59E0B' }}>
                                            <div className="big-num" style={{ color: '#F59E0B' }}>
                                                {stats?.overallStats?.learning || 0}
                                            </div>
                                            <div className="stat-desc">📚 Đang học</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Modal Thêm / Sửa Thẻ */}
            {showCardModal && (
                <div className="modal-backdrop-v2" onClick={() => !isSaving && setShowCardModal(false)}>
                    <div className="config-modal animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '1.75rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
                                {editingCard?.flashcardId ? '✏️ Chỉnh sửa thẻ' : '✨ Thêm thẻ mới'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>Điền nội dung câu hỏi và đáp án</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ⚡ Mặt trước (Câu hỏi)
                                </label>
                                <textarea
                                    rows={3}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', resize: 'vertical' }}
                                    placeholder="Nhập câu hỏi hoặc khái niệm..."
                                    value={editingCard?.frontText || ''}
                                    onChange={e => setEditingCard(prev => ({ ...prev, frontText: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#10B981', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ✅ Mặt sau (Đáp án)
                                </label>
                                <textarea
                                    rows={4}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', resize: 'vertical' }}
                                    placeholder="Nhập đáp án hoặc giải thích..."
                                    value={editingCard?.backText || ''}
                                    onChange={e => setEditingCard(prev => ({ ...prev, backText: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.875rem', marginTop: '1.75rem' }}>
                            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCardModal(false)}>
                                Hủy bỏ
                            </button>
                            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSaveCard}>
                                {isSaving ? '⏳ Đang lưu...' : '💾 Lưu thẻ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thiết lập Ôn Tập */}
            {showConfig && (
                <div className="modal-backdrop-v2" onClick={() => setShowConfig(false)}>
                    <div className="config-modal animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '1.75rem' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px', margin: 0 }}>
                                🚀 Thiết lập phiên học
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>Tùy chỉnh mục tiêu học tập của bạn</p>
                        </div>

                        <div className="config-grid">
                            <div className="config-section">
                                <label><Book size={16} /> Chọn Môn Học</label>
                                <select className="config-select" value={config.subjectId} onChange={e => setConfig({ ...config, subjectId: e.target.value })}>
                                    <option value="">Tất cả môn học ({Object.values(subjectCounts).reduce((a, b) => a + b, 0)} thẻ)</option>
                                    {globalSubjects.map((s: any) => (
                                        <option key={s.subjectId} value={s.subjectId}>{s.subjectName} ({subjectCounts[s.subjectId] || 0} thẻ)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="config-section">
                                <label><Target size={16} /> Số lượng thẻ</label>
                                <div className="config-pills">
                                    {[10, 20, 50, 100].map(val => (
                                        <button key={val} className={`pill-btn ${config.limit === val ? 'active' : ''}`} onClick={() => setConfig({ ...config, limit: val })}>
                                            {val}
                                        </button>
                                    ))}
                                    <button className={`pill-btn ${config.limit === 999 ? 'active' : ''}`} onClick={() => setConfig({ ...config, limit: 999 })}>
                                        Tất cả
                                    </button>
                                </div>
                            </div>

                            <div className="config-section">
                                <label><Zap size={16} /> Chế độ học</label>
                                <div className="mode-options">
                                    <div className={`mode-card ${config.mode === 'mixed' ? 'active' : ''}`} onClick={() => setConfig({ ...config, mode: 'mixed' })}>
                                        <div className="mode-icon"><TrendingUp size={18} /></div>
                                        <div className="mode-name">Hỗn hợp</div>
                                    </div>
                                    <div className={`mode-card ${config.mode === 'new' ? 'active' : ''}`} onClick={() => setConfig({ ...config, mode: 'new' })}>
                                        <div className="mode-icon"><Plus size={18} /></div>
                                        <div className="mode-name">Thẻ mới</div>
                                    </div>
                                    <div className={`mode-card ${config.mode === 'review' ? 'active' : ''}`} onClick={() => setConfig({ ...config, mode: 'review' })}>
                                        <div className="mode-icon"><RotateCcw size={18} /></div>
                                        <div className="mode-name">Ôn tập</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.875rem', marginTop: '2rem' }}>
                            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowConfig(false)}>
                                Hủy bỏ
                            </button>
                            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: '1rem' }} onClick={confirmStartReview}>
                                <PlayCircle size={20} /> BẮT ĐẦU
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardLearningHub;