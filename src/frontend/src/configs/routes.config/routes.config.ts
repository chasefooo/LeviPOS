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
    key: 'locations',
    path: '/locations',
    component: lazy(() => import('@/pages/Locations')),
    authority: []
  },
  {
    key: 'users',
    path: '/users',
    component: lazy(() => import('@/pages/Users')),
    authority: []
  },
  {
    key: 'terminals',
    path: '/terminals',
    // component: lazy(() => import('@/pages/Terminals')),
    authority: []
  },
  {
    key: 'signout',
    path: '/signout',
    component: lazy(() => import('@/pages/SignOut')),
    authority: []
  },
]