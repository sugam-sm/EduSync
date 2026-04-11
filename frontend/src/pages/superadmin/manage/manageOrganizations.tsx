import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../../store';
import { fetchOrganizations, deleteOrganization } from '../../../features/organization/organizationSlice';
import { Search, Building2, Plus, Loader2, X, Filter } from 'lucide-react';
import { CustomDropdown } from '../../../components/Custom/customDropdown';
import { addToast } from '../../../features/toasts/toastSlice';
import { OrganizationCard } from '../../../components/Cards/superadmin/organizationCard';
import { BackToTop } from '../../../components/Custom/backToTop';
import { DecisionPopup } from '../../../components/decision popup';
import { Button } from '../../../components/Buttons/customButton';
import { CardButton } from '../../../components/Buttons/cardButton';
import { CreateOrganizationPopup } from '../create/createOrganizationPopup';

export const ManageOrganizations = () => {
    const dispatch = useDispatch<AppDispatch>();
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    
    const { organizations, isLoading } = useSelector((state: RootState) => state.organization);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

    // Popup State
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchOrganizations());
    }, [dispatch]);

    const handleCreate = () => {
        setEditingOrg(null);
        setIsPopupOpen(true);
    };

    const handleEdit = (org: any) => {
        setEditingOrg(org);
        setIsPopupOpen(true);
    };

    const handleDelete = (org: any) => {
        openDecidePopup({
            question: `Permanently delete ${org.name}?`,
            confirmText: "Yes, Delete",
            cancelText: "Cancel",
            variant: 'primary',
            onConfirm: async () => {
                try {
                    await dispatch(deleteOrganization(org.id)).unwrap();
                    dispatch(addToast({message: "Organization deleted successfully", type: "success"}));
                } catch (error) {
                    dispatch(addToast({message: "Failed to delete organization", type: "failure"}));
                }
            }
        });
    };

    const filteredOrgs = useMemo(() => {
        return organizations.filter(org => {
            const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 org.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true : (statusFilter === 'Active' ? org.is_active !== false : org.is_active === false);
            return matchesSearch && matchesStatus;
        });
    }, [organizations, searchTerm, statusFilter]);

    const isAnyFilterActive = useMemo(() => {
        return searchTerm !== "" || statusFilter !== 'All';
    }, [searchTerm, statusFilter]);

    return (
        <div className='flex flex-col items-center justify-center align-middle h-full w-full relative'>
            <div className="flex flex-col mx-auto mb-5 items-center justify-center sm:justify-start w-[90%] sm:w-[80%] md:w-[73%]">
                <h1 className="w-full text-primary text-3xl font-bold text-center sm:text-left shadow-primary drop-shadow-sm">Manage Organizations</h1>
            </div>
            
            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto relative">
                <div className="bg-surface border-2 border-light/3 rounded-2xl mb-2 flex items-center justify-between p-3 gap-1 h-auto">
                    <div className="hidden sm:flex w-[15%] items-center gap-2 px-2 text-primary">
                        <Building2 size={30} strokeWidth={3}/>
                    </div>
                    <div className="group flex items-center w-[80%] sm:w-[60%] text-text-heading border-2 border-light/20 rounded-2xl focus-within:border-primary font-semibold text-md transition-all duration-400">
                        <input 
                            type="text" 
                            placeholder="Search Organizations..." 
                            className="w-full pl-5 py-2 outline-none placeholder-text-muted/40 bg-transparent rounded-2xl" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                        <X size={25} strokeWidth={3} className="text-failure hover:rotate-90 transition-all duration-300 hover:bg-failure/20 rounded-full p-1 hover:cursor-pointer"/>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <CustomDropdown 
                                        label="Operational Status"
                                        options={[
                                            { label: 'All Domains', value: 'All' },
                                            { label: 'Verified Status', value: 'Active' },
                                            { label: 'Suspended Cluster', value: 'Inactive' },
                                        ]}
                                        value={statusFilter}
                                        onChange={(val: any) => setStatusFilter(val)}
                                        className="w-full"
                                    />
                                </div>
                                <Button label="Reset" onClick={() => { setSearchTerm(""); setStatusFilter("All"); setIsFilterOpen(false); }} variant="failure" className="w-full mt-4" />
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
                            <p className="font-bold">Syncing Organizations...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 w-full pb-20">
                            {(!isAnyFilterActive || filteredOrgs.length > 0) && (
                                <CardButton 
                                    Icon={Plus} 
                                    onClick={handleCreate} 
                                />
                            )}
                            {filteredOrgs.map((org) => (
                                <OrganizationCard 
                                    key={org.id} 
                                    organization={org} 
                                    onEdit={() => handleEdit(org)} 
                                    onDelete={() => handleDelete(org)} 
                                />
                            ))}
                            {filteredOrgs.length === 0 && isAnyFilterActive && (
                                <div className="col-span-full w-full mt-20 text-center">
                                    <p className="text-xl text-failure/60 font-bold">No organizations found.</p>
                                    <p className="text-sm text-text-muted">Adjust filters or search query.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <BackToTop scrollRef={scrollRef as any} />
            </section>

            {/* Organization CRUD Popup */}
            <CreateOrganizationPopup 
                isOpen={isPopupOpen} 
                onClose={() => setIsPopupOpen(false)} 
                editOrg={editingOrg} 
            />

            <DecidePopup />
        </div>
    );
};
