import React, { useState, useEffect } from 'react'; // Corregido: Import React añadido
import { School, User, ShieldCheck, LogIn, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import AdminPortal from './components/AdminPortal';
import EmployeePortal from './components/EmployeePortal';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [view, setView] = useState<'landing' | 'employee' | 'admin' | 'login'>('landing');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Corregido: checkUser movido fuera o definido correctamente para el useEffect
  const checkUser = async () => {
    const savedFolio = localStorage.getItem('employeeFolio');
    if (savedFolio) setView('employee');

    const { data: { session } } = await supabase.auth.getSession();
    if (session) setView('admin');
    
    setLoading(false);
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('Credenciales incorrectas. Intenta de nuevo.');
      setLoading(false);
    } else if (data.session) {
      setView('admin');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('employeeFolio');
    setView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (view === 'employee') return <EmployeePortal onLogout={handleLogout} />;
  if (view === 'admin') return <AdminPortal onLogout={handleLogout} />;

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 animate-in fade-in zoom-in duration-300">
          <button onClick={() => setView('landing')} className="text-slate-400 mb-6 hover:text-slate-600">← Volver</button>
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-slate-100 text-slate-800 rounded-2xl mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Acceso Administrativo</h2>
            <p className="text-slate-500 text-sm">Ingresa tus credenciales de Supabase</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="admin@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            {authError && <p className="text-red-500 text-xs font-bold text-center">{authError}</p>}
            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-100"
            >
              {loading ? <Loader2 className="animate-spin" /> : <LogIn className="w-5 h-5" />}
              Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-md">
            <School className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Control de Asistencia</h1>
        <p className="text-slate-500 mb-10">Selecciona tu perfil para continuar</p>

        <div className="space-y-4">
          <button onClick={() => setView('employee')} className="w-full flex items-center p-4 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><User className="w-6 h-6" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Soy Trabajador</h3>
              <p className="text-sm text-slate-500">Ver mi código QR y registrarme</p>
            </div>
          </button>

          <button onClick={() => setView('login')} className="w-full flex items-center p-4 bg-white border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-50 rounded-2xl transition-all group">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl mr-4 group-hover:bg-slate-800 group-hover:text-white transition-colors"><ShieldCheck className="w-6 h-6" /></div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Administración</h3>
              <p className="text-sm text-slate-500">Escanear y administrar registros</p>
            </div>
          </button>
        </div>
      </div>
      <p className="mt-8 text-sm text-slate-400">Sistema de Registro QR © {new Date().getFullYear()}</p>
    </div>
  );
}
