import { useState, useEffect, type FormEvent } from 'react';
import QRCode from 'react-qr-code';
import { User, LogOut, QrCode, ArrowRight, UserPlus, List, Clock, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Employee {
  folio: string;
  name: string;
  position: string;
  salary: number;
  hire_date: string | null;
  attendance: number;
}

interface Log {
  id: number;
  folio: string;
  type: 'ENTRADA' | 'SALIDA';
  timestamp: string;
}

interface EmployeePortalProps {
  onLogout: () => void;
}

export default function EmployeePortal({ onLogout }: EmployeePortalProps) {
  const [view, setView] = useState<'login' | 'register' | 'qr' | 'logs'>('login');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Form states
  const [folio, setFolio] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const savedFolio = localStorage.getItem('employeeFolio');
    if (savedFolio) {
      handleLogin(savedFolio);
    }
  }, []);

  const fetchMyLogs = async (employeeFolio: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/logs/${employeeFolio}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleLogin = async (loginFolio: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/employees/${loginFolio}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
        localStorage.setItem('employeeFolio', data.folio);
        setView('qr');
      } else {
        if (view === 'login') {
          setError('No se encontró un trabajador con ese folio. Verifica o regístrate.');
        } else {
          // If auto-login failed, clear storage
          localStorage.removeItem('employeeFolio');
          setView('login');
        }
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (folio.trim()) {
      handleLogin(folio.trim());
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio: folio.trim(), name, position: position}),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Error al registrarse');
      } else {
        // Automatically log in after successful registration
        handleLogin(folio.trim());
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeFolio');
    onLogout();
  };

  if ((view === 'qr' || view === 'logs') && employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pb-24">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden mt-8">
          <div className="bg-indigo-600 p-6 text-center relative">
            <button 
              onClick={handleLogout}
              className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
            <p className="text-indigo-200 font-medium mt-1">Puesto: {employee.position}</p>
          </div>
          
          {view === 'qr' ? (
            <div className="p-8 flex flex-col items-center">
              <p className="text-sm text-slate-500 text-center mb-6">
                Presenta este código QR en el escáner de la entrada para registrar tu asistencia.
              </p>
              
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                <QRCode value={employee.folio} size={200} level="H" />
              </div>
              
              <p className="mt-6 font-mono text-lg font-bold text-slate-900 tracking-widest">
                {employee.folio}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                Mis Registros Recientes
              </h3>
              
              {loadingLogs ? (
                <div className="text-center py-8 text-slate-500">Cargando registros...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  No tienes registros de asistencia aún.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          log.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <ArrowRightLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{log.type}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(log.timestamp), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-700">
                          {format(new Date(log.timestamp), "HH:mm:ss", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation for Employee */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
          <div className="flex justify-around p-2 max-w-md mx-auto">
            <button
              onClick={() => setView('qr')}
              className={`flex flex-col items-center p-3 rounded-xl flex-1 transition-colors ${
                view === 'qr' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Mi QR</span>
            </button>
            <button
              onClick={() => {
                setView('logs');
                fetchMyLogs(employee.folio);
              }}
              className={`flex flex-col items-center p-3 rounded-xl flex-1 transition-colors ${
                view === 'logs' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <List className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Mis Registros</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <QrCode className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Portal del Trabajador
        </h2>
        <p className="text-center text-slate-500 mb-8">
          {view === 'login' ? 'Ingresa tu folio para ver tu código QR' : 'Regístrate para obtener tu código QR'}
        </p>

        {view === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Folio / Matrícula</label>
              <input
                type="text"
                required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
                placeholder="Ej. 123456"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? 'Buscando...' : 'Ver mi Código QR'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-600">
                ¿No estás registrado?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('register'); setError(''); setFolio(''); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Folio / Matrícula</label>
              <input
                type="text"
                required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. 123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Puesto</label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. Gerente"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-2"
            >
              {loading ? 'Registrando...' : 'Registrarme'}
              {!loading && <UserPlus className="w-5 h-5 ml-2" />}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button 
            onClick={onLogout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
