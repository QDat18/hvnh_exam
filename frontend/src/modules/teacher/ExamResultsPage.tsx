import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertTriangle, Download, CheckCircle, Clock, Eye, X } from 'lucide-react';
import { studyHubApi } from '../../services/studyHubApi'; 

const ExamResultsPage: React.FC = () => {
    const { classId, roomId } = useParams<{ classId: string, roomId: string }>();
    const navigate = useNavigate();

    const [results, setResults] = useState<any[]>([]);
    const [examInfo, setExamInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // State cho Modal lịch sử
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        if (classId && roomId) fetchResults();
    }, [classId, roomId]);

    const fetchResults = async () => {
        try {
            const res = await studyHubApi.getExamResults(classId!, roomId!);
            const data = res.data;

            setExamInfo({ 
                name: data.roomName || 'Bài kiểm tra', 
                totalStudents: data.totalStudents || 0, 
                submittedCount: data.totalParticipants || 0,
                statistics: data.statistics
            });

            // Sắp xếp điểm từ cao xuống thấp
            const sortedResults = data.results.sort((a: any, b: any) => b.bestScore - a.bestScore);
            setResults(sortedResults);
            
        } catch (error) {
            console.error("Lỗi tải kết quả:", error);
            alert("Không thể tải kết quả bài thi!");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return "Chưa hoàn thành";
        return new Date(isoString).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return "--";
        const diffMins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
        return `${diffMins} phút`;
    };

    const handleExportExcel = () => {
        if (results.length === 0) return alert("Không có dữ liệu để xuất!");
        const headers = ['STT', 'Mã SV', 'Họ và tên', 'Điểm cao nhất', 'Số lần làm', 'Nộp lần cuối'];
        const csvContent = [
            headers.join(','),
            ...results.map((r, i) => 
                [i + 1, r.studentCode, `"${r.studentName}"`, r.bestScore, r.attemptCount, `"${formatTime(r.latestSubmitTime)}"`].join(',')
            )
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `Ket_Qua_${examInfo?.name}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="bg-light min-vh-100 pb-5 animation-fade-in position-relative">
            {/* Header */}
            <div className="bg-white border-bottom py-4 shadow-sm sticky-top" style={{ zIndex: 100 }}>
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-link text-muted p-0 mb-3 text-decoration-none d-flex align-items-center gap-2">
                        <ArrowLeft size={18} /> Quay lại lớp học
                    </button>
                    <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
                        <div>
                            <h2 className="fw-bold mb-1 text-dark">Thống kê: {examInfo?.name}</h2>
                            <p className="mb-0 text-muted d-flex align-items-center gap-3">
                                <span className="d-flex align-items-center gap-1"><Users size={16}/> Sĩ số: {examInfo?.totalStudents}</span>
                                <span className="d-flex align-items-center gap-1 text-success"><CheckCircle size={16}/> Đã nộp: {examInfo?.submittedCount}</span>
                                {examInfo?.statistics && (
                                    <span className="badge bg-light text-dark border ms-2">
                                        Max: {examInfo.statistics.max} | Min: {examInfo.statistics.min} | TB: {examInfo.statistics.avg}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button onClick={handleExportExcel} className="btn btn-success fw-bold rounded-pill px-4 d-flex align-items-center gap-2 shadow-sm">
                            <Download size={18} /> Xuất Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Bảng điểm */}
            <div className="container mt-5" style={{ maxWidth: '1100px' }}>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-muted">
                                <tr>
                                    <th className="py-3 px-4">STT</th>
                                    <th className="py-3">Mã SV</th>
                                    <th className="py-3">Họ và tên</th>
                                    <th className="py-3 text-center">Điểm cao nhất</th>
                                    <th className="py-3 text-center">Số lần làm</th>
                                    <th className="py-3">Lần nộp gần nhất</th>
                                    <th className="py-3 text-center">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-5 text-muted">Chưa có dữ liệu.</td></tr>
                                ) : (
                                    results.map((res, index) => (
                                        <tr key={res.studentId}>
                                            <td className="px-4 text-muted fw-bold">{index + 1}</td>
                                            <td className="fw-bold">{res.studentCode}</td>
                                            <td className="fw-bold text-dark">{res.studentName}</td>
                                            <td className="text-center">
                                                <span className={`fs-5 fw-bold ${res.bestScore >= 8 ? 'text-success' : res.bestScore >= 5 ? 'text-primary' : 'text-danger'}`}>
                                                    {res.bestScore}
                                                </span>
                                            </td>
                                            <td className="text-center fw-bold">{res.attemptCount}</td>
                                            <td className="text-muted small">{formatTime(res.latestSubmitTime)}</td>
                                            <td className="text-center">
                                                <button onClick={() => setSelectedStudent(res)} className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-1">
                                                    <Eye size={14}/> Xem
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL LỊCH SỬ THI */}
            {selectedStudent && (
                <div className="modal fade show d-block bg-dark bg-opacity-50" tabIndex={-1}>
                    <div className="modal-dialog modal-lg modal-dialog-centered animation-zoom-in">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-header border-bottom bg-light">
                                <div>
                                    <h5 className="modal-title fw-bold">Lịch sử làm bài</h5>
                                    <small className="text-muted">{selectedStudent.studentCode} - {selectedStudent.studentName}</small>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setSelectedStudent(null)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <table className="table mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Lần thi</th>
                                            <th className="text-center">Điểm số</th>
                                            <th>Thời gian bắt đầu</th>
                                            <th>Nộp bài</th>
                                            <th>Thời gian làm</th>
                                            <th className="text-center text-danger">Vi phạm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedStudent.history.map((hist: any, idx: number) => (
                                            <tr key={hist.attemptId}>
                                                <td className="ps-4 fw-bold text-muted">Lần {selectedStudent.history.length - idx}</td>
                                                <td className="text-center fw-bold text-primary">{hist.score}</td>
                                                <td className="small">{formatTime(hist.startTime)}</td>
                                                <td className="small">{formatTime(hist.endTime)}</td>
                                                <td className="small"><Clock size={12} className="me-1"/>{calculateDuration(hist.startTime, hist.endTime)}</td>
                                                <td className="text-center">
                                                    {hist.violations > 0 ? <span className="badge bg-danger">{hist.violations}</span> : <span className="text-success">-</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animation-fade-in { animation: fadeIn 0.3s ease-out; }
                .animation-zoom-in { animation: zoomIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};
export default ExamResultsPage;