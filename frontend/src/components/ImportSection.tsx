import React, { useState } from 'react';
import { Upload, FileDown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../services/axiosClient';

interface ImportSectionProps {
    subjectId: string;
    chapterId?: string;
    onSuccess?: () => void;
}

const ImportSection: React.FC<ImportSectionProps> = ({ subjectId, chapterId, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                toast.error("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!subjectId) return toast.warning("Bác phải chọn môn học đã!");
        if (!file) return toast.warning("Bác chưa chọn file kìa!");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectId', subjectId);
        if (chapterId) formData.append('chapterId', chapterId);

        setUploading(true);
        try {
            // Endpoint này khớp với Backend phía dưới
            await axiosClient.post('/content/questions/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Import thành công file ${file.name}!`);
            setFile(null);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi import file Excel!");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden border-start border-5 border-success">
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-success mb-0 d-flex align-items-center gap-2">
                        <Upload size={20} /> Nhập câu hỏi từ Excel
                    </h5>
                    <a href="/templates/question_import_template.xlsx" className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1">
                        <FileDown size={14} /> Tải file mẫu
                    </a>
                </div>

                <div className={`border-2 border-dashed rounded-4 p-4 text-center transition-all ${file ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-muted'}`}>
                    <input type="file" id="excelUpload" className="d-none" accept=".xlsx, .xls" onChange={handleFileChange} />
                    <label htmlFor="excelUpload" className="cursor-pointer mb-0">
                        {file ? (
                            <div>
                                <CheckCircle2 size={40} className="text-success mb-2" />
                                <p className="fw-bold mb-0 text-dark">{file.name}</p>
                                <small className="text-muted">Bấm để chọn file khác</small>
                            </div>
                        ) : (
                            <div>
                                <Upload size={40} className="text-muted mb-2" />
                                <p className="mb-0 text-muted">Kéo thả file hoặc bấm vào đây để chọn file Excel</p>
                                <small className="text-muted">(Hỗ trợ .xlsx, .xls)</small>
                            </div>
                        )}
                    </label>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                    <button 
                        className="btn btn-success fw-bold px-4 rounded-pill d-flex align-items-center gap-2"
                        onClick={handleUpload}
                        disabled={uploading || !file}
                    >
                        {uploading ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
                        Bắt đầu Import
                    </button>
                </div>
            </div>
            <style>{`.cursor-pointer { cursor: pointer; } .spinner { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ImportSection;