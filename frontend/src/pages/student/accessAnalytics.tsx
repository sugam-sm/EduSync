import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { type AppDispatch, type RootState } from '../../store';
import { fetchDashboardData } from '../../features/analytics/dashboardSlice';
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { StudentAnalyticsDashboard } from '../../components/Analytics/studentAnalyticsDashboard';
import { BackToTop } from '../../components/Custom/backToTop';

import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export const AccessAnalytics = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, error } = useSelector((state: RootState) => state.dashboard);
    const [selectedSubject, setSelectedSubject] = useState<string | number>("");

    useEffect(() => {
        dispatch(fetchDashboardData({ 
            subject_id: selectedSubject || undefined 
        }));
    }, [dispatch, selectedSubject]);

    const subjectOptions = data?.subjects?.map((s: any) => ({ label: s.name, value: s.id })) || [];

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    My Analytics
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            <TrendingUp size={30} strokeWidth={3} />
                        </div>
                        <div className="flex gap-2 w-[80%] 2xl:w-[50%]">
                            <span className="text-text-muted font-semibold flex items-center">Subject:</span>
                            <CustomDropdown
                                className="w-full"
                                value={selectedSubject}
                                onChange={setSelectedSubject}
                                options={subjectOptions}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl border-2 border-primary/20">
                        <BarChart3 size={14} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            50% Quiz + 40% Attendance + 10% Sentiment
                        </span>
                    </div>
                </div>

                <div
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative"
                    ref={scrollRef}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold tracking-widest uppercase text-xs">Analyzing your performance...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-failure">Error Loading Analytics</h3>
                                <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">{error}</p>
                            </div>
                        </div>
                    ) : !selectedSubject ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <TrendingUp size={60} className="text-primary opacity-20" />
                            <div>
                                <h3 className="text-2xl font-bold text-primary">Select a Subject</h3>
                                <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                    Choose a subject from the dropdown above to view your detailed analytics and performance tracking.
                                </p>
                            </div>
                        </div>
                    ) : !data ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center opacity-40">
                            <TrendingUp size={60} />
                            <p className="font-bold tracking-widest uppercase text-xs">No analytics data available yet.</p>
                        </div>
                    ) : (
                        <div className="pb-15">
                            <StudentAnalyticsDashboard data={data} />
                        </div>
                    )}

                    <div className="sticky bottom-0 left-0 w-full flex justify-end p-2 z-50">
                        <BackToTop scrollRef={scrollRef} />
                    </div>
                </div>
            </section>
        </div>
    );
};
