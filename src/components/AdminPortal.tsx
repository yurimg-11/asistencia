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

  // Función para verificar la clave antes de salir del escáner
  const handleExitScanner = () => {
    if (exitPin === '9999') { // <--- AQUÍ PONES TU CLAVE DE SALIDA
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
            <button onClick={onLogout} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* VISTA DEL ESCÁNER PROTEGIDA */}
        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto pt-10 animate-in fade-in zoom-in duration-300 relative">
            
            {/* Overlay de Clave (Si alguien intenta picarle a salir) */}
            {showExitPin && (
              <div className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 border-4 border-indigo-500 shadow-2xl">
                <Lock className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-white font-bold text-xl mb-4">Ingrese PIN de Admin</h3>
                <input 
                  type="password" 
                  value={exitPin}
                  onChange={(e) => setExitPin(e.target.value)}
                  className="w-32 text-center text-3xl tracking-[1rem] bg-slate-800 border-2 border-slate-700 text-white rounded-xl p-2 outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex space-x-4 mt-6">
                  <button onClick={handleExitScanner} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">Entrar</button>
                  <button onClick={() => { setShowExitPin(false); setExitPin(''); }} className="text-slate-400">Cancelar</button>
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-white">
              <div className="flex justify-between items-center mb-4 px-4 pt-2">
                <h3 className="text-white font-bold flex items-center italic">
                  <QrCode className="w-5 h-5 mr-2 text-indigo-400" /> MODO REGISTRO
                </h3>
                <button 
                  onClick={() => setShowExitPin(true)} 
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-full font-bold transition-all"
                >
                  SALIR
                </button>
              </div>
              <ScannerView isFullscreen={false} />
            </div>
          </div>
        )}

        {/* Otras vistas se quedan igual */}
        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'employees' && <EmployeesView />}
        {activeTab === 'qrcodes' && <QRCodesView />}
      </main>

      {/* Navegación inferior (Se oculta en escáner) */}
      {activeTab !== 'scanner' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-slate-200 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-8 animate-in slide-in-from-bottom duration-300">
           {/* ... botones de siempre ... */}
           <button onClick={() => setActiveTab('employees')} className={activeTab === 'employees' ? 'text-indigo-600' : 'text-slate-400'}> <Users /> </button>
           <button onClick={() => setActiveTab('scanner')} className="text-indigo-600 bg-slate-100 p-3 rounded-full"> <QrCode /> </button>
           <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'text-indigo-600' : 'text-slate-400'}> <List /> </button>
        </nav>
      )}
    </div>
  );
}