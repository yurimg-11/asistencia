import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Supabase con variables de entorno de Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware para verificar conexión
const requireDB = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase no configurado en Vercel.' });
  }
  next();
};

// --- RUTAS DE EMPLEADOS ---

app.get('/api/employees', requireDB, async (req, res) => {
  const { data: employees, error } = await supabase.from('employees').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(employees);
});

app.post('/api/employees', requireDB, async (req, res) => {
  const { error } = await supabase.from('employees').insert([req.body]);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/employees/:folio', requireDB, async (req, res) => {
  const { folio } = req.params;
  const { error } = await supabase.from('employees').delete().eq('folio', folio);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- RUTA DE ESCANEO (QR) ---

app.post('/api/scan', requireDB, async (req, res) => {
  const { folio } = req.body;
  
  // 1. Buscar empleado
  const { data: employee, error: empError } = await supabase
    .from('employees').select('*').eq('folio', folio).single();
  
  if (empError || !employee) return res.status(404).json({ error: 'No encontrado' });

  // 2. Determinar tipo (Entrada/Salida)
  const { data: lastLog } = await supabase
    .from('logs').select('type').eq('folio', folio)
    .order('timestamp', { ascending: false }).limit(1).single();

  const nextType = !lastLog || lastLog.type.toLowerCase() === 'salida' ? 'ENTRADA' : 'SALIDA';

  // 3. Guardar log
  const { error: logError } = await supabase.from('logs').insert([{ folio, type: nextType }]);
  if (logError) return res.status(500).json({ error: logError.message });

  res.json({ 
    employee: employee, 
    type: nextType, 
    timestamp: new Date().toISOString() 
  });
});

// --- RUTA DE LOGS (HISTORIAL) ---

app.get('/api/logs', requireDB, async (req, res) => {
  const { data: logs, error } = await supabase
    .from('logs')
    .select('id, folio, type, timestamp, employees(name, position)')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  // Formatear para el Frontend
  const formatted = logs.map((log: any) => ({
    id: log.id,
    folio: log.folio,
    type: log.type,
    timestamp: log.timestamp,
    name: log.employees?.name || 'Desconocido',
    position: log.employees?.position || 'N/A'
  }));

  res.json(formatted);
});

export default app;
