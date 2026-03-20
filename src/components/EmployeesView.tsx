import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus, Users, Trash2, Calendar, DollarSign } from 'lucide-react';

interface Employee {
  folio: string;
  name: string;
  position: string;
  salary: number;
  hire_date: string | null;
  attendance: number;
}

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    folio: '', name: '', position: '', salary: '', hire_date: '', attendance: ''
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      fetchEmployees();
      setFormData({ folio: '', name: '', position: '', salary: '', hire_date: '', attendance: '' });
    }
  };

  const deleteEmployee = async (folio: string) => {
    if (!confirm(`¿Eliminar al empleado con folio ${folio}?`)) return;
    const res = await fetch(`/api/employees/${folio}`, { method: 'DELETE' });
    if (res.ok) setEmployees(employees.filter(e => e.folio !== folio));
  };

  return (
    <div className="space-y-8">
      {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <UserPlus className="text-indigo-600" /> Nuevo Registro
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Folio" value={formData.folio} onChange={e => setFormData({...formData, folio: e.target.value})} className="border p-2 rounded-xl" required />
          <input placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border p-2 rounded-xl" required />
          <input placeholder="Puesto" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="border p-2 rounded-xl" required />
          <input type="number" placeholder="Salario" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="border p-2 rounded-xl" />
          <input type="date" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} className="border p-2 rounded-xl" />
          <input type="number" step="0.01" min="0" max="100" placeholder="Asistencia %" value={formData.attendance} onChange={e => setFormData({...formData, attendance: e.target.value})} className="border p-2 rounded-xl" />
          <button type="submit" className="bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Guardar</button>
        </form>
      </div>

      {/* TABLA DINÁMICA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Empleado</th>
              <th className="px-6 py-4">Ingreso</th>
              <th className="px-6 py-4">Salario</th>
              <th className="px-6 py-4">Asistencia</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.folio} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold">{emp.name}</div>
                  <div className="text-xs text-slate-400">{emp.position} • {emp.folio}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : 'No asignada'}
                </td>
                <td className="px-6 py-4 font-mono text-green-600 font-bold">
                  ${Number(emp.salary).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-mono text-blue-600 font-bold">
                  {Number(emp.attendance).toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => deleteEmployee(emp.folio)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}