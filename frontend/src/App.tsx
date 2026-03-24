import { useEffect } from 'react';
import { BrowserRouter, Routes, Outlet, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { UserLock,  SearchX } from 'lucide-react';

// pages for every user
import { Login } from './pages/login';
import { Layout } from './layout/layout';
import { Settings } from './pages/settings';

// pages for admin
import { AdminDashboard } from './pages/admin/dashboard';
import { ManageUsers } from './pages/admin/manageUsers';
import { ManageOrganization } from './pages/admin/manageOrganization';
import { ManageSubjects } from './pages/admin/manageSubjects';
import { ManageGrades } from './pages/admin/manageGrades';

// pages for superadmin
import { SuperAdminLayout } from './pages/superadmin/layout';
import { SuperAdminDashboard } from './pages/superadmin/dashboard';
import { ManageOrganizations as SAManageOrganizations } from './pages/superadmin/manage/manageOrganizations';
import { CreateOrganizationsPage as SACreateOrganizationsPage } from './pages/superadmin/create/createOrganizationsPage';
import { UpdateOrganizationsPage as SAUpdateOrganizationsPage } from './pages/superadmin/update/updateOrganizationsPage';

import { ManageUsers as SAManageUsers } from './pages/superadmin/manage/manageUsers';
import { CreateUsersPage as SACreateUsersPage } from './pages/superadmin/create/createUsersPage';
import { UpdateUsersPage as SAUpdateUsersPage } from './pages/superadmin/update/updateUsersPage';

import { ManageRoles as SAManageRoles } from './pages/superadmin/manage/manageRoles';
import { CreateRolesPage as SACreateRolesPage } from './pages/superadmin/create/createRolesPage';
import { UpdateRolesPage as SAUpdateRolesPage } from './pages/superadmin/update/updateRolesPage';
import { ManageGroups as SAManageGroups } from './pages/superadmin/manage/manageGroups';
import { CreateGroupsPage as SACreateGroupsPage } from './pages/superadmin/create/createGroupsPage';
import { UpdateGroupsPage as SAUpdateGroupsPage } from './pages/superadmin/update/updateGroupsPage';


// pages for students
import { StudentDashboard } from './pages/student/dashbaord';
import { AccessResources } from './pages/student/accessResources';
import { AccessAssessments } from './pages/student/accessAssessments';
import { AccessSessions } from './pages/student/accessSessions';
import { AccessAnalytics } from './pages/student/accessAnalytics';

// pages for teachers
import { TeacherDashboard } from './pages/teacher/dashboard';
import { ManageLearningResources } from './pages/teacher/manageLearningResources';
import { ManageAssessments } from './pages/teacher/manageAssessments';
import { ManageSessions } from './pages/teacher/manageSessions';
import { ManageAnalytics } from './pages/teacher/manageAnalytics';

import { removeToast } from './features/toasts/toastSlice';
import { verifyUserToken, setVerifying } from './features/login/loginSlice';
import { Toast } from './components/toast';
import { type AppDispatch, type RootState } from './store';

const Dashboard = () => {
    const { user } = useSelector((state: RootState) => state.login);

    const role = user?.role;

    if (user?.is_superuser || role === 'superadmin') {
        return <Navigate to="/superadmin" replace />;
    }

    switch (role) {
        case 'admin':
            return <AdminDashboard />;
        case 'teacher':
            return <TeacherDashboard />;
        case 'student':
            return <StudentDashboard />;
    }
}

const Resources = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'teacher':
            return <ManageLearningResources />;
        case 'student':
            return <AccessResources />;
    }
}

const Assessments = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'teacher':
            return <ManageAssessments />;
        case 'student':
            return <AccessAssessments />;
    }
}

const Sessions = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'teacher':
            return <ManageSessions />;
        case 'student':
            return <AccessSessions />;
    }
}

const Analytics = () => {
    const { user } = useSelector((state: RootState) => state.login);

    const role = user?.role;

    switch (role) {
        case 'admin':
        case 'teacher':
            return <ManageAnalytics />;
        case 'student':
            return <AccessAnalytics />;
    }
}

interface ProtectedRouteProps {
    allowedRoles?: string[];
    isPublic?: boolean;
    requireSuperadmin?: boolean;
}

export const ProtectedRoute = ({ allowedRoles, isPublic, requireSuperadmin }: ProtectedRouteProps) => {
    const { user } = useSelector((state: RootState) => state.login);
    const location = useLocation();

    if (isPublic && user) {
        return <Navigate to="/" replace />;
    }

    if (!isPublic && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireSuperadmin && user) {
        if (!user.is_superuser) {
            return <Navigate to="/unauthorized" replace />;
        }
        // If the user is a superuser and the route needs superadmin, allow them in.
        return <Outlet />;
    }

    if (allowedRoles && user) {
        const userRole = user.role;
        const isAllowed = allowedRoles.includes(userRole);
        
        if (!isAllowed) {
            // Superusers bypass role restrictions
            if (!user.is_superuser && user.role !== 'superadmin') {
                return <Navigate to="/unauthorized" replace />;
            }
        }
    }

    return <Outlet />;
}

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
                    <Route element={<ProtectedRoute isPublic={true} allowedRoles={[]} />}>
                        <Route path="/login" element={<Login />} />
                    </Route>

                    <Route element={<ProtectedRoute isPublic={false} allowedRoles={['admin', 'teacher', 'student']} />}>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="settings" element={<Settings />} />

                            <Route element={<ProtectedRoute allowedRoles={['teacher', 'student']} />}>
                                <Route path="resources" element={<Resources />} />
                                <Route path="assessments" element={<Assessments />} />
                                <Route path="sessions" element={<Sessions />} />
                                <Route path="analytics" element={<Analytics />} />
                            </Route>

                            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                <Route path="organization" element={< ManageOrganization />} />
                                <Route path="users" element={< ManageUsers />} />
                                <Route path="grades" element={< ManageGrades />} />
                                <Route path="subjects" element={< ManageSubjects />} />
                            </Route>

                            <Route path="/unauthorized" element={<div className="h-screen flex flex-col items-center justify-center font-semibold text-failure text-3xl gap-4 bg-bg text-text">
                                <UserLock size='45' strokeWidth={2.5} /> Access Denied
                            </div>} />
                            <Route path="*" element={<div className="h-screen flex flex-col items-center justify-center text-failure font-semibold text-3xl gap-4 bg-bg text-text">
                                <SearchX size='45' strokeWidth={2.5} /> Page Not Found
                            </div>} />
                        </Route>

                        <Route path="/superadmin" element={<ProtectedRoute requireSuperadmin={true} />}>
                            <Route element={<SuperAdminLayout />}>
                                <Route index element={<SuperAdminDashboard />} />

                            {/* Organizations Module */}
                            <Route path="manage/organizations" element={<SAManageOrganizations />} />
                            <Route path="create/organizations" element={<SACreateOrganizationsPage />} />
                            <Route path="update/organizations/:id" element={<SAUpdateOrganizationsPage />} />

                            {/* Users Module */}
                            <Route path="manage/admins" element={<SAManageUsers type="admin" />} />
                            <Route path="manage/users" element={<SAManageUsers excludeAdmins={true} />} />
                            <Route path="create/users" element={<SACreateUsersPage />} />
                            <Route path="update/users/:id" element={<SAUpdateUsersPage />} />

                            {/* Redirect old paths if they hit directly */}
                            <Route path="manage/students" element={<Navigate to="/superadmin/manage/users" replace />} />
                            <Route path="manage/teachers" element={<Navigate to="/superadmin/manage/users" replace />} />
                            
                            <Route path="manage/roles" element={<SAManageRoles />} />
                            <Route path="create/roles" element={<SACreateRolesPage />} />
                            <Route path="update/roles/:id" element={<SAUpdateRolesPage />} />
                            <Route path="manage/groups" element={<SAManageGroups />} />
                            <Route path="create/groups" element={<SACreateGroupsPage />} />
                            <Route path="update/groups/:id" element={<SAUpdateGroupsPage />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;