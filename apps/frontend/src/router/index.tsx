import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Home } from '@/pages/Home'
import { AuthCallback } from '@/pages/AuthCallback'
import { SellerRoute } from '@/components/layout/SellerRoute'
import { AuthRoute } from '@/components/layout/AuthRoute'
import { AdminRoute } from '@/components/layout/AdminRoute'

// Cada página va en su propio archivo JS y se descarga al entrar a ella (el home y el layout cargan de inmediato)
const Catalog = lazy(() => import('@/pages/Catalog').then((m) => ({ default: m.Catalog })))
const VehicleDetail = lazy(() => import('@/pages/VehicleDetail').then((m) => ({ default: m.VehicleDetail })))
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })))
const PublishVehicle = lazy(() => import('@/pages/PublishVehicle').then((m) => ({ default: m.PublishVehicle })))
const EditVehicle = lazy(() => import('@/pages/EditVehicle').then((m) => ({ default: m.EditVehicle })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Admin = lazy(() => import('@/pages/Admin').then((m) => ({ default: m.Admin })))
const LegalPage = lazy(() => import('@/pages/LegalPage').then((m) => ({ default: m.LegalPage })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))
const Support = lazy(() => import('@/pages/Support').then((m) => ({ default: m.Support })))

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
        <Route path="/vehicles/:id/edit" element={<AuthRoute><EditVehicle /></AuthRoute>} />
        <Route path="/dashboard" element={<AuthRoute><Dashboard /></AuthRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
