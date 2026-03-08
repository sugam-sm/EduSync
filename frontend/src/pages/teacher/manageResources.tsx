import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, Search, Loader2, BookMarked } from "lucide-react";
import { Button } from '../../components/Buttons/customButton';
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { type AppDispatch, type RootState } from "../../store";
import { fetchGrades } from "../../features/management/gradeSlice";
// Import your resource-specific components here
// import { ResourceCard } from "../../components/Cards/resourceCard";
// import { CreateResourcePopup } from "./create/createResourcePopup";

export const ManageResources = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { grades } = useSelector((state: RootState) => state.grade);
    const [isLoading] = useState(false); // Replace with your actual resource loading state

    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedSection, setSelectedSection] = useState<string | number>("All");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        dispatch(fetchGrades());
    }, [dispatch]);

    const gradeOptions = [
        { label: "Select Grade", value: "All" },
        ...grades.map(g => ({ label: g.name, value: g.id }))
    ];

    const sectionOptions = useMemo(() => {
        // Filter sections based on selectedGrade if necessary
        return [{ label: "Select Section", value: "All" }]; 
    }, [selectedGrade]);

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-screen relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="text-primary text-3xl font-bold">Manage Resources</h1>
                <Button 
                    label="Add New Resource" 
                    Icon={BookOpen} 
                    onClick={() => setIsCreatePopupOpen(true)} 
                    variant="primary" 
                />
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-wrap items-center p-3 gap-3">
                    <div className="flex items-center gap-2 px-2 text-primary">
                        <BookMarked size={25} />
                    </div>
                    
                    <div className="flex-1 flex gap-2">
                        <CustomDropdown label="Grade" value={selectedGrade} onChange={setSelectedGrade} options={gradeOptions} />
                        <CustomDropdown label="Section" value={selectedSection} onChange={setSelectedSection} options={sectionOptions} />
                    </div>

                    <div className="group flex items-center w-full md:w-[30%] text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary">
                        <input 
                            type="text" 
                            placeholder="Search resources..." 
                            className="w-full pl-5 py-2 outline-none bg-transparent" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={20} className="mr-3 text-light/30" />
                    </div>
                </div>

                <div className="sm:p-5 p-2 border-2 border-light/3 bg-surface h-[60vh] overflow-auto rounded-2xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p>Loading Resources...</p>
                        </div>
                    ) : (
                        <div className="text-center mt-20">
                            <p className="text-text-muted">Select a class and section to view resources.</p>
                        </div>
                    )}
                </div>
            </section>
            
            {/* Include Popups here */}
            {/* <CreateResourcePopup isOpen={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} /> */}
        </div>
    );
};