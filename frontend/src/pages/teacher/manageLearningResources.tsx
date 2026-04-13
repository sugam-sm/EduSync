import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Folders, Layers, FolderPlus, LayersPlus } from "lucide-react";

import { CardButton } from "../../components/Buttons/cardButton";
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { ResourceFolderCard } from "../../components/Cards/teacher/resourceFolderCard";
import { CreateFolderPopup } from "./create/createFolderPopup";
import { CreateFlashcardDeckPopup } from "./create/createFlashcardDeckPopup";
import { UpdateFolderPopup } from "./update/updateFolderPopup";
import { UpdateFlashcardDeckPopup } from "./update/updateFlashcardDeckPopup";
import { CreateFlashcardsWithAIPopup } from "./create/createFlashcardsWithAIPopup";
import { ManageResources } from "./manage/manageResources";
import { ManageFlashcards } from "./manage/manageFlashcards";
import { FlashcardDisplayPopup } from "../../components/flashcardDisplayPopup";
import { BackToTop } from "../../components/Custom/backToTop";

import { type AppDispatch, type RootState } from "../../store";
import { fetchAssignSubs } from "../../features/organization/assignSubjectSlice";
import { fetchResourceFolders, type ResourceFolder } from "../../features/learning/resourceSlice";
import { fetchFlashcardDecks, type FlashcardDeck } from "../../features/learning/flashcardSlice";
import { FlashcardDeckCard } from "../../components/Cards/teacher/flashcardDeckCard";

export const ManageLearningResources = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { assignSub } = useSelector((state: RootState) => state.assignSub);
    const { folders, isLoading: isResLoading } = useSelector((state: RootState) => state.resource);
    const { flashcard_decks, isLoading: isDeckLoading } = useSelector((state: RootState) => state.flashcard);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedSubject, setSelectedSubject] = useState<string | number>("All");
    const [sectionMode, setSectionMode] = useState<'resources' | 'flashcards'>('resources');

    const [isCreateFolderPopupOpen, setIsCreateFolderOpen] = useState(false);
    const [isCreateDeckPopupOpen, setIsCreateDeckOpen] = useState(false);
    const [isUpdateFolderPopupOpen, setIsUpdateFolderOpen] = useState(false);
    const [isUpdateDeckPopupOpen, setIsUpdateDeckOpen] = useState(false);
    const [isManageResourcesOpen, setIsManageResourcesOpen] = useState(false);
    const [isManageFlashcardsOpen, setIsManageFlashcardsOpen] = useState(false);
    const [isDisplayPopupOpen, setIsDisplayPopupOpen] = useState(false);

    const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);
    const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);

    const [isCreateAIOpen, setIsCreateAIOpen] = useState(false);
    const [aiInitialTitle, setAiInitialTitle] = useState('');
    const [createDeckKey, setCreateDeckKey] = useState(0);

    // Fetch teacher's assignments once
    useEffect(() => { dispatch(fetchAssignSubs()); }, [dispatch]);

    // Derive unique grades securely from assignments
    const gradeOptions = useMemo(() => {
        const seen = new Map<number, { label: string; value: number }>();
        assignSub.forEach(a => {
            if (a.grade && !seen.has(a.grade)) {
                seen.set(a.grade, { label: `${a.grade_name || ''} ${a.grade_section || ''}`.trim(), value: a.grade });
            }
        });
        return Array.from(seen.values());
    }, [assignSub]);

    // Synchronously derive subjects for the selected grade to prevent UI overlap
    const subjectOptions = useMemo(() => {
        if (selectedGrade === "All") return [];
        const seen = new Map<number, { label: string; value: number }>();
        assignSub.forEach(a => {
            if (a.grade === selectedGrade && a.subject && !seen.has(a.subject)) {
                seen.set(a.subject, { label: a.subject_name || '', value: a.subject });
            }
        });
        return Array.from(seen.values());
    }, [assignSub, selectedGrade]);

    // Auto-select first grade when grades load
    useEffect(() => {
        if (gradeOptions.length > 0 && (selectedGrade === "All" || !gradeOptions.find(g => g.value === selectedGrade))) {
            setSelectedGrade(gradeOptions[0].value);
        }
    }, [gradeOptions, selectedGrade]);

    // Auto-select first subject when specific grade subjects load
    useEffect(() => {
        if (subjectOptions.length > 0) {
            if (!subjectOptions.find(s => s.value === selectedSubject)) {
                setSelectedSubject(subjectOptions[0].value);
            }
        } else {
            setSelectedSubject("All");
        }
    }, [subjectOptions, selectedSubject]);

    // Fetch data when grade + subject are selected
    useEffect(() => {
        if (selectedGrade !== "All" && selectedSubject !== "All") {
            if (sectionMode === 'resources') {
                dispatch(fetchResourceFolders({ grade: selectedGrade, subject: selectedSubject }));
            } else {
                dispatch(fetchFlashcardDecks({ grade: selectedGrade, subject: selectedSubject }));
            }
        }
    }, [dispatch, selectedGrade, selectedSubject, sectionMode]);

    const handleEditFolder = (folder: ResourceFolder) => {
        setSelectedFolder(folder);
        setIsUpdateFolderOpen(true);
    };

    const handleManageFolder = (folder: ResourceFolder) => {
        setSelectedFolder(folder);
        setIsManageResourcesOpen(true);
    };

    const handleEditDeck = (deck: FlashcardDeck) => {
        setSelectedDeck(deck);
        setIsUpdateDeckOpen(true);
    };

    const handleManageDeck = (deck: FlashcardDeck) => {
        setSelectedDeck(deck);
        setIsManageFlashcardsOpen(true);
    };

    const handlePreviewDeck = (deck: FlashcardDeck) => {
        setSelectedDeck(deck);
        setIsDisplayPopupOpen(true);
    };

    const isLoading = sectionMode === 'resources' ? isResLoading : isDeckLoading;

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>


            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row items-center p-3 gap-4 lg:gap-6">
                    {/* Group 1: Icon + Grade */}
                    <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
                        <div className="text-primary shrink-0">
                            {sectionMode === 'resources' ? <Folders size={30} strokeWidth={3} /> : <Layers size={30} strokeWidth={3} />}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-text-muted font-bold text-sm whitespace-nowrap">Grade:</span>
                            <CustomDropdown
                                className="w-full flex-1 h-11.5"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
                            />
                        </div>
                    </div>
                    
                    {/* Group 2: Subject */}
                    <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
                        <span className="text-text-muted font-bold text-sm whitespace-nowrap">Subject:</span>
                        <CustomDropdown
                            className="w-full flex-1 h-11.5"
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            options={subjectOptions}
                        />
                    </div>

                    {/* Group 3: Toggle Buttons */}
                    <div className="flex w-full lg:w-75 h-11.5 gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15 shrink-0">
                        <button
                            type="button"
                            onClick={() => setSectionMode('resources')}
                            className={`flex-1 h-full rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'resources' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Resources
                        </button>
                        <button
                            type="button"
                            onClick={() => setSectionMode('flashcards')}
                            className={`flex-1 h-full rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'flashcards' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Flashcards
                        </button>
                    </div>
                </div>

                <div className="relative mx-auto flex-1 h-0 w-full min-h-75 mt-2">
                    <div
                        className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-full overflow-y-auto rounded-2xl custom-scrollbar"
                        ref={scrollRef}
                    >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-15">
                            <CardButton
                                onClick={() => sectionMode === 'resources' ? setIsCreateFolderOpen(true) : setIsCreateDeckOpen(true)}
                                Icon={sectionMode === 'resources' ? FolderPlus : LayersPlus}
                            />
                            {sectionMode === 'resources' ? (
                                folders.map((folder) => (
                                    <ResourceFolderCard
                                        key={folder.id}
                                        folder={folder}
                                        onEdit={handleEditFolder}
                                        onModify={handleManageFolder}
                                    />
                                ))
                            ) : (
                                flashcard_decks.map((deck) => (
                                    <FlashcardDeckCard
                                        key={deck.id}
                                        deck={deck}
                                        onEdit={handleEditDeck}
                                        onModify={handleManageDeck}
                                        onPreview={handlePreviewDeck}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    </div>
                    <BackToTop scrollRef={scrollRef} />
                </div>
            </section>

            <CreateFolderPopup isOpen={isCreateFolderPopupOpen} onClose={() => setIsCreateFolderOpen(false)} grade={selectedGrade} subject={selectedSubject} />
            <CreateFlashcardDeckPopup
                key={createDeckKey}
                isOpen={isCreateDeckPopupOpen}
                onClose={() => setIsCreateDeckOpen(false)}
                grade={selectedGrade}
                subject={selectedSubject}
                onSwitchToAI={(title: string) => {
                    setIsCreateDeckOpen(false);
                    setAiInitialTitle(title);
                    setIsCreateAIOpen(true);
                }}
            />
            <CreateFlashcardsWithAIPopup
                isOpen={isCreateAIOpen}
                onClose={() => setIsCreateAIOpen(false)}
                grade={selectedGrade}
                subject={selectedSubject}
                initialTitle={aiInitialTitle}
                onBack={() => {
                    setIsCreateAIOpen(false);
                    setIsCreateDeckOpen(true);
                }}
                onDiscard={() => {
                    setCreateDeckKey(prev => prev + 1);
                    setAiInitialTitle('');
                }}
            />
            <UpdateFolderPopup isOpen={isUpdateFolderPopupOpen} onClose={() => { setIsUpdateFolderOpen(false); setSelectedFolder(null); }} folder={selectedFolder} />
            <UpdateFlashcardDeckPopup isOpen={isUpdateDeckPopupOpen} onClose={() => { setIsUpdateDeckOpen(false); setSelectedDeck(null); }} deck={selectedDeck} />

            {selectedFolder && (
                <ManageResources
                    isOpen={isManageResourcesOpen}
                    onClose={() => { setIsManageResourcesOpen(false); setSelectedFolder(null); }}
                    folder={selectedFolder}
                />
            )}

            {selectedDeck && (
                <ManageFlashcards
                    isOpen={isManageFlashcardsOpen}
                    onClose={() => { setIsManageFlashcardsOpen(false); setSelectedDeck(null); }}
                    deck={selectedDeck}
                />
            )}

            {selectedDeck && (
                <FlashcardDisplayPopup
                    isOpen={isDisplayPopupOpen}
                    onClose={() => { setIsDisplayPopupOpen(false); setSelectedDeck(null); }}
                    deck={selectedDeck}
                />
            )}
        </div>
    );
};
