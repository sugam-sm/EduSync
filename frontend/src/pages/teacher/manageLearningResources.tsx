import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Folders, Layers, FolderPlus, LayersPlus } from "lucide-react";

import { CardButton } from "../../components/Buttons/cardButton";
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { ResourceFolderCard } from "../../components/Cards/teacher/resourceFolderCard";
import { CreateFolderPopup } from "./create/createFolderPopup";
import { CreateFlashcardDeckPopup } from "./create/createFlashcardDeckPopup";
import { UpdateFolderPopup } from "./update/updateFolderPopup";
import { UpdateFlashcardDeckPopup } from "./update/updateFlashcardDeckPopup";
import { ManageResources } from "./manage/manageResources";
import { ManageFlashcards } from "./manage/manageFlashcards";
import { FlashcardDisplayPopup } from "../../components/flashcardDisplayPopup";
import { BackToTop } from "../../components/Custom/backToTop";

import { type AppDispatch, type RootState } from "../../store";
import { fetchGrades } from "../../features/organization/gradeSlice";
import { fetchResourceFolders, type ResourceFolder } from "../../features/learning/resourceSlice";
import { fetchFlashcardDecks, type FlashcardDeck } from "../../features/learning/flashcardSlice";
import { FlashcardDeckCard } from "../../components/Cards/teacher/flashcardDeckCard";

export const ManageLearningResources = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { grades } = useSelector((state: RootState) => state.grade);
    const { folders, isLoading: isResLoading } = useSelector((state: RootState) => state.resource);
    const { flashcard_decks, isLoading: isDeckLoading } = useSelector((state: RootState) => state.flashcard);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
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

    useEffect(() => { dispatch(fetchGrades()); }, [dispatch]);
    useEffect(() => {
        if (selectedGrade !== "All") {
            if (sectionMode === 'resources') {
                dispatch(fetchResourceFolders({ grade_id: selectedGrade }));
            } else {
                dispatch(fetchFlashcardDecks({ grade_id: selectedGrade }));
            }
        }
    }, [dispatch, selectedGrade, sectionMode]);

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

    const gradeOptions = grades.map(grade => ({
        label: `${grade.name} ${grade.section}`,
        value: grade.id!
    }));

    const isLoading = sectionMode === 'resources' ? isResLoading : isDeckLoading;

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-screen relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">
                    Manage {sectionMode === 'resources' ? 'Resources' : 'Flashcards'}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            {sectionMode === 'resources' ? < Folders size={30} strokeWidth={3} /> : <Layers size={30} strokeWidth={3} />}
                        </div>
                        <div className="flex gap-2 w-[80%] 2xl:w-[35%]">
                            <span className="text-text-muted font-semibold flex items-center">Grade:</span>
                            <CustomDropdown
                                className="w-full"
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                options={gradeOptions}
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

                <div
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[62.7vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto relative"
                    ref={scrollRef}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading...</p>
                        </div>
                    ) : selectedGrade === "All" ? (
                        <div className="text-center mt-20 text-text-muted">
                            <p className="text-md font-bold">Select a class to manage content.</p>
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

                    <div className="sticky bottom-0 left-0 w-full flex justify-end p-2 z-50">
                        <BackToTop scrollRef={scrollRef} />
                    </div>
                </div>
            </section>

            <CreateFolderPopup isOpen={isCreateFolderPopupOpen} onClose={() => setIsCreateFolderOpen(false)} gradeId={selectedGrade} />
            <CreateFlashcardDeckPopup isOpen={isCreateDeckPopupOpen} onClose={() => setIsCreateDeckOpen(false)} gradeId={selectedGrade} />
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