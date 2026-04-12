import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Filter, Search, FileUp, Loader2, School, X, DiamondPlus } from "lucide-react";
import { Button } from '../../components/Buttons/customButton';
import { CardButton } from "../../components/Buttons/cardButton";
import { GradeCard } from "../../components/Cards/admin/gradeCard";
import { CreateGradePopup } from "./create/createGradePopup";
import { UpdateGradePopup } from "./update/updateGradePopup";
import { CsvUploadPopup } from "../../components/csvUploadPopup";
import { DecisionPopup } from "../../components/decision popup";
import { CustomDropdown } from "../../components/Custom/customDropdown";
import { BackToTop } from "../../components/Custom/backToTop";
import { type AppDispatch, type RootState } from "../../store";
import { fetchGrades, deleteGrade, bulkUploadGrades, type GradeDetails } from "../../features/organization/gradeSlice";
import { addToast } from "../../features/toasts/toastSlice";

export const ManageGrades = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCsvPopupOpen, setIsCsvPopupOpen] = useState(false);
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

    const isAnyFilterActive = useMemo(() => {
        return searchQuery !== "" || selectedYear !== "All";
    }, [searchQuery, selectedYear]);

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>

            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col md:flex-row items-center p-3 gap-3">
                    <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="text-primary shrink-0">
                            <School size={30} strokeWidth={2.5} />
                        </div>
                        <div className="group flex items-center flex-1 h-11.25 text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400 bg-light/5">
                            <input
                                type="text"
                                placeholder="Search for Grade"
                                className="w-full pl-5 outline-none bg-transparent placeholder-text-muted/40"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search size={20} className="mr-3 text-light/30 group-focus-within:text-primary" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <div className="relative w-auto h-11.25">
                            <Button label="" Icon={Filter} onClick={() => setIsFilterOpen(!isFilterOpen)} variant="primary" className="h-full px-4 min-w-11.25">
                                <span className="hidden lg:block">Filter</span>
                            </Button>

                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-surface border-2 border-light/10 p-6 rounded-2xl shadow-xl z-10">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-primary">Filters</h3>
                                        <button onClick={() => setIsFilterOpen(false)}>
                                            <X size={25} strokeWidth={3} className="text-failure hover:rotate-90 transition-all duration-300 hover:bg-failure/20 rounded-full p-1 hover:cursor-pointer" />
                                        </button>
                                    </div>
                                    <CustomDropdown label="Academic Year" icon={School} value={selectedYear} onChange={setSelectedYear} options={academicYears} className='w-full' />
                                    <Button label="Reset" onClick={() => setSelectedYear("All")} variant="failure" className="w-full mt-4" />
                                </div>
                            )}
                        </div>
                        
                        <Button
                            label="Upload CSV"
                            Icon={FileUp}
                            onClick={() => setIsCsvPopupOpen(true)}
                            variant="primary"
                            className="h-11.25 flex-1 md:flex-none md:min-w-37.5"
                        />
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="sm:p-5 p-2 border-2 border-light/3 rounded-2xl bg-surface max-w-full flex-1 h-0 overflow-y-auto mx-auto w-full custom-scrollbar"
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Syncing Grades...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3 w-full pb-20">
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
                            {filteredGrades.length === 0 && isAnyFilterActive && (
                                <div className="col-span-full w-full mt-20 text-center">
                                    <p className="text-xl text-failure/60 font-bold">No grade found.</p>
                                    <p className="text-sm text-text-muted">Adjust filters or search query.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <BackToTop scrollRef={scrollRef} />
            </section>
            <CreateGradePopup isOpen={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} />
            <UpdateGradePopup isOpen={isUpdatePopupOpen} onClose={() => setIsUpdatePopupOpen(false)} grade={selectedGrade} />
            <DecidePopup />
            <CsvUploadPopup 
                isOpen={isCsvPopupOpen} 
                onClose={() => {
                    setIsCsvPopupOpen(false);
                    dispatch(fetchGrades());
                }}
                onUpload={(file) => dispatch(bulkUploadGrades(file)).unwrap()}
                title="Import Grades"
                description="Upload CSV to bulk create Grades/Classes. Format expected: name, section."
                samples={[{ label: "Grades", headers: ["name", "section"] }]}
            />
        </div>
    );
};
