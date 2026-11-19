import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Odontogram from './pages/Odontogram';
import Treatments from './pages/Treatments';
import Quotes from './pages/Quotes';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="odontogram" element={<Odontogram />} />
        <Route path="treatments" element={<Treatments />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="finance" element={<Finance />} />
        <Route path="inventory" element={<Inventory />} />
      </Route>
    </Routes>
  );
}
