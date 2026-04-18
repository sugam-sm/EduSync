import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
    data: any;
}

export const StudentAnalyticsDashboard = ({ data }: Props) => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [tick, setTick] = useState(0);
    const [activeRemark, setActiveRemark] = useState<any>(null);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const darkNow = document.documentElement.classList.contains('dark');
            setIsDark(darkNow);
            setTick(t => t + 1);
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const theme = isDark ? 'dark' : 'light';
    const [overallOffset, setOverallOffset] = useState(0);
    const [quizOffset, setQuizOffset] = useState(0);
    const [sentimentOffset, setSentimentOffset] = useState(0);

    const getThemeColor = (varName: string) => {
        if (typeof window === 'undefined') return "";
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    };

    // Reset offsets when data changes (new student or subject)
    useEffect(() => {
        setOverallOffset(0);
        setQuizOffset(0);
        setSentimentOffset(0);
    }, [data.student_id, data.active_subject]);

    const handleScroll = (offset: number, setOffset: any, total: number, direction: 'left' | 'right') => {
        const step = 6;
        let newOffset = direction === 'left' ? offset + step : offset - step;
        if (newOffset < 0) newOffset = 0;
        const maxOffset = total > 12 ? total - 12 : 0;
        if (newOffset > maxOffset) newOffset = maxOffset;
        setOffset(newOffset);
    };

    const getXScale = (total: number, offset: number) => {
        if (total <= 12) {
            return { offset: true, grid: { display: false }, ticks: { display: false } };
        }
        return {
            min: Math.max(0, total - 12 - offset),
            max: total - 1 - offset,
            offset: true,
            grid: { display: false },
            ticks: { display: false }
        };
    };

    const tooltipStyle = {
        backgroundColor: getThemeColor('--app-surface'),
        titleColor: getThemeColor('--app-primary'),
        bodyColor: getThemeColor('--app-text-heading'),
        borderColor: getThemeColor('--app-primary'),
        borderWidth: 2,
        padding: 20,
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14, weight: '500' },
        footerFont: { size: 12 },
        displayColors: true,
        boxPadding: 8,
    };

    // 1. Overall Performance
    const overallChartData = {
        labels: (data.overall_performance || []).map((d: any) => d.quiz_title || "Initial"),
        datasets: [
            {
                label: 'EduSync Index',
                data: (data.overall_performance || []).map((d: any) => d.index),
                borderColor: getThemeColor('--app-primary'),
                fill: false,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: getThemeColor('--app-primary'),
            },
            {
                label: 'Class Avg',
                data: (data.overall_performance || []).map((d: any) => d.class_avg_index),
                borderColor: getThemeColor('--app-text-body'),
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            }
        ]
    };

    // 2. Quiz Scores
    const quizChartData = {
        labels: (data.quiz_scores || []).map((q: any) => q.quiz_title),
        datasets: [
            {
                label: 'Score %',
                data: (data.quiz_scores || []).map((q: any) => q.percentage),
                borderColor: getThemeColor('--app-success'),
                fill: false,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: getThemeColor('--app-success'),
            },
            {
                label: 'Class Avg',
                data: (data.quiz_scores || []).map((q: any) => q.class_avg_percentage),
                borderColor: getThemeColor('--app-text-body'),
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            }
        ]
    };


    // 4. Sentiment (Line)
    const sentimentChartData = {
        labels: (data.sentiment || []).map((s: any) => s.quiz_title),
        datasets: [
            {
                label: 'Sentiment Score',
                data: (data.sentiment || []).map((s: any) => s.sentiment_score),
                borderColor: getThemeColor('--app-warning'),
                fill: false,
                tension: 0.3,
                pointRadius: 6,
                pointBackgroundColor: (data.sentiment || []).map((s: any) =>
                    s.sentiment_label === 'Positive' ? getThemeColor('--app-success') :
                        s.sentiment_label === 'Negative' ? getThemeColor('--app-failure') : getThemeColor('--app-warning')
                ),
            }
        ]
    };

    const commonOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        clip: { left: 0, right: 0, top: false, bottom: false },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { position: 'top', labels: { color: getThemeColor('--app-text-body'), font: { weight: 'bold', size: 11 }, boxWidth: 12 } },
            tooltip: tooltipStyle
        },
        scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(184,193,236,0.05)' }, ticks: { color: getThemeColor('--app-text-body'), font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { color: getThemeColor('--app-text-body'), font: { size: 10 } } }
        }
    };

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-light/3 border-2 border-primary/10 p-4 rounded-2xl">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Curr. Index</p>
                    <h2 className="text-2xl font-black text-primary mt-1">
                        {data?.student_stats?.current_index ?? data?.class_averages?.avg_edusync_index ?? 0}
                    </h2>
                </div>
                <div className="bg-light/3 border-2 border-success/10 p-4 rounded-2xl">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Quiz Avg.</p>
                    <h2 className="text-2xl font-black text-success mt-1">{data?.student_stats?.avg_quiz_percentage ?? data?.class_averages?.avg_quiz_percentage ?? 0}%</h2>
                </div>
                <div className="bg-light/3 border-2 border-info/10 p-4 rounded-2xl">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Attendance</p>
                    <h2 className="text-2xl font-black text-info mt-1">{data?.student_stats?.attendance_rate ?? data?.attendance_summary?.attendance_rate ?? 0}%</h2>
                </div>
                <div className="bg-light/3 border-2 border-warning/10 p-4 rounded-2xl">
                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Sentiment</p>
                    <h2 className="text-2xl font-black text-warning mt-1">{data?.student_stats?.positive_pct ?? data?.sentiment_summary?.positive_pct ?? 0}%</h2>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. Overall Performance */}
                <div className="bg-light/3 border-2 border-light/5 p-5 rounded-2xl h-[300px] flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-black text-primary uppercase tracking-wider">Overall Performance</h3>
                        {data.overall_performance?.length > 12 && (
                            <div className="flex gap-2">
                                <button onClick={() => handleScroll(overallOffset, setOverallOffset, data.overall_performance.length, 'left')} className="p-1 rounded bg-light/10 hover:bg-light/20 text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={overallOffset >= (data.overall_performance.length - 12)}><ChevronLeft size={16} /></button>
                                <button onClick={() => handleScroll(overallOffset, setOverallOffset, data.overall_performance.length, 'right')} className="p-1 rounded bg-light/10 hover:bg-light/20 text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={overallOffset <= 0}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        <Line
                            key={`overall-${theme}-${tick}`}
                            redraw={true}
                            data={overallChartData}
                            options={{ ...commonOptions, scales: { ...commonOptions.scales, x: getXScale(data.overall_performance?.length || 0, overallOffset) } }}
                        />
                    </div>
                </div>

                {/* 2. Quiz Scores */}
                <div className="bg-light/3 border-2 border-light/5 p-5 rounded-2xl h-[300px] flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-black text-success uppercase tracking-wider">Quiz Scores</h3>
                        {data.quiz_scores?.length > 12 && (
                            <div className="flex gap-2">
                                <button onClick={() => handleScroll(quizOffset, setQuizOffset, data.quiz_scores.length, 'left')} className="p-1 rounded bg-light/10 hover:bg-light/20 text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={quizOffset >= (data.quiz_scores.length - 12)}><ChevronLeft size={16} /></button>
                                <button onClick={() => handleScroll(quizOffset, setQuizOffset, data.quiz_scores.length, 'right')} className="p-1 rounded bg-light/10 hover:bg-light/20 text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={quizOffset <= 0}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        <Line
                            key={`quiz-${theme}-${tick}`}
                            redraw={true}
                            data={quizChartData}
                            options={{ ...commonOptions, scales: { ...commonOptions.scales, x: getXScale(data.quiz_scores?.length || 0, quizOffset) } }}
                        />
                    </div>
                </div>


                {/* 4. Teacher Sentiment */}
                <div className="bg-light/3 border-2 border-light/5 p-5 rounded-2xl h-[300px] flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-black text-warning uppercase tracking-wider">Teacher Sentiment</h3>
                        {data.sentiment?.length > 12 && (
                            <div className="flex gap-2">
                                <button onClick={() => handleScroll(sentimentOffset, setSentimentOffset, data.sentiment.length, 'left')} className="p-1 rounded bg-light/10 hover:bg-light/20 text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={sentimentOffset >= (data.sentiment.length - 12)}><ChevronLeft size={16} /></button>
                                <button onClick={() => handleScroll(sentimentOffset, setSentimentOffset, data.sentiment.length, 'right')} className="p-1 rounded bg-light/10 hover:bg-light/20 text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={sentimentOffset <= 0}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        <Line
                            key={`sentiment-${theme}-${tick}`}
                            redraw={true}
                            data={sentimentChartData}
                            options={{
                                ...commonOptions,
                                scales: { ...commonOptions.scales, x: getXScale(data.sentiment?.length || 0, sentimentOffset) },
                                onClick: (_: any, elements: any) => {
                                    if (elements.length > 0) setActiveRemark(data.sentiment[elements[0].index]);
                                }
                            }}
                        />
                    </div>

                    {activeRemark && (
                        <div className="absolute inset-0 bg-surface/95 backdrop-blur-xl p-8 flex flex-col z-10 animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-2xl text-primary">{activeRemark.quiz_title}</h4>
                                <button
                                    onClick={() => setActiveRemark(null)}
                                    className="-mt-1 p-2 hover:bg-failure/20 hover:text-failure rounded-full text-text-muted transition-all hover:rotate-90 duration-300 hover:cursor-pointer"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                            <p className="text-xs text-text-muted mb-3">{activeRemark.teacher_name} & {new Date(activeRemark.date).toLocaleDateString()}</p>
                            <div className="bg-light/5 p-4 rounded-xl border border-light/10 flex-1 overflow-y-auto italic text-light text-sm leading-relaxed">
                                "{activeRemark.remark_text}"
                            </div>
                        </div>
                    )}
                </div>

                {/* Attendance Mix Donut */}
                <div className="bg-light/3 border-2 border-light/5 p-5 rounded-2xl h-[300px] flex flex-col">
                    <h3 className="text-sm font-black text-text-muted uppercase tracking-wider mb-2">Attendance Distribution</h3>
                    <div className="flex-1 min-h-0">
                        <Doughnut
                            key={`attendance-${theme}-${tick}`}
                            redraw={true}
                            data={{
                                labels: ['Present', 'Late', 'Absent'],
                                datasets: [{
                                    data: [data.attendance?.donut?.present ?? 0, data.attendance?.donut?.late ?? 0, data.attendance?.donut?.absent ?? 0],
                                    backgroundColor: [getThemeColor('--app-success'), getThemeColor('--app-warning'), getThemeColor('--app-failure')],
                                    borderColor: getThemeColor('--app-surface'),
                                    borderWidth: 2,
                                    borderRadius: 10,
                                    hoverOffset: 15,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '0%',
                                layout: { padding: 30 },
                                plugins: { legend: { position: 'right', labels: { color: getThemeColor('--app-text-body'), font: { weight: 'bold' } } } }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
