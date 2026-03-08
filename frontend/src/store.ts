import { configureStore } from "@reduxjs/toolkit";

import loginReducer from "./features/login/loginSlice";
import organizationReducer from "./features/management/organizationSlice"
import toastReducer from "./features/toasts/toastSlice";
import usersReducer from "./features/management/userSlice"
import gradesReducer from "./features/management/gradeSlice"
import subjectsReducer from "./features/management/subjectSlice"
import assignSubReducer from "./features/management/assignSubjectSlice"

export const store = configureStore({
    reducer: {
        login: loginReducer,
        organization: organizationReducer,
        toast: toastReducer,
        user: usersReducer,
        grade: gradesReducer, 
        subject: subjectsReducer,
        assignsub: assignSubReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;