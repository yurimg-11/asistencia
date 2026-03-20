import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, XCircle, User, Clock, ArrowRightLeft, X } from 'lucide-react';
import { format } from 'date-fns';

interface ScanResult {
  employee: {
    folio: string;
    name: string;
    position: string;
    salary: number;
    hire_date: string | null;
    attendance: number;
  };
  type: 'ENTRADA' | 'SALIDA';
  timestamp: string;
  entryTime?: string;
}

interface ScannerViewProps {
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

export default function ScannerView({ isFullscreen = false, onExitFullscreen }: ScannerViewProps) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          async (decodedText) => {
            if (scanner.getState() === 2) { // SCANNING
              scanner.pause();
              try {
                const res = await fetch('/api/scan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ folio: decodedText })
                });
                const data = await res.json();
                
                if (!res.ok) {
                  setError(data.error || 'Error al registrar');
                  setResult(null);
                } else {
                  setResult(data);
                  setError(null);
                }
              } catch (err) {
                setError('Error de conexión con el servidor');
              }
              
              // Resume after 3 seconds
              setTimeout(() => {
                setResult(null);
                setError(null);
                if (scannerRef.current?.getState() === 3) { // PAUSED
                  scannerRef.current.resume();
                }
              }, 3000);
            }
          },
          () => {
            // ignore frame errors
          }
        );
        setIsScanning(true);
      } catch (err) {
        console.error("Error starting scanner", err);
        setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center ${isFullscreen ? 'w-full h-full p-8 text-white' : 'w-full max-w-md mx-auto space-y-6'}`}>
      {isFullscreen && onExitFullscreen && (
        <div className="w-full flex justify-end mb-4">
          <button
            onClick={onExitFullscreen}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            title="Salir del modo escáner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
      
      <div className="text-center space-y-2">
        <h2 className={`text-2xl font-bold tracking-tight ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>Escanear QR</h2>
        <p className={isFullscreen ? 'text-white/80' : 'text-slate-500'}>Apunta la cámara al código QR del trabajador</p>
      </div>

      <div className="relative w-full aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-inner border-4 border-slate-200">
        <div id="qr-reader" className="w-full h-full object-cover"></div>
        
        {/* Overlay for results */}
        {(result || error) && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center p-6 ${isFullscreen ? 'bg-black/80' : 'bg-white/95 backdrop-blur-sm'} animate-in fade-in zoom-in duration-200`}>
            {result ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full ${result.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>{result.employee.name}</h3>
                  <p className={`text-lg font-medium ${isFullscreen ? 'text-white/80' : 'text-slate-500'}`}>Puesto: {result.employee.position}</p>
                  <p className={`text-sm ${isFullscreen ? 'text-white/60' : 'text-slate-400'}`}>Folio: {result.employee.folio}</p>
                </div>
                <div className={`mt-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${result.type === 'ENTRADA' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  {result.type} REGISTRADA
                </div>
                <div className="flex flex-col items-center mt-2 space-y-1">
                  {result.entryTime && (
                    <p className={`text-sm flex items-center ${isFullscreen ? 'text-white/80' : 'text-slate-500'}`}>
                      <Clock className="w-4 h-4 mr-1" />
                      Entrada: {format(new Date(result.entryTime), 'HH:mm:ss')}
                    </p>
                  )}
                  <p className={`text-sm font-medium flex items-center ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
                    <Clock className="w-4 h-4 mr-1" />
                    {result.type === 'ENTRADA' ? 'Entrada' : 'Salida'}: {format(new Date(result.timestamp), 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-red-100 text-red-600">
                  <XCircle className="w-12 h-12" />
                </div>
                <h3 className={`text-xl font-bold ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>Error</h3>
                <p className={isFullscreen ? 'text-white/80' : 'text-slate-600'}>{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
