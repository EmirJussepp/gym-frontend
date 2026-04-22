import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import SociosPage from '@/pages/socios/SociosPage'
import PlanesPage from '@/pages/planes/PlanesPage'
import RutinasPage from '@/pages/rutinas/RutinasPage'
import EjerciciosPage from '@/pages/ejercicios/EjerciciosPage'
import GruposMuscularesPage from '@/pages/gruposMusculares/GruposMuscularesPage'
import CuotasPage from '@/pages/cuotas/CuotasPage'
import AsistenciasPage from '@/pages/asistencias/AsistenciasPage'
import HorariosPage from '@/pages/horarios/HorariosPage'
import RecuperacionesPage from '@/pages/recuperaciones/RecuperacionesPage'
import RolesPage from '@/pages/roles/RolesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="socios" element={<SociosPage />} />
          <Route path="planes" element={<PlanesPage />} />
          <Route path="rutinas" element={<RutinasPage />} />
          <Route path="ejercicios" element={<EjerciciosPage />} />
          <Route path="grupos-musculares" element={<GruposMuscularesPage />} />
          <Route path="cuotas" element={<CuotasPage />} />
          <Route path="asistencias" element={<AsistenciasPage />} />
          <Route path="horarios" element={<HorariosPage />} />
          <Route path="recuperaciones" element={<RecuperacionesPage />} />
          <Route path="roles" element={<RolesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
