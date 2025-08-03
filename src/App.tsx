import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Components
import Layout from '@/components/Layout/Layout';
import LoginPage from '@/pages/Auth/LoginPage';
import Dashboard from '@/pages/Dashboard/Dashboard';
import StudyList from '@/pages/Studies/StudyList';
import StudyDetail from '@/pages/Studies/StudyDetail';
import CreateStudy from '@/pages/Studies/CreateStudy';
import PatientMatches from '@/pages/Patients/PatientMatches';
import Patients from '@/pages/Patients/Patients';
import Forms from '@/pages/Forms/Forms';
import DynamicForm from '@/pages/Forms/DynamicForm';
import AIChat from '@/pages/Chat/AIChat';
import ChatInterface from '@/pages/Chat/ChatInterface';

// Hooks
import { useAuthStore } from '@/store/authStore';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1976d2',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Study Routes */}
            <Route path="studies" element={<StudyList />} />
            <Route path="studies/create" element={<CreateStudy />} />
            <Route path="studies/:id" element={<StudyDetail />} />
            <Route path="studies/:id/matches" element={<PatientMatches />} />
            <Route path="studies/:id/forms/:formId" element={<DynamicForm />} />
            <Route path="studies/:id/chat" element={<ChatInterface />} />
            
            {/* Patient Routes */}
            <Route path="patients" element={<Patients />} />
            
            {/* Form Routes */}
            <Route path="forms" element={<Forms />} />
            
            {/* AI Chat Routes */}
            <Route path="chat" element={<AIChat />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
