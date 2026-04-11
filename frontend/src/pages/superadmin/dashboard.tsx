import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { 
    Users, 
    Building2,
    LayoutDashboard, 
    ChevronRight,
    Server
} from "lucide-react";
import { type RootState } from "../../store";

export const SuperAdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.login);

    const quickLinks = [
        { 
            title: "Organizations", 
            description: "Onboard and manage platform tenant organizations.", 
            icon: Building2, 
            path: "/superadmin/manage/organizations",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        { 
            title: "System Users", 
            description: "Manage global user access, operations, and credentials.", 
            icon: Users, 
            path: "/superadmin/manage/admins",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        }
    ];

    return (
        <div className='flex flex-col items-center justify-start min-h-full w-full py-10 overflow-y-auto'>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 mx-auto mb-8 items-center justify-center sm:justify-between w-[90%] sm:w-[80%] md:w-[73%]">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <LayoutDashboard size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-primary text-3xl font-bold">SuperAdmin Dashboard</h1>
                </div>
            </div>

            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto space-y-6">
                
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/15 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Server size={150} />
                    </div>
                    <div className="relative z-10 w-full sm:w-2/3">
                        <p className="text-primary font-bold tracking-widest uppercase text-xs mb-2">Welcome Back</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-text-heading leading-tight mb-4 tracking-tight">
                            {user?.full_name || 'System Operator'}
                        </h2>
                        <p className="text-text-muted font-bold text-sm leading-relaxed mb-6">
                            Oversee the global EduSync infrastructure. Manage cross-organization operations, system health, and secure platform access from your command center.
                        </p>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-xl font-bold text-text-heading mb-4 flex items-center gap-2 mt-4">
                        <div className="w-2 h-6 bg-primary rounded-full"></div>
                        Global Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickLinks.map((link, idx) => (
                            <Link 
                                key={idx} 
                                to={link.path}
                                className="bg-surface border-2 border-light/5 hover:border-primary/40 rounded-3xl p-5 flex items-center gap-5 transition-all duration-300 group hover:bg-light/5 shadow-sm hover:shadow-md"
                            >
                                <div className={`p-4 rounded-2xl ${link.bg} ${link.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <link.icon size={26} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-text-heading group-hover:text-primary transition-colors">{link.title}</h4>
                                    <p className="text-xs font-semibold text-text-muted mt-0.5">{link.description}</p>
                                </div>
                                <div className="p-2 text-text-muted group-hover:text-primary -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100">
                                    <ChevronRight size={20} strokeWidth={3} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </section>
        </div>
    );
};
