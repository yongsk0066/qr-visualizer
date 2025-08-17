import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import './index.css'
import App from './App.tsx'

const router = createBrowserRouter([
  // 루트 경로는 한국어로 리다이렉트
  {
    path: '/',
    element: <Navigate to="/ko" replace />
  },
  // 언어별 라우트
  {
    path: '/:lang',
    element: <App />
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
