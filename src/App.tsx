/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { School, User, ShieldCheck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import AdminPortal from './components/AdminPortal';
import EmployeePortal from './components/EmployeePortal';

// Inicializar cliente de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [view, setView] = useState<'landing' | 'employee' | 'admin'>('landing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Check if user is a logged-in employee (Local Storage)
      const savedFolio = localStorage.getItem('employeeFolio');
      if (savedFolio) {
        setView('employee');
      }
      
      // 2. Check if user is a logged-in admin (Supabase Session)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setView('admin');
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleAdminLogin = async () => {
    const email = prompt('jime@dominio.com');
    if (!email) return;
    
    const password = prompt('licenciadO1.@');
    if (!password) return;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('Acceso denegado: ' + error.message);
      } else if (data.session) {
        setView('admin');
      }
    } catch (err) {
      alert('Error inesperado al intentar iniciar sesión');
    }
  };

  const handleLogout = async () => {
    // Cerrar sesión en Supabase (Admin)
    await supabase.auth.signOut();
    
    // Limpiar localStorage (Empleado)
    localStorage.removeItem('employeeFolio');
    
    setView('landing');
  };

  // Pantalla de carga mientras verificamos la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
