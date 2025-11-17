import { pool } from '../config/db.js';
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    const ms = Date.now() - start;
    console.log(`Response ${req.method} ${req.path} (${ms}ms)`);
    return originalJson(data);
  };
  
  next();
}

export async function auditLog(
  action: string, 
  entityType: string, 
  entityId: number, 
  userId: number, 
  details: Record<string, any> | null = null
) {
  try {
    await pool.query(
      `INSERT INTO Audit_Log (table_name, record_id, action, account_id, new_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [entityType, entityId, action, userId, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

export default { requestLogger, auditLog };
