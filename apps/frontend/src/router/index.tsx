import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Home } from '@/pages/Home'
import { Catalog } from '@/pages/Catalog'
import { VehicleDetail } from '@/pages/VehicleDetail'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { PublishVehicle } from '@/pages/PublishVehicle'
import { EditVehicle } from '@/pages/EditVehicle'
import { Dashboard } from '@/pages/Dashboard'
import { Admin } from '@/pages/Admin'
import { AuthCallback } from '@/pages/AuthCallback'
import { LegalPage } from '@/pages/LegalPage'
import { NotFound } from '@/pages/NotFound'
import { Support } from '@/pages/Support'
import { SellerRoute } from '@/components/layout/SellerRoute'
import { AdminRoute } from '@/components/layout/AdminRoute'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/publish" element={<SellerRoute><PublishVehicle /></SellerRoute>} />
        <Route path="/vehicles/:id/edit" element={<EditVehicle />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
