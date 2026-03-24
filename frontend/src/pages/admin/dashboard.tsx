import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    Users, 
    BookOpen, 
    School, 
    ClipboardCheck, 
    LayoutDashboard, 
    TrendingUp, 
    AlertCircle,
    Loader2
} from "lucide-react";

import { type AppDispatch, type RootState } from "../../store";
import { fetchUsers } from "../../features/organization/userSlice";
import { fetchGrades } from "../../features/organization/gradeSlice";
import { fetchSubjects } from "../../features/organization/subjectSlice";
import { fetchAssignSubs } from "../../features/organization/assignSubjectSlice";

export const AdminDashboard = () => {
    const dispatch = useDispatch<AppDispatch>();

    // Selectors
    const { users, isLoading: userLoading } = useSelector((state: RootState) => state.user);
    const { grades, isLoading: gradeLoading } = useSelector((state: RootState) => state.grade);
    const { subjects, isLoading: subjectLoading } = useSelector((state: RootState) => state.subject);
    const { assignSub, isLoading: assignLoading } = useSelector((state: RootState) => state.assignSub);

    const isLoading = userLoading || gradeLoading || subjectLoading || assignLoading;

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchGrades());
        dispatch(fetchSubjects());
        dispatch(fetchAssignSubs());
    }, [dispatch]);

    // Data Insights Logic
    const insights = useMemo(() => {
        const teachers = users.filter(u => u.role_name === 'teacher');
        const totalAdmins = users.filter(u => u.role_name === 'admin').length;
        
        // Find unassigned teachers (based on the "one subject" rule)
        const assignedTeacherIds = new Set(assignSub.filter(a => a.teacher).map(a => a.teacher));
        const availableTeachers = teachers.filter(t => !assignedTeacherIds.has(t.id));

        // Find classes without any subjects assigned
        const assignedGradeIds = new Set(assignSub.map(a => a.grade));
        const unassignedGrades = grades.filter(g => assignedGradeIds.has(g.id || 1));

        return {
            teacherCount: teachers.length,
            availableTeachersCount: availableTeachers.length,
            adminCount: totalAdmins,
            unassignedGradesCount: unassignedGrades.length,
            coveragePercent: grades.length > 0 
                ? Math.round((assignedGradeIds.size / grades.length) * 100) 
                : 0
        };
    }, [users, grades, assignSub]);

    const statsCards = [
        { label: "Total Users", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Active Subjects", value: subjects.length, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Class Sections", value: grades.length, icon: School, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Assignments", value: assignSub.length, icon: ClipboardCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    return (
        <div className='flex flex-col items-center justify-start align-middle min-h-full w-full py-10 overflow-y-auto'>
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-8 items-center justify-center sm:justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <LayoutDashboard size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-primary text-3xl font-bold">Admin Dashboard</h1>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface border-2 border-light/10 rounded-2xl text-text-muted font-semibold">
                    <TrendingUp size={20} className="text-emerald-500" />
                    <span>System Live</span>
                </div>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map((card, index) => (
                        <div key={index} className="bg-surface border-2 border-light/3 rounded-3xl p-5 flex items-center gap-5 hover:border-primary/30 transition-all duration-300">
                            <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
                                <card.icon size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{card.label}</p>
                                <p className="text-2xl font-black text-text-heading">{isLoading ? "..." : card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Insights Panel */}
                    <div className="lg:col-span-2 bg-surface border-2 border-light/3 rounded-3xl p-6 h-fit">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle className="text-primary" size={24} />
                            <h2 className="text-xl font-bold text-text-heading">Operational Insights</h2>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center py-20 gap-3">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="font-bold text-text-muted">Analyzing Data...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-light/5 border-2 border-light/10 rounded-2xl">
                                    <p className="text-text-muted font-bold text-xs uppercase mb-2">Teacher Allocation</p>
                                    <p className="text-sm font-semibold text-text-heading leading-relaxed">
                                        You have <span className="text-primary font-bold">{insights.availableTeachersCount}</span> teachers currently unassigned to any subjects.
                                    </p>
                                    <div className="mt-4 w-full bg-light/10 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-primary h-full transition-all duration-1000" 
                                            style={{ width: `${(insights.teacherCount - insights.availableTeachersCount) / insights.teacherCount * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-5 bg-light/5 border-2 border-light/10 rounded-2xl">
                                    <p className="text-text-muted font-bold text-xs uppercase mb-2">Curriculum Coverage</p>
                                    <p className="text-sm font-semibold text-text-heading leading-relaxed">
                                        <span className="text-emerald-500 font-bold">{insights.coveragePercent}%</span> of class sections have at least one subject configured.
                                    </p>
                                    <div className="mt-4 w-full bg-light/10 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-full transition-all duration-1000" 
                                            style={{ width: `${insights.coveragePercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-5 bg-failure/5 border-2 border-failure/10 rounded-2xl md:col-span-2">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-failure mt-1" size={18} />
                                        <div>
                                            <p className="text-failure font-bold text-sm">Action Required</p>
                                            <p className="text-xs font-semibold text-text-muted mt-1">
                                                {insights.unassignedGradesCount} classes currently have no subjects or teachers linked. Visit Manage Subjects to complete setup.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Breakdown */}
                    <div className="bg-surface border-2 border-light/3 rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-text-heading mb-6">Staffing</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 hover:bg-light/5 rounded-2xl transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="font-semibold text-text-muted">Admins</span>
                                </div>
                                <span className="font-bold text-text-heading">{insights.adminCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 hover:bg-light/5 rounded-2xl transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="font-semibold text-text-muted">Teachers</span>
                                </div>
                                <span className="font-bold text-text-heading">{insights.teacherCount}</span>
                            </div>
                            <div className="pt-4 border-t-2 border-light/10">
                                <div className="bg-primary/10 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">System Health</p>
                                    <p className="text-xs font-bold text-text-muted">All reducers synced and operational.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};