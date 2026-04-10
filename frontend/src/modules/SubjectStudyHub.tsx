import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { studyHubApi } from '../services/studyHubApi';
// Đã xóa import từ lucide-react, chuyển sang dùng thẻ <i> của FontAwesome
import FloatingAITutor from '../modules/student/FloatingAITutor';
import axiosClient from '../services/axiosClient';
import ExamBuilder from '../modules/teacher/ExamBuilder';
import { toast } from 'react-toastify';
import { getFullImageUrl } from '../utils/urlUtils';

const SubjectStudyHub: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [hubData, setHubData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'stream' | 'materials' | 'exams' | 'people'>('stream');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<any>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

    const [examRooms, setExamRooms] = useState<any[]>([]);
    const [showCreateExamModal, setShowCreateExamModal] = useState(false);
    const [examFile, setExamFile] = useState<File | null>(null);
    const [selectedRoomHistory, setSelectedRoomHistory] = useState<any>(null);

    const [examStep, setExamStep] = useState<1 | 2 | 3>(1);
    const [answerGrid, setAnswerGrid] = useState<Record<number, string>>({});

    const [examForm, setExamForm] = useState({
        name: '',
        durationMinutes: 60,
        maxAttempts: 1,
        totalQuestions: 40,
        answerKey: '',
        startTime: '',
        endTime: '',
        showResult: true
    });

    const [creationMode, setCreationMode] = useState<'PDF' | 'BANK'>('PDF');
    const [isCreatingExam, setIsCreatingExam] = useState(false);
    const [examBuilderType, setExamBuilderType] = useState<'PRACTICE' | 'OFFICIAL'>('PRACTICE');
    const [showExamDropdown, setShowExamDropdown] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null);

    const handleForceEnd = async (roomId: string, roomName: string) => {
        const confirmText = window.prompt(`CẢNH BÁO HÀNH ĐỘNG\nViệc này sẽ thu bài của TẤT CẢ sinh viên đang làm bài "${roomName}" ngay lập tức.\n\nVui lòng gõ chữ "XACNHAN" (không dấu) để tiếp tục:`);
        if (confirmText !== 'XACNHAN') {
            if (confirmText !== null) toast.warning("Xác nhận không hợp lệ. Đã hủy lệnh thu bài.");
            return;
        }
        try {
            await axiosClient.post(`/exams/${roomId}/force-end`);
            toast.success("Đã đóng phòng thi thành công!");
            fetchExamRooms();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Lỗi đóng phòng thi");
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: editingRoom.name,
                durationMinutes: editingRoom.durationMinutes,
                maxAttempts: editingRoom.maxAttempts,
                showResult: editingRoom.showResult,
                startTime: editingRoom.startTime ? editingRoom.startTime : null,
                endTime: editingRoom.endTime ? editingRoom.endTime : null,
            };

            await axiosClient.put(`/exams/${editingRoom.id}/update`, payload);
            toast.success("Cập nhật phòng thi thành công!");
            setIsEditModalOpen(false);
            fetchExamRooms();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Lỗi cập nhật phòng thi");
        }
    };

    const getTeacherAvatar = (teacher: any) => {
        if (teacher.avatar && teacher.avatar.trim() !== '' && !teacher.avatar.includes('ui-avatars') && !teacher.avatar.includes('dicebear')) {
            return getFullImageUrl(teacher.avatar);
        }
        const gender = teacher.gender ? teacher.gender.toString().toUpperCase() : '';
        if (gender === 'NỮ' || gender === 'FEMALE' || gender === 'NU') {
            return 'https://tse4.mm.bing.net/th/id/OIP.aLVJAeJ4k0Sk6qAFaGwuzAHaGwuzAHaHa?w=626&h=626&rs=1&pid=ImgDetMain&o=7&rm=3';
        }
        return 'https://th.bing.com/th/id/OIP.684tcY3ThHrUDP8o6D3bnAHaLG?w=203&h=304&c=7&r=0&o=7&pid=1.7&rm=3';
    };

    const getStudentAvatar = (student: any) => {
        if (student.avatar && student.avatar.trim() !== '' && (student.avatar.startsWith('http') || student.avatar.startsWith('/'))) {
            return getFullImageUrl(student.avatar);
        }
        return `https://api.dicebear.com/9.x/initials/svg?seed=${student.fullName || 'SV'}&backgroundColor=003b70,002a50,0369a1&fontFamily=Inter&fontWeight=700`;
    };

    useEffect(() => {
        if (classId) {
            studyHubApi.getClassHub(classId)
                .then(res => setHubData(res.data))
                .catch(err => {
                    const errorMsg = err.response?.data?.error || err.message || "Lỗi không xác định";
                    console.error("DEBUG CLASS HUB 500:", err.response);
                    toast.error(`Không thể tải phòng học: ${errorMsg}`);
                });
            fetchExamRooms();
        }
    }, [classId]);

    const fetchExamRooms = () => {
        if (!classId) return Promise.resolve();
        return studyHubApi.getExamRooms(classId)
            .then(res => {
                const rooms = res.data.examRooms || res.data || [];
                setExamRooms(Array.isArray(rooms) ? rooms : []);
            })
            .catch(err => console.error("Lỗi tải phòng thi:", err));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (!hubData?.subjectId) return toast.error("Lỗi: Không tìm thấy mã môn học gốc!");

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => studyHubApi.uploadOfficialMaterial(file, hubData.subjectId));
            const results = await Promise.all(uploadPromises);
            const newDocuments = results.map(res => res.data.document);
            setHubData((prev: any) => ({ ...prev, materials: [...newDocuments, ...(prev.materials || [])] }));
            toast.success(`Đăng thành công ${newDocuments.length} tài liệu!`);
        } catch (error) {
            toast.error("Có lỗi xảy ra trong quá trình đăng tài liệu.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getFullFileUrl = (url: string) => {
        return getFullImageUrl(url);
    };

    const handlePreviewClick = async (doc: any) => {
        setPreviewDoc(doc);
        setPreviewBlobUrl(null);
        try {
            const finalUrl = getFullFileUrl(doc.fileUrl);
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await fetch(finalUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if (!response.ok) throw new Error("Lỗi tải dữ liệu file");
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            setPreviewBlobUrl(objectUrl);
        } catch (error) {
            setPreviewBlobUrl(getFullFileUrl(doc.fileUrl));
        }
    };

    const handleClosePreview = () => {
        setPreviewDoc(null);
        if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) window.URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
    };

    const handleForceDownload = async (fileUrl: string, fileName: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const finalUrl = getFullFileUrl(fileUrl);
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const response = await fetch(finalUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            window.open(getFullFileUrl(fileUrl), '_blank');
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classId) return;
        if (!examFile) return toast.error("Vui lòng tải lên file đề thi PDF!");

        const builtAnswerKey = Object.entries(answerGrid).map(([q, a]) => `${q}${a}`).join(',');
        if (!builtAnswerKey) return toast.error("Vui lòng cấu hình đáp án!");

        const formatDateTime = (dateStr: string) => {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
        };

        const formData = new FormData();
        formData.append('file', examFile);
        formData.append('name', examForm.name);
        formData.append('durationMinutes', examForm.durationMinutes.toString());
        formData.append('maxAttempts', examForm.maxAttempts.toString());
        formData.append('totalQuestions', examForm.totalQuestions.toString());
        formData.append('answerKey', builtAnswerKey);
        formData.append('courseClassId', classId);
        formData.append('showResult', examForm.showResult.toString());

        if (examForm.startTime) formData.append('startTime', formatDateTime(examForm.startTime));
        if (examForm.endTime) formData.append('endTime', formatDateTime(examForm.endTime));

        setIsUploading(true);
        try {
            await axiosClient.post(`/exams/create-from-pdf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Tạo Bài kiểm tra thành công!");
            setShowCreateExamModal(false);
            setExamFile(null);
            setExamStep(1);
            setAnswerGrid({});
            setExamForm({ name: '', durationMinutes: 60, maxAttempts: 1, totalQuestions: 40, answerKey: '', startTime: '', endTime: '', showResult: true });
            await fetchExamRooms();
        } catch (error: any) {
            toast.error("Lỗi: " + (error.response?.data?.message || "Vui lòng kiểm tra lại"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleStartExam = async (roomId: string) => {
        if (!classId) return;
        if (!window.confirm("Bạn đã sẵn sàng bắt đầu tính giờ làm bài?")) return;
        try {
            const res = await axiosClient.post(`/student/study-hub/class-hub/${classId}/exam-rooms/${roomId}/start`);
            const { attemptId } = res.data;
            navigate(`/student/exam-taking/${attemptId}`);
        } catch (error: any) {
            alert(error.response?.data?.error || "Có lỗi xảy ra, không thể vào phòng thi.");
        }
    };

    if (!hubData) return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '80vh' }}>
            <div className="spinner-border text-primary border-4 mb-3" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
    );

    const isTeacher = hubData.canEdit;

    return (
        <div className="bg-main-light min-vh-100 pb-5 animation-fade-in" style={{ backgroundColor: '#f8fafc' }}>
            {/* HEADER */}
            <div className="text-white pt-2 pb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #003B70 0%, #002a50 100%)', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
                <div className="container px-3 px-md-4" style={{ maxWidth: '1100px' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-link text-white p-0 mb-3 text-decoration-none d-flex align-items-center gap-2 opacity-80 hover-opacity-100 transition-all" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        <i className="fa-solid fa-arrow-left" style={{ fontSize: '14px' }}></i> Quay lại
                    </button>
                    <div className="d-flex justify-content-between align-items-center gap-3">
                        <div className="flex-grow-1 min-width-0">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h2 className="fw-900 mb-0 text-truncate" style={{ fontSize: 'var(--hub-title-fs, 1.6rem)', letterSpacing: '-0.5px' }}>{hubData.className}</h2>
                                {isTeacher && <span className="badge bg-warning text-dark px-2 py-1 rounded-pill fw-800" style={{ fontSize: '0.6rem' }}>GV</span>}
                            </div>
                            <p className="mb-0 opacity-70 fw-600" style={{ fontSize: '0.8rem' }}>
                                {hubData.classCode} • {hubData.teacher.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS NAV - Đã gỡ bỏ sticky-top để thanh menu gắn liền khối với Header */}
            <div className="bg-white border-bottom shadow-sm hub-tabs-nav">
                <div className="container px-0 px-md-3" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex overflow-x-auto no-scrollbar">
                        {(['stream', 'materials', 'exams', 'people'] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`btn border-0 py-3 fw-800 flex-shrink-0 px-3 px-md-4 transition-all position-relative ${activeTab === t ? 'text-primary' : 'text-slate-400 opacity-70 hover-opacity-100'}`}
                                style={{ fontSize: '0.85rem' }}>
                                {t === 'stream' ? <><i className="fa-solid fa-rss me-2"></i> Bảng tin</> :
                                    t === 'materials' ? <><i className="fa-solid fa-book-open me-2"></i> Tài liệu</> :
                                        t === 'exams' ? <><i className="fa-solid fa-laptop-code me-2"></i> Phòng thi</> :
                                            <><i className="fa-solid fa-user-group me-2"></i> Thành viên</>}
                                {activeTab === t && <div className="position-absolute bottom-0 start-50 translate-middle-x bg-primary" style={{ width: '20px', height: '3px', borderRadius: '10px 10px 0 0' }}></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mt-4 px-3 px-md-4" style={{ maxWidth: '1100px' }}>
                <div className="row g-4">
                    <div className="col-12 col-lg-9 order-1 order-lg-1">

                        {activeTab === 'stream' && (
                            <div className="d-flex flex-column gap-4 animation-slide-up">
                                {/* Hero Banner for Stream */}
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative" style={{ minHeight: '160px', background: 'linear-gradient(135deg, #003B70 0%, #0369a1 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="card-body p-4 d-flex flex-column justify-content-center position-relative z-1">
                                        <div className="text-white-50 small fw-800 text-uppercase tracking-wider mb-1" style={{ letterSpacing: '2px' }}>Hiện đang học</div>
                                        <h2 className="text-white fw-900 mb-0" style={{ fontSize: '2.2rem', letterSpacing: '-1px' }}>
                                            {hubData.subjectCode ? `${hubData.subjectCode} - ` : ''}{hubData.subjectName || hubData.className || 'Thông tin môn học'}
                                        </h2>
                                    </div>
                                    <div className="position-absolute rounded-circle bg-white opacity-5" style={{ width: '300px', height: '300px', top: '-150px', right: '-80px' }}></div>
                                    <div className="position-absolute bg-white opacity-5" style={{ width: '2px', height: '140%', right: '120px', top: '-20%', transform: 'rotate(45deg)' }}></div>
                                </div>

                                {/* Announcement Card */}
                                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                                    <div className="d-flex gap-3 align-items-start">
                                        <div className="bg-primary bg-opacity-5 p-3 rounded-4 text-primary flex-shrink-0 shadow-sm">
                                            <i className="fa-solid fa-bell" style={{ fontSize: '24px' }}></i>
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <div className="fw-800 text-slate-800 fs-5">Chào mừng các bạn đến với lớp!</div>
                                                <span className="badge bg-danger rounded-pill fw-800" style={{ fontSize: '0.6rem' }}>MỚI</span>
                                            </div>
                                            <p className="text-slate-500 mb-3 fw-500">Hệ thống đang được cập nhật các bài giảng và bài kiểm tra mới nhất. Các thông báo quan trọng sẽ xuất hiện ở đây.</p>
                                            <div className="d-flex align-items-center gap-1 text-slate-400 small fw-700">
                                                <i className="fa-regular fa-clock" style={{ fontSize: '14px' }}></i> Vừa xong
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'materials' && (
                            <div className="card border-0 shadow-sm rounded-4 p-4 animation-slide-up bg-white mt-2">
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 pb-3 border-bottom gap-3">
                                    <h5 className="fw-bolder mb-0 text-primary d-flex align-items-center gap-2">
                                        <i className="fa-regular fa-folder-open" style={{ fontSize: '24px' }}></i> Kho Tài Liệu
                                    </h5>
                                    {isTeacher && (
                                        <>
                                            <input type="file" ref={fileInputRef} className="d-none" onChange={handleFileChange} multiple />
                                            <button className="btn btn-primary bg-gradient shadow-sm rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 action-hover" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                                {isUploading ? <><i className="fa-solid fa-rotate fa-spin" style={{ fontSize: '18px' }}></i> Đang tải...</> : <><i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '18px' }}></i> Tải tài liệu lên</>}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    {hubData.materials?.length === 0 ? (
                                        <div className="py-5 text-center w-100 bg-light rounded-4 border border-dashed">
                                            <img src="https://cdni.iconscout.com/illustration/premium/thumb/folder-is-empty-4064360-3363921.png" alt="No materials" height="120" className="mb-3 opacity-75" style={{ filter: 'grayscale(1)' }} />
                                            <h5 className="fw-bold text-dark mb-2">Kho tài liệu trống</h5>
                                            <p className="text-muted mb-0">Chưa có tài liệu học tập nào được chia sẻ.</p>
                                        </div>
                                    ) :
                                        hubData.materials?.map((doc: any) => {
                                            const ext = doc.documentTitle.split('.').pop()?.toLowerCase();
                                            let iconColor = 'text-primary';
                                            let bgClass = 'bg-primary';
                                            if (ext === 'pdf') { iconColor = 'text-danger'; bgClass = 'bg-danger'; }
                                            else if (ext === 'doc' || ext === 'docx') { iconColor = 'text-primary'; bgClass = 'bg-primary'; }
                                            else if (ext === 'xls' || ext === 'xlsx') { iconColor = 'text-success'; bgClass = 'bg-success'; }
                                            else if (ext === 'ppt' || ext === 'pptx') { iconColor = 'text-warning text-dark'; bgClass = 'bg-warning'; }
                                            else if (['png', 'jpg', 'jpeg'].includes(ext)) { iconColor = 'text-info text-dark'; bgClass = 'bg-info'; }

                                            return (
                                                <div key={doc.id || doc.studentDocId} className="card border shadow-sm rounded-4 overflow-hidden action-hover bg-white cursor-pointer transition-transform hover-translate-up" onClick={() => handlePreviewClick(doc)}>
                                                    <div className="card-body p-3 p-md-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                                                        <div className="d-flex align-items-center gap-3 w-100 min-width-0">
                                                            <div className={`${bgClass} bg-opacity-10 rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center`} style={{ width: '50px', height: '50px' }}>
                                                                <i className={`fa-regular fa-file-lines ${iconColor}`} style={{ fontSize: '24px' }}></i>
                                                            </div>
                                                            <div className="w-100 min-width-0">
                                                                <h6 className="fw-bolder text-dark mb-1 text-truncate" title={doc.documentTitle} style={{ maxWidth: '100%' }}>{doc.documentTitle}</h6>
                                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                                    <span className="badge bg-light text-secondary border fw-medium px-2 py-1">{ext ? ext.toUpperCase() : 'FILE'}</span>
                                                                    <span className="text-muted small fw-medium text-truncate">Giảng viên chia sẻ</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 flex-shrink-0 mt-2 mt-sm-0 pt-3 pt-sm-0 border-top border-sm-0 w-100 w-sm-auto justify-content-end">
                                                            <button className="btn btn-light border text-dark fw-bold rounded-pill px-4 shadow-sm fs-7 d-flex align-items-center transition-all action-hover flex-grow-1 flex-sm-grow-0 justify-content-center py-2"><i className="fa-regular fa-eye me-2 text-primary" style={{ fontSize: '16px' }}></i> Xem</button>
                                                            <button className="btn btn-primary bg-gradient shadow-sm fw-bold rounded-pill px-4 fs-7 d-flex align-items-center transition-all action-hover flex-grow-1 flex-sm-grow-0 justify-content-center py-2" onClick={(e) => { e.stopPropagation(); handleForceDownload(doc.fileUrl, doc.documentTitle, e); }}><i className="fa-solid fa-download me-2" style={{ fontSize: '16px' }}></i> Tải về</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        )}

                        {activeTab === 'exams' && (
                            isCreatingExam ? (
                                <ExamBuilder
                                    classId={classId!}
                                    subjectId={hubData.subjectId}
                                    examType={examBuilderType}
                                    onClose={() => setIsCreatingExam(false)}
                                    onSuccess={() => { setIsCreatingExam(false); fetchExamRooms(); }}
                                />
                            ) : (
                                <div className="card border-0 shadow-sm rounded-4 p-4 animation-slide-up bg-white">
                                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                        <h5 className="fw-bold mb-0 text-danger d-flex align-items-center gap-2">
                                            <i className="fa-solid fa-bullseye" style={{ fontSize: '24px' }}></i> {isTeacher ? 'Quản lý Đánh giá' : 'Nhiệm vụ học tập'}
                                        </h5>
                                        {isTeacher && (
                                            <div className="position-relative" onBlur={() => setTimeout(() => setShowExamDropdown(false), 150)}>
                                                <button className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2" onClick={() => setShowExamDropdown(v => !v)}>
                                                    <i className="fa-solid fa-plus" style={{ fontSize: '18px' }}></i> Tạo Bài Tập <span>▼</span>
                                                </button>
                                                {showExamDropdown && (
                                                    <div className="position-absolute end-0 mt-1 bg-white shadow-lg rounded-4 py-2 border" style={{ minWidth: '240px', zIndex: 999 }}>
                                                        <button className="btn w-100 text-start px-4 py-2 d-flex align-items-center gap-3 fw-bold text-dark action-hover" onMouseDown={() => { setShowExamDropdown(false); setShowCreateExamModal(true); }}>
                                                            <div className="bg-danger bg-opacity-10 p-2 rounded text-danger"><i className="fa-regular fa-file-lines" style={{ fontSize: '18px' }}></i></div> Tự chấm từ PDF
                                                        </button>
                                                        <hr className="my-1 mx-3 opacity-25" />
                                                        <button className="btn w-100 text-start px-4 py-2 d-flex align-items-center gap-3 fw-bold text-dark action-hover" onMouseDown={() => { setShowExamDropdown(false); setExamBuilderType('OFFICIAL'); setIsCreatingExam(true); }}>
                                                            <div className="bg-warning bg-opacity-25 p-2 rounded text-warning-darker"><i className="fa-solid fa-bolt" style={{ fontSize: '18px' }}></i></div> Sinh tự động (Ma trận)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isTeacher ? (
                                        /* TEACHER DASHBOARD */
                                        <>
                                            <div className="row g-3 mb-4">
                                                <div className="col-4">
                                                    <div className="bg-primary bg-opacity-10 p-3 rounded-4 border border-primary border-opacity-25 text-center">
                                                        <h3 className="fw-bolder text-primary mb-0">{examRooms.length}</h3>
                                                        <small className="fw-bold text-secondary text-uppercase tracking-wide">Tổng Bài Tập</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row g-4 d-flex flex-column">
                                                {examRooms.length === 0 ? (
                                                    <div className="text-center text-muted py-5 w-100 bg-light rounded-4 border border-dashed">
                                                        <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Empty" height="120" className="mb-3 opacity-75" style={{ filter: 'grayscale(1)' }} />
                                                        <p className="mb-3 fw-bold fs-5 text-dark">Lớp học chưa có bài tập nào</p>
                                                        <button className="btn btn-outline-danger shadow-sm rounded-pill px-4 fw-bold" onClick={() => setShowCreateExamModal(true)}>+ Khởi tạo bài đầu tiên</button>
                                                    </div>
                                                ) : examRooms.map(room => (
                                                    <div key={room.id} className="card border shadow-sm rounded-4 overflow-hidden transition-transform hover-translate-up bg-white">
                                                        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between gap-4">
                                                            <div>
                                                                <h5 className="fw-bolder text-dark mb-2">{room.name}</h5>
                                                                <div className="d-flex flex-wrap gap-3 mb-2">
                                                                    <span className="text-muted small d-flex align-items-center gap-1"><i className="fa-regular fa-clock" style={{ fontSize: '14px' }}></i> {room.durationMinutes} Phút</span>
                                                                    <span className="text-muted small d-flex align-items-center gap-1"><i className="fa-solid fa-users" style={{ fontSize: '14px' }}></i> Lượt làm: {room.attemptsCount || 0}</span>
                                                                    <span className="text-muted small d-flex align-items-center gap-1"><i className="fa-solid fa-rotate-right" style={{ fontSize: '14px' }}></i> Tối đa: {room.maxAttempts} lần</span>
                                                                </div>
                                                                {(room.startTime || room.endTime) && (
                                                                    <div className="small text-danger d-flex align-items-center gap-1 fw-bold bg-danger bg-opacity-10 p-2 rounded-3 d-inline-flex">
                                                                        <i className="fa-regular fa-calendar" style={{ fontSize: '14px' }}></i>
                                                                        Mở: {room.startTime ? new Date(room.startTime).toLocaleString('vi-VN') : '--'}
                                                                        <span className="mx-1">|</span> Đóng: {room.endTime ? new Date(room.endTime).toLocaleString('vi-VN') : '--'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="d-flex flex-column gap-2 justify-content-center border-start ps-md-4 flex-shrink-0">
                                                                <button onClick={() => navigate(`/teacher/class-hub/${classId}/exam/${room.id}/monitor`)} className="btn btn-info text-white fw-bold shadow-sm rounded-pill px-4 text-nowrap">Giám sát</button>
                                                                <button onClick={() => navigate(`/teacher/class-hub/${classId}/exam/${room.id}/results`)} className="btn btn-primary fw-bold shadow-sm rounded-pill px-4 text-nowrap"><i className="fa-solid fa-trophy me-2" style={{ fontSize: '16px' }}></i>Bảng điểm</button>
                                                                <button onClick={() => { setEditingRoom({ ...room, startTime: room.startTime ? room.startTime.slice(0, 16) : '', endTime: room.endTime ? room.endTime.slice(0, 16) : '' }); setIsEditModalOpen(true); }} className="btn btn-light border fw-bold shadow-sm rounded-pill px-4 text-nowrap"><i className="fa-regular fa-pen-to-square me-2" style={{ fontSize: '16px' }}></i>Chỉnh sửa</button>
                                                                <button onClick={() => handleForceEnd(room.id, room.name)} className="btn btn-outline-danger fw-bold shadow-sm rounded-pill px-4 text-nowrap"><i className="fa-regular fa-circle-stop me-2" style={{ fontSize: '16px' }}></i>Thu bài lập tức</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        /* STUDENT TIMELINE */
                                        <div className="student-timeline">
                                            {/* To-Do Section */}
                                            <h6 className="fw-bold text-primary mb-3 text-uppercase tracking-wide d-flex align-items-center gap-2"><i className="fa-solid fa-bullseye" style={{ fontSize: '18px' }}></i> Việc cần làm</h6>
                                            <div className="d-flex flex-column gap-3 mb-5">
                                                {examRooms.filter(r => (r.attemptsCount || 0) < (r.maxAttempts || 1) && (!r.endTime || new Date(r.endTime).getTime() > Date.now())).length === 0 ? (
                                                    <div className="p-4 bg-light rounded-4 border text-center text-muted fw-bold">🎉 Tuyệt vời! Bạn thiết lập trạng thái hoàn thành.</div>
                                                ) : examRooms.filter(r => (r.attemptsCount || 0) < (r.maxAttempts || 1) && (!r.endTime || new Date(r.endTime).getTime() > Date.now())).map(room => (
                                                    <div key={room.id} className="card border-0 shadow-sm rounded-4 overflow-hidden border-start border-primary border-5 bg-white transition-transform hover-translate-up p-3 p-md-4">
                                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                                                            <div className="w-100">
                                                                <h5 className="fw-bolder text-dark mb-2">{room.name}</h5>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    <span className="badge bg-light text-dark border px-2 py-1"><i className="fa-regular fa-clock" style={{ fontSize: '12px' }}></i> {room.durationMinutes} phút</span>
                                                                    <span className="badge bg-warning bg-opacity-10 text-warning-darker px-2 py-1 fw-bold">Đã làm: {room.attemptsCount || 0}/{room.maxAttempts || 1}</span>
                                                                </div>
                                                                {room.endTime && <div className="text-danger small mt-2 fw-bold d-flex align-items-center gap-1"><i className="fa-solid fa-circle-stop" style={{ fontSize: '14px' }}></i> Đóng: {new Date(room.endTime).toLocaleString('vi-VN')}</div>}
                                                            </div>
                                                            <button onClick={() => handleStartExam(room.id)} className="btn btn-primary bg-gradient shadow-sm fw-bold rounded-pill px-5 py-3 w-100 w-md-auto text-nowrap fs-6"><i className="fa-regular fa-circle-play me-2" style={{ fontSize: '18px' }}></i> VÀO THI</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Expired Section */}
                                            {examRooms.some(r => (r.attemptsCount || 0) < (r.maxAttempts || 1) && r.endTime && new Date(r.endTime).getTime() <= Date.now()) && (
                                                <>
                                                    <h6 className="fw-bold text-danger mb-3 text-uppercase tracking-wide d-flex align-items-center gap-2"><i className="fa-solid fa-circle-stop" style={{ fontSize: '18px' }}></i> Đã quá hạn</h6>
                                                    <div className="d-flex flex-column gap-3 mb-5">
                                                        {examRooms.filter(r => (r.attemptsCount || 0) < (r.maxAttempts || 1) && r.endTime && new Date(r.endTime).getTime() <= Date.now()).map(room => (
                                                            <div key={room.id} className="card border-0 shadow-sm rounded-4 overflow-hidden border-start border-danger border-5 bg-light p-3 p-md-4 opacity-75">
                                                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                                                                    <div className="w-100">
                                                                        <h5 className="fw-bolder text-muted mb-1 text-decoration-line-through">{room.name}</h5>
                                                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                                                            <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 fw-bold border border-danger border-opacity-25">Đã hết hạn làm bài</span>
                                                                            <span className="badge bg-light text-dark border px-2 py-1"><i className="fa-regular fa-clock" style={{ fontSize: '12px' }}></i> {room.durationMinutes} phút</span>
                                                                            <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">Đã làm: {room.attemptsCount || 0}/{room.maxAttempts || 1}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button disabled className="btn btn-secondary border-0 fw-bold rounded-pill px-4 shadow-sm w-100 w-md-auto text-nowrap"><i className="fa-solid fa-circle-stop me-2" style={{ fontSize: '16px' }}></i> Đã đóng</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Completed Section */}
                                            <h6 className="fw-bold text-success mb-3 text-uppercase tracking-wide d-flex align-items-center gap-2"><i className="fa-regular fa-circle-check" style={{ fontSize: '18px' }}></i> Đã hoàn thành</h6>
                                            <div className="d-flex flex-column gap-3">
                                                {examRooms.filter(r => (r.attemptsCount || 0) >= (r.maxAttempts || 1)).length === 0 ? (
                                                    <div className="p-4 bg-light rounded-4 border text-center text-muted small">Chưa có bài nào được giải quyết.</div>
                                                ) : examRooms.filter(r => (r.attemptsCount || 0) >= (r.maxAttempts || 1)).map(room => (
                                                    <div key={room.id} className="card border-0 shadow-sm rounded-4 overflow-hidden border-start border-success border-5 bg-light p-3 p-md-4 opacity-75">
                                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                                                            <div className="w-100">
                                                                <h5 className="fw-bolder text-muted mb-1 text-decoration-line-through">{room.name}</h5>
                                                                <div className="d-flex flex-wrap gap-2 mt-2">
                                                                    <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 fw-bold">Cao nhất: {room.highestScore !== null ? room.highestScore : '--'}</span>
                                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">Đã hết lượt ({room.maxAttempts})</span>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => setSelectedRoomHistory(room)} className="btn btn-outline-secondary fw-bold rounded-pill px-4 shadow-sm w-100 w-md-auto text-nowrap"><i className="fa-regular fa-clock me-2" style={{ fontSize: '16px' }}></i> Lịch sử</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {activeTab === 'people' && (
                            <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 animation-slide-up">
                                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                    <h5 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                        <i className="fa-solid fa-users" style={{ fontSize: '22px' }}></i> Thành viên lớp
                                    </h5>
                                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold">
                                        {hubData.memberCount} SV
                                    </span>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light text-muted">
                                            <tr>
                                                <th className="ps-3" style={{ width: '50px' }}>#</th>
                                                <th>Sinh viên</th>
                                                <th className="d-none d-sm-table-cell">Mã SV</th>
                                                <th className="d-none d-md-table-cell">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hubData.students?.map((student: any, index: number) => (
                                                <tr key={student.id}>
                                                    <td className="ps-3 text-muted fw-bold">{index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <img
                                                                src={getStudentAvatar(student)}
                                                                alt="avatar"
                                                                className="rounded-circle shadow-sm flex-shrink-0"
                                                                width="40" height="40"
                                                                style={{ objectFit: 'cover', border: '2px solid #fff' }}
                                                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                    const target = e.currentTarget;
                                                                    target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${student.fullName || 'SV'}&backgroundColor=003b70&fontFamily=Inter`;
                                                                }}
                                                            />
                                                            <div className="min-width-0">
                                                                <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '150px' }}>{student.fullName}</div>
                                                                <small className="text-muted d-sm-none">{student.studentId}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="fw-medium text-dark d-none d-sm-table-cell">{student.studentId}</td>
                                                    <td className="text-muted d-none d-md-table-cell" style={{ fontSize: '0.85rem' }}>{student.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="col-12 col-lg-3 order-2 order-lg-2">
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-3">
                            <h6 className="fw-bold text-primary mb-3">Phụ trách lớp</h6>
                            <div className="d-flex align-items-center gap-3 d-lg-block text-lg-center">
                                <img src={getTeacherAvatar(hubData.teacher)} className="rounded-circle shadow-sm flex-shrink-0" width="64" height="64" style={{ objectFit: 'cover' }} alt="avatar" />
                                <div>
                                    <div className="fw-bold">{hubData.teacher.name}</div>
                                    <small className="text-muted">{hubData.teacher.email}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FloatingAITutor subjectId={hubData.subjectId} />

            {/* MODAL PREVIEW TÀI LIỆU */}
            {previewDoc && (
                <div className="modal fade show d-block animation-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content overflow-hidden rounded-4 shadow-lg border-0">
                            <div className="modal-header bg-white align-items-center">
                                <h5 className="modal-title fw-bold text-truncate d-flex align-items-center gap-2" style={{ maxWidth: '85%' }}>
                                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded"><i className="fa-regular fa-file-lines" style={{ fontSize: '20px' }}></i></div>
                                    {previewDoc.documentTitle}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleClosePreview}></button>
                            </div>
                            <div className="modal-body p-0 bg-light position-relative" style={{ height: '75vh' }}>
                                {!previewBlobUrl ? (
                                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                                ) : (
                                    <iframe src={previewBlobUrl} className="w-100 h-100 border-0 bg-white"></iframe>
                                )}
                            </div>
                            <div className="modal-footer bg-white">
                                <button className="btn btn-light fw-bold" onClick={handleClosePreview}>Đóng</button>
                                <button className="btn btn-primary fw-bold" onClick={() => handleForceDownload(previewDoc.fileUrl, previewDoc.documentTitle)}><i className="fa-solid fa-download me-2" style={{ fontSize: '18px' }}></i> Tải file</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO BÀI KIỂM TRA */}
            {showCreateExamModal && (
                <div className="modal fade show d-block animation-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl mx-2 mx-md-auto">
                        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header bg-primary text-white border-0 p-4 align-items-center">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-3">
                                    <div className="bg-white bg-opacity-25 p-2 rounded-circle"><i className="fa-solid fa-bullseye" style={{ fontSize: '24px' }}></i></div>
                                    Tạo Bài Tập / Kiểm Tra Mới
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateExamModal(false)}></button>
                            </div>

                            <div className="modal-body p-0 d-flex flex-column flex-lg-row">
                                {/* Cột trái */}
                                <div className="bg-light p-4 col-12 col-lg-4 border-end border-light-subtle">
                                    <h6 className="fw-bold text-secondary mb-4 text-uppercase tracking-wide fs-6">Thiết lập & Cấu hình</h6>

                                    <div className="mb-4">
                                        <div className={`p-3 rounded-4 mb-3 border transition-colors cursor-pointer ${creationMode === 'PDF' ? 'bg-white border-primary border-2 shadow-sm' : 'bg-transparent border-light-subtle'}`} onClick={() => setCreationMode('PDF')}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`p-2 rounded-circle ${creationMode === 'PDF' ? 'bg-primary text-white' : 'bg-secondary bg-opacity-10 text-secondary'}`}><i className="fa-regular fa-file-lines" style={{ fontSize: '20px' }}></i></div>
                                                <div>
                                                    <div className={`fw-bold ${creationMode === 'PDF' ? 'text-primary' : 'text-dark'}`}>Tự chấm từ File PDF</div>
                                                    <div className="small text-muted">Upload đề thi & Khai báo đáp án</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-4 border transition-colors cursor-pointer ${creationMode === 'BANK' ? 'bg-white border-warning border-2 shadow-sm' : 'bg-transparent border-light-subtle'}`} onClick={() => setCreationMode('BANK')}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`p-2 rounded-circle ${creationMode === 'BANK' ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-10 text-secondary'}`}><i className="fa-solid fa-bolt" style={{ fontSize: '20px' }}></i></div>
                                                <div>
                                                    <div className={`fw-bold ${creationMode === 'BANK' ? 'text-warning-dark' : 'text-dark'}`}>Thống kê Ma trận</div>
                                                    <div className="small text-muted">Bốc ngẫu nhiên từ Ngân hàng</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {creationMode === 'PDF' && (
                                        <div className="d-flex flex-column gap-3 mt-5 position-relative">
                                            <div className="position-absolute border-start border-2 border-primary" style={{ left: '15px', top: '15px', bottom: '15px', zIndex: 0, opacity: 0.2 }}></div>

                                            <div className={`d-flex align-items-center gap-3 position-relative z-1 ${examStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${examStep === 1 ? 'bg-primary text-white shadow' : examStep > 1 ? 'bg-success text-white' : 'bg-secondary text-white'}`} style={{ width: '32px', height: '32px' }}>
                                                    {examStep > 1 ? <i className="fa-solid fa-circle-check" style={{ fontSize: '16px' }}></i> : '1'}
                                                </div>
                                                <div className="fw-bold">Thông tin & File đề</div>
                                            </div>

                                            <div className={`d-flex align-items-center gap-3 position-relative z-1 ${examStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${examStep === 2 ? 'bg-primary text-white shadow' : examStep > 2 ? 'bg-success text-white' : 'bg-secondary text-white'}`} style={{ width: '32px', height: '32px' }}>
                                                    {examStep > 2 ? <i className="fa-solid fa-circle-check" style={{ fontSize: '16px' }}></i> : '2'}
                                                </div>
                                                <div className="fw-bold">Thời gian & Thể lệ</div>
                                            </div>

                                            <div className={`d-flex align-items-center gap-3 position-relative z-1 ${examStep >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                                                <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${examStep === 3 ? 'bg-primary text-white shadow' : 'bg-secondary text-white'}`} style={{ width: '32px', height: '32px' }}>3</div>
                                                <div className="fw-bold">Khai báo Đáp án</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cột phải */}
                                <div className="p-4 p-md-5 col-12 col-lg-8 bg-white" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                    {creationMode === 'BANK' ? (
                                        <div className="text-center py-5 h-100 d-flex flex-column justify-content-center align-items-center">
                                            <div className="bg-warning bg-opacity-10 rounded-circle p-4 mb-4"><i className="fa-solid fa-bolt text-warning" style={{ fontSize: '60px' }}></i></div>
                                            <h3 className="fw-bolder text-dark mb-3">Chế độ Ma trận Đề thi</h3>
                                            <p className="text-secondary mb-5 px-sm-5 fs-5">Hệ thống sẽ chuyển bạn sang giao diện cấu hình chuyên sâu. Tại đây, bạn có thể thiết lập số lượng câu hỏi Dễ/TB/Khó theo từng chương học.</p>
                                            <button className="btn btn-warning bg-gradient rounded-pill px-5 py-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2 transition-transform hover-translate-up fs-5 text-dark"
                                                onClick={() => { setShowCreateExamModal(false); setIsCreatingExam(true); }}>
                                                Bắt đầu Cấu hình <i className="fa-solid fa-arrow-right" style={{ fontSize: '22px' }}></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleCreateExam} className="h-100 d-flex flex-column">
                                            {/* BƯỚC 1: INFO */}
                                            {examStep === 1 && (
                                                <div className="animation-fade-in flex-grow-1">
                                                    <h4 className="fw-bold text-dark mb-4 border-bottom pb-3">Bước 1: Thông tin cơ bản</h4>
                                                    <div className="mb-4">
                                                        <label className="fw-bold text-secondary small mb-2 text-uppercase tracking-wide">Tên bài kiểm tra / Đánh giá</label>
                                                        <input type="text" className="form-control form-control-lg bg-light border-light-subtle shadow-sm" required placeholder="VD: Bài kiểm tra Giữa kỳ 1..."
                                                            value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} autoFocus />
                                                    </div>

                                                    <div className="mb-4 p-4 border rounded-4 border-primary border-opacity-25 bg-primary bg-opacity-10 shadow-sm position-relative overflow-hidden">
                                                        <div className="position-absolute end-0 bottom-0 opacity-10 p-2"><i className="fa-solid fa-file-lines" style={{ fontSize: '100px' }}></i></div>
                                                        <label className="fw-bolder text-primary mb-3 d-flex align-items-center gap-2 fs-5"><i className="fa-solid fa-file-lines" style={{ fontSize: '20px' }}></i> Tải lên Đề thi (PDF)</label>
                                                        <input type="file" className="form-control form-control-lg border-0 shadow-sm bg-white" accept=".pdf" required onChange={e => setExamFile(e.target.files ? e.target.files[0] : null)} />
                                                        <small className="text-primary mt-2 d-block fw-medium">Đề thi dạng PDF sẽ được trích xuất để sinh viên đọc trực tiếp trên màn hình.</small>
                                                    </div>
                                                </div>
                                            )}

                                            {/* BƯỚC 2: TIMING */}
                                            {examStep === 2 && (
                                                <div className="animation-fade-in flex-grow-1">
                                                    <h4 className="fw-bold text-dark mb-4 border-bottom pb-3">Bước 2: Luật chơi & Thời gian</h4>

                                                    <div className="row g-4 mb-4">
                                                        <div className="col-md-6">
                                                            <div className="p-3 bg-light rounded-4 border shadow-sm h-100">
                                                                <label className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2"><i className="fa-regular fa-clock" style={{ fontSize: '16px' }}></i> Thời gian làm bài (Phút)</label>
                                                                <input type="number" className="form-control form-control-lg border-0 shadow-sm bg-white fw-bold text-primary" required min="1" value={examForm.durationMinutes} onChange={e => setExamForm({ ...examForm, durationMinutes: parseInt(e.target.value) })} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="p-3 bg-light rounded-4 border shadow-sm h-100">
                                                                <label className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2"><i className="fa-solid fa-rotate-right" style={{ fontSize: '16px' }}></i> Số lượt thi tối đa</label>
                                                                <input type="number" className="form-control form-control-lg border-0 shadow-sm bg-white fw-bold text-primary" required min="1" value={examForm.maxAttempts} onChange={e => setExamForm({ ...examForm, maxAttempts: parseInt(e.target.value) })} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="row g-4 mb-4">
                                                        <div className="col-md-6">
                                                            <div className="p-3 bg-light rounded-4 border shadow-sm h-100">
                                                                <label className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2"><i className="fa-regular fa-calendar" style={{ fontSize: '16px' }}></i> Giờ mở cửa (Tùy chọn)</label>
                                                                <input type="datetime-local" className="form-control bg-white border-0 shadow-sm" value={examForm.startTime} onChange={e => setExamForm({ ...examForm, startTime: e.target.value })} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="p-3 bg-light rounded-4 border shadow-sm h-100">
                                                                <label className="fw-bold text-secondary small mb-2 d-flex align-items-center gap-2"><i className="fa-solid fa-circle-stop" style={{ fontSize: '16px' }}></i> Giờ đóng cửa (Tùy chọn)</label>
                                                                <input type="datetime-local" className="form-control bg-white border-0 shadow-sm" value={examForm.endTime} onChange={e => setExamForm({ ...examForm, endTime: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 shadow-sm">
                                                        <div className="form-check form-switch d-flex align-items-center gap-3">
                                                            <input className="form-check-input ms-0 mt-0" style={{ transform: 'scale(1.5)' }} type="checkbox" id="pdfShowSwitch" checked={examForm.showResult} onChange={e => setExamForm({ ...examForm, showResult: e.target.checked })} />
                                                            <label className="form-check-label fw-bold text-success-darker" htmlFor="pdfShowSwitch" style={{ fontSize: '1.1rem' }}>Sinh viên được xem đáp án sau khi nộp</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* BƯỚC 3: ANSWER GRID */}
                                            {examStep === 3 && (
                                                <div className="animation-fade-in flex-grow-1 d-flex flex-column h-100">
                                                    <h4 className="fw-bold text-dark mb-3 border-bottom pb-3">Bước 3: Khai báo Đáp án</h4>

                                                    <div className="mb-4 p-3 bg-warning bg-opacity-10 rounded-4 border border-warning shadow-sm d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <label className="fw-bold text-warning-darker small text-uppercase">Số lượng câu hỏi trắc nghiệm</label>
                                                            <div className="fs-6 text-dark mt-1">Hệ thống sẽ tạo lưới để bạn tích chọn đáp án đúng.</div>
                                                        </div>
                                                        <input type="number" className="form-control form-control-lg bg-white border-warning fw-bold text-warning-darker text-center shadow-sm" style={{ maxWidth: '120px' }} required min="1" max="200" value={examForm.totalQuestions} onChange={e => {
                                                            setExamForm({ ...examForm, totalQuestions: parseInt(e.target.value) });
                                                            const newGrid = { ...answerGrid };
                                                            Object.keys(newGrid).forEach(k => { if (parseInt(k) > parseInt(e.target.value)) delete newGrid[parseInt(k)]; });
                                                            setAnswerGrid(newGrid);
                                                        }} />
                                                    </div>

                                                    <div className="flex-grow-1 bg-light rounded-4 border p-3 config-scrollbar overflow-auto shadow-inner" style={{ minHeight: '200px' }}>
                                                        <div className="row g-3">
                                                            {Array.from({ length: examForm.totalQuestions || 0 }).map((_, idx) => {
                                                                const qNum = idx + 1;
                                                                return (
                                                                    <div key={idx} className="col-12 col-sm-6 col-md-4 col-xl-3">
                                                                        <div className="d-flex align-items-center justify-content-between bg-white p-2 rounded-3 border shadow-sm">
                                                                            <span className="fw-bold text-secondary badge bg-light text-dark px-2">{qNum}</span>
                                                                            <div className="d-flex gap-1" role="group" aria-label={`Đáp án câu ${qNum}`}>
                                                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                                                    <button
                                                                                        key={opt} type="button"
                                                                                        tabIndex={0}
                                                                                        className={`btn btn-sm rounded-circle p-0 fw-bold transition-all ${answerGrid[qNum] === opt ? 'btn-primary shadow-sm' : 'btn-light border text-muted'}`}
                                                                                        style={{ width: '28px', height: '28px' }}
                                                                                        onClick={() => setAnswerGrid({ ...answerGrid, [qNum]: opt })}
                                                                                    >
                                                                                        {opt}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-top d-flex justify-content-between">
                                                {examStep > 1 ? (
                                                    <button type="button" className="btn btn-light border fw-bold px-4 py-2 text-dark rounded-pill" onClick={() => setExamStep(s => (s - 1) as any)}>
                                                        <i className="fa-solid fa-arrow-left me-2" style={{ fontSize: '18px' }}></i> Quay lại
                                                    </button>
                                                ) : <div />}

                                                {examStep < 3 ? (
                                                    <button type="button" className="btn btn-primary bg-gradient shadow-sm fw-bold px-5 py-2 rounded-pill d-flex align-items-center gap-2 transition-transform hover-translate-up"
                                                        disabled={examStep === 1 && !examFile}
                                                        onClick={() => setExamStep(s => (s + 1) as any)}>
                                                        Tiếp theo <i className="fa-solid fa-arrow-right" style={{ fontSize: '18px' }}></i>
                                                    </button>
                                                ) : (
                                                    <button type="submit" className="btn btn-success bg-gradient shadow fw-bold px-5 py-2 rounded-pill d-flex align-items-center gap-2 transition-transform hover-translate-up" disabled={isUploading || Object.keys(answerGrid).length === 0}>
                                                        {isUploading ? <i className="fa-solid fa-rotate fa-spin" style={{ fontSize: '20px' }}></i> : <i className="fa-solid fa-circle-check" style={{ fontSize: '20px' }}></i>}
                                                        {isUploading ? "Đang xử lý..." : "Hoàn tất tạo bài"}
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LỊCH SỬ THI */}
            {selectedRoomHistory && (
                <div className="modal fade show d-block bg-dark bg-opacity-50" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-2 mx-md-auto" style={{ maxWidth: '560px' }}>
                        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
                            <div className="modal-header border-bottom bg-light py-3">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 text-dark">
                                    <i className="fa-regular fa-clock text-primary" style={{ fontSize: '20px' }}></i> Lịch sử: {selectedRoomHistory.name}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedRoomHistory(null)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <table className="table mb-0 align-middle table-hover">
                                    <thead className="table-light text-muted">
                                        <tr>
                                            <th className="ps-4 py-3">Lần thi</th>
                                            <th className="text-center py-3">Điểm số</th>
                                            <th className="py-3">Thời gian nộp</th>
                                            <th className="text-center py-3">Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRoomHistory.history?.map((hist: any, idx: number) => {
                                            const isFinished = hist.endTime != null;
                                            const maxAttempts = selectedRoomHistory.maxAttempts || 1;
                                            const currentAttemptCount = selectedRoomHistory.history.length;
                                            const showResult = selectedRoomHistory.showResult !== false;
                                            const canReview = showResult && (currentAttemptCount >= maxAttempts);

                                            return (
                                                <tr key={hist.attemptId}>
                                                    <td className="ps-4 fw-bold text-muted">Lần {selectedRoomHistory.history.length - idx}</td>
                                                    <td className="text-center fw-bold text-primary fs-5">{hist.score !== null ? hist.score : '--'}</td>
                                                    <td className="small text-muted">{hist.endTime ? new Date(hist.endTime).toLocaleString('vi-VN') : 'Đang làm...'}</td>
                                                    <td className="text-center">
                                                        {!isFinished ? (
                                                            <span className="badge bg-warning text-dark px-2 py-1">Đang làm dở</span>
                                                        ) : canReview ? (
                                                            <button onClick={() => navigate(`/student/exam-review/${hist.attemptId}`)} className="btn btn-sm btn-outline-primary rounded-pill fw-bold shadow-sm">
                                                                <i className="fa-solid fa-eye me-1" style={{ fontSize: '14px' }}></i> Xem chi tiết
                                                            </button>
                                                        ) : (
                                                            <span className="badge bg-light text-muted border px-2 py-1" title="Chỉ được xem đáp án khi đã thi hết số lượt">
                                                                <i className="fa-solid fa-eye-slash me-1" style={{ fontSize: '12px' }}></i> Đã khóa
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer border-top-0 bg-light">
                                <button className="btn btn-secondary rounded-pill px-4 fw-bold" onClick={() => setSelectedRoomHistory(null)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && editingRoom && (
                <div className="modal fade show d-block animation-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2"><i className="fa-solid fa-pen-to-square text-primary" style={{ fontSize: '20px' }}></i> Chỉnh sửa Phòng Thi</h5>
                                <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <form onSubmit={handleSaveEdit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-muted">Tên phòng thi</label>
                                        <input
                                            type="text" className="form-control bg-light border-0"
                                            value={editingRoom.name}
                                            onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label className="form-label fw-bold small text-muted">Thời gian (Phút)</label>
                                            <input
                                                type="number" className="form-control bg-light border-0"
                                                value={editingRoom.durationMinutes}
                                                onChange={(e) => setEditingRoom({ ...editingRoom, durationMinutes: parseInt(e.target.value) || 0 })}
                                                required min="1"
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-bold small text-muted">Số lượt làm</label>
                                            <input
                                                type="number" className="form-control bg-light border-0"
                                                value={editingRoom.maxAttempts}
                                                onChange={(e) => setEditingRoom({ ...editingRoom, maxAttempts: parseInt(e.target.value) || 1 })}
                                                required min="1"
                                            />
                                        </div>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-muted">Giờ mở cửa</label>
                                            <input
                                                type="datetime-local" className="form-control bg-light border-0"
                                                value={editingRoom.startTime}
                                                onChange={(e) => setEditingRoom({ ...editingRoom, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-muted">Giờ đóng cửa</label>
                                            <input
                                                type="datetime-local" className="form-control bg-light border-0"
                                                value={editingRoom.endTime}
                                                onChange={(e) => setEditingRoom({ ...editingRoom, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4 bg-light p-3 rounded-4 border border-light">
                                        <div className="form-check form-switch d-flex align-items-center gap-2">
                                            <input
                                                className="form-check-input mt-0 ms-0"
                                                type="checkbox" role="switch"
                                                id="editShowResult"
                                                checked={editingRoom.showResult}
                                                onChange={(e) => setEditingRoom({ ...editingRoom, showResult: e.target.checked })}
                                                style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label fw-bold text-dark mb-0 ms-2 cursor-pointer" htmlFor="editShowResult">
                                                Cho phép xem điểm và đáp án
                                            </label>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Lưu thay đổi</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .cursor-pointer { cursor: pointer; }
                .animation-fade-in { animation: fadeIn 0.3s ease-out; }
                .animation-slide-up { animation: slideUp 0.3s ease-out; }
                .animation-zoom-in { animation: zoomIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                .hover-translate-up { transition: all 0.2s ease; }
                .hover-translate-up:hover { transform: translateY(-3px); border-color: #0d6efd !important; }
                .hover-bg-primary:hover { background-color: #0d6efd !important; color: white !important; }
                .border-dashed { border: 2px dashed #dee2e6 !important; }
                /* Đã loại bỏ .spin do thay bằng class mặc định fa-spin của FontAwesome */
                .min-width-0 { min-width: 0; }
                .overflow-x-auto { overflow-x: auto; }
                @media (max-width: 576px) {
                    .w-sm-auto { width: auto !important; }
                    .flex-sm-grow-0 { flex-grow: 0 !important; }
                }
                @media (min-width: 576px) {
                    .flex-sm-grow-0 { flex-grow: 0 !important; }
                    .w-sm-auto { width: auto !important; }
                }
            `}</style>
        </div>
    );
};

export default SubjectStudyHub;