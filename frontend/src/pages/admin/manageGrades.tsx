import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Filter, Search, FileUp, Loader2, School, X, DiamondPlus } from "lucide-react";
import { Button } from '../../components/Buttons/customButton';
import { CardButton } from "../../components/Buttons/cardButton";
import { GradeCard } from "../../components/Cards/gradeCard";
import { CreateGradePopup } from "./create/createGradePopup";
import { UpdateGradePopup } from "./update/updateGradePopup";
import { DecisionPopup } from "../../components/decision popup";
import { CustomDropdown } from "../../components/Custom/customDropdown";
import { BackToTop } from "../../components/Custom/backToTop";
import { type AppDispatch, type RootState } from "../../store";
import { fetchGrades, deleteGrade, type GradeDetails } from "../../features/organization/gradeSlice";
import { addToast } from "../../features/toasts/toastSlice";

export const ManageGrades = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<GradeDetails | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState<string | number>("All");
    
    const { grades, isLoading } = useSelector((state: RootState) => state.grade);    
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    useEffect(() => {
        dispatch(fetchGrades());
    }, [dispatch]);

    const handleEdit = (grade: GradeDetails) => {
        setSelectedGrade(grade);
        setIsUpdatePopupOpen(true);
    };

    const handleDelete = (id: number | undefined) => {
        if (id === undefined) return;

        openDecidePopup({
            question: "Are you sure you want to delete this class? This action cannot be undone.",
            confirmText: "Yes, Delete",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                const result = await dispatch(deleteGrade(id));
                
                if (deleteGrade.fulfilled.match(result)) {
                    dispatch(addToast({ message: 'Grade deleted successfully.', type: 'success' }));
                } else {
                    const errorMessage = (result.payload as any)?.detail || "Failed to delete grade.";
                    dispatch(addToast({ message: errorMessage, type: 'failure' }));
                }
            }
        });
    };

    const academicYears = useMemo(() => {
        const years = Array.from(new Set(grades.map((g) => g.academic_year)));
        return [
            { label: "All Years", value: "All" },
            ...years.map((y) => ({ label: String(y), value: y }))
        ];
    }, [grades]);

    const filteredGrades = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return grades.filter((grade) => {
            const matchesSearch = 
                grade.name.toLowerCase().includes(query) ||
                grade.section.toLowerCase().includes(query) ||
                grade.teacher_name?.toLowerCase().includes(query);
            
            const matchesYear = selectedYear === "All" || String(grade.academic_year) === String(selectedYear);
            
            return matchesSearch && matchesYear;
        });
    }, [grades, searchQuery, selectedYear]);

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-screen relative'>
            <CreateGradePopup isOpen={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} />
            <UpdateGradePopup isOpen={isUpdatePopupOpen} onClose={() => setIsUpdatePopupOpen(false)} grade={selectedGrade} />
            <DecidePopup />
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-center sm:justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">Manage Grades</h1>
                <Button 
                    label="Upload CSV" 
                    Icon={FileUp} 
                    onClick={() => console.log('CSV Upload Triggered')} 
                    variant="primary" 
                    className="w-full sm:w-[50%] md:w-[40%] lg:w-[25%]"
                />
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex items-center justify-between p-3 gap-1 ">
                    <div className="hidden sm:flex w-[15%] items-center gap-2 px-2 text-primary">
                        <School size={25} strokeWidth={3} />
                    </div>
                    <div className="group flex items-center w-[80%] sm:w-[60%] text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400">
                        <input 
                            type="text" 
                            placeholder="Search for Grade" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-5 py-2 outline-none placeholder-text-muted/40" 
                        />
                        <Search size={20} className="mr-3 text-light/30 group-focus-within:text-primary" />
                    </div>
                    <div className="relative w-[15%]">
                        <Button label="" Icon={Filter} onClick={() => setIsFilterOpen(!isFilterOpen)} variant="primary" className="w-full">
                            <span className="hidden lg:block">Filter</span>
                        </Button>
                        
                        {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-surface border-2 border-light/10 p-6 rounded-2xl shadow-xl z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-primary">Filters</h3>
                                    <button onClick={() => setIsFilterOpen(false)}>
                                        <X size={25} strokeWidth={3} className="text-failure hover:rotate-90 transition-all duration-300 hover:bg-failure/20 rounded-full p-1 hover:cursor-pointer"/>
                                    </button>
                                </div>
                                <CustomDropdown 
                                    label="Academic Year" 
                                    icon={School} 
                                    value={selectedYear} 
                                    onChange={setSelectedYear} 
                                    className='w-full'
                                    options={academicYears} 
                                />
                                <Button label="Reset" onClick={() => setSelectedYear("All")} variant="failure" className="w-full mt-4" />
                            </div>
                        )}
                    </div>
                </div>

                <div 
                    ref={scrollRef}
                    className="sm:p-5 p-2 border-2 border-light/3 rounded-2xl bg-surface max-w-full h-[65vh] lg:h-[70vh] overflow-auto mx-auto"
                >
                     {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Syncing Grades...</p>
                        </div>
                    ) : filteredGrades.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 w-full pb-20">
                            <CardButton
                                onClick={() => setIsCreatePopupOpen(true)}
                                Icon={DiamondPlus}
                            />
                            {filteredGrades.map((grade) => (
                                <GradeCard 
                                    key={grade.id} 
                                    gradeData={grade} 
                                    onEdit={() => handleEdit(grade)} 
                                    onDelete={() => handleDelete(grade.id)}
                                />
                            ))}
                        </div>
                        ) : (
                            <div className="w-full mt-20 text-text-muted text-center">
                                <p className="text-xl font-bold text-failure/50">No Grade found.</p>
                                <p className="text-sm">Add new Grade.</p>
                            </div>
                        )}
                </div>
                <BackToTop scrollRef={scrollRef} />
            </section>
        </div>
    );
};