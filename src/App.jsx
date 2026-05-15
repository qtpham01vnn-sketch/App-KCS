import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import KilnAudit from './pages/KilnAudit';
import DryerAudit from './pages/DryerAudit';
import DatabaseView from './pages/DatabaseView';
import Comparison from './pages/Comparison';
import Settings from './pages/Settings';
import KnowledgeBase from './pages/KnowledgeBase';
import MaterialManager from './pages/MaterialManager';
import QualityControl from './pages/QualityControl';
import DefectLibrary from './pages/DefectLibrary';
import TrendAnalysis from './pages/TrendAnalysis';
import ManagementReport from './pages/ManagementReport';
import OperationsLog from './pages/OperationsLog';
import MachineManager from './pages/MachineManager';
import DepartmentManager from './pages/DepartmentManager';
import AI3DInterior from './pages/AI3DInterior';

// Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const MainLayout = ({ children, activeMenu }) => (
  <div className="flex h-screen w-full bg-[#020617] text-white overflow-hidden">
    <Sidebar activeMenu={activeMenu} />
    <main className="flex-1 overflow-y-auto p-12 bg-brand-bg">
      <Header activeMenu={activeMenu} />
      <div className="animate-none">
        {children}
      </div>
    </main>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Bảng điều khiển">
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/kiln" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Lò Nung Men/Xương">
                <KilnAudit />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/dryer" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Lò Sấy 5 Tầng">
                <DryerAudit />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/database" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Cơ sở dữ liệu">
                <DatabaseView />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/comparison" element={
            <ProtectedRoute>
              <MainLayout activeMenu="So sánh dải nhiệt">
                <Comparison />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/knowledge" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Kho Tri Thức">
                <KnowledgeBase />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/materials" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Nguyên liệu & Phối liệu">
                <MaterialManager />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/qc" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Kiểm soát Hồ & Bột">
                <QualityControl />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/defects" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Thư viện lỗi gạch">
                <DefectLibrary />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/trends" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Giám sát tiêu chuẩn">
                <TrendAnalysis />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/management" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Báo cáo giám đốc">
                <ManagementReport />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/logs" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Nhật ký vận hành">
                <OperationsLog />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/machines" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Máy móc thiết bị (MMTB)">
                <MachineManager />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/departments" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Phòng ban nội bộ">
                <DepartmentManager />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/ai-interior" element={
            <ProtectedRoute>
              <MainLayout activeMenu="AI 3D Interior">
                <AI3DInterior />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout activeMenu="Cài đặt hệ thống">
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

