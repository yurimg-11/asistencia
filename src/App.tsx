import React, { useState, useEffect } from 'react';
import { School, User, ShieldCheck, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const savedFolio = localStorage.getItem('employeeFolio');
      if (savedFolio) setView('employee');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) setView('admin');
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError('Credenciales incorrectas o cuenta no confirmada.');
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
          <button onClick={() => setView('landing')} className="text-slate-400 mb-6 hover:text-slate-600 text-sm font-medium transition-colors">← Volver al inicio</button>
          
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acceso de Administración</h2>
            <p className="text-slate-500 text-sm mt-1">Ingresa tus datos para gestionar el sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo Electrónico</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="admin@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold text-center border border-red-100">
                {authError}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><LogIn className="w-5 h-5" /> Acceder al Panel</>}
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
        <p className="text-slate-500 mb-10 text-sm">Selecciona tu perfil para continuar</p>

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

