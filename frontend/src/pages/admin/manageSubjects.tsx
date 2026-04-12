import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Filter, Search, FileUp, BookPlus, Loader2, BookCopy, X } from "lucide-react";
import { Button } from '../../components/Buttons/customButton';
import { CardButton } from "../../components/Buttons/cardButton";
import { SubjectCard } from "../../components/Cards/admin/subjectCard";
import { CreateSubjectPopup } from "./create/createSubjectPopup";
import { UpdateSubjectPopup } from "./update/updateSubjectPopup";
import { ConfigureSubjectPopup } from "./configureSubjectPopup";
import { CsvUploadPopup } from "../../components/csvUploadPopup";
import { DecisionPopup } from "../../components/decision popup";
import { BackToTop } from "../../components/Custom/backToTop";
import { fetchSubjects, deleteSubject, bulkUploadSubjects, type SubjectDetails } from "../../features/organization/subjectSlice";
import { addToast } from "../../features/toasts/toastSlice";
import { type AppDispatch, type RootState } from "../../store";

export const ManageSubjects = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isConfigurePopupOpen, setIsConfigurePopupOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCsvPopupOpen, setIsCsvPopupOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<SubjectDetails | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { subjects, isLoading } = useSelector((state: RootState) => state.subject);
    const { openDecidePopup, DecidePopup } = DecisionPopup();

    useEffect(() => {
        dispatch(fetchSubjects());
    }, [dispatch]);

    const handleEdit = (subject: SubjectDetails) => {
        setSelectedSubject(subject);
        setIsUpdatePopupOpen(true);
    };

    const handleConfigure = (subject: SubjectDetails) => {
        setSelectedSubject(subject);
        setIsConfigurePopupOpen(true);
    };

    const handleDelete = (subject: SubjectDetails) => {
        openDecidePopup({
            question: `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "primary",
            onConfirm: async () => {
                if (subject.id !== undefined) {
                    const result = await dispatch(deleteSubject(subject.id));
                    if (deleteSubject.fulfilled.match(result)) {
                        dispatch(addToast({ message: "Subject deleted successfully.", type: 'success' }));
                    } else {
                        const errorMessage = (result.payload as any)?.detail || "Failed to delete subject.";
                        dispatch(addToast({ message: errorMessage, type: 'failure' }));
                    }
                }
            }
        });
    };

    const filteredSubjects = useMemo(() => {
        return subjects.filter((s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [subjects, searchQuery]);

    const isAnyFilterActive = useMemo(() => {
        return searchQuery !== "";
    }, [searchQuery]);

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>

            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col md:flex-row items-center p-3 gap-3">
                    <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="text-primary shrink-0">
                            <BookCopy size={30} strokeWidth={3} />
                        </div>
                        <div className="group flex items-center flex-1 h-11.5 text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400 bg-light/5">
                            <input
                                type="text"
                                placeholder="Search for Subject"
                                className="w-full pl-5 outline-none bg-transparent placeholder-text-muted/40"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search size={20} className="mr-3 text-light/30 group-focus-within:text-primary" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <div className="relative w-auto h-11.5">
                            <Button label="" Icon={Filter} onClick={() => setIsFilterOpen(!isFilterOpen)} variant="primary" className="h-full px-4 min-w-11.5">
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
                                    <p className="text-text-muted text-sm italic">No filters present for Subjects</p>
                                </div>
                            )}
                        </div>
                        
                        <Button
                            label="Upload CSV"
                            Icon={FileUp}
                            onClick={() => setIsCsvPopupOpen(true)}
                            variant="primary"
                            className="h-11.5 flex-1 md:flex-none md:min-w-37.5"
                        />
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface max-w-full flex-1 h-0 overflow-y-auto rounded-2xl mx-auto w-full custom-scrollbar"
                >
                        {isLoading ? (
                            <div className="flex flex-col items-center h-full justify-center gap-3 text-text-muted">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="font-bold">Syncing Subjects...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-20">
                                <CardButton
                                    onClick={() => setIsCreatePopupOpen(true)}
                                    Icon={BookPlus}
                                />
                                {filteredSubjects.map((subject) => (
                                    <SubjectCard
                                        key={subject.id}
                                        subjectData={subject}
                                        onEdit={() => handleEdit(subject)}
                                        onDelete={() => handleDelete(subject)}
                                        onConfigure={() => handleConfigure(subject)}
                                    />
                                ))}
                                {filteredSubjects.length === 0 && isAnyFilterActive && (
                                    <div className="col-span-full w-full mt-20 text-center">
                                        <p className="text-xl text-failure/60 font-bold">No subjects found.</p>
                                        <p className="text-sm text-text-muted">Adjust filters or search query.</p>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
                <BackToTop scrollRef={scrollRef} />
            </section>
            <CreateSubjectPopup isOpen={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} />

            {selectedSubject && (
                <UpdateSubjectPopup
                    isOpen={isUpdatePopupOpen}
                    onClose={() => {
                        setIsUpdatePopupOpen(false);
                        setSelectedSubject(null);
                    }}
                    subject={selectedSubject}
                />
            )}

            {selectedSubject && (
                <ConfigureSubjectPopup
                    isOpen={isConfigurePopupOpen}
                    onClose={() => {
                        setIsConfigurePopupOpen(false);
                        setSelectedSubject(null);
                    }}
                    subject={selectedSubject}
                />
            )}

            <DecidePopup />
            <CsvUploadPopup 
                isOpen={isCsvPopupOpen} 
                onClose={() => {
                    setIsCsvPopupOpen(false);
                    dispatch(fetchSubjects());
                }}
                onUpload={(file) => dispatch(bulkUploadSubjects(file)).unwrap()}
                title="Import Subjects"
                description="Upload CSV to bulk create Subjects. Format expected: name."
                samples={[{ label: "Subjects", headers: ["name"] }]}
            />
        </div>
    );
};
