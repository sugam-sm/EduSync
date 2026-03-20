import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileUp, Filter, Search, Loader2, X, School, UserCircle, Activity, UserRoundPlus, UsersRound } from "lucide-react";

import { Button } from '../../components/Buttons/customButton';
import { CardButton } from "../../components/Buttons/cardButton";
import { CustomDropdown } from '../../components/Custom/customDropdown';
import { type AppDispatch, type RootState } from "../../store";
import { fetchUsers, fetchUser } from "../../features/organization/userSlice";
import { fetchGrades } from "../../features/organization/gradeSlice";
import { UserCard } from "../../components/Cards/userCard";
import { UserDetailCard } from "../../components/Cards/detailUserCard";
import { CreateUserPopup } from "./create/createUserPopup";
import { UpdateUserPopup } from "./update/updateUserPopup";
import { BackToTop } from "../../components/Custom/backToTop";
import { addToast } from "../../features/toasts/toastSlice";

export const ManageUsers = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { users, selectedUser, isLoading } = useSelector((state: RootState) => state.user);
    const { grades } = useSelector((state: RootState) => state.grade);

    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string | number>("All");
    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedStatus, setSelectedStatus] = useState<string | number>("All");

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchGrades());
    }, [dispatch]);

    const handleEdit = async (userId: number) => {
        await dispatch(fetchUser(userId));
        setIsUpdatePopupOpen(true);
    };

    const handleView = async (userId: number) => {
        await dispatch(fetchUser(userId));
        setIsViewPopupOpen(true);
    };

    const roleOptions = [
        { label: "All Roles", value: "All" },
        { label: "Teacher", value: "Teacher" },
        { label: "Student", value: "Student" },
    ];

    const gradeOptions = [
        { label: "All Grades", value: "All" },
        ...grades.map(g => ({ label: `${g.name} "${g.section}"`, value: g.id }))
    ];

    const statusOptions = [
        { label: "All Status", value: "All" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
    ];

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                user.username?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = selectedRole === "All" || user.role_name === selectedRole;
            
            const matchesGrade = selectedGrade === "All" || 
                                 String(user.grade_id || "") === String(selectedGrade);
            
            const matchesStatus = selectedStatus === "All" || 
                                 String(user.is_active) === String(selectedStatus);
            
            return matchesSearch && matchesRole && matchesGrade && matchesStatus;
        });
    }, [users, searchQuery, selectedRole, selectedGrade, selectedStatus]);

    const isAnyFilterActive = useMemo(() => {
        return searchQuery !== "" || selectedRole !== "All" || selectedGrade !== "All" || selectedStatus !== "All";
    }, [searchQuery, selectedRole, selectedGrade, selectedStatus]);

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-screen relative'>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-5 items-center justify-center sm:justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full md:w-[60%] text-primary text-3xl font-bold text-center sm:text-left">Manage Users</h1>
                <Button 
                    label="Upload CSV" 
                    Icon={FileUp} 
                    onClick={() => dispatch(addToast({ message: "CSV Upload feature coming soon!", type: 'info' }))} 
                    variant="primary" 
                    className="w-full sm:w-[50%] md:w-[40%] lg:w-[25%]"
                />
            </div>
            
            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex items-center justify-between p-3 gap-1 h-auto">
                    <div className="hidden sm:flex w-[15%] items-center gap-2 px-2 text-primary">
                        <UsersRound size={30} strokeWidth={3}/>
                    </div>
                    <div className="group flex items-center w-[80%] sm:w-[60%] text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400">
                        <input 
                            type="text" 
                            placeholder="Search for User" 
                            className="w-full pl-5 py-2 outline-none placeholder-text-muted/40" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={20} className="mr-3 text-light/30 group-focus-within:text-primary" />
                    </div>
                    <div className="relative w-[15%] h-auto">
                        <Button label="" Icon={Filter} onClick={() => setIsFilterOpen(!isFilterOpen)} variant="primary" className="w-full h-full">
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
                                <div className="space-y-4">
                                    <CustomDropdown label="Role" icon={UserCircle} value={selectedRole} onChange={setSelectedRole} options={roleOptions} className='w-full' />
                                    <CustomDropdown label="Grade" icon={School} value={selectedGrade} onChange={setSelectedGrade} options={gradeOptions} className='w-full' />
                                    <CustomDropdown label="Status" icon={Activity} value={selectedStatus} onChange={setSelectedStatus} options={statusOptions} className='w-full' />
                                </div>
                                <Button label="Reset" onClick={() => { setSelectedRole("All"); setSelectedGrade("All"); setSelectedStatus("All"); }} variant="failure" className="w-full mt-4" />
                            </div>
                        )}
                    </div>
                </div>
                
                <div 
                    ref={scrollRef}
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface max-w-full h-[65vh] lg:h-[70vh] overflow-auto rounded-2xl mx-auto text-white scroll-smooth"
                >
                     {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Syncing Users...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full pb-20">
                            <CardButton
                                onClick={() => setIsCreatePopupOpen(true)}
                                Icon={UserRoundPlus}
                            />
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <UserCard 
                                        key={user.id} 
                                        user={user} 
                                        onEdit={() => handleEdit(user.id!)} 
                                        onView={() => handleView(user.id!)} 
                                    />
                                ))
                            ) : (
                                isAnyFilterActive && (
                                    <div className="col-span-full w-full mt-20 text-center">
                                        <p className="text-xl text-failure/60 font-bold">No users found.</p>
                                        <p className="text-sm text-text-muted">Adjust filters or search query.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                <BackToTop scrollRef={scrollRef} />
            </section>
            
            {isViewPopupOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsViewPopupOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
                        <UserDetailCard user={selectedUser} onClose={() => setIsViewPopupOpen(false)} />
                    </div>
                </div>
            )}
            <CreateUserPopup isOpen={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} />
            <UpdateUserPopup isOpen={isUpdatePopupOpen} onClose={() => setIsUpdatePopupOpen(false)} user={selectedUser} />
        </div>
    );
};