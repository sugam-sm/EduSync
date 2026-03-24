import { configureStore } from "@reduxjs/toolkit";

import loginReducer from "./features/login/loginSlice";
import organizationReducer from "./features/organization/organizationSlice"
import toastReducer from "./features/toasts/toastSlice";
import usersReducer from "./features/organization/userSlice"
import gradesReducer from "./features/organization/gradeSlice"
import subjectsReducer from "./features/organization/subjectSlice"
import assignSubReducer from "./features/organization/assignSubjectSlice"
import resourceReducer from "./features/learning/resourceSlice"
import flashcardReducer from "./features/learning/flashcardSlice"
import quizReducer from "./features/learning/quizSllice"
import teacherRemarkReducer from "./features/learning/teacherRemarkSlice"
import attendanceReducer from "./features/analytics/attendanceSlice";
import roleReducer from "./features/organization/roleSlice";

export const store = configureStore({
    reducer: {
        login: loginReducer,
        organization: organizationReducer,
        toast: toastReducer,
        user: usersReducer,
        grade: gradesReducer, 
        subject: subjectsReducer,
        assignSub: assignSubReducer,
        resource: resourceReducer,
        flashcard: flashcardReducer,
        quiz: quizReducer,
        teacherRemark: teacherRemarkReducer,
        attendance: attendanceReducer,
        role: roleReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;