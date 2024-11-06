'use client';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Err404Page from './pages/Err404Page';

const PythonPage = React.lazy(() => import('./pages/PythonPage'));

const fallback = <></>;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/python" />} />

        <Route
          path="/python"
          element={
            <React.Suspense fallback={fallback}>
              <PythonPage />
            </React.Suspense>
          }
        />

        <Route path="*" element={<Err404Page />} />
      </Routes>
    </BrowserRouter>
  );
}
