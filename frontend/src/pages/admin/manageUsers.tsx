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
import { CsvUploadPopup } from "../../components/csvUploadPopup";
import { BackToTop } from "../../components/Custom/backToTop";
import { bulkUploadUsers } from "../../features/organization/userSlice";

export const ManageUsers = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { users, selectedUser, isLoading } = useSelector((state: RootState) => state.user);
    const { grades } = useSelector((state: RootState) => state.grade);

    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCsvPopupOpen, setIsCsvPopupOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string | number>("All");
    const [selectedGrade, setSelectedGrade] = useState<string | number>("All");
    const [selectedStatus, setSelectedStatus] = useState<string | number>("All");
    
    const [selectedRoleForCsv, setSelectedRoleForCsv] = useState<string>("student");

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
        { label: "Teacher", value: "teacher" },
        { label: "Student", value: "student" },
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
                String(user.student_profile?.grade_name || "") === String(selectedGrade);

            const matchesStatus = selectedStatus === "All" ||
                (selectedStatus === "Active" ? user.is_active : !user.is_active);

            return matchesSearch && matchesRole && matchesGrade && matchesStatus;
        });
    }, [users, searchQuery, selectedRole, selectedGrade, selectedStatus]);

    const isAnyFilterActive = useMemo(() => {
        return searchQuery !== "" || selectedRole !== "All" || selectedGrade !== "All" || selectedStatus !== "All";
    }, [searchQuery, selectedRole, selectedGrade, selectedStatus]);

    return (
        <div className='flex flex-col items-center justify-start h-full w-full relative overflow-hidden p-4'>

            <section className="w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] mx-auto flex-1 flex flex-col overflow-hidden">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex flex-col md:flex-row items-center p-3 gap-3">
                    <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="text-primary shrink-0">
                            <UsersRound size={30} strokeWidth={3} />
                        </div>
                        <div className="group flex items-center flex-1 h-11.25 text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400 bg-light/5">
                            <input
                                type="text"
                                placeholder="Search for User"
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
                                <div className="absolute top-full right-0 mt-2 w-72 bg-surface border-2 border-light/10 p-6 rounded-2xl shadow-xl z-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-primary">Filters</h3>
                                        <button onClick={() => setIsFilterOpen(false)}>
                                            <X size={25} strokeWidth={3} className="text-failure hover:rotate-90 transition-all duration-300 hover:bg-failure/20 rounded-full p-1 hover:cursor-pointer" />
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
                    className="sm:p-5 p-2 border-2 border-light/3 bg-surface max-w-full flex-1 h-0 overflow-y-auto rounded-2xl mx-auto scroll-smooth custom-scrollbar w-full"
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center h-full gap-3 text-text-muted justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold">Syncing Users...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full pb-20">
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
                <UserDetailCard user={selectedUser} onClose={() => setIsViewPopupOpen(false)} />
            )}
            <CreateUserPopup isOpen={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} />
            <UpdateUserPopup isOpen={isUpdatePopupOpen} onClose={() => setIsUpdatePopupOpen(false)} user={selectedUser} />
            <CsvUploadPopup 
                isOpen={isCsvPopupOpen} 
                onClose={() => {
                    setIsCsvPopupOpen(false);
                    dispatch(fetchUsers());
                }}
                onUpload={(file) => dispatch(bulkUploadUsers({file, role: selectedRoleForCsv})).unwrap()}
                title="Import Users"
                description={`Upload CSV to bulk create ${selectedRoleForCsv === 'teacher' ? 'Teachers' : 'Students'}.`}
                dropdownConfig={{
                    label: "Select Role",
                    options: [
                        { label: "Student", value: "student" },
                        { label: "Teacher", value: "teacher" }
                    ],
                    value: selectedRoleForCsv,
                    onChange: setSelectedRoleForCsv
                }}
                samples={[
                    selectedRoleForCsv === 'teacher' 
                    ? { 
                        label: "Teachers", 
                        headers: ["first_name", "middle_name", "last_name", "email", "gender", "contact_number", "specialization", "qualification"] 
                    }
                    : { 
                        label: "Students", 
                        headers: ["first_name", "middle_name", "last_name", "email", "gender", "grade_name", "section", "guardian_name", "guardian_relation", "guardian_contact"] 
                    }
                ]}
            />
        </div>
    );
};
