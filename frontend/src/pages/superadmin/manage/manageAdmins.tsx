import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../../store';
import { fetchUsers } from '../../../features/organization/userSlice';
import { fetchOrganizations } from '../../../features/organization/organizationSlice';
import { fetchRoles } from '../../../features/organization/roleSlice';
import { Search, Plus, Loader2, X, Filter, Users2 } from 'lucide-react';
import { UserCard } from '../../../components/Cards/userCard';
import { UserDetailCard } from '../../../components/Cards/detailUserCard';
import { BackToTop } from '../../../components/Custom/backToTop';
import { Button } from '../../../components/Buttons/customButton';
import { CardButton } from '../../../components/Buttons/cardButton';
import { fetchUser } from '../../../features/organization/userSlice';
import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { CreateAdminPopup } from '../create/createAdminPopup';

interface ManageAdminsProps {
    type?: 'student' | 'teacher' | 'admin';
    excludeAdmins?: boolean;
}

export const ManageAdmins = ({ type, excludeAdmins }: ManageAdminsProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const { users, isLoading, selectedUser, isDetailsLoading } = useSelector((state: RootState) => state.user);
    const { organizations } = useSelector((state: RootState) => state.organization);

    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string | number>('All');
    const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

    // Popup State
    const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
    const [isCrudPopupOpen, setIsCrudPopupOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchOrganizations());
        dispatch(fetchRoles());
    }, [dispatch]);

    const filteredUsers = useMemo(() => {
        return users.filter((user: any) => {
            const matchesSearch =
                user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = type
                ? (user.role_name === type)
                : (excludeAdmins ? (user.role_name !== 'admin') : true);

            // Always exclude superusers from these management views
            if (user.is_superuser || user.role_name === 'superadmin') return false;
            const matchesOrg = selectedOrgId === 'All' ? true : String(user.organization) === String(selectedOrgId);
            const matchesStatus = selectedStatus === 'All' ? true : (selectedStatus === 'Active' ? user.is_active !== false : user.is_active === false);

            return matchesSearch && matchesRole && matchesOrg && matchesStatus;
        });
    }, [users, searchTerm, type, excludeAdmins, selectedOrgId, selectedStatus]);

    const handleView = (user: any) => {
        dispatch(fetchUser(user.id));
        setIsViewPopupOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setIsCrudPopupOpen(true);
    };

    const handleEdit = async (user: any) => {
        const resultAction = await dispatch(fetchUser(user.id));
        if (fetchUser.fulfilled.match(resultAction)) {
            setEditingUser(resultAction.payload);
            setIsCrudPopupOpen(true);
        }
    };

    const isAnyFilterActive = useMemo(() => {
        return searchTerm !== "" || selectedOrgId !== 'All' || selectedStatus !== 'All';
    }, [searchTerm, selectedOrgId, selectedStatus]);

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            {/* Header */}
            <div className="flex flex-col mx-auto mb-5 items-center justify-center sm:justify-start w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full text-primary text-3xl font-bold text-center sm:text-left shadow-primary drop-shadow-sm">
                    {type === 'admin' ? 'Domain Admins' : (type || (excludeAdmins ? 'Global Clusters' : 'Identity Clusters'))}
                </h1>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto">
                {/* Filter Bar */}
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex items-center justify-between p-3 gap-1 h-auto relative z-20">
                    <div className="hidden sm:flex w-[15%] items-center gap-2 px-2 text-primary">
                        <Users2 size={30} strokeWidth={3} />
                    </div>
                    <div className="group flex items-center w-[80%] sm:w-[60%] text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400">
                        <input
                            type="text"
                            placeholder="Search identity registry pools..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-5 py-2 outline-none placeholder-text-muted/40 bg-transparent rounded-2xl"
                        />
                        <Search size={20} className="mr-3 text-light/30 group-focus-within:text-primary" />
                    </div>

                    <div className="relative w-[15%] h-auto">
                        <Button label="" Icon={Filter} onClick={() => setIsFilterOpen(!isFilterOpen)} variant="primary" className="w-full h-full min-h-[44px]">
                            <span className="hidden lg:block ml-2">Filter</span>
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
                                    <CustomDropdown
                                        label="Domain Binding"
                                        options={[
                                            { label: 'All Domains', value: 'All' },
                                            ...organizations.map(org => ({ label: org.name, value: org.id }))
                                        ]}
                                        value={selectedOrgId}
                                        onChange={(val: any) => setSelectedOrgId(val)}
                                        className="w-full"
                                    />

                                    <CustomDropdown
                                        label="Access Status"
                                        options={[
                                            { label: 'All Protocols', value: 'All' },
                                            { label: 'Active Sessions', value: 'Active' },
                                            { label: 'Locked Access', value: 'Inactive' },
                                        ]}
                                        value={selectedStatus}
                                        onChange={(val: any) => setSelectedStatus(val)}
                                        className="w-full"
                                    />
                                </div>

                                <Button label="Reset" onClick={() => { setSearchTerm(""); setSelectedOrgId("All"); setSelectedStatus("All"); setIsFilterOpen(false); }} variant="failure" className="w-full mt-4" />
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
                            <p className="font-bold">Syncing Identities...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full pb-20">
                            {(!isAnyFilterActive || filteredUsers.length > 0) && (
                                <CardButton
                                    Icon={Plus}
                                    onClick={handleCreate}
                                />
                            )}
                            {filteredUsers.map((user: any) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    onEdit={() => handleEdit(user)}
                                    onView={() => handleView(user)}
                                />
                            ))}
                            {filteredUsers.length === 0 && isAnyFilterActive && (
                                <div className="col-span-full w-full mt-20 text-center">
                                    <p className="text-xl text-failure/60 font-bold">No identities found.</p>
                                    <p className="text-sm text-text-muted">Adjust filters or search query.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <BackToTop scrollRef={scrollRef as any} />
            </section>

            {/* View Popup */}
            {isViewPopupOpen && (
                <>
                    {isDetailsLoading ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 bg-surface p-8 rounded-3xl border-2 border-primary/20 shadow-2xl">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="font-black text-primary uppercase tracking-[4px] text-[10px]">Retrieving Identity Profile...</p>
                            </div>
                        </div>
                    ) : selectedUser && (
                        <UserDetailCard user={selectedUser} onClose={() => setIsViewPopupOpen(false)} />
                    )}
                </>
            )}

            {/* User CRUD Popup */}
            <CreateAdminPopup
                isOpen={isCrudPopupOpen}
                onClose={() => setIsCrudPopupOpen(false)}
                editUser={editingUser}
                roleDefault={type}
            />

        </div>
    );
};
