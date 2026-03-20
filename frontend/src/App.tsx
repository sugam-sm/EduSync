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

    switch (user?.role) {
        case 'Administrator':
            return <AdminDashboard />;
        case 'Teacher':
            return <TeacherDashboard />;
        case 'Student':
            return <StudentDashboard />;
    }
}

const Resources = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'Teacher':
            return <ManageLearningResources />;
        case 'Student':
            return <AccessResources />;
    }
}

const Assessments = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'Teacher':
            return <ManageAssessments />;
        case 'Student':
            return <AccessAssessments />;
    }
}

const Sessions = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'Teacher':
            return <ManageSessions />;
        case 'Student':
            return <AccessSessions />;
    }
}

const Analytics = () => {
    const { user } = useSelector((state: RootState) => state.login);

    switch (user?.role) {
        case 'Teacher':
            return <ManageAnalytics />;
        case 'Student':
            return <AccessAnalytics />;
    }
}

interface ProtectedRouteProps {
    allowedRoles: string[];
    isPublic?: boolean;
}

export const ProtectedRoute = ({ allowedRoles, isPublic }: ProtectedRouteProps) => {
    const { user } = useSelector((state: RootState) => state.login);
    const location = useLocation();

    if (isPublic && user) {
        return <Navigate to="/" replace />;
    }

    if (!isPublic && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
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
            <div className="fixed top-6 right-6 z-500 flex flex-col items-end gap-3 pointer-events-none">
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

                    <Route element={<ProtectedRoute isPublic={false} allowedRoles={['Administrator', 'Teacher', 'Student']} />}>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="settings" element={<Settings />} />

                            <Route element={<ProtectedRoute allowedRoles={['Teacher', 'Student']} />}>
                                <Route path="resources" element={<Resources />} />
                                <Route path="assessments" element={<Assessments />} />
                                <Route path="sessions" element={<Sessions />} />
                                <Route path="analytics" element={<Analytics />} />
                            </Route>

                            <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
                                <Route path="organization" element={< ManageOrganization />} />
                                <Route path="users" element={< ManageUsers />} />
                                <Route path="grades" element={< ManageGrades />} />
                                <Route path="subjects" element={< ManageSubjects />} />
                            </Route>

                            <Route path="/unauthorized" element={<div className="h-screen flex items-center justify-center font-semibold text-failure text-3xl gap-4">
                                <UserLock size='35' strokeWidth={2.5} /> Access Denied
                            </div>} />
                            <Route path="*" element={<div className="h-screen flex items-center justify-center text-failure font-semibold text-3xl gap-4">
                                <SearchX size='35' strokeWidth={2.5} /> Page Not Found
                            </div>} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;