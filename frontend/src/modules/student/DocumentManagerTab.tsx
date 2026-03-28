import React, { useState, useEffect, useRef, useCallback } from 'react';
import { studyHubApi } from '../../services/studyHubApi';
import { type StudentDocument } from '../../types/study';
import { CloudUpload, FileText, Clock, CheckCircle, AlertTriangle, FileUp, Trash2, ListChecks } from 'lucide-react';

interface DocumentManagerTabProps {
    subjectId: string;
}

const DocumentManagerTab: React.FC<DocumentManagerTabProps> = ({ subjectId }) => {
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    
    // Đổi state này thành số lượng file đang up để giao diện hiện số cho sinh động
    const [uploadingCount, setUploadingCount] = useState<number>(0);
    
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const fetchDocuments = useCallback(async (isPolling = false) => {
        try {
            const res = await studyHubApi.getDocuments(subjectId);
            const docs = res.data?.documents || [];
            setDocuments(docs);
            if (docs.some((d: StudentDocument) => d.processingStatus === 'PROCESSING')) {
                if (!pollingRef.current) startPolling();
            } else {
                stopPolling();
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách tài liệu:", err);
        } finally {
            if (!isPolling) setIsInitialLoading(false);
        }
    }, [subjectId]);

    const startPolling = () => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(() => fetchDocuments(true), 5000);
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    useEffect(() => {
        setIsInitialLoading(true);
        setSelectedDocs([]);
        fetchDocuments();
        return () => stopPolling();
    }, [fetchDocuments]);

    // 🔥 ĐÃ NÂNG CẤP: XỬ LÝ UPLOAD NHIỀU FILE CÙNG LÚC
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Lấy toàn bộ danh sách file người dùng chọn
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Lọc chỉ lấy PDF và TXT
        const validFiles = files.filter(file => file.type === 'application/pdf' || file.name.endsWith('.txt'));
        
        if (validFiles.length < files.length) {
            alert("Một số file không đúng định dạng (chỉ nhận PDF, TXT) nên đã bị bỏ qua!");
        }

        if (validFiles.length === 0) return;

        setUploadingCount(validFiles.length); // Hiện thông báo đang up bao nhiêu file

        try {
            // Upload song song nhiều file lên server
            await Promise.all(validFiles.map(file => studyHubApi.uploadDocument(file, subjectId)));
            fetchDocuments(); // Tải lại danh sách sau khi up xong
        } catch (err) {
            alert("Đã xảy ra lỗi khi tải một số tài liệu lên. Vui lòng kiểm tra lại.");
            fetchDocuments(); // Vẫn tải lại để xem cái nào up thành công
        } finally {
            setUploadingCount(0); // Tắt trạng thái loading
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedDocs(documents.map(d => d.studentDocId));
        else setSelectedDocs([]);
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) setSelectedDocs(prev => [...prev, id]);
        else setSelectedDocs(prev => prev.filter(docId => docId !== id));
    };

    const handleDeleteSingle = async (docId: string, docName: string) => {
        if (window.confirm(`Xóa tài liệu "${docName}"?`)) {
            try {
                await studyHubApi.deleteDocument(docId);
                fetchDocuments(); 
                setSelectedDocs(prev => prev.filter(id => id !== docId));
            } catch (err) {
                alert("Không thể xóa tài liệu.");
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDocs.length === 0) return;
        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedDocs.length} tài liệu đã chọn không? Mọi dữ liệu trắc nghiệm, thẻ nhớ liên quan sẽ mất vĩnh viễn.`)) {
            setUploadingCount(-1); // Mượn state để block màn hình lúc xóa
            try {
                await Promise.all(selectedDocs.map(id => studyHubApi.deleteDocument(id)));
                setSelectedDocs([]);
                fetchDocuments();
            } catch (err) {
                alert("Đã xảy ra lỗi trong quá trình xóa một số tài liệu.");
                fetchDocuments();
            } finally {
                setUploadingCount(0);
            }
        }
    };

    const isUploading = uploadingCount > 0;
    const isDeleting = uploadingCount < 0;

    return (
        <div className="row g-4 animation-fade-in">
            {/* CỘT TRÁI: UPLOAD */}
            <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-primary bg-gradient text-white">
                    <div className="card-body p-5 text-center d-flex flex-column justify-content-center">
                        <CloudUpload size={60} className="mb-4 mx-auto opacity-75" />
                        <h4 className="fw-bold text-white mb-3">Tải Tài Liệu Lên</h4>
                        <p className="text-white-50 mb-4 small">
                            Hỗ trợ định dạng PDF, TXT. Bạn có thể chọn nhiều file cùng lúc (Quét chuột hoặc Ctrl+Click).
                        </p>
                        
                        {/* THÊM THUỘC TÍNH multiple VÀO ĐÂY */}
                        <input 
                            type="file" 
                            className="d-none" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".pdf,.txt" 
                            multiple 
                        />
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading || isDeleting} 
                            className="btn btn-light text-primary btn-lg rounded-pill fw-bold shadow mt-auto w-100"
                        >
                            {isUploading ? (
                                <><span className="spinner-border spinner-border-sm me-2" /> Đang tải lên {uploadingCount} file...</>
                            ) : (
                                <><FileUp size={20} className="me-2 mb-1 d-inline" /> CHỌN NHIỀU FILE</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI: QUẢN LÝ FILE */}
            <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column">
                    <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            {documents.length > 0 && (
                                <input 
                                    className="form-check-input mt-0 fs-5 border-secondary" 
                                    type="checkbox" 
                                    title="Chọn tất cả"
                                    checked={selectedDocs.length === documents.length && documents.length > 0}
                                    onChange={handleSelectAll}
                                />
                            )}
                            <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                                <ListChecks size={20} className="me-2 text-primary" /> Tài liệu đã tải lên
                            </h5>
                        </div>
                        
                        {selectedDocs.length > 0 ? (
                            <button onClick={handleBulkDelete} disabled={isDeleting} className="btn btn-danger btn-sm rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center animation-fade-in">
                                {isDeleting ? <span className="spinner-border spinner-border-sm me-2"/> : <Trash2 size={16} className="me-2" />}
                                Xóa {selectedDocs.length} mục đã chọn
                            </button>
                        ) : (
                            <span className="badge bg-primary rounded-pill">{documents.length} files</span>
                        )}
                    </div>

                    <div className="card-body p-0 overflow-auto flex-grow-1" style={{ maxHeight: '600px' }}>
                        {isInitialLoading ? (
                            <div className="text-center py-5"><div className="spinner-border text-primary border-3"></div></div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-5">
                                <FileText size={50} className="text-muted opacity-25 mb-3 mx-auto" />
                                <p className="text-muted fw-bold">Chưa có tài liệu nào. Hãy quét khối nhiều file để tải lên nhé!</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {documents.map(doc => {
                                    const isSelected = selectedDocs.includes(doc.studentDocId);
                                    return (
                                        <div key={doc.studentDocId} className={`list-group-item p-4 border-bottom d-flex align-items-center justify-content-between transition-all ${isSelected ? 'bg-primary bg-opacity-10' : 'hover-bg-light'}`}>
                                            <div className="d-flex align-items-center overflow-hidden pe-3 w-75">
                                                <input 
                                                    className="form-check-input fs-5 me-3 border-secondary flex-shrink-0" 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={(e) => handleSelectOne(doc.studentDocId, e.target.checked)}
                                                />
                                                <div className={`bg-white shadow-sm p-3 rounded-3 me-3 ${isSelected ? 'text-primary border border-primary' : 'text-secondary border'}`}>
                                                    <FileText size={24} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h6 className={`fw-bold mb-1 text-truncate ${isSelected ? 'text-primary' : ''}`} title={doc.documentTitle}>{doc.documentTitle}</h6>
                                                    <div className="text-muted small d-flex align-items-center gap-3">
                                                        <span>{new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}</span>
                                                        <span>{doc.fileSizeMb ? `${doc.fileSizeMb} MB` : 'PDF'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 text-end d-flex align-items-center gap-3">
                                                {doc.processingStatus === 'COMPLETED' && <span className="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-2"><CheckCircle size={14} className="me-1" /> Sẵn sàng</span>}
                                                {doc.processingStatus === 'PROCESSING' && <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning rounded-pill px-3 py-2"><Clock size={14} className="me-1" /> Đang xử lý AI</span>}
                                                {doc.processingStatus === 'FAILED' && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger rounded-pill px-3 py-2"><AlertTriangle size={14} className="me-1" /> Lỗi đọc file</span>}

                                                <button 
                                                    className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2 hover-bg-danger hover-text-white transition-all ms-2"
                                                    title="Xóa tài liệu này"
                                                    onClick={() => handleDeleteSingle(doc.studentDocId, doc.documentTitle)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentManagerTab;