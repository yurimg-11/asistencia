import { useState } from 'react';
import { QrCode, List, Users, ShieldCheck, LogOut, Lock } from 'lucide-react';
import ScannerView from './ScannerView';
import LogsView from './LogsView';
import EmployeesView from './EmployeesView';
import QRCodesView from './QRCodesView';

interface AdminPortalProps {
  onLogout: () => void;
}

export default function AdminPortal({ onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'scanner' | 'logs' | 'employees' | 'qrcodes'>('employees');
  const [showExitPin, setShowExitPin] = useState(false);
  const [exitPin, setExitPin] = useState('');

  // --- CAMBIO AQUÍ: Usamos la variable de entorno de Vercel ---
  const handleExitScanner = () => {
    // Si no está configurada en Vercel, por defecto usará 'licenciado1.@'
    const secretPin = import.meta.env.VITE_EXIT_PIN || 'licenciado1.@';

    if (exitPin === secretPin) {
      setActiveTab('employees');
      setShowExitPin(false);
      setExitPin('');
    } else {
      alert('Clave incorrecta. Solo el administrador puede salir.');
      setExitPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header: Se oculta en el escáner */}
      {activeTab !== 'scanner' && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">Panel Control</span>
            </div>
            <button onClick={onLogout} className="text-slate-500 hover:text-red-600 flex items-center gap-2 font-medium">
              <span className="text-sm">Cerrar Sesión</span>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* VISTA DEL ESCÁNER PROTEGIDA */}
        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto pt-10 animate-in fade-in zoom-in duration-300 relative">
            
            {/* Overlay de Clave */}
            {showExitPin && (
              <div className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 border-4 border-indigo-500 shadow-2xl">
                <Lock className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-white font-bold text-xl mb-4 text-center">Ingrese PIN de Administrador para salir</h3>
                <input 
                  type="password" 
                  value={exitPin}
                  onChange={(e) => setExitPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExitScanner()}
                  className="w-48 text-center text-3xl tracking-[0.5rem] bg-slate-800 border-2 border-slate-700 text-white rounded-xl p-3 outline-none focus:border-indigo-500 transition-all"
                  placeholder="****"
                  autoFocus
                />
                <div className="flex space-x-4 mt-8">
                  <button 
                    onClick={handleExitScanner} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => { setShowExitPin(false); setExitPin(''); }} 
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-white overflow-hidden">
              <div className="flex justify-between items-center mb-4 px-4 pt-2">
                <h3 className="text-white font-bold flex items-center italic tracking-wider">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  MODO REGISTRO ACTIVO
                </h3>
                <button 
                  onClick={() => setShowExitPin(true)} 
                  className="bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white text-xs px-5 py-2 rounded-full font-bold transition-all border border-white/20"
                >
                  DESBLOQUEAR
                </button>
              </div>
              <div className="rounded-[1.5rem] overflow-hidden">
                 <ScannerView isFullscreen={false} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'employees' && <EmployeesView />}
        {activeTab === 'qrcodes' && <QRCodesView />}
      </main>

      {/* Navegación inferior (Se oculta en escáner) */}
      {activeTab !== 'scanner' && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg border border-slate-200 px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center space-x-10 animate-in slide-in-from-bottom duration-500 z-50">
           <button 
             onClick={() => setActiveTab('employees')} 
             className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'employees' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
           > 
             <Users className="w-6 h-6" />
             <span className="text-[10px] font-bold uppercase">Personal</span>
           </button>

           <button 
             onClick={() => setActiveTab('scanner')} 
             className="relative -top-2 bg-indigo-600 text-white p-5 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-90"
           > 
             <QrCode className="w-7 h-7" />
           </button>

           <button 
             onClick={() => setActiveTab('logs')} 
             className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'logs' ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
           > 
             <List className="w-6 h-6" />
             <span className="text-[10px] font-bold uppercase">Registros</span>
           </button>
        </nav>
      )}
    </div>
  );
}
