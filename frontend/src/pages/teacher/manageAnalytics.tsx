import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Loader2, Users, BookOpen, Target, TrendingUp, Award, ArrowLeft, XCircle, MessageSquare, BarChart3 } from 'lucide-react';

import { type AppDispatch, type RootState } from '../../store';
import { fetchDashboardData, clearDashboardData } from '../../features/analytics/dashboardSlice';
import { fetchGrades } from '../../features/organization/gradeSlice';
import { fetchGradeStudents } from '../../features/analytics/attendanceSlice';
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { StudentAnalyticsDashboard } from '../../components/Analytics/studentAnalyticsDashboard';
import { BackToTop } from '../../components/Custom/backToTop';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export const ManageAnalytics = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);

    // State
    const { data, isLoading, error } = useSelector((state: RootState) => state.dashboard);
    const { grades, isLoading: gradesLoading } = useSelector((state: RootState) => state.grade);
    const { currentStudents } = useSelector((state: RootState) => state.attendance);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedStudent, setSelectedStudent] = useState<string | number>("All");

    const getThemeColor = (varName: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    };

    // Fetch initial grades
    useEffect(() => {
        dispatch(fetchGrades());
    }, [dispatch]);

    // Fetch students when grade changes
    useEffect(() => {
        if (selectedGrade && selectedGrade !== "All") {
            dispatch(fetchGradeStudents(selectedGrade));
            setSelectedStudent("All");
        }
    }, [dispatch, selectedGrade]);

    // Fetch dashboard data
    useEffect(() => {
        if (selectedGrade && selectedGrade !== "All") {
            dispatch(fetchDashboardData({
                grade_id: selectedGrade,
                student_id: selectedStudent === "All" ? undefined : selectedStudent,
            }));
        } else {
            dispatch(clearDashboardData());
        }
    }, [dispatch, selectedGrade, selectedStudent]);

    // --- Options ---
    const gradeOptions = grades.map(g => ({
        label: `${g.name} ${g.section}`,
        value: g.id!
    }));

    const studentOptions = [
        { label: "Class Overview", value: "All" },
        ...currentStudents.map(s => ({
            label: s.fullname || s.username,
            value: s.user
        }))
    ];

    // Donut options used across charts
    const donutOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        layout: { padding: 40 },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: getThemeColor('--color-text-body'), font: { weight: 'bold' } }
            }
        }
    };

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    {data?.view === 'student' ? `${data?.student_name}'s Analytics` : 'Class Analytics'}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between items-center w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            <BarChart3 size={30} strokeWidth={3} />
                        </div>
                        <div className="flex gap-2 w-[80%] 2xl:w-[35%]">
                            <span className="text-text-muted font-bold flex items-center whitespace-nowrap text-sm">Grade:</span>
                            <CustomDropdown
                                className="w-full"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
                            />
                        </div>
                    </div>

                    {selectedGrade && selectedGrade !== "All" && (
                        <div className="flex gap-2 w-full lg:w-auto items-center">
                            <span className="text-text-muted font-bold whitespace-nowrap text-sm">Student:</span>
                            <CustomDropdown
                                className="w-full min-w-[200px]"
                                options={studentOptions}
                                value={selectedStudent}
                                onChange={setSelectedStudent}
                            />
                        </div>
                    )}
                </div>

                <div
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative"
                    ref={scrollRef}
                >
                    {gradesLoading || isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold tracking-widest uppercase text-xs">Syncing class analytics...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <XCircle size={50} className="text-failure opacity-40" />
                            <h3 className="text-xl font-bold text-failure">{error}</h3>
                        </div>
                    ) : !selectedGrade || selectedGrade === "All" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <TrendingUp size={60} className="text-primary opacity-20" />
                            <div>
                                <h3 className="text-2xl font-bold text-primary">Select a Grade</h3>
                                <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                    Choose a grade from the dropdown above to view performance rankings, quiz metrics, and behavioral analysis for your students.
                                </p>
                            </div>
                        </div>
                    ) : data && data.view === 'grade' ? (
                        /* ═══════════════════════════════════════════
                           GRADE OVERVIEW VIEW
                           ═══════════════════════════════════════════ */
                        <div className="space-y-6 pb-15">

                            {/* Top Stats Band */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="bg-light/3 border-2 border-primary/10 p-5 rounded-2xl">
                                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Class Index Avg</p>
                                    <h2 className="text-3xl font-black text-primary mt-1">{data.class_averages.avg_edusync_index}</h2>
                                    <div className="mt-3 h-1.5 w-full bg-light/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${data.class_averages.avg_edusync_index}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-light/3 border-2 border-success/10 p-5 rounded-2xl">
                                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Quiz Accuracy</p>
                                    <h2 className="text-3xl font-black text-success mt-1">{data.class_averages.avg_quiz_percentage}%</h2>
                                    <p className="text-[10px] text-text-muted mt-2 uppercase font-bold tracking-tighter">Avg Across {data.quiz_summary.total_quizzes} Quizzes</p>
                                </div>
                                <div className="bg-light/3 border-2 border-info/10 p-5 rounded-2xl">
                                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Attend. Rate</p>
                                    <h2 className="text-3xl font-black text-info mt-1">{data.attendance_summary.attendance_rate}%</h2>
                                    <p className="text-[10px] text-text-muted mt-2 uppercase font-bold tracking-tighter">{data.attendance_summary.total_sessions} Sessions Logged</p>
                                </div>
                                <div className="bg-light/3 border-2 border-warning/10 p-5 rounded-2xl">
                                    <p className="text-text-muted text-[10px] uppercase font-black tracking-widest">Avg Sentiment</p>
                                    <h2 className="text-3xl font-black text-warning mt-1">{data.sentiment_summary.positive_pct}%</h2>
                                    <p className="text-[10px] text-text-muted mt-2 uppercase font-bold tracking-tighter">Positive Vibrations</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* 1. Class Leaderboard */}
                                <div className="xl:col-span-2 bg-light/3 p-6 rounded-2xl border-2 border-light/5 overflow-hidden">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-black text-text-heading flex items-center gap-2">
                                            <Award className="text-warning" size={24} />
                                            Performance Rankings
                                        </h3>
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase italic">Sort: Index</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left border-b border-light/5">
                                                    <th className="pb-3 text-xs font-black uppercase text-text-muted px-4">Rank</th>
                                                    <th className="pb-3 text-xs font-black uppercase text-text-muted">Student</th>
                                                    <th className="pb-3 text-xs font-black uppercase text-text-muted text-center">Quiz Avg</th>
                                                    <th className="pb-3 text-xs font-black uppercase text-text-muted text-center">Index</th>
                                                    <th className="pb-3 text-xs font-black uppercase text-text-muted text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-light/5">
                                                {(data?.student_rankings || []).map((rank: any) => (
                                                    <tr key={rank.student_id} className="group hover:bg-light/5 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${rank.rank === 1 ? 'bg-warning/20 text-warning' :
                                                                    rank.rank === 2 ? 'bg-light/20 text-text-heading' :
                                                                        rank.rank === 3 ? 'bg-primary/20 text-primary' : 'bg-surface border border-light/10 text-text-muted'
                                                                }`}>
                                                                {rank.rank}
                                                            </span>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-text-heading group-hover:text-primary transition-colors">{rank.student_name}</span>
                                                                <span className="text-[10px] font-bold text-text-muted uppercase">{rank.total_quizzes} Quizzes • {rank.total_sessions} Sessions</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <span className="font-mono font-bold text-success bg-success/5 px-2 py-1 rounded-lg text-sm">{rank.avg_quiz}%</span>
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <span className="text-xl font-black text-primary">{rank.edusync_index}</span>
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <button
                                                                onClick={() => setSelectedStudent(rank.student_id)}
                                                                className="p-2 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 cursor-pointer"
                                                            >
                                                                <TrendingUp size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* 2. Sidebar: Sentiment + Resources */}
                                <div className="flex flex-col gap-6">
                                    {/* Sentiment Donut */}
                                    <div className="bg-light/3 p-6 rounded-2xl border-2 border-light/5 flex flex-col items-center">
                                        <h3 className="text-lg font-black text-text-heading mb-6 flex self-start gap-2">
                                            <MessageSquare className="text-info" size={20} />
                                            Sentiment Mix
                                        </h3>
                                        <div className="w-full h-[250px] relative">
                                            <Doughnut
                                                data={{
                                                    labels: ['Positive', 'Neutral', 'Negative'],
                                                    datasets: [{
                                                        data: [data.sentiment_summary.positive, data.sentiment_summary.neutral, data.sentiment_summary.negative],
                                                        backgroundColor: [getThemeColor('--color-success'), getThemeColor('--color-info'), getThemeColor('--color-failure')],
                                                        borderColor: getThemeColor('--color-surface'),
                                                        borderWidth: 4,
                                                        borderRadius: 10,
                                                        hoverOffset: 20,
                                                    }]
                                                }}
                                                options={donutOptions}
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                                <p className="text-3xl font-black text-text-heading">{data.sentiment_summary.total_remarks}</p>
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center">Total<br />Remarks</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resource Stats */}
                                    <div className="bg-light/3 p-6 rounded-2xl border-2 border-primary/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <BookOpen size={80} />
                                        </div>
                                        <h3 className="text-lg font-black text-text-heading mb-4 flex gap-2">
                                            <BookOpen className="text-primary" size={20} />
                                            Learning Content
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-light/5 p-4 rounded-xl">
                                                <p className="text-2xl font-black text-primary">{data.resource_stats.total_resources}</p>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter leading-tight mt-1">Files &<br />Resources</p>
                                            </div>
                                            <div className="bg-light/5 p-4 rounded-xl">
                                                <p className="text-2xl font-black text-info">{data.resource_stats.total_flashcards}</p>
                                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter leading-tight mt-1">Active<br />Flashcards</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assessment Analytics */}
                            <div className="bg-light/3 p-6 rounded-2xl border-2 border-light/5">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-text-heading flex items-center gap-3">
                                            <Target className="text-success" size={28} />
                                            Assessment Analytics
                                        </h3>
                                        <p className="text-text-muted font-bold mt-1 ml-1 text-sm">Per-quiz class performance breakdown</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                                    {data?.quiz_summary?.quizzes?.map((quiz: any) => (
                                        <div key={quiz.quiz_id} className="bg-surface/50 p-5 rounded-2xl border-2 border-light/5 hover:border-success/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[9px] font-black text-success bg-success/10 px-2 py-0.5 rounded-full uppercase mb-1 inline-block tracking-widest">{quiz.subject}</span>
                                                    <h4 className="font-black text-lg text-text-heading leading-tight group-hover:text-success transition-colors">{quiz.quiz_title}</h4>
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1">
                                                        <span className="text-text-muted">Class Success</span>
                                                        <span className="text-success">{quiz.avg_percentage}%</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-light/5 rounded-xl overflow-hidden flex">
                                                        <div className="h-full bg-success opacity-80" style={{ width: `${quiz.avg_percentage}%` }}></div>
                                                        <div className="h-full bg-failure opacity-50" style={{ width: `${(quiz.missed_count / (quiz.total_attempts || 1)) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-text-heading leading-none">
                                                        {quiz.completed_count}
                                                        <span className="text-xs text-text-muted font-bold"> / {data.total_students}</span>
                                                    </p>
                                                    <p className="text-[10px] text-text-muted font-black uppercase mt-1 tracking-tighter">Turnout</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-between pt-3 border-t border-light/5">
                                                <div className="text-center flex-1 border-r border-light/5">
                                                    <p className="text-xs font-black text-text-heading">{quiz.highest_score}</p>
                                                    <p className="text-[8px] font-black text-text-muted uppercase">Highest</p>
                                                </div>
                                                <div className="text-center flex-1 border-r border-light/5">
                                                    <p className="text-xs font-black text-text-heading">{quiz.avg_score}</p>
                                                    <p className="text-[8px] font-black text-text-muted uppercase">Average</p>
                                                </div>
                                                <div className="text-center flex-1">
                                                    <p className="text-xs font-black text-text-heading">{quiz.missed_count}</p>
                                                    <p className="text-[8px] font-black text-failure uppercase">Missed</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : data && data.view === 'student' ? (
                        /* ═══════════════════════════════════════════
                           STUDENT DRILL-DOWN VIEW
                           ═══════════════════════════════════════════ */
                        <div className="pb-15">
                            <button
                                onClick={() => setSelectedStudent("All")}
                                className="mb-4 flex items-center gap-2 text-primary font-black uppercase text-xs hover:gap-4 transition-all cursor-pointer"
                            >
                                <ArrowLeft size={16} /> Back to Class Overview
                            </button>

                            <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-2xl mb-6 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Users size={100} />
                                </div>
                                <div>
                                    <p className="text-primary text-xs uppercase font-black tracking-widest mb-1">Student Intelligence Focus</p>
                                    <h2 className="text-3xl font-black text-text-heading">{data?.student_name}</h2>
                                    <p className="text-text-muted font-bold mt-1 text-sm">Analyzing individual academic trajectory and engagement metrics.</p>
                                </div>
                            </div>

                            <StudentAnalyticsDashboard data={data} />
                        </div>
                    ) : null}

                    <div className="sticky bottom-0 left-0 w-full flex justify-end p-2 z-50">
                        <BackToTop scrollRef={scrollRef} />
                    </div>
                </div>
            </section>
        </div>
    );
};