import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Mock data để bác test giao diện trước khi nối API
const mockExam = {
  examId: '123',
  title: 'Bài Luyện Tập: Hệ thống thông tin quản lý',
  durationMinutes: 45,
  questions: [
    { 
      id: 'q1', 
      text: 'Hệ thống CRM tập trung vào đối tượng nào?', 
      answers: [
        {id: 'a1', label: 'A', text: 'Nhà cung cấp'}, 
        {id: 'a2', label: 'B', text: 'Nhân viên nội bộ'},
        {id: 'a3', label: 'C', text: 'Khách hàng'},
        {id: 'a4', label: 'D', text: 'Cổ đông'}
      ] 
    },
    { 
      id: 'q2', 
      text: 'Thương mại điện tử B2B là viết tắt của?', 
      answers: [
        {id: 'b1', label: 'A', text: 'Business to Body'}, 
        {id: 'b2', label: 'B', text: 'Business to Business'},
        {id: 'b3', label: 'C', text: 'Bank to Bank'},
        {id: 'b4', label: 'D', text: 'Business to Boy'}
      ] 
    }
  ]
};

const ExamRoom: React.FC = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(mockExam.durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Lưu trữ đáp án sinh viên chọn
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) {
      if (timeLeft <= 0 && !isSubmitted) handleSubmitExam(); // Hết giờ tự nộp
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  // Format thời gian MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectAnswer = (questionId: string, answerId: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;
    
    // Yêu cầu xác nhận nếu chưa làm hết và chưa hết giờ
    const answeredCount = Object.keys(answers).length;
    if (timeLeft > 0 && answeredCount < mockExam.questions.length) {
      if (!window.confirm(`Bạn mới làm ${answeredCount}/${mockExam.questions.length} câu. Bạn có chắc chắn muốn nộp bài?`)) return;
    }

    setIsSubmitted(true);
    const loadingToast = toast.loading("Đang chấm bài...");

    try {
      // Ở đây sau này sẽ gọi API nộp bài: axiosClient.post(...)
      
      // Giả lập Backend trả về điểm sau 1.5 giây
      setTimeout(() => {
        setScore(8.5); // Mock điểm
        toast.update(loadingToast, { render: "Nộp bài thành công!", type: "success", isLoading: false, autoClose: 3000 });
      }, 1500);
    } catch (error) {
      toast.update(loadingToast, { render: "Lỗi nộp bài!", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  // MÀN HÌNH KẾT QUẢ (Sau khi nộp)
  if (isSubmitted && score !== null) {
    return (
      <div className="container py-5 text-center animation-fade-in">
        <div className="card border-0 shadow-lg rounded-4 p-5 mx-auto" style={{maxWidth: '500px'}}>
          <CheckCircle size={72} className="text-success mx-auto mb-4" />
          <h3 className="fw-bold mb-2">Nộp bài thành công!</h3>
          <p className="text-muted mb-4">Điểm số của bạn đã được ghi nhận vào hệ thống.</p>
          
          <div className="p-4 bg-light rounded-4 mb-4">
            <h5 className="text-muted mb-2">Điểm đạt được</h5>
            <div className="display-1 fw-bold text-primary">{score} <span className="fs-4 text-muted">/10</span></div>
          </div>

          <button className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm" onClick={() => navigate('/student')}>
            Về trang chủ học tập
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH LÀM BÀI THI
  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* Thanh Header ghim trên cùng */}
      <div className="bg-white shadow-sm sticky-top py-3 px-4 d-flex justify-content-between align-items-center" style={{ zIndex: 1000 }}>
        <h5 className="fw-bold mb-0 text-primary d-none d-md-block">{mockExam.title}</h5>
        <div className={`badge rounded-pill fs-5 px-4 py-2 shadow-sm ${timeLeft < 300 ? 'bg-danger animate-pulse' : 'bg-dark'}`}>
          <Clock size={20} className="me-2 mb-1" />
          {formatTime(timeLeft)}
        </div>
        <button className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center" onClick={handleSubmitExam}>
          <Send size={18} className="me-2" /> Nộp bài
        </button>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          {/* CỘT TRÁI: Danh sách câu hỏi */}
          <div className="col-lg-8">
            {mockExam.questions.map((q, index) => (
              <div key={q.id} id={`question-${index}`} className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                <h6 className="fw-bold mb-4" style={{ lineHeight: '1.5' }}>
                  <span className="badge bg-primary me-2 px-2 py-1 fs-6">Câu {index + 1}</span> 
                  {q.text}
                </h6>
                <div className="d-flex flex-column gap-3">
                  {q.answers.map(a => (
                    <label key={a.id} 
                           className={`p-3 border rounded-3 cursor-pointer transition-all d-flex align-items-center
                           ${answers[q.id] === a.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'hover-bg-light'}`}>
                      <input type="radio" className="form-check-input me-3 mt-0" style={{ width: '1.2em', height: '1.2em' }}
                             name={`question-${q.id}`} 
                             checked={answers[q.id] === a.id}
                             onChange={() => handleSelectAnswer(q.id, a.id)} />
                      <span className="fw-bold me-2 text-primary">{a.label}.</span> 
                      <span className="fs-6">{a.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CỘT PHẢI: Bảng điều hướng nhanh */}
          <div className="col-lg-4 d-none d-lg-block">
            <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{top: '90px'}}>
              <h6 className="fw-bold mb-3">Tiến độ làm bài</h6>
              <div className="progress mb-4" style={{ height: '8px' }}>
                <div className="progress-bar bg-success" 
                     style={{ width: `${(Object.keys(answers).length / mockExam.questions.length) * 100}%` }}>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mb-4">
                {mockExam.questions.map((q, index) => (
                  <button key={q.id} 
                          onClick={() => document.getElementById(`question-${index}`)?.scrollIntoView({behavior: 'smooth'})}
                          className={`btn btn-sm rounded-circle fw-bold transition-all shadow-sm
                          ${answers[q.id] ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                          style={{width: '42px', height: '42px'}}>
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="alert alert-warning mb-0 border-0 d-flex align-items-start small rounded-3">
                <AlertTriangle size={18} className="me-2 flex-shrink-0 mt-1" />
                <span>Tuyệt đối không làm mới trang. Hệ thống sẽ tự động thu bài khi hết giờ.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamRoom;