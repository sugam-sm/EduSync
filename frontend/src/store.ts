import { configureStore } from "@reduxjs/toolkit";

import loginReducer from "./features/login/loginSlice";
import organizationReducer from "./features/organization/organizationSlice"
import toastReducer from "./features/toasts/toastSlice";
import usersReducer from "./features/organization/userSlice"
import gradesReducer from "./features/organization/gradeSlice"
import subjectsReducer from "./features/organization/subjectSlice"
import assignSubReducer from "./features/organization/assignSubjectSlice"

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