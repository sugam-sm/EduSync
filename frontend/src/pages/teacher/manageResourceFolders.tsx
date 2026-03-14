import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, BookMarked, FolderPlus } from "lucide-react";

import { CardButton } from "../../components/Buttons/cardButton"; 
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { ResourceFolderCard } from "../../components/Cards/resourceFolderCard";
import { CreateFolderPopup } from "./create/createFolderPopup";
import { UpdateFolderPopup } from "./update/updateFolderPopup";
import { ManageResources } from "./manageResources";

import { type AppDispatch, type RootState } from "../../store";
import { fetchGrades } from "../../features/organization/gradeSlice";
import { fetchResourceFolders, type ResourceFolder } from "../../features/learning/resourceSlice";

export const ManageResourceFolders = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { grades } = useSelector((state: RootState) => state.grade);
    const { folders, isLoading } = useSelector((state: RootState) => state.resource);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [sectionMode, setSectionMode] = useState<'resources' | 'flashcards'>('resources');
    
    const [isCreateFolderPopupOpen, setIsCreateFolderOpen] = useState(false);
    const [isUpdateFolderPopupOpen, setIsUpdateFolderOpen] = useState(false);
    const [isManageResourcesOpen, setIsManageResourcesOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);

    useEffect(() => { dispatch(fetchGrades()); }, [dispatch]);
    useEffect(() => { if (selectedGrade !== "All") dispatch(fetchResourceFolders(selectedGrade)); }, [dispatch, selectedGrade]);

    const handleEditFolder = (folder: ResourceFolder) => {
        setSelectedFolder(folder);
        setIsUpdateFolderOpen(true);
    };

    const handleManageFolder = (folder: ResourceFolder) => {
        setSelectedFolder(folder);
        setIsManageResourcesOpen(true);
    };

    const gradeOptions = grades.map(grade => ({
        label: `${grade.name} ${grade.section}`,
        value: grade.id!
    }));
    
    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-screen relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full sm:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">Manage Resources</h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col lg:flex-row justify-between items-center p-3 gap-3">
                    <div className="flex justify-between w-full xl:w-[53%]">
                        <div className="flex w-[20%] items-center gap-2 px-2 text-primary">
                            <BookMarked size={25} />
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

                <div className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[60vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Loading...</p>
                        </div>
                    ) : selectedGrade === "All" ? (
                        <div className="text-center mt-20 text-text-muted">
                            <p className="text-xl font-bold">Select a class to manage content.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                            <CardButton
                                onClick={() => setIsCreateFolderOpen(true)}
                                Icon={FolderPlus}
                            />
                            {folders.map((folder) => (
                                <ResourceFolderCard 
                                    key={folder.id} 
                                    folder={folder} 
                                    onEdit={handleEditFolder} 
                                    onModify={handleManageFolder} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <CreateFolderPopup 
                isOpen={isCreateFolderPopupOpen} 
                onClose={() => setIsCreateFolderOpen(false)} 
                gradeId={selectedGrade}
            />

            <UpdateFolderPopup 
                isOpen={isUpdateFolderPopupOpen}
                onClose={() => {
                    setIsUpdateFolderOpen(false);
                    setSelectedFolder(null);
                }}
                folder={selectedFolder}
            />

            {selectedFolder && (
                <ManageResources 
                    isOpen={isManageResourcesOpen}
                    onClose={() => {
                        setIsManageResourcesOpen(false);
                        setSelectedFolder(null);
                    }} 
                    folder={selectedFolder} 
                />
            )}
        </div>
    );
};