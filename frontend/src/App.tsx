if (import.meta.env.PROD) {
    console.log = () => {};
    console.warn = () => {};
    console.debug = () => {};
}

import React from 'react';
import {BrowserRouter as Router,  Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './modules/auth/LoginPage';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminSubjectManager from './modules/admin/subjects/SubjectManager';
import AdminDashboard from './modules/admin/dashboard/AdminDashboard';
import AdminSettings from './modules/admin/AdminSetting';
import AdminSystemLogs from './modules/admin/AdminSystemLogs';
import FacultyManager from './modules/admin/faculties/FacultyManager';
import TeacherManager from './modules/faculty-admin/TeacherManager';
import DepartmentManager from './modules/faculty-admin/DepartmentManager';
import QuestionManager from './modules/QuestionManager';
import AdminUserManager from './modules/admin/AdminUserManager';
import FacultyDashboard from './modules/faculty-admin/FacultyDashboard';
import ClassManager from './modules/faculty-admin/ClassManager';
import CourseClassManager from './modules/faculty-admin/CourseClassManager';
import FacultySubjectManager from './modules/faculty-admin/SubjectManager';
import TeacherClassManager from './modules/teacher/ClassManager';
import ExamBuilder from './modules/teacher/ExamBuilder';
import StudentDashboard from './modules/student/dashboard/StudentDashboard';
import JoinCoursePage from './modules/student/JoinCoursePage';
import ExamRoom from './modules/student/exam/ExamRoom';
import MyClasses from './modules/student/MyClasses';
import SubjectStudyHub from './modules/SubjectStudyHub';
import FlashcardLearningHub from './modules/student/flashcards/FlashcardLearningHub';
import FlashcardReviewPage from './modules/student/flashcards/FlashcardReviewPage';
import ExamTakingPage from './modules/student/exam/ExamTakingPage';
import ExamReviewPage from './modules/student/exam/ExanReviewPage';
import TeacherClasses from './modules/teacher/TeacherClasses'; 
import ExamResultsPage from './modules/teacher/ExamResultsPage';
import ExamMonitorPage from './modules/teacher/ExamMonitorPage';
import AdminActiveExams from './modules/admin/dashboard/AdminActiveExams';
import UserProfile from './modules/profile/UserProfile';
import MaintenancePage from './modules/error/MaintenancePage';
import LearningAnalyticsHub from './modules/student/LearningAnalyticsHub';


const RoleRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'FACULTY_ADMIN') return <Navigate to="/faculty-admin" replace />; 
    if (user.role === 'TEACHER') return <Navigate to="/teacher/classes" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    
    return <Navigate to="/login" replace />;
};

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <AuthProvider>
        <Routes>
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<MainLayout />}>
              <Route path="/profile" element={<UserProfile />} />
              
              {/* ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users"    element={<AdminUserManager />} />
                  <Route path="/admin/subjects" element={<AdminSubjectManager />} />
                  <Route path="/admin/faculties" element={<FacultyManager />} />
                  <Route path="/admin/settings"  element={<AdminSettings />} />
                  <Route path="/admin/logs" element={<AdminSystemLogs />} />
                  <Route path="/admin/active-exams" element={<AdminActiveExams />} />
                  <Route path="/teacher/class-hub/:classId/exam/:roomId/monitor" element={<ExamMonitorPage />} />
              </Route>
              
              {/* FACULTY ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['FACULTY_ADMIN']} />}>
                  <Route path="/faculty-admin" element={<FacultyDashboard />} />
                  <Route path="/faculty-admin/departments" element={<DepartmentManager />} />
                  <Route path="/faculty-admin/teachers" element={<TeacherManager />} /> 
                  <Route path="/faculty-admin/classes" element={<ClassManager />} /> 
                  <Route path="/faculty-admin/course-classes" element={<CourseClassManager />} />
                  <Route path="/faculty-admin/subjects" element={<FacultySubjectManager />} /> 
                  <Route path="/faculty-admin/questions" element={<QuestionManager />} />
              </Route>
              
              {/* TEACHER */}
              <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                  <Route path="/teacher" element={<Navigate to="/teacher/classes" replace />} /> 
                  <Route path="/teacher/classes" element={<TeacherClasses />} />
                  <Route path="/teacher/questions" element={<QuestionManager />} />
                  <Route path="/teacher/class-hub/:classId" element={<SubjectStudyHub />} />
                  <Route path="/teacher/homeroom-classes" element={<TeacherClassManager />} />
                  <Route path="/teacher/class-hub/:classId/exam/:roomId/results" element={<ExamResultsPage />} />
                  <Route path="/teacher/class-hub/:classId/exam/:roomId/monitor" element={<ExamMonitorPage />} />
                  <Route path="/teacher/exam-builder" element={<ExamBuilder />} />
              </Route>

              {/* STUDENT */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/documents" element={<StudentDashboard activeTabDefault="documents" />} />
                  <Route path="/student/flashcards" element={<FlashcardLearningHub />} />
                  <Route path="/student/flashcards/review" element={<FlashcardReviewPage />} />
                  <Route path="/student/practice" element={<StudentDashboard activeTabDefault="practice" />} />
                  <Route path="/student/analytics" element={<LearningAnalyticsHub />} />
                  <Route path="/student/competency-analysis" element={<LearningAnalyticsHub />} />
                  <Route path="/student/join-course" element={<JoinCoursePage />} />
                  <Route path="/student/exam-room" element={<ExamRoom />} />
                  <Route path="/student/class-hub/:classId" element={<SubjectStudyHub />} />
                  <Route path="/student/my-classes" element={<MyClasses />} />
                  <Route path="/student/exam-taking/:attemptId" element={<ExamTakingPage />} />
                  <Route path="/student/exam-review/:attemptId" element={<ExamReviewPage />} />
              </Route>
          </Route>
              
          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;