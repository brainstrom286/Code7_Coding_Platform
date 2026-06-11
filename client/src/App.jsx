import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { AdminDashboardPage, TestEditorPage } from './pages/AdminPages';
import { AdminLoginPage, StudentLoginPage, StudentRegisterPage } from './pages/AuthPages';
import ProtectedRoute from './components/ProtectedRoute';
import {
  StudentDashboardPage,
  StudentInstructionsPage,
  StudentResultPage,
  StudentTestPage,
} from './pages/StudentPages';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/register" element={<StudentRegisterPage />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/instructions"
        element={
          <ProtectedRoute role="student">
            <StudentInstructionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/test"
        element={
          <ProtectedRoute role="student">
            <StudentTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result"
        element={
          <ProtectedRoute role="student">
            <StudentResultPage />
          </ProtectedRoute>
        }
      />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/test-editor"
        element={
          <ProtectedRoute role="admin">
            <TestEditorPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
