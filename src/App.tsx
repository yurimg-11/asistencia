/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { School, User, ShieldCheck } from 'lucide-react';
import AdminPortal from './components/AdminPortal';
import EmployeePortal from './components/EmployeePortal';

export default function App() {
  const [view, setView] = useState<'landing' | 'employee' | 'admin'>('landing');

  useEffect(() => {
    // Check if user was already logged in as employee
    const savedFolio = localStorage.getItem('employeeFolio');
    if (savedFolio) {
      setView('employee');
    }
    
    // Check if user was already logged in as admin
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setView('admin');
    }
  }, []);

  const handleAdminLogin = () => {
    const pin = prompt('Ingrese el PIN de administrador:');
    if (pin === '1234') {
      localStorage.setItem('adminAuth', 'true');
      setView('admin');
    } else if (pin !== null) {
      alert('PIN incorrecto');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('employeeFolio');
    setView('landing');
  };

  if (view === 'employee') {
    return <EmployeePortal onLogout={handleLogout} />;
  }

  if (view === 'admin') {
    return <AdminPortal onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-md">
            <School className="w-12 h-12" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Control de Asistencia
        </h1>
        <p className="text-slate-500 mb-10">
          Selecciona tu perfil para continuar
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setView('employee')}
            className="w-full flex items-center p-4 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group"
          >
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Soy Trabajador</h3>
              <p className="text-sm text-slate-500">Ver mi código QR y registrarme</p>
            </div>
          </button>

          <button
            onClick={handleAdminLogin}
            className="w-full flex items-center p-4 bg-white border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-50 rounded-2xl transition-all group"
          >
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl mr-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Administración</h3>
              <p className="text-sm text-slate-500">Escanear y administrar registros</p>
            </div>
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-slate-400">
        Sistema de Registro QR © {new Date().getFullYear()}
      </p>
    </div>
  );
}
