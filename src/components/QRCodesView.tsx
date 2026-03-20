import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Printer, LayoutTemplate, CheckSquare, Square, Search, User } from 'lucide-react';

interface Employee {
  folio: string;
  name: string;
  position: string;
}

type TemplateType = 'id-card' | 'sticker' | 'minimal';

export default function QRCodesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolios, setSelectedFolios] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<TemplateType>('id-card');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
      // Select all by default
      setSelectedFolios(new Set(data.map((e: Employee) => e.folio)));
    } catch (error) {
      console.error('Error fetching employees', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.folio.includes(searchTerm) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (folio: string) => {
    const newSelection = new Set(selectedFolios);
    if (newSelection.has(folio)) {
      newSelection.delete(folio);
    } else {
      newSelection.add(folio);
    }
    setSelectedFolios(newSelection);
  };

  const toggleAll = () => {
    if (selectedFolios.size === filteredEmployees.length) {
      setSelectedFolios(new Set());
    } else {
      setSelectedFolios(new Set(filteredEmployees.map(e => e.folio)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedEmployees = employees.filter(e => selectedFolios.has(e.folio));

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Controls Sidebar - Hidden when printing */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6 print:hidden">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Generar QR</h2>
            <button
              onClick={handlePrint}
              disabled={selectedFolios.size === 0}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Imprimir"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>

          {/* Template Selection */}
          <div className="space-y-3 mb-8">
            <label className="text-sm font-medium text-slate-700 flex items-center">
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Plantilla
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setTemplate('id-card')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border text-left transition-colors ${
                  template === 'id-card' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Credencial (Vertical)
              </button>
              <button
                onClick={() => setTemplate('sticker')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border text-left transition-colors ${
                  template === 'sticker' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Etiqueta (Horizontal)
              </button>
              <button
                onClick={() => setTemplate('minimal')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border text-left transition-colors ${
                  template === 'minimal' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Minimalista (Solo QR)
              </button>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Trabajadores ({selectedFolios.size}/{filteredEmployees.length})
              </label>
              <button 
                onClick={toggleAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedFolios.size === filteredEmployees.length ? 'Deseleccionar' : 'Seleccionar todos'}
              </button>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar trabajador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">Cargando...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No hay resultados</div>
              ) : (
                filteredEmployees.map(employee => (
                  <button
                    key={employee.folio}
                    onClick={() => toggleSelection(employee.folio)}
                    className="w-full flex items-center px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                  >
                    {selectedFolios.has(employee.folio) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 mr-3 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 mr-3 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{employee.name}</p>
                      <p className="text-xs text-slate-500 truncate">{employee.position} • {employee.folio}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview / Print Area */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 print:p-0 print:border-none print:shadow-none print:bg-transparent">
        {selectedEmployees.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 print:hidden min-h-[400px]">
            <LayoutTemplate className="w-12 h-12 mb-4 text-slate-300" />
            <p>Selecciona al menos un trabajador para generar su código QR</p>
          </div>
        ) : (
          <div className={`
            grid gap-6 print:gap-4
            ${template === 'id-card' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3' : ''}
            ${template === 'sticker' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3' : ''}
            ${template === 'minimal' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 print:grid-cols-6' : ''}
          `}>
            {selectedEmployees.map(employee => (
              <div 
                key={employee.folio} 
                className="break-inside-avoid"
              >
                {template === 'id-card' && (
                  <div className="flex flex-col items-center p-6 border-2 border-slate-200 rounded-2xl bg-white text-center h-full print:border-black print:rounded-lg">
                    <div className="w-full bg-indigo-600 text-white py-2 rounded-t-xl -mt-6 mb-6 print:bg-black print:text-white print:rounded-t-md print:-mt-6 print:mb-4">
                      <h3 className="font-bold tracking-widest uppercase text-sm">Empresa</h3>
                    </div>
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm print:border-black print:shadow-none">
                      <User className="w-10 h-10 text-slate-400 print:text-black" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">{employee.name}</h4>
                    <p className="text-sm font-medium text-slate-500 mb-6">Puesto: {employee.position}</p>
                    <div className="mt-auto bg-white p-2 rounded-xl border border-slate-100 print:border-none">
                      <QRCode value={employee.folio} size={120} level="H" />
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-2">{employee.folio}</p>
                  </div>
                )}

                {template === 'sticker' && (
                  <div className="flex items-center p-4 border-2 border-slate-200 rounded-xl bg-white print:border-black print:rounded-md">
                    <div className="bg-white p-1 mr-4 flex-shrink-0">
                      <QRCode value={employee.folio} size={80} level="M" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-slate-900 truncate">{employee.name}</h4>
                      <p className="text-sm text-slate-600">Puesto: {employee.position}</p>
                      <p className="text-xs font-mono text-slate-400 mt-1">{employee.folio}</p>
                    </div>
                  </div>
                )}

                {template === 'minimal' && (
                  <div className="flex flex-col items-center p-4 border border-slate-200 rounded-xl bg-white print:border-black print:rounded-none">
                    <QRCode value={employee.folio} size={100} level="L" />
                    <p className="text-xs font-mono text-slate-900 mt-2 font-bold">{employee.folio}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
