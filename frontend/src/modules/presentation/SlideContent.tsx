import * as React from 'react';
import { 
    Brain, ShieldCheck, Zap, Database, 
    Layout, Users, Globe, BarChart3, 
    Sparkles, Rocket, Target, Code,
    Shield, Cpu, HeartPulse
} from 'lucide-react';

interface Slide {
    title: string;
    subtitle?: string;
    type: string;
    content: React.ReactNode;
    image?: string;
    icon?: React.ReactNode;
}

export const slides: Slide[] = [
    {
        title: "Kỷ Nguyên Thi Cử Số",
        subtitle: "Hệ thống Quản lý Khảo thí Thông minh tích hợp AI",
        type: "Tầm nhìn 2026",
        icon: <Rocket size={18} />,
        image: "/presentation/ai_brain.png",
        content: (
            <div className="space-y-6">
                <p className="text-xl text-dim">
                    Kiến tạo một hệ sinh thái học tập và thi cử hiện đại, minh bạch và tối ưu hóa 
                    bằng công nghệ Trí tuệ Nhân tạo tiên tiến.
                </p>
                <div className="feature-grid">
                    <div className="glass-card">
                        <div className="stat-value">100%</div>
                        <div className="stat-label">Chuyển đổi số</div>
                    </div>
                    <div className="glass-card">
                        <div className="stat-value">0.1s</div>
                        <div className="stat-label">Tốc độ AI xử lý</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Trái Tim Trí Tuệ",
        subtitle: "Xử lý giáo trình bằng AI thông minh",
        type: "Công nghệ lõi",
        icon: <Brain size={18} />,
        image: "/presentation/ai_brain.png",
        content: (
            <div className="space-y-6">
                <div className="glass-card">
                    <h3 className="card-title text-gold">AI Study Hub</h3>
                    <ul className="list-bullet">
                        <li>Tự động hóa trích xuất kiến thức từ hàng ngàn trang tài liệu PDF.</li>
                        <li>Phân tích độ khó và trọng tâm của từng chương mục.</li>
                        <li>Gợi ý bộ câu hỏi ôn tập tương ứng với năng lực sinh viên.</li>
                    </ul>
                </div>
                <div className="glass-card">
                    <h3 className="card-title">Flashcards Tự động</h3>
                    <p className="text-dim">Chuyển đổi bài giảng thành thẻ ghi nhớ thông minh chỉ trong 1 click.</p>
                </div>
            </div>
        )
    },
    {
        title: "Bảo Mật Tuyệt Đối",
        subtitle: "Phòng thi ảo với cơ chế giám sát 360",
        type: "Security",
        icon: <Shield size={18} />,
        image: "/presentation/security.png",
        content: (
            <div className="space-y-6">
                <div className="glass-card" style={{borderColor: 'rgba(52, 211, 153, 0.2)'}}>
                    <h3 className="card-title text-gold">Cơ chế Chống Gian lận</h3>
                    <ul className="list-bullet">
                        <li>Log giám sát hoạt động trình duyệt thời gian thực.</li>
                        <li>Xác thực Firebase/Supabase mã hóa JWT 2 lớp.</li>
                        <li>Ngân hàng câu hỏi xáo trộn cực lớn, mã đề riêng biệt.</li>
                    </ul>
                </div>
                <div className="glass-card">
                    <div className="stat-value" style={{fontSize: '2rem'}}>99.9%</div>
                    <div className="stat-label">Độ tin cậy dữ liệu</div>
                </div>
            </div>
        )
    },
    {
        title: "Dữ Liệu Biết Nói",
        subtitle: "Phân tích hồ sơ năng lực 5 chiều",
        type: "Analytics",
        icon: <BarChart3 size={18} />,
        image: "/presentation/analytics.png",
        content: (
            <div className="space-y-6">
                <div className="glass-card">
                    <h3 className="card-title">Biểu đồ Radar Năng lực</h3>
                    <p className="text-dim">Trực quan hóa điểm mạnh, điểm yếu của từng sinh viên dựa trên lịch sử làm bài.</p>
                </div>
                <div className="glass-card">
                    <h3 className="card-title text-gold">Dự báo Kết quả</h3>
                    <p className="text-dim">Hệ thống gợi ý lộ trình ôn tập để đạt được mục tiêu GPA cá nhân.</p>
                </div>
                <div className="feature-grid">
                    <div className="stat-item">
                        <div className="stat-value">5+</div>
                        <div className="stat-label">Chỉ số đo lường</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">REAL</div>
                        <div className="stat-label">Time Stats</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        title: "Học Tập Mọi Nơi",
        subtitle: "Trải nghiệm đa nền tảng mượt mà",
        type: "Trải nghiệm",
        icon: <Globe size={18} />,
        image: "/presentation/ai_brain.png",
        content: (
            <div className="space-y-6">
                <div className="glass-card">
                    <h3 className="card-title">Inter-platform Sync</h3>
                    <p className="text-dim">Đồng bộ hóa kết quả học tập giữa Laptop, Máy tính bảng và Mobile.</p>
                </div>
                <div className="glass-card">
                    <h3 className="card-title">Offline Mode</h3>
                    <p className="text-dim">Ôn tập Flashcards ngay cả khi không có kết nối Internet.</p>
                </div>
            </div>
        )
    },
    {
        title: "Smart Roadmap",
        subtitle: "Lộ trình phát triển bền vững",
        type: "Tương lai",
        icon: <Rocket size={18} />,
        image: "/presentation/analytics.png",
        content: (
            <div className="space-y-4">
                <div className="glass-card">
                    <div className="slide-type-tag">Quý 3 - 2026</div>
                    <h3 className="card-title">VR Proctoring</h3>
                    <p className="text-dim">Môi trường thi thực tế ảo tăng cường.</p>
                </div>
                <div className="glass-card">
                    <div className="slide-type-tag">Quý 4 - 2026</div>
                    <h3 className="card-title">Blockchain Certification</h3>
                    <p className="text-dim">Cấp chứng chỉ và lưu trữ bảng điểm chống giả mạo.</p>
                </div>
            </div>
        )
    },
    {
        title: "Trân trọng Cảm ơn",
        subtitle: "Innovation for Education",
        type: "HVNH EXAM",
        icon: <HeartPulse size={18} />,
        image: "/presentation/security.png",
        content: (
            <div className="space-y-8 text-center" style={{paddingTop: '40px'}}>
                <h3 className="slide-title" style={{fontSize: '3rem', margin: 0}}>CÙNG CHÚNG TÔI KIẾN TẠO TƯƠNG LAI</h3>
                <div className="glass-card" style={{display: 'inline-block'}}>
                    <p className="text-xl">Q&A Session</p>
                    <p className="text-dim">Mọi thắc mắc xin vui lòng gửi về: support@hvnh.edu.vn</p>
                </div>
            </div>
        )
    }
];
