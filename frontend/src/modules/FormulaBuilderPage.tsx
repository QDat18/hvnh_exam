import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Play, ArrowLeft, Calculator, Variable, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosClient from '../services/axiosClient';
import templateApi from '../services/templateApi';
import type { Subject, Chapter, FormulaTemplateForm } from '../types';

const FormulaBuilder = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Setup Form
    const { register, control, handleSubmit, formState: { errors } } = useForm<FormulaTemplateForm>({
        defaultValues: {
            questionPattern: "Cho hàm số y = {a}x + {b}. Tính giá trị của y tại x = {x}.",
            formulaCorrect: "a * x + b",
            formulasDistractors: [{ value: "a * x - b" }],
            variableRanges: [{ name: "a", min: 1, max: 10 }, { name: "b", min: 1, max: 20 }, { name: "x", min: 1, max: 5 }],
            explanationTemplate: "Thay x={x} vào phương trình, ta có kết quả là {correct_answer}."
        }
    });

    const { fields: distractorFields, append: appendDistractor, remove: removeDistractor } = useFieldArray({ control, name: "formulasDistractors" });
    const { fields: rangeFields, append: appendRange, remove: removeRange } = useFieldArray({ control, name: "variableRanges" });

    // Load Subjects
    useEffect(() => {
        // @ts-ignore
        subjectApi.getAll().then((data: any) => {
            setSubjects(Array.isArray(data) ? data : []);
        }).catch(() => toast.error("Không tải được danh sách môn học"));
    }, []);

    // Handle Subject Change -> Load Chapters
    const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subId = e.target.value;
        if (!subId) {
            setChapters([]); 
            return;
        }
        try {
            // @ts-ignore
            const res = await subjectApi.getChapters(subId);
            setChapters(Array.isArray(res) ? res : (res as any).data || []);
        } catch (error) {
            console.error(error);
        }
    };

    // Submit & Preview
    const onSubmit: SubmitHandler<FormulaTemplateForm> = async (data) => {
        setIsLoading(true);
        try {
            // Convert Array Ranges -> Map (Backend requirement)
            const variableRangesMap: Record<string, number[]> = {};
            data.variableRanges.forEach(r => {
                variableRangesMap[r.name] = [Number(r.min), Number(r.max)];
            });

            const payload = {
                ...data,
                formulasDistractors: data.formulasDistractors.map(d => d.value),
                variableRanges: variableRangesMap
            };

            // 1. Create Template
            const createRes: any = await templateApi.create(payload);
            const newId = createRes.templateId || createRes.data?.templateId;
            
            toast.success("Đã lưu mẫu công thức!");

            // 2. Get Live Preview
            const previewRes = await templateApi.preview(newId);
            setPreviewData(previewRes);

        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi lưu template. Kiểm tra lại công thức!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 overflow-hidden">
            <div className="row h-100">
                
                {/* --- CỘT TRÁI: FORM BUILDER --- */}
                <div className="col-md-6 h-100 d-flex flex-column border-end p-0 bg-white">
                    {/* Header */}
                    <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2 text-primary">
                            <Calculator size={24} />
                            <h5 className="mb-0 fw-bold">Xưởng Chế Tạo Công Thức</h5>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                            <ArrowLeft size={16} /> Quay lại
                        </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-grow-1 overflow-auto p-4">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            
                            {/* 1. Context Selection */}
                            <div className="row mb-3">
                                <div className="col-6">
                                    <label className="form-label fw-bold">Môn học</label>
                                    <select {...register("subjectId", {required: true})} onChange={handleSubjectChange} className="form-select">
                                        <option value="">-- Chọn môn --</option>
                                        {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label fw-bold">Chương</label>
                                    <select {...register("chapterId", {required: true})} className="form-select">
                                        <option value="">-- Chọn chương --</option>
                                        {chapters.map(c => <option key={c.chapterId} value={c.chapterId}>{c.chapterName}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* 2. Variable Ranges */}
                            <div className="card mb-4 border-light bg-light">
                                <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                                    <span className="fw-bold d-flex align-items-center gap-2"><Variable size={16}/> Biến số & Phạm vi</span>
                                    <button type="button" onClick={() => appendRange({name: '', min: 1, max: 10})} className="btn btn-sm btn-link text-decoration-none">
                                        <Plus size={16}/> Thêm biến
                                    </button>
                                </div>
                                <div className="card-body p-2">
                                    {rangeFields.map((field, idx) => (
                                        <div key={field.id} className="input-group mb-2">
                                            <span className="input-group-text bg-white font-monospace">{`{`}</span>
                                            <input {...register(`variableRanges.${idx}.name` as const, {required: true})} className="form-control text-center text-primary fw-bold" placeholder="x" style={{maxWidth: '60px'}} />
                                            <span className="input-group-text bg-white font-monospace">{`}`}</span>
                                            
                                            <span className="input-group-text bg-transparent border-0">Min:</span>
                                            <input type="number" {...register(`variableRanges.${idx}.min` as const, {required: true})} className="form-control" />
                                            
                                            <span className="input-group-text bg-transparent border-0">Max:</span>
                                            <input type="number" {...register(`variableRanges.${idx}.max` as const, {required: true})} className="form-control" />
                                            
                                            <button type="button" onClick={() => removeRange(idx)} className="btn btn-outline-danger">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Question Pattern */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">Mẫu câu hỏi (Template)</label>
                                <textarea 
                                    {...register("questionPattern", {required: true})} 
                                    rows={3} 
                                    className="form-control font-monospace" 
                                    placeholder="Ví dụ: Tính giá trị của {x} + {y}..."
                                    style={{fontSize: '0.9rem'}}
                                />
                                <div className="form-text">Sử dụng tên biến đặt trong dấu ngoặc nhọn, ví dụ <code>{`{x}`}</code></div>
                            </div>

                            {/* 4. Formulas */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-success">Công thức Đáp án ĐÚNG</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-success text-white"><CheckCircle size={18}/></span>
                                    <input 
                                        {...register("formulaCorrect", {required: true})} 
                                        className="form-control font-monospace text-success fw-bold"
                                        placeholder="a * x + b" 
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <label className="form-label fw-bold text-danger">Công thức Đáp án NHIỄU</label>
                                    <button type="button" onClick={() => appendDistractor({value: ''})} className="btn btn-sm btn-link text-danger p-0 text-decoration-none">
                                        <Plus size={14}/> Thêm
                                    </button>
                                </div>
                                {distractorFields.map((field, idx) => (
                                    <div key={field.id} className="input-group mb-2">
                                        <span className="input-group-text bg-light text-danger"><XCircle size={18}/></span>
                                        <input 
                                            {...register(`formulasDistractors.${idx}.value` as const, {required: true})} 
                                            className="form-control font-monospace text-danger"
                                            placeholder="Công thức sai..." 
                                        />
                                        <button type="button" onClick={() => removeDistractor(idx)} className="btn btn-outline-danger">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* 5. Explanation */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">Lời giải chi tiết</label>
                                <textarea {...register("explanationTemplate")} className="form-control" rows={2} placeholder="Giải thích cách tính..."/>
                            </div>

                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 border-top bg-light text-end">
                        <button 
                            onClick={handleSubmit(onSubmit)} 
                            disabled={isLoading} 
                            className="btn btn-primary d-inline-flex align-items-center gap-2 fw-bold px-4"
                        >
                            {isLoading ? <span className="spinner-border spinner-border-sm"/> : <Save size={18}/>}
                            LƯU & SINH THỬ
                        </button>
                    </div>
                </div>

                {/* --- CỘT PHẢI: LIVE PREVIEW --- */}
                <div className="col-md-6 h-100 bg-secondary bg-opacity-10 d-flex flex-column align-items-center justify-content-center p-4">
                    {!previewData ? (
                        <div className="text-center text-muted opacity-50">
                            <Play size={64} strokeWidth={1} className="mb-3"/>
                            <h4>Chưa có dữ liệu Preview</h4>
                            <p>Nhập công thức bên trái và bấm "Lưu & Sinh thử"</p>
                        </div>
                    ) : (
                        <div className="card shadow-lg w-100 border-0" style={{maxWidth: '600px'}}>
                            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <span className="fw-bold d-flex align-items-center gap-2"><Play size={18}/> KẾT QUẢ SINH TỰ ĐỘNG</span>
                                <span className="badge bg-white text-primary">Live Preview</span>
                            </div>
                            <div className="card-body p-4">
                                <h5 className="card-title lh-base mb-4 fw-bold text-dark border-start border-4 border-primary ps-3">
                                    {previewData.questionText}
                                </h5>

                                <div className="d-grid gap-3">
                                    {previewData.answers?.map((ans: any, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className={`p-3 rounded border d-flex align-items-center gap-3
                                                ${ans.isCorrect ? 'bg-success bg-opacity-10 border-success' : 'bg-white border-light-subtle'}`}
                                        >
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white
                                                ${ans.isCorrect ? 'bg-success' : 'bg-secondary'}`} 
                                                style={{width: '32px', height: '32px', flexShrink: 0}}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={`flex-grow-1 fw-medium ${ans.isCorrect ? 'text-success' : 'text-dark'}`}>
                                                {ans.text}
                                            </span>
                                            {ans.isCorrect && <span className="badge bg-success">ĐÚNG</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card-footer text-center bg-white border-top-0 pb-4">
                                <button onClick={handleSubmit(onSubmit)} className="btn btn-link text-decoration-none d-inline-flex align-items-center gap-1">
                                    <Play size={16}/> Sinh ngẫu nhiên khác
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FormulaBuilder;