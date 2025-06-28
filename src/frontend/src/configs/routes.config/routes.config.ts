import { lazy } from 'react'
import authRoute from './authRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes = [
  {
    key: 'dashboard',
    path: '/dashboard',
    component: lazy(() => import('@/pages/Dashboard')),
    authority: []
  },
  {
    key: 'signout',
    path: '/signout',
    component: lazy(() => import('@/pages/SignOut')),
    authority: []
  },
]