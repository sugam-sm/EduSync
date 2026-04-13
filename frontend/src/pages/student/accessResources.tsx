import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Layers, Folders } from "lucide-react";
import { BackToTop } from "../../components/Custom/backToTop";

import { type AppDispatch, type RootState } from "../../store";
import { fetchResourceFolders, type ResourceFolder } from "../../features/learning/resourceSlice";
import { fetchFlashcardDecks, type FlashcardDeck } from "../../features/learning/flashcardSlice";
import { fetchSubjects } from "../../features/organization/subjectSlice";
import { FlashcardDisplayPopup } from "../../components/flashcardDisplayPopup";
import { CustomDropdown } from "../../components/Custom/customDropdown";
import { StudentFolderCard } from "../../components/Cards/student/studentFolderCard";
import { StudentDeckCard } from "../../components/Cards/student/studentDeckCard";
import { ViewResourcesPopup } from "./view/viewResourcesPopup";

export const AccessResources = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dispatch(fetchSubjects());
    }, [dispatch]);

    const { subjects } = useSelector((state: RootState) => state.subject);
    const { folders, isLoading: isResLoading } = useSelector((state: RootState) => state.resource);
    const { flashcard_decks, isLoading: isDeckLoading } = useSelector((state: RootState) => state.flashcard);

    const [sectionMode, setSectionMode] = useState<'resources' | 'flashcards'>('resources');
    const [selectedSubject, setSelectedSubject] = useState<string | number>("All");
    const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);
    const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);

    useEffect(() => {
        if (subjects.length > 0 && selectedSubject === "All") {
            setSelectedSubject(subjects[0].id!);
        }
    }, [subjects]);

    useEffect(() => {
        if (selectedSubject !== "All") {
            dispatch(fetchResourceFolders({ subject: selectedSubject }));
            dispatch(fetchFlashcardDecks({ subject: selectedSubject }));
        }
    }, [dispatch, selectedSubject]);

    const subjectOptions = subjects.map((subject) => ({
        label: subject.name,
        value: subject.id!
    }));

    const isLoading = sectionMode === 'resources' ? isResLoading : isDeckLoading;

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>


            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            {sectionMode === 'resources' ? <Folders size={30} strokeWidth={3} /> : <Layers size={30} strokeWidth={3} />}
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
                    <div className="flex w-full 2xl:w-[30%] gap-1 p-1 bg-light/5 rounded-xl border-2 border-light/15">
                        <button
                            type="button"
                            onClick={() => setSectionMode('resources')}
                            className={`w-[50%] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'resources' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
                        >
                            Resources
                        </button>
                        <button
                            type="button"
                            onClick={() => setSectionMode('flashcards')}
                            className={`w-[50%] py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sectionMode === 'flashcards' ? 'bg-primary/35 text-primary' : 'text-text-muted hover:bg-primary/10'}`}
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
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center mt-20">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading content...</p>
                        </div>
                    ) : sectionMode === 'resources' ? (
                        folders.length === 0 ? (
                            <p className="text-center font-bold text-text-muted mt-20 text-lg">No resource folders available.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-15">
                                {folders.map((folder: ResourceFolder) => (
                                    <StudentFolderCard
                                        key={folder.id}
                                        folder={folder}
                                        onView={(f) => setSelectedFolder(f)}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        flashcard_decks.length === 0 ? (
                            <p className="text-center font-bold text-text-muted mt-20 text-lg">No flashcard decks available.</p>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-15">
                                {flashcard_decks.map(deck => (
                                    <StudentDeckCard
                                        key={deck.id}
                                        deck={deck}
                                        onView={(d: FlashcardDeck) => setSelectedDeck(d)}
                                    />
                                ))}
                            </div>
                        )
                    )}
                    </div>
                    <BackToTop scrollRef={scrollRef} />
                </div>
            </section>

            {/* Modals for playing/viewing content */}
            {selectedFolder && (
                <ViewResourcesPopup
                    isOpen={!!selectedFolder}
                    onClose={() => setSelectedFolder(null)}
                    folder={selectedFolder}
                />
            )}

            {selectedDeck && (
                <FlashcardDisplayPopup
                    isOpen={!!selectedDeck}
                    onClose={() => setSelectedDeck(null)}
                    deck={selectedDeck}
                />
            )}
        </div>
    );
};
