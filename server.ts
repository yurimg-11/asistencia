import express from 'express';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Initialize MySQL Database Pool
let pool: mysql.Pool | null = null;

async function initDB() {
  if (!process.env.DB_HOST) {
    console.warn('MySQL credentials not found in environment variables. Database will not be connected.');
    return;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Licenciado1@.',
      database: process.env.DB_NAME || 'asistencia_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        folio VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        salary DECIMAL(10,2) DEFAULT 0,
        hire_date DATE,
        attendance DECIMAL(5,2) DEFAULT 0
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        folio VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folio) REFERENCES employees(folio)
      )
    `);

    // Seed initial data if empty
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM employees');
    if (rows[0].count === 0) {
      const insertQuery = 'INSERT INTO employees (folio, name, position) VALUES (?, ?, ?)';
      await pool.query(insertQuery, ['20004', 'ALONSO ALTAMIRA DIEGO', 'MOSTRADOR']);
      await pool.query(insertQuery, ['21005', 'COYOTL TELIZ ALDO ASAEL', 'OPERARIO DE FRUTERIA']);
      await pool.query(insertQuery, ['20002', 'ESPINOZA MUNGUIA JIMENA', 'SUPERVISOR DE VENTAS']);
      await pool.query(insertQuery, ['20001', 'GUTIERREZ SANCHEZ ERIKA DEL CARMEN', 'GERENTE GENERAL']);
      await pool.query(insertQuery, ['20003', 'MERTINEZ HERNANDEZ JUAN PABLO', 'COCTELERO']);
      await pool.query(insertQuery, ['21006', 'NARANJO OJEDA RUBEN', 'SUPERVISOR DE OPERACIONES']);
      await pool.query(insertQuery, ['22007', 'RAMIREZ RAMIREZ NAOMI GUADALUPE', 'CAJERO']);
    }
    console.log('MySQL Database initialized successfully');
  } catch (error) {
    console.error('Error initializing MySQL database:', error);
    pool = null;
  }
}

// Check DB middleware
const requireDB = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured. Please set MySQL environment variables.' });
  }
  next();
};

// Helper functions for automatic calculations
async function calculateAttendance(folio: string): Promise<number> {
  try {
    // Get employee hire date
    const [employeeRows] = await pool!.query<mysql.RowDataPacket[]>(
      'SELECT hire_date FROM employees WHERE folio = ?',
      [folio]
    );
    
    if (employeeRows.length === 0) return 0;
    const hireDate = new Date(employeeRows[0].hire_date);
    const today = new Date();
    
    // Count working days since hire date (Monday to Friday)
    let workingDays = 0;
    for (let d = new Date(hireDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        workingDays++;
      }
    }
    
    // Count unique attendance days
    const [logRows] = await pool!.query<mysql.RowDataPacket[]>(
      'SELECT DISTINCT DATE(timestamp) as attendance_date FROM logs WHERE folio = ?',
      [folio]
    );
    
    const attendanceDays = logRows.length;
    
    // Calculate percentage
    return workingDays > 0 ? Math.round((attendanceDays / workingDays) * 100) : 0;
  } catch (error) {
    console.error('Error calculating attendance:', error);
    return 0;
  }
}

async function calculateSalary(folio: string): Promise<number> {
  try {
    // Get all logs for the employee, ordered by timestamp
    const [logRows] = await pool!.query<mysql.RowDataPacket[]>(
      'SELECT timestamp, type FROM logs WHERE folio = ? ORDER BY timestamp ASC',
      [folio]
    );
    
    let totalHours = 0;
    let lastEntry: Date | null = null;
    
    for (const log of logRows) {
      const logTime = new Date(log.timestamp);
      
      if (log.type === 'entry') {
        lastEntry = logTime;
      } else if (log.type === 'exit' && lastEntry) {
        // Calculate hours between entry and exit
        const hoursWorked = (logTime.getTime() - lastEntry.getTime()) / (1000 * 60 * 60);
        totalHours += hoursWorked;
        lastEntry = null; // Reset for next pair
      }
    }
    
    // Calculate salary at $40/hour
    return Math.round(totalHours * 40 * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating salary:', error);
    return 0;
  }
}

// API Routes

// Get all employees
app.get('/api/employees', requireDB, async (req, res) => {
  try {
    const [employees] = await pool!.query<mysql.RowDataPacket[]>('SELECT * FROM employees ORDER BY name ASC');
    
    // Calculate attendance and salary for each employee
    const employeesWithCalculations = await Promise.all(
      employees.map(async (employee: any) => ({
        ...employee,
        attendance: await calculateAttendance(employee.folio),
        salary: await calculateSalary(employee.folio)
      }))
    );
    
    res.json(employeesWithCalculations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

// Get a single employee by folio
app.get('/api/employees/:folio', requireDB, async (req, res) => {
  try {
    const [rows] = await pool!.query<mysql.RowDataPacket[]>('SELECT * FROM employees WHERE folio = ?', [req.params.folio]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Trabajador no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar trabajador' });
  }
});

// Add a new employee
app.post('/api/employees', requireDB, async (req, res) => {
  const { folio, name, position, salary, hire_date, attendance } = req.body;
  if (!folio || !name || !position) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  try {
    await pool!.query('INSERT INTO employees (folio, name, position, salary, hire_date, attendance) VALUES (?, ?, ?, ?, ?, ?)', 
      [folio, name, position, salary || 0, hire_date || null, attendance || 0]);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El folio ya existe' });
    } else {
      res.status(500).json({ error: 'Error al registrar trabajador' });
    }
  }
});

// Delete an employee
app.delete('/api/employees/:folio', requireDB, async (req, res) => {
  const { folio } = req.params;
  
  try {
    // First delete related logs
    await pool!.query('DELETE FROM logs WHERE folio = ?', [folio]);
    // Then delete the employee
    const [result] = await pool!.query<mysql.ResultSetHeader>('DELETE FROM employees WHERE folio = ?', [folio]);
    
    if ((result as any).affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Trabajador no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
});

// Scan QR code (Register entry or exit)
app.post('/api/scan', requireDB, async (req, res) => {
  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ error: 'Folio no proporcionado' });
  }

  try {
    const [employeeRows] = await pool!.query<mysql.RowDataPacket[]>(
      'SELECT * FROM employees WHERE folio = ?', [folio]);

    if (employeeRows.length === 0) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    const employee = employeeRows[0];

    // Determine if it's an entry or exit based on the last log today
    const [logRows] = await pool!.query<mysql.RowDataPacket[]>(`
      SELECT type, timestamp FROM logs 
      WHERE folio = ? AND DATE(timestamp) = CURDATE()
      ORDER BY timestamp DESC LIMIT 1
    `, [folio]);

    const lastLog = logRows.length > 0 ? logRows[0] : undefined;
    const newType = lastLog?.type === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';
    
    // MySQL returns Date objects for DATETIME fields by default in mysql2
    let entryTime = undefined;
    if (newType === 'SALIDA' && lastLog?.timestamp) {
      entryTime = lastLog.timestamp instanceof Date 
        ? lastLog.timestamp.toISOString() 
        : new Date(lastLog.timestamp).toISOString();
    }

    await pool!.query('INSERT INTO logs (folio, type) VALUES (?, ?)', [folio, newType]);

    res.json({
      employee,
      type: newType,
      timestamp: new Date().toISOString(),
      entryTime
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el escaneo' });
  }
});

// Get recent logs
app.get('/api/logs', requireDB, async (req, res) => {
  try {
    const [logs] = await pool!.query<mysql.RowDataPacket[]>(`
      SELECT l.id, l.folio, l.type, l.timestamp, e.name, e.position
      FROM logs l
      JOIN employees e ON l.folio = e.folio
      ORDER BY l.timestamp DESC
      LIMIT 100
    `);
    
    // Ensure timestamps are properly formatted as ISO strings for the frontend
    const formattedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString()
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

// Get logs for a specific employee
app.get('/api/logs/:folio', requireDB, async (req, res) => {
  try {
    const [logs] = await pool!.query<mysql.RowDataPacket[]>(`
      SELECT l.id, l.folio, l.type, l.timestamp, e.name, e.position
      FROM logs l
      JOIN employees e ON l.folio = e.folio
      WHERE l.folio = ?
      ORDER BY l.timestamp DESC
      LIMIT 100
    `, [req.params.folio]);
    
    const formattedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString()
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros del trabajador' });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  await initDB();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
