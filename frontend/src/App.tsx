import { useEffect } from 'react';
import { BrowserRouter, Routes, Outlet, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { UserLock, SearchX } from 'lucide-react';

import { Login } from './pages/login';
import { Layout } from './layout/layout';
import { Settings } from './pages/settings';

import { AdminDashboard } from './pages/admin/dashboard';
import { ManageUsers } from './pages/admin/manageUsers';
import { ManageOrganization } from './pages/admin/manageOrganization';
import { ManageSubjects } from './pages/admin/manageSubjects';
import { ManageGrades } from './pages/admin/manageGrades';

import { SuperAdminDashboard } from './pages/superadmin/dashboard';
import { ManageOrganizations as SAManageOrganizations } from './pages/superadmin/manage/manageOrganizations';
import { UpdateOrganizationPopup as SAUpdateOrganizationPopup } from './pages/superadmin/update/updateOrganizationPopup';
import { ManageAdmins as SAManageAdmins } from './pages/superadmin/manage/manageAdmins';

import { StudentDashboard } from './pages/student/dashbaord';
import { AccessResources } from './pages/student/accessResources';
import { AccessAssessments } from './pages/student/accessAssessments';
import { AccessSessions } from './pages/student/accessSessions';
import { AccessAnalytics } from './pages/student/accessAnalytics';

import { TeacherDashboard } from './pages/teacher/dashboard';
import { ManageLearningResources } from './pages/teacher/manageLearningResources';
import { ManageAssessments } from './pages/teacher/manageAssessments';
import { ManageSessions } from './pages/teacher/manageSessions';
import { ManageAnalytics } from './pages/teacher/manageAnalytics';

import { removeToast, addToast } from './features/toasts/toastSlice';
import { verifyUserToken, setVerifying } from './features/login/loginSlice';
import { Toast } from './components/toast';
import { type AppDispatch, type RootState } from './store';

const Dashboard = () => {
    const { user } = useSelector((state: RootState) => state.login);
    const role = user?.role;

    switch (role) {
        case 'admin':
            return <AdminDashboard />;
        case 'teacher':
            return <TeacherDashboard />;
        case 'student':
            return <StudentDashboard />;
        case 'superadmin':
            return <SuperAdminDashboard />;
        default:
            return null;
    }
};

const Resources = () => {
    const { user } = useSelector((state: RootState) => state.login);
    switch (user?.role) {
        case 'teacher':
            return <ManageLearningResources />;
        case 'student':
            return <AccessResources />;
        default:
            return null;
    }
}

const Assessments = () => {
    const { user } = useSelector((state: RootState) => state.login);
    switch (user?.role) {
        case 'teacher':
            return <ManageAssessments />;
        case 'student':
            return <AccessAssessments />;
        default:
            return null;
    }
};

const Sessions = () => {
    const { user } = useSelector((state: RootState) => state.login);
    switch (user?.role) {
        case 'teacher':
            return <ManageSessions />;
        case 'student':
            return <AccessSessions />;
        default:
            return null;
    }
};

const Analytics = () => {
    const { user } = useSelector((state: RootState) => state.login);
    const role = user?.role;

    switch (role) {
        case 'admin':
        case 'teacher':
            return <ManageAnalytics />;
        case 'student':
            return <AccessAnalytics />;
        default:
            return null;
    }
};

interface ProtectedRouteProps {
    allowedRoles?: string[];
    isPublic?: boolean;
}

export const ProtectedRoute = ({ allowedRoles, isPublic }: ProtectedRouteProps) => {
    const { user } = useSelector((state: RootState) => state.login);
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();

    const path = location.pathname;
    const isErrorPage = path === '/unauthorized' || path.startsWith('/superadmin/unauthorized');

    useEffect(() => {
        if (user && user.needs_password_change && path !== '/settings' && !isErrorPage) {
            dispatch(addToast({ message: "For your security, you must change your temporary password before accessing other features.", type: 'failure' }));
        }
    }, [user, path, isErrorPage, dispatch]);

    if (isPublic && user) {
        return <Navigate to="/" replace />;
    }

    if (!isPublic && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user && !isErrorPage) {
        const role = user.role;
        if (allowedRoles && !allowedRoles.includes(role)) {
            return <Navigate to="/unauthorized" replace />;
        }

        if (user.needs_password_change && path !== '/settings') {
            return <Navigate to="/settings" replace />;
        }
    }

    return <Outlet />;
};

function App() {
    const toasts = useSelector((state: RootState) => state.toast);
    const { isAuthenticated, isVerifying } = useSelector((state: RootState) => state.login);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(verifyUserToken());
        } else {
            dispatch(setVerifying(false));
        }
    }, [dispatch, isAuthenticated]);

    if (isVerifying) {
        return (
            <div className="h-screen w-full bg-surface flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted font-bold tracking-widest animate-pulse uppercase text-sm">
                        Verifying Session
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed top-20 right-6 z-1000 flex flex-col items-end gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast toast={t} onClose={() => dispatch(removeToast(t.id))} />
                    </div>
                ))}
            </div>

            <BrowserRouter>
                <Routes>
                    <Route element={<ProtectedRoute isPublic={true} />}>
                        <Route path="/login" element={<Login />} />
                    </Route>

                    <Route element={<ProtectedRoute isPublic={false} />}>
                        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher', 'student']} />}>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
                                    <Route path="settings" element={<Settings />} />
                                </Route>

                                <Route element={<ProtectedRoute allowedRoles={['teacher', 'student']} />}>
                                    <Route path="resources" element={<Resources />} />
                                    <Route path="assessments" element={<Assessments />} />
                                    <Route path="sessions" element={<Sessions />} />
                                    <Route path="analytics" element={<Analytics />} />
                                </Route>

                                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                    <Route path="organization" element={<ManageOrganization />} />
                                    <Route path="users" element={<ManageUsers />} />
                                    <Route path="grades" element={<ManageGrades />} />
                                    <Route path="subjects" element={<ManageSubjects />} />
                                </Route>

                                <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                                    <Route path="superadmin/manage/organizations" element={<SAManageOrganizations />} />
                                    <Route path="superadmin/update/organizations/:id" element={<SAUpdateOrganizationPopup />} />
                                    <Route path="superadmin/manage/admins" element={<SAManageAdmins type="admin" />} />
                                </Route>

                                <Route path="/unauthorized" element={
                                    <div className="flex flex-col items-center justify-center h-full text-failure text-3xl gap-4">
                                        <UserLock size="45" strokeWidth={2.5} /> Access Denied
                                    </div>
                                } />

                                <Route path="*" element={
                                    <div className="flex flex-col items-center justify-center h-full text-failure text-3xl gap-4">
                                        <SearchX size="45" strokeWidth={2.5} /> Page Not Found
                                    </div>
                                } />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;