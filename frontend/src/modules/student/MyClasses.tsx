import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyHubApi } from '../../services/studyHubApi';
import courseClassService from '../../services/course-class.service';
import { BookOpen, FolderOpen, Plus, Info, CheckCircle2, X, Users, ArrowRight, Hash, Search, Loader2 } from 'lucide-react';

const CARD_GRADIENTS = [
    'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
    'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
    'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
];

const ITEMS_PER_LOAD = 8; // Số lượng thẻ load thêm mỗi lần cuộn

const MyClasses: React.FC = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // States cho Tìm kiếm & Cuộn vô hạn
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

    // Ref dùng làm "trạm gác" để bắt sự kiện cuộn tới cuối
    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchClasses = useCallback(() => {
        setLoading(true);
        studyHubApi.getMyClasses()
            .then(res => setClasses(res.data?.classes || []))
            .catch(err => console.error('Lỗi lấy danh sách lớp:', err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchClasses(); }, [fetchClasses]);

    // Reset lại số lượng hiển thị khi gõ tìm kiếm mới
    useEffect(() => {
        setVisibleCount(ITEMS_PER_LOAD);
    }, [searchTerm]);

    // Setup IntersectionObserver cho Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries: IntersectionObserverEntry[]) => {
                const target = entries[0];
                if (target.isIntersecting) {
                    // Tăng số lượng thẻ hiển thị lên khi cuộn tới bottom
                    setVisibleCount((prev: number) => prev + ITEMS_PER_LOAD);
                }
            },
            { root: null, rootMargin: '100px', threshold: 0.1 } // Kích hoạt trước khi cuộn tới sát mép 100px
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) observer.unobserve(currentLoader);
        };
    }, []);

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setIsJoining(true);
        setJoinMessage(null);
        try {
            const res = await courseClassService.joinClass(joinCode.trim());
            const data = res.data as any;
            setJoinMessage({ type: 'success', text: data.message || 'Tham gia lớp thành công!' });
            setJoinCode('');
            fetchClasses();
            setTimeout(() => { setShowJoinForm(false); setJoinMessage(null); }, 3000);
        } catch (error: any) {
            setJoinMessage({ type: 'error', text: error.response?.data?.message || 'Mã lớp không hợp lệ hoặc bạn đã tham gia lớp này.' });
        } finally {
            setIsJoining(false);
        }
    };

    // Xử lý Lọc & Cắt data theo mốc visibleCount
    const filteredClasses = classes.filter(cls =>
        (cls.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentClasses = filteredClasses.slice(0, visibleCount);
    const hasMore = visibleCount < filteredClasses.length;

    return (
        <div className="mc-page">

            {/* ── Page Header ── */}
            <div className="mc-header">
                <div className="mc-header-left">
                    <div className="mc-header-icon"><BookOpen size={22} /></div>
                    <div>
                        <h1 className="mc-title">Lớp học phần của tôi</h1>
                        <p className="mc-subtitle">
                            {loading ? 'Đang tải...' : `${classes.length} lớp học đang tham gia`}
                        </p>
                    </div>
                </div>
                <div className="mc-header-actions">
                    <button
                        className={`mc-join-btn ${showJoinForm ? 'mc-join-btn--cancel' : ''}`}
                        onClick={() => { setShowJoinForm(!showJoinForm); setJoinMessage(null); }}
                    >
                        {showJoinForm ? <><X size={16} /> Hủy</> : <><Plus size={16} /> Tham gia lớp mới</>}
                    </button>
                </div>
            </div>

            {/* ── Toolbar: Search ── */}
            {!loading && classes.length > 0 && (
                <div className="mc-toolbar">
                    <div className="mc-search-box">
                        <Search size={18} className="mc-search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã lớp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mc-search-input"
                        />
                        {searchTerm && (
                            <button className="mc-clear-search" onClick={() => setSearchTerm('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Join Form ── */}
            {showJoinForm && (
                <div className="mc-join-panel">
                    <div className="mc-join-panel-inner">
                        <div className="mc-join-label">
                            <Hash size={15} /> Nhập mã lớp học (Join Code)
                        </div>
                        <form onSubmit={handleJoinClass} className="mc-join-form">
                            <input
                                type="text"
                                className="mc-join-input"
                                placeholder="VD: ABC-1234"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                disabled={isJoining}
                                autoFocus
                            />
                            <button type="submit" className="mc-join-submit" disabled={!joinCode.trim() || isJoining}>
                                {isJoining
                                    ? <span className="mc-mini-spinner" />
                                    : 'Xác nhận'}
                            </button>
                        </form>
                        <p className="mc-join-hint">Mã do Giảng viên hoặc Khoa cung cấp.</p>
                        {joinMessage && (
                            <div className={`mc-join-msg ${joinMessage.type === 'success' ? 'mc-join-msg--ok' : 'mc-join-msg--err'}`}>
                                {joinMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
                                {joinMessage.text}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            {loading && classes.length === 0 ? (
                <div className="mc-skeleton-grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="mc-skeleton-card" />)}
                </div>
            ) : classes.length === 0 ? (
                <div className="mc-empty">
                    <div className="mc-empty-icon"><BookOpen size={40} /></div>
                    <h3>Chưa có lớp học nào</h3>
                    <p>Hãy bấm "Tham gia lớp mới" và nhập mã do giảng viên cung cấp để bắt đầu.</p>
                    <button className="mc-empty-cta" onClick={() => setShowJoinForm(true)}>
                        <Plus size={16} /> Tham gia lớp ngay
                    </button>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="mc-empty" style={{ padding: '3rem 2rem' }}>
                    <Search size={40} color="#9CA3AF" style={{ marginBottom: '1rem' }} />
                    <h3>Không tìm thấy lớp học</h3>
                    <p>Không có lớp học nào khớp với từ khóa "{searchTerm}"</p>
                </div>
            ) : (
                <>
                    <div className="mc-grid">
                        {currentClasses.map((cls, idx) => {
                            // Giữ màu gradient ổn định theo index
                            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                            const initial = cls.name?.charAt(0).toUpperCase() || '?';
                            return (
                                <div className="mc-card" key={cls.id}>
                                    <div className="mc-card-head" style={{ background: gradient }}>
                                        <div className="mc-card-head-content">
                                            <h3 className="mc-card-name" onClick={() => navigate(`/student/class-hub/${cls.id}`)} title={cls.name}>
                                                {cls.name}
                                            </h3>
                                            <span className="mc-card-code">{cls.code}</span>
                                        </div>
                                        <div className="mc-card-avatar">{initial}</div>
                                    </div>

                                    <div className="mc-card-body">
                                        <div className="mc-card-meta">
                                            <div className="mc-card-meta-row">
                                                <Users size={14} />
                                                <span>GV: <strong>{cls.teacher || 'HVNH Lecturer'}</strong></span>
                                            </div>
                                            <div className="mc-card-meta-row">
                                                <FolderOpen size={14} />
                                                <span>{cls.totalDocs || 0} tài liệu bài giảng</span>
                                            </div>
                                        </div>
                                        <button className="mc-card-cta" onClick={() => navigate(`/student/class-hub/${cls.id}`)}>
                                            Vào học <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Trạm gác Infinite Scroll (Loader) ── */}
                    {hasMore && (
                        <div ref={loaderRef} className="mc-infinite-loader">
                            <Loader2 className="mc-spin-icon" size={24} />
                            <span>Đang tải thêm...</span>
                        </div>
                    )}

                    {/* Hiển thị dòng chữ nhỏ khi đã cuộn hết */}
                    {!hasMore && currentClasses.length > 8 && (
                        <div className="mc-end-message">
                            Đã hiển thị tất cả {filteredClasses.length} lớp học.
                        </div>
                    )}
                </>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

                .mc-page {
                    padding: 1.75rem 2rem;
                    background: #F5F3FF;
                    min-height: 100vh;
                    font-family: 'Nunito', sans-serif;
                    color: #1E1B4B;
                }

                /* Header */
                .mc-header { display: flex; align-items: center; justify-content: space-between; background: white; border-radius: 22px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border: 1.5px solid rgba(79,70,229,0.1); box-shadow: 0 4px 16px rgba(79,70,229,0.05); flex-wrap: wrap; gap: 12px; }
                .mc-header-left { display: flex; align-items: center; gap: 1rem; }
                .mc-header-icon { width: 48px; height: 48px; border-radius: 16px; background: #4F46E5; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(79,70,229,0.3); }
                .mc-title { font-size: 1.3rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; font-family: 'DM Sans', sans-serif; }
                .mc-subtitle { font-size: 0.8rem; color: #9CA3AF; margin: 3px 0 0; font-weight: 600; }
                .mc-header-actions { display: flex; align-items: center; gap: 12px; }

                /* Toolbar & Search */
                .mc-toolbar { margin-bottom: 1.5rem; display: flex; justify-content: flex-end; }
                .mc-search-box { position: relative; width: 320px; max-width: 100%; background: white; border-radius: 14px; border: 1.5px solid rgba(79,70,229,0.1); display: flex; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: all 0.2s; }
                .mc-search-box:focus-within { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
                .mc-search-icon { color: #9CA3AF; margin-left: 14px; }
                .mc-search-input { flex: 1; border: none; background: transparent; padding: 0.75rem 1rem 0.75rem 0.5rem; outline: none; font-family: 'Nunito', sans-serif; font-weight: 600; color: #1E1B4B; }
                .mc-search-input::placeholder { color: #9CA3AF; font-weight: 500; }
                .mc-clear-search { background: transparent; border: none; color: #9CA3AF; padding: 0 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .mc-clear-search:hover { color: #EF4444; }

                .mc-join-btn { display: inline-flex; align-items: center; gap: 7px; background: #4F46E5; color: white; border: none; border-radius: 14px; padding: 0.75rem 1.4rem; font-size: 0.875rem; font-weight: 800; font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 6px 18px rgba(79,70,229,0.3); }
                .mc-join-btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 10px 26px rgba(79,70,229,0.4); }
                .mc-join-btn--cancel { background: #F1F5F9; color: #64748B; box-shadow: none; }
                .mc-join-btn--cancel:hover { background: #E2E8F0; transform: none; box-shadow: none; }

                /* Join Panel */
                .mc-join-panel { background: white; border-radius: 20px; border: 1.5px solid rgba(79,70,229,0.15); margin-bottom: 1.5rem; overflow: hidden; animation: mc-slide-down 0.3s cubic-bezier(0.34,1.56,0.64,1); }
                @keyframes mc-slide-down { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .mc-join-panel-inner { padding: 1.5rem; }
                .mc-join-label { display: flex; align-items: center; gap: 7px; font-size: 0.875rem; font-weight: 800; color: #4F46E5; margin-bottom: 1rem; }
                .mc-join-form { display: flex; gap: 0.875rem; flex-wrap: wrap; }
                .mc-join-input { flex: 1; min-width: 220px; padding: 0.875rem 1.1rem; border: 1.5px solid rgba(79,70,229,0.2); border-radius: 14px; font-size: 1rem; font-weight: 700; font-family: 'Nunito', sans-serif; color: #1E1B4B; outline: none; background: #F9F7FF; letter-spacing: 1px; transition: border-color 0.2s, box-shadow 0.2s; }
                .mc-join-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 4px rgba(79,70,229,0.1); background: white; }
                .mc-join-submit { background: #4F46E5; color: white; border: none; border-radius: 14px; padding: 0.875rem 1.75rem; font-size: 0.9rem; font-weight: 800; cursor: pointer; white-space: nowrap; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
                .mc-join-submit:disabled { opacity: 0.5; cursor: not-allowed; }
                .mc-join-submit:not(:disabled):hover { background: #4338CA; transform: translateY(-1px); }
                .mc-join-hint { font-size: 0.78rem; color: #9CA3AF; margin: 0.75rem 0 0; font-weight: 600; }
                .mc-join-msg { display: flex; align-items: center; gap: 8px; margin-top: 1rem; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 700; }
                .mc-join-msg--ok { background: #D1FAE5; color: #065F46; }
                .mc-join-msg--err { background: #FEE2E2; color: #991B1B; }
                .mc-mini-spinner { width: 18px; height: 18px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; animation: mc-spin 0.7s linear infinite; }
                @keyframes mc-spin { to { transform: rotate(360deg); } }

                /* Grid */
                .mc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

                /* Card */
                .mc-card { background: white; border-radius: 24px; overflow: hidden; border: 1.5px solid rgba(79,70,229,0.1); box-shadow: 0 4px 16px rgba(79,70,229,0.06); transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s, border-color 0.25s; display: flex; flex-direction: column; }
                .mc-card:hover { transform: translateY(-8px) scale(1.01); box-shadow: 0 24px 48px rgba(79,70,229,0.14); border-color: rgba(79,70,229,0.3); }

                /* Card Header cố định để thẻ luôn cân bằng */
                .mc-card-head { height: 125px; padding: 1.4rem 1.4rem; position: relative; display: flex; flex-direction: column; }
                .mc-card-head-content { padding-right: 40px; flex: 1; }
                .mc-card-name { font-size: 1.05rem; font-weight: 800; color: white; margin: 0 0 4px; cursor: pointer; line-height: 1.3; min-height: 2.6em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: opacity 0.2s; }
                .mc-card-name:hover { opacity: 0.85; }
                .mc-card-code { font-size: 0.75rem; color: rgba(255,255,255,0.8); font-weight: 700; letter-spacing: 0.5px; }
                .mc-card-avatar { position: absolute; bottom: -22px; right: 20px; width: 48px; height: 48px; border-radius: 50%; background: white; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900; border: 3px solid white; box-shadow: 0 6px 16px rgba(0,0,0,0.15); font-family: 'DM Sans', sans-serif; }

                /* Card Body */
                .mc-card-body { padding: 2.25rem 1.4rem 1.4rem; flex: 1; display: flex; flex-direction: column; }
                .mc-card-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
                .mc-card-meta-row { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #6B7280; font-weight: 600; }
                .mc-card-meta-row strong { color: #1E1B4B; }
                .mc-card-cta { margin-top: auto; width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px; background: #EEF2FF; color: #4F46E5; border: none; border-radius: 12px; padding: 0.8rem; font-size: 0.875rem; font-weight: 800; font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.2s; }
                .mc-card-cta:hover { background: #4F46E5; color: white; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.2); }

                /* Infinite Scroll Styles */
                .mc-infinite-loader { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 2.5rem 0; color: #6B7280; font-weight: 600; font-size: 0.9rem; }
                .mc-spin-icon { animation: mc-spin 1s linear infinite; color: #4F46E5; }
                .mc-end-message { text-align: center; padding: 2.5rem 0 1rem; color: #9CA3AF; font-size: 0.85rem; font-weight: 600; }

                /* Empty & Skeleton */
                .mc-empty { background: white; border-radius: 24px; padding: 4rem 2rem; text-align: center; border: 1.5px dashed rgba(79,70,229,0.25); display: flex; flex-direction: column; align-items: center; gap: 12px; }
                .mc-empty-icon { width: 72px; height: 72px; border-radius: 24px; background: #EEF2FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
                .mc-empty h3 { font-size: 1.1rem; font-weight: 900; color: #1E1B4B; margin: 0; }
                .mc-empty p { font-size: 0.875rem; color: #6B7280; max-width: 320px; line-height: 1.6; margin: 0; font-weight: 600; }
                .mc-empty-cta { display: inline-flex; align-items: center; gap: 7px; background: #4F46E5; color: white; border: none; border-radius: 14px; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 800; margin-top: 8px; box-shadow: 0 6px 18px rgba(79,70,229,0.3); transition: all 0.2s; cursor: pointer;}
                .mc-empty-cta:hover { background: #4338CA; transform: translateY(-2px); }

                .mc-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .mc-skeleton-card { height: 260px; border-radius: 24px; background: linear-gradient(90deg, #EEF2FF 25%, #E0E7FF 50%, #EEF2FF 75%); background-size: 200% 100%; animation: mc-shimmer 1.4s ease-in-out infinite; }
                @keyframes mc-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                @media (max-width: 768px) {
                    .mc-page { padding: 1rem; }
                    .mc-header { padding: 1rem; border-radius: 16px; flex-direction: column; align-items: stretch; }
                    .mc-toolbar { justify-content: flex-start; }
                    .mc-search-box { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default MyClasses;