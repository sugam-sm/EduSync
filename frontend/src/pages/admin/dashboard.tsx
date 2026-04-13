import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {Users, BookOpen, School, Building, ChevronRight, Shield} from "lucide-react";
import { type RootState } from "../../store";

export const AdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.login);

    const quickLinks = [
        { 
            title: "Organization Info", 
            description: "View and update your organization profile.", 
            icon: Building, 
            path: "/organization",
            color: "text-info",
            bg: "bg-info/10"
        },
        { 
            title: "Manage Users", 
            description: "Onboard and manage teachers, and students.", 
            icon: Users, 
            path: "/users",
            color: "text-success",
            bg: "bg-success/10"
        },
        { 
            title: "Grade Sections", 
            description: "Set up and manage classes and academic years.", 
            icon: School, 
            path: "/grades",
            color: "text-warning",
            bg: "bg-warning/10"
        },
        { 
            title: "Curriculum Subjects", 
            description: "Configure subjects and assign teachers to classes.", 
            icon: BookOpen, 
            path: "/subjects",
            color: "text-primary",
            bg: "bg-primary/10"
        }
    ];

    return (
        <div className='flex flex-col items-center justify-start min-h-full w-full py-10 overflow-y-auto'>
            {/* Header Section */}


            <section className="w-[90%] sm:w-[80%] md:w-[75%] mx-auto space-y-6">
                
                {/* Welcome Banner */}
                <div className="bg-primary/40 border-2 border-primary/80 rounded-3xl p-8 relative">
                    <div className="absolute top-0 right-0 p-6 text-primary pointer-events-none">
                        <Shield size={150} />
                    </div>
                    <div className="relative z-10 w-full sm:w-2/3">
                        <p className="text-primary font-bold tracking-widest uppercase text-sm mb-2">Welcome Back</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-heading leading-tight mb-4 tracking-tight">
                            {user?.full_name || 'Administrator'}
                        </h2>
                        <p className="text-light font-bold text-sm leading-relaxed">
                            Oversee your organization's infrastructure. Seamlessly manage user access, define academic grades, and allocate curriculum subjects from your administrative command center.
                        </p>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-2xl font-bold text-text-heading mb-4 flex items-center gap-2 mt-4">
                        <div className="w-2 h-8 bg-primary rounded-full"></div>
                        Administrative Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickLinks.map((link, idx) => (
                            <Link 
                                key={idx} 
                                to={link.path}
                                className="bg-surface border-2 border-light/10 hover:border-primary/40 rounded-3xl p-5 flex items-center gap-5 transition-all duration-300 group hover:bg-light/10"
                            >
                                <div className={`p-4 rounded-2xl ${link.bg} ${link.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <link.icon size={26} strokeWidth={3} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-text-heading group-hover:text-primary transition-colors">{link.title}</h4>
                                    <p className="text-sm font-semibold text-text-body mt-0.5">{link.description}</p>
                                </div>
                                <div className="p-2 text-text-body group-hover:text-primary -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100">
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
