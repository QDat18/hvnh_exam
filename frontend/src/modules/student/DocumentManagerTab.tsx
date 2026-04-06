import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Trash2, Eye,
    Loader2, CheckCircle2, AlertCircle, Filter,
    Search, BookMarked, X, Book, ChevronDown
} from 'lucide-react';
import { studyHubApi } from '../../services/studyHubApi';
import { toast } from 'react-toastify';
import { type StudentDocument } from '../../types/study';
import Skeleton from '../../components/common/Skeleton';

interface DocumentManagerTabProps {
    subjectId?: string;
}

// Component con hiển thị từng dòng tài liệu (Dùng memo để chống giật lag khi render lại)
const DocumentRow = memo(({
    doc,
    idx,
    isLast,
    onNavigate,
    onDelete,
    formatDate
}: {
    doc: StudentDocument,
    idx: number,
    isLast: boolean,
    onNavigate: (url: string) => void,
    onDelete: (id: string, title: string) => void,
    formatDate: (date?: string) => string
}) => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 2fr) minmax(120px, 1.5fr) minmax(150px, 1.5fr) 120px',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: !isLast ? '1px solid #f3f4f6' : 'none',
                alignItems: 'center',
                transition: 'background 0.3s',
                background: 'white'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
        >
            {/* Cột 1: Tên tài liệu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                }}>
                    <FileText size={20} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{
                        fontWeight: 600,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }} title={doc.documentTitle}>
                        {doc.documentTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {formatDate(doc.uploadedAt)}
                    </div>
                </div>
            </div>

            {/* Cột 2: Loại */}
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                {doc.processedCount || 0} thẻ nhớ
            </div>

            {/* Cột 3: Trạng thái xử lý AI */}
            <div>
                {doc.processingStatus === 'PROCESSING' ? (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                    }}>
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        Xử lý...
                    </div>
                ) : doc.processingStatus === 'COMPLETED' ? (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                    }}>
                        <CheckCircle2 size={12} />
                        Hoàn thành
                    </div>
                ) : (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                    }}>
                        <AlertCircle size={12} />
                        Lỗi
                    </div>
                )}
            </div>

            {/* Cột 4: Hành động */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {doc.processingStatus === 'COMPLETED' && (
                    <button
                        onClick={() => onNavigate(`/student/flashcards/review?fileId=${doc.studentDocId}`)}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.3s',
                            transform: 'scale(1)'
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)')}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                        }}
                    >
                        <Eye size={14} />
                        Học
                    </button>
                )}
                <button
                    onClick={() => onDelete(doc.studentDocId, doc.documentTitle)}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s',
                        transform: 'scale(1)'
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
});

const DocumentManagerTab: React.FC<DocumentManagerTabProps> = ({ subjectId }) => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // State cho thanh tìm kiếm Dropdown
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // State cho phân trang (Pagination)
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // State quản lý môn học
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [uploadSubjectId, setUploadSubjectId] = useState<string>(subjectId || '');

    // Đóng dropdown tìm kiếm khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // FETCH DANH SÁCH MÔN HỌC (Sử dụng API mới để lấy tất cả môn học đã join)
    useEffect(() => {
        if (!subjectId) {
            studyHubApi.getDocumentSubjects().then(res => {
                setAvailableSubjects(res.data || []);
            }).catch(err => {
                console.error("Lỗi lấy môn học:", err);
                setAvailableSubjects([]);
            });
        }
    }, [subjectId]);

    useEffect(() => {
        setUploadSubjectId(subjectId || '');
    }, [subjectId]);

    useEffect(() => {
        if (subjectId) {
            setDocuments([]);
            setPage(0);
            setHasMore(true);
            fetchDocuments(true, 0);
        }
    }, [subjectId]);

    // Polling 10 giây 1 lần chỉ khi có file đang PROCESSING
    const hasProcessingDocs = documents.some(doc => doc.processingStatus === 'PROCESSING');
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hasProcessingDocs) {
            interval = setInterval(() => {
                fetchDocuments(false, 0);
            }, 8000); // Tăng lên 8s cho đỡ nghẽn mạng
        }
        return () => clearInterval(interval);
    }, [hasProcessingDocs, subjectId]);

    // Xử lý cuộn trang (Infinite scroll)
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

        if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !isLoadingMore && !isInitialLoading) {
            fetchDocuments(false, page);
        }
    }, [page, hasMore, isLoadingMore, isInitialLoading, subjectId]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [page, hasMore, isLoadingMore, isInitialLoading, handleScroll]);

    // Hàm gọi API lấy tài liệu
    const fetchDocuments = async (showLoading = true, pageNum = page) => {
        if (!subjectId) return;
        if (showLoading && pageNum === 0) setIsInitialLoading(true);
        if (pageNum > 0) setIsLoadingMore(true);

        try {
            const limit = 10;
            const offset = pageNum * limit;
            const res = await studyHubApi.getDocuments(subjectId, offset, limit);
            const newDocs = res.data.documents || [];

            if (pageNum === 0) {
                setDocuments(newDocs);
            } else {
                setDocuments(prev => [...prev, ...newDocs]);
            }

            setHasMore(newDocs.length === limit);
            setPage(pageNum + 1);
        } catch (error) {
            console.error("Error fetching documents:", error);
            if (showLoading) toast.error("Không thể tải danh sách tài liệu.");
        } finally {
            setIsInitialLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Hàm Upload tài liệu
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const finalSubjectId = subjectId || uploadSubjectId;

        if (!finalSubjectId) {
            toast.warning("Vui lòng chọn môn học trước khi tải tài liệu!");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            await studyHubApi.uploadDocument(file, finalSubjectId, 'TEXTBOOK', (progressEvent: any) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            });

            toast.success("Tải lên thành công! AI đang bắt đầu tạo Flashcard.");
            fetchDocuments(false, 0);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Lỗi khi tải tài liệu lên.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (e.target) e.target.value = '';
        }
    };

    // Hàm xóa tài liệu
    const handleDeleteSingle = async (docId: string, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${title}" không?`)) return;

        try {
            await studyHubApi.deleteDocument(docId);
            toast.success("Đã xóa tài liệu.");
            setDocuments(prev => prev.filter(d => d.studentDocId !== docId));
            setPage(0);
            setHasMore(true);
        } catch (error) {
            toast.error("Lỗi khi xóa tài liệu.");
        }
    };

    // Format ngày tháng
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '---';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '---';
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch {
            return '---';
        }
    };

    // Lọc tài liệu theo thanh tìm kiếm
    const filteredDocs = documents.filter(d =>
        d.documentTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Tìm tên môn học để hiển thị lên Nút
    const selectedSubjectName = availableSubjects.find(s => s.subjectId === uploadSubjectId)?.subjectName || "Đang tải...";

    // NẾU CHƯA CHỌN MÔN HỌC Ở THANH ĐIỀU HƯỚNG TỔNG
    if (!subjectId) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '32px', border: '1px solid #e5e7eb', margin: '20px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ width: '80px', height: '80px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <BookMarked size={40} color="#6366f1" />
                </div>
                <h3 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', fontSize: '1.5rem' }}>Chưa chọn môn học</h3>
                <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 32px', fontWeight: 500 }}>Vui lòng chọn một môn học ở thanh công cụ phía trên để quản lý tài liệu và học tập.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>

                {/* DÒNG 1: CHỌN MÔN HỌC & NÚT UPLOAD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>

                    {/* Giao diện nút Chọn Môn Học dạng Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 16px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '100px',
                            color: '#1e293b',
                            fontWeight: 700,
                            fontSize: '15px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <div style={{
                                background: '#eef2ff', padding: '6px', borderRadius: '8px', display: 'flex'
                            }}>
                                <Book size={16} color="#4f46e5" />
                            </div>
                            {selectedSubjectName}
                            <ChevronDown size={16} color="#94a3b8" style={{ marginLeft: '4px' }} />
                        </button>
                    </div>

                    {/* Nút Upload Tài liệu */}
                    <label style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 700,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                        onMouseEnter={(e) => !isUploading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                        {isUploading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#fff', transition: 'width 0.3s' }}></div>
                                </div>
                                <span style={{ fontSize: '12px' }}>{uploadProgress}%</span>
                            </div>
                        ) : (
                            <Plus size={18} />
                        )}
                        {isUploading ? 'Đang tải...' : 'Tải tài liệu mới'}
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                {/* DÒNG 2: THANH TÌM KIẾM & LỌC */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Thanh Tìm Kiếm Floating Dropdown */}
                    <div ref={searchRef} style={{ position: 'relative', flex: '1 1 300px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 16px',
                            border: isSearchFocused ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            borderRadius: '100px',
                            background: 'white',
                            transition: 'all 0.2s',
                        }}>
                            <Search size={18} color="#64748b" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tài liệu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                style={{
                                    border: 'none', outline: 'none', flex: 1, fontSize: '15px', color: '#1e293b'
                                }}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                    <X size={16} color="#94a3b8" />
                                </button>
                            )}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '4px 6px', background: '#f1f5f9', borderRadius: '6px',
                                fontSize: '12px', fontWeight: 600, color: '#64748b',
                                border: '1px solid #e2e8f0'
                            }}>
                                ⌘ K
                            </div>
                        </div>

                        {/* Dropdown Kết Quả */}
                        {isSearchFocused && searchTerm && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e2e8f0',
                                zIndex: 50,
                                padding: '12px 0',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                <div style={{ padding: '0 16px 8px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                                    Kết quả tìm kiếm ({filteredDocs.length})
                                </div>

                                {filteredDocs.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                        Không tìm thấy tài liệu phù hợp
                                    </div>
                                ) : (
                                    filteredDocs.map(doc => (
                                        <div key={doc.studentDocId} style={{
                                            padding: '12px 16px',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileText size={16} color="#3b82f6" />
                                                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{doc.documentTitle}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginLeft: '24px' }}>
                                                document • {doc.subjectId === subjectId ? 'Chung' : 'Khác'}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Nút Bộ Lọc */}
                    <button style={{
                        padding: '10px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '100px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                        }}>
                        <Filter size={16} />
                        Bộ lọc
                    </button>
                </div>
            </div>

            {/* BẢNG DANH SÁCH TÀI LIỆU */}
            <div style={{
                maxHeight: '600px',
                overflow: 'auto',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                background: 'white'
            }} ref={scrollContainerRef}>

                <div style={{ minWidth: '800px' }}>
                    {isInitialLoading ? (
                        <div style={{ padding: '0' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(250px, 2fr) minmax(120px, 1.5fr) minmax(150px, 1.5fr) 120px',
                                gap: '16px',
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                background: '#f9fafb'
                            }}>
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} height="12px" width="60%" />)}
                            </div>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(250px, 2fr) minmax(120px, 1.5fr) minmax(150px, 1.5fr) 120px',
                                    gap: '16px',
                                    padding: '20px',
                                    borderBottom: '1px solid #f3f4f6',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <Skeleton width="40px" height="40px" borderRadius="8px" />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton width="70%" height="14px" style={{ marginBottom: '8px' }} />
                                            <Skeleton width="40%" height="10px" />
                                        </div>
                                    </div>
                                    <Skeleton width="50%" height="12px" />
                                    <Skeleton width="100px" height="24px" borderRadius="20px" />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <Skeleton width="60px" height="30px" borderRadius="6px" />
                                        <Skeleton width="40px" height="30px" borderRadius="6px" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Chưa có tài liệu nào</p>
                            <p style={{ fontSize: '14px' }}>Hãy tải lên tài liệu để bắt đầu tạo flashcard</p>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(250px, 2fr) minmax(120px, 1.5fr) minmax(150px, 1.5fr) 120px',
                                gap: '16px',
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                background: '#f9fafb',
                                fontWeight: 700,
                                fontSize: '13px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                <div>Tên tài liệu</div>
                                <div>Loại</div>
                                <div>Trạng thái</div>
                                <div style={{ textAlign: 'center' }}>Hành động</div>
                            </div>

                            <div>
                                {filteredDocs.map((doc, idx) => (
                                    <DocumentRow
                                        key={doc.studentDocId}
                                        doc={doc}
                                        idx={idx}
                                        isLast={idx === filteredDocs.length - 1}
                                        onNavigate={navigate}
                                        onDelete={handleDeleteSingle}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>

                            {isLoadingMore && (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    opacity: 0.5,
                                    borderTop: '1px solid #e5e7eb'
                                }}>
                                    <Loader2 size={20} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                                    Đang tải thêm...
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default DocumentManagerTab;