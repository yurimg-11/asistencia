import express from 'express';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://rnqdsxsqqyiqrpulacyt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware para verificar conexión
const requireDB = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase no configurado en variables de entorno.' });
  }
  next();
};

// --- Funciones de Ayuda (Lógica de Negocio) ---

async function calculateAttendance(folio: string): Promise<number> {
  const { data: employee } = await supabase.from('employees').select('hire_date').eq('folio', folio).single();
  if (!employee) return 0;

  const hireDate = new Date(employee.hire_date);
  const today = new Date();
  let workingDays = 0;

  for (let d = new Date(hireDate); d <= today; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) workingDays++;
  }

  const { count } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('folio', folio);

  return workingDays > 0 ? Math.round(((count || 0) / workingDays) * 100) : 0;
}

async function calculateSalary(folio: string): Promise<number> {
  const { data: logs } = await supabase
    .from('logs')
    .select('timestamp, type')
    .eq('folio', folio)
    .order('timestamp', { ascending: true });

  if (!logs) return 0;

  let totalHours = 0;
  let lastEntry: Date | null = null;

  for (const log of logs) {
    const logTime = new Date(log.timestamp);
    if (log.type === 'entry') {
      lastEntry = logTime;
    } else if (log.type === 'exit' && lastEntry) {
      totalHours += (logTime.getTime() - lastEntry.getTime()) / (1000 * 60 * 60);
      lastEntry = null;
    }
  }
  return Math.round(totalHours * 40 * 100) / 100;
}

// --- Rutas de la API ---

app.get('/api/employees', requireDB, async (req, res) => {
  const { data: employees, error } = await supabase.from('employees').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });

  const withCalculations = await Promise.all(
    employees.map(async (emp) => ({
      ...emp,
      attendance: await calculateAttendance(emp.folio),
      salary: await calculateSalary(emp.folio)
    }))
  );
  res.json(withCalculations);
});

app.post('/api/employees', requireDB, async (req, res) => {
  const { error } = await supabase.from('employees').insert([req.body]);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/scan', requireDB, async (req, res) => {
  const { folio } = req.body;
  const { data: employee } = await supabase.from('employees').select('*').eq('folio', folio).single();
  
  if (!employee) return res.status(404).json({ error: 'No encontrado' });

  // Lógica de entrada/salida simplificada
  const { data: lastLog } = await supabase
    .from('logs')
    .select('type')
    .eq('folio', folio)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  const nextType = !lastLog || lastLog.type === 'exit' ? 'entry' : 'exit';

  const { error } = await supabase.from('logs').insert([{ folio, type: nextType }]);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, type: nextType, employee: employee.name });
});

export default app;