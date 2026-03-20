import { CheckCircle2, X, Clock, AlertCircle } from "lucide-react";
import { Portal } from '../../../components/Portal';
import { Button } from '../../../components/Buttons/customButton';
import { type Quiz, type QuizAttempt } from '../../../features/learning/quizSllice';

interface ViewQuizResultPopupProps {
    isOpen: boolean;
    onClose: () => void;
    result: QuizAttempt | null;
    quiz: Quiz | undefined;
}

export const ViewQuizResultPopup = ({ isOpen, onClose, result, quiz }: ViewQuizResultPopupProps) => {
    if (!isOpen || !result) return null;

    const totalPoints = quiz?.questions?.reduce((acc, q) => acc + (q.points_override || 1), 0) || 1;
    const percentage = Math.round((result.total_score / totalPoints) * 100) || 0;
    const isPassed = percentage >= 50;

    // Security check: Hide detailed results if quiz window is still open
    const isWindowOpen = quiz?.end_datetime ? new Date(quiz.end_datetime) > new Date() : false;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/90 backdrop-blur-xl">
                <div className="w-full max-w-xl bg-surface border-2 border-light/10 rounded-[3rem] shadow-2xl flex flex-col p-8 items-center text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
                    
                    {/* Glassy Background Accents */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="w-full flex justify-end mb-4">
                        <button onClick={onClose} className="p-2 hover:bg-light/10 rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer">
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>

                    <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 rotate-12 shadow-2xl transition-transform hover:rotate-0 duration-500 ${
                        isPassed ? 'bg-green-500/20 text-green-500 shadow-green-500/20' : 'bg-red-400/20 text-red-400 shadow-red-400/20'
                    }`}>
                        <CheckCircle2 size={64} strokeWidth={2.5} />
                    </div>
                    
                    <h2 className="text-4xl font-black text-primary uppercase tracking-tighter mb-2">
                        {quiz?.title || 'Assessment Summary'}
                    </h2>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                        <Clock size={12} />
                        Completed {new Date(result.completed_at || Date.now()).toLocaleTimeString()}
                    </p>
                    
                    <div className="w-full bg-light/5 border-2 border-light/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center mb-10 relative group">
                        <div className={`absolute top-0 inset-x-0 h-1.5 ${isPassed ? 'bg-green-500' : 'bg-red-400'}`} />
                        
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mb-4">Holistic Score Metrics</span>
                        
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className={`text-8xl font-black tracking-tighter ${isPassed ? 'text-green-500' : 'text-red-400'}`}>
                                {result.total_score}
                            </span>
                            <span className="text-4xl font-black text-text-muted opacity-20">/ {totalPoints}</span>
                        </div>
                        
                        <div className={`px-6 py-2 rounded-2xl font-black text-2xl border-2 tracking-tighter ${
                            isPassed ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-400/10 text-red-400 border-red-400/20'
                        }`}>
                            {percentage}% Accuracy
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-8 w-full">
                            <div className="h-3 w-full bg-light/10 rounded-full overflow-hidden border border-light/5 p-0.5">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                                        isPassed ? 'bg-green-500 shadow-green-500/20' : 'bg-red-400 shadow-red-400/20'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {isWindowOpen && (
                        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-8 w-full group">
                            <AlertCircle className="text-primary animate-pulse" size={20} />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Security Lock Active</p>
                                <p className="text-xs font-bold text-text-muted">Detailed answer review will be available after the deadline.</p>
                            </div>
                        </div>
                    )}

                    <Button 
                        label="Done" 
                        onClick={onClose} 
                        variant="primary" 
                        className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-3xl" 
                    />
                </div>
            </div>
        </Portal>
    );
};

export default ViewQuizResultPopup;
