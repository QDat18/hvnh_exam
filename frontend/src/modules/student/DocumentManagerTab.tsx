import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Trash2, Eye,
    Loader2, CheckCircle2, AlertCircle, Filter,
    Search, BookMarked, X, Download
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
    onPreview,
    onDownload,
    formatDate
}: {
    doc: StudentDocument,
    idx: number,
    isLast: boolean,
    onNavigate: (url: string) => void,
    onDelete: (id: string, title: string) => void,
    onPreview: (doc: StudentDocument) => void,
    onDownload: (doc: StudentDocument) => void,
    formatDate: (date?: string) => string
}) => {
    return (
        <div
            style={{
                display: 'grid',
                padding: '16px 20px',
                borderBottom: !isLast ? '1px solid #f3f4f6' : 'none',
                alignItems: 'center',
                transition: 'background 0.3s',
                background: 'white'
            }}
            className="document-row-grid"
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
        >
            {/* Cột 1: Tên tài liệu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1',
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
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

            {/* Cột 2: Số thẻ nhớ */}
            <div className="doc-col-type" style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ 
                    fontSize: '14px', 
                    color: '#475569', 
                    fontWeight: 600,
                    textAlign: 'center'
                }}>
                    {doc.flashcardCount || 0} thẻ
                </div>
            </div>

            {/* Cột 3: Trạng thái xử lý AI */}
            <div className="doc-col-status" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
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
                        whiteSpace: 'nowrap',
                        width: 'fit-content'
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
                        whiteSpace: 'nowrap',
                        width: 'fit-content'
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
                        whiteSpace: 'nowrap',
                        width: 'fit-content'
                    }}>
                        <AlertCircle size={12} />
                        Lỗi
                    </div>
                )}
            </div>

            {/* Cột 4: Hành động */}
            <div className="doc-col-actions" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {doc.processingStatus === 'COMPLETED' && (
                    <button
                        onClick={() => onNavigate(`/student/flashcards/review?fileId=${doc.studentDocId}`)}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
                    >
                        <Eye size={14} /> Học
                    </button>
                )}

                <button
                    onClick={() => onPreview(doc)}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)')}
                >
                    <Search size={14} /> Xem
                </button>

                <button
                    onClick={() => onDownload(doc)}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(100, 116, 139, 0.1)',
                        color: '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)')}
                >
                    <Download size={14} />
                </button>

                <button
                    onClick={() => onDelete(doc.studentDocId, doc.documentTitle)}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
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

    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [uploadSubjectId, setUploadSubjectId] = useState<string>(subjectId || '');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handlePreviewClick = async (doc: StudentDocument) => {
        setPreviewDoc(doc);
        setPreviewBlobUrl(null);
        try {
            const res = await studyHubApi.downloadDocument(doc.studentDocId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPreviewBlobUrl(url);
        } catch (err) {
            console.error("Lỗi preview:", err);
            toast.error("Không thể mở bản xem trước.");
            setPreviewDoc(null);
        }
    };

    const handleClosePreview = () => {
        if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
        setPreviewDoc(null);
        setPreviewBlobUrl(null);
    };

    const handleForceDownload = async (doc: StudentDocument) => {
        try {
            const res = await studyHubApi.downloadDocument(doc.studentDocId);
            const blob = new Blob([res.data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.documentTitle || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (err) {
            console.error("Lỗi download:", err);
            toast.error("Không thể tải tài liệu.");
        }
    };

    useEffect(() => {
        if (subjectId) {
            setDocuments([]);
            setPage(0);
            setHasMore(true);
            fetchDocuments(true, 0);
        }
    }, [subjectId]);

    const hasProcessingDocs = documents.some(doc => doc.processingStatus === 'PROCESSING');
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hasProcessingDocs) {
            interval = setInterval(() => {
                fetchDocuments(false, 0);
            }, 8000);
        }
        return () => clearInterval(interval);
    }, [hasProcessingDocs, subjectId]);

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

    const fetchDocuments = async (showLoading = true, pageNum = page) => {
        if (!subjectId) return;
        if (showLoading && pageNum === 0) setIsInitialLoading(true);
        if (pageNum > 0) setIsLoadingMore(true);

        try {
            const limit = 10;
            const res = await studyHubApi.getDocuments(subjectId, pageNum, limit);
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

    const handleDeleteSingle = async (docId: string, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${title}" không?`)) return;

        try {
            await studyHubApi.deleteDocument(docId);
            toast.success("Đã xóa tài liệu.");
            setDocuments(prev => prev.filter(d => d.studentDocId !== docId));
        } catch (error) {
            toast.error("Lỗi khi xóa tài liệu.");
        }
    };

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

    const filteredDocs = documents.filter(d =>
        d.documentTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                {/* DÒNG 1: TIÊU ĐỀ & NÚT UPLOAD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#eef2ff', padding: '10px', borderRadius: '14px', color: '#4f46e5', display: 'flex' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Kho tài liệu AI</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>Quản lý và ôn tập tài liệu hiệu quả</p>
                        </div>
                    </div>

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
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                        transition: 'all 0.3s'
                    }}
                        onMouseEnter={(e) => !isUploading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                        {isUploading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={18} />}
                        {isUploading ? `Tải lên (${uploadProgress}%)` : 'Tải tài liệu mới'}
                        <input type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>

                {/* DÒNG 2: SEARCH & FILTER */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div ref={searchRef} style={{ position: 'relative', flex: '1 1 300px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 18px',
                            border: isSearchFocused ? '2px solid #6366f1' : '1px solid #e2e8f0',
                            borderRadius: '100px',
                            background: 'white',
                            boxShadow: isSearchFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
                            transition: 'all 0.2s',
                        }}>
                            <Search size={18} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên tài liệu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                style={{ border: 'none', outline: 'none', flex: 1, fontSize: '15px', color: '#1e293b', background: 'transparent' }}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <button style={{
                        padding: '10px 20px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '100px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#475569',
                        transition: 'all 0.3s'
                    }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                        <Filter size={16} /> Bộ lọc
                    </button>
                </div>

                {/* ─── LIST AREA ─── */}
                <div className="doc-table-container shadow-sm" style={{
                    marginTop: '24px',
                    background: 'white',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                }}>
                    <div className="doc-table-inner">
                        {/* Table Header */}
                        <div className="document-row-grid doc-header-row" style={{
                            padding: '16px 20px',
                            background: '#f8fafc',
                            borderBottom: '1.5px solid #e2e8f0',
                            fontWeight: 700,
                            fontSize: '11px',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>
                            <div style={{ paddingLeft: '8px' }}>Tài liệu</div>
                            <div style={{ textAlign: 'center' }}>Thẻ nhớ</div>
                            <div style={{ textAlign: 'center' }}>Trạng thái</div>
                            <div style={{ textAlign: 'center' }}>Thao tác</div>
                        </div>

                        {/* Table Body */}
                        <div ref={scrollContainerRef} style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                            {isInitialLoading && documents.length === 0 ? (
                                <div style={{ padding: '10px 20px' }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="document-row-grid" style={{ padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <Skeleton width="44px" height="44px" borderRadius="12px" />
                                                <div style={{ flex: 1 }}><Skeleton width="70%" height="16px" style={{ marginBottom: '8px' }} /><Skeleton width="40%" height="12px" /></div>
                                            </div>
                                            <div className="text-center d-flex justify-content-center">
                                                <Skeleton width="60px" height="20px" borderRadius="6px" />
                                            </div>
                                            <div className="text-center d-flex justify-content-center">
                                                <Skeleton width="100px" height="28px" borderRadius="20px" />
                                            </div>
                                            <div className="text-center d-flex justify-content-center" style={{ gap: '8px' }}>
                                                <Skeleton width="65px" height="32px" borderRadius="8px" />
                                                <Skeleton width="65px" height="32px" borderRadius="8px" />
                                                <Skeleton width="34px" height="32px" borderRadius="8px" />
                                                <Skeleton width="34px" height="32px" borderRadius="8px" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredDocs.length === 0 ? (
                                <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                                    <FileText size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                    <h4 style={{ color: '#64748b', fontWeight: 600 }}>Chưa có tài liệu nào</h4>
                                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Bấm nút "Tải tài liệu mới" để bắt đầu.</p>
                                </div>
                            ) : (
                                <>
                                    {filteredDocs.map((doc, idx) => (
                                        <DocumentRow
                                            key={doc.studentDocId}
                                            doc={doc}
                                            idx={idx}
                                            isLast={idx === filteredDocs.length - 1}
                                            onNavigate={navigate}
                                            onDelete={handleDeleteSingle}
                                            onPreview={handlePreviewClick}
                                            onDownload={handleForceDownload}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                    {isLoadingMore && (
                                        <div style={{ padding: '20px', textAlign: 'center' }}>
                                            <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={20} color="#6366f1" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Table Footer */}
                        {!isInitialLoading && documents.length > 0 && (
                            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa', color: '#64748b', fontSize: '12px', fontWeight: 500 }}>
                                Tổng cộng: {documents.length} tài liệu
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL PREVIEW */}
            {previewDoc && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: '24px', border: 'none', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-3" style={{ color: '#1e293b' }}>
                                    <FileText size={20} color="#6366f1" /> {previewDoc.documentTitle}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleClosePreview}></button>
                            </div>
                            <div className="modal-body p-0 bg-light" style={{ height: '70vh' }}>
                                {!previewBlobUrl ? (
                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center gap-3">
                                        <Loader2 size={40} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
                                        <span className="fw-semibold text-muted">Đang tải tài liệu...</span>
                                    </div>
                                ) : (
                                    <iframe src={previewBlobUrl} className="w-100 h-100 border-0 bg-white"></iframe>
                                )}
                            </div>
                            <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                <button className="btn btn-light fw-bold rounded-pill px-4" onClick={handleClosePreview}>Đóng</button>
                                <button className="btn btn-primary fw-bold rounded-pill px-4" onClick={() => handleForceDownload(previewDoc)}>
                                    <Download size={18} className="me-2" /> Tải file về máy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .document-row-grid {
                    display: grid;
                    grid-template-columns: 4fr 1.5fr 2fr 2.5fr;
                    gap: 16px;
                    align-items: center;
                }
                .doc-table-inner { min-width: 900px; }
                .doc-table-container { overflow-x: auto; }
                @media (max-width: 992px) {
                    .document-row-grid { grid-template-columns: 1.5fr 100px 140px 220px; }
                }
                @media (max-width: 768px) {
                    .document-row-grid { display: flex; flex-direction: column; align-items: flex-start !important; padding: 20px !important; }
                    .doc-header-row { display: none !important; }
                    .doc-col-type, .doc-col-status, .doc-col-actions { width: 100%; justify-content: flex-start !important; padding-left: 52px; margin-top: 8px; }
                }
            `}</style>
        </div>
    );
};

export default DocumentManagerTab;