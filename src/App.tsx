import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminRoute } from '@/components/layout/AdminRoute'

import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import SociosPage from '@/pages/socios/SociosPage'
import PlanesPage from '@/pages/planes/PlanesPage'

import CuotasPage from '@/pages/cuotas/CuotasPage'
import AsistenciasPage from '@/pages/asistencias/AsistenciasPage'
import HorariosPage from '@/pages/horarios/HorariosPage'
import RecuperacionesPage from '@/pages/recuperaciones/RecuperacionesPage'
import RolesPage from '@/pages/roles/RolesPage'
import UsuariosPage from '@/pages/usuarios/UsuariosPage'
import SocioPerfilPage from '@/pages/socios/SocioPerfilPage'
import MetodosPagoPage from '@/pages/metodosPago/MetodosPagoPage'
import BibliotecaPage from '@/pages/ejercicios/BibliotecaPage'
import ConfiguracionPage from '@/pages/configuracion/ConfiguracionPage'
import NotFoundPage from '@/pages/NotFoundPage'

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
          
          <Route path="cuotas" element={<CuotasPage />} />
          <Route path="asistencias" element={<AsistenciasPage />} />
          <Route path="horarios" element={<HorariosPage />} />
          <Route path="recuperaciones" element={<RecuperacionesPage />} />
          <Route path="socios/:id" element={<SocioPerfilPage />} />
          <Route path="biblioteca" element={<BibliotecaPage />} />

          {/* Solo admins */}
          <Route path="roles"        element={<AdminRoute><RolesPage /></AdminRoute>} />
          <Route path="usuarios"     element={<AdminRoute><UsuariosPage /></AdminRoute>} />
          <Route path="metodos-pago" element={<AdminRoute><MetodosPagoPage /></AdminRoute>} />
          <Route path="configuracion" element={<AdminRoute><ConfiguracionPage /></AdminRoute>} />

        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
