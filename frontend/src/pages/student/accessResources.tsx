import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Layers, Folders } from "lucide-react";

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
        if (selectedSubject !== "All") {
            dispatch(fetchResourceFolders({ subject_id: selectedSubject || undefined }));
            dispatch(fetchFlashcardDecks({ subject_id: selectedSubject || undefined }));
        }
    }, [dispatch, selectedSubject]);

    const subjectOptions = subjects.map((subject) => ({
        label: subject.name,
        value: subject.id!
    }));

    const isLoading = sectionMode === 'resources' ? isResLoading : isDeckLoading;

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    Access {sectionMode === 'resources' ? 'Resources' : 'Flashcards'}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
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

                <div className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center mt-20">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading content...</p>
                        </div>
                    ) : selectedSubject === "All" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                            <div>
                                {sectionMode === 'resources' ?
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Subject</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a subject from the dropdown above to access resources for that subject.
                                        </p>
                                    </>
                                    :
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">Select a Subject</h3>
                                        <p className="text-text-muted font-semibold text-sm max-w-sm mx-auto">
                                            Choose a subject from the dropdown above to access flashcards for that subject.
                                        </p>
                                    </>
                                }
                            </div>
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