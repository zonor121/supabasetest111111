import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql, and, or, like, count, asc, desc } from "drizzle-orm";
import type { TableInfo, DynamicRecord, PaginationParams } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Debug the DATABASE_URL to ensure it's correct
console.log("Database URL hostname:", new URL(process.env.DATABASE_URL).hostname);

const sqlClient = postgres(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

export interface IStorage {
  // Table discovery
  getTables(): Promise<TableInfo[]>;
  getTableInfo(tableName: string): Promise<TableInfo | null>;
  
  // Generic CRUD operations
  getRecords(tableName: string, params: PaginationParams): Promise<{
    data: DynamicRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  getRecord(tableName: string, id: string): Promise<DynamicRecord | null>;
  createRecord(tableName: string, data: DynamicRecord): Promise<DynamicRecord>;
  updateRecord(tableName: string, id: string, data: DynamicRecord): Promise<DynamicRecord>;
  deleteRecord(tableName: string, id: string): Promise<boolean>;
  
  // Connection test
  testConnection(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async testConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }

  async getTables(): Promise<TableInfo[]> {
    try {
      // Get all user tables from information_schema
      const tablesResult = await db.execute(sql`
        SELECT 
          t.table_name,
          COUNT(CASE WHEN c.column_name IS NOT NULL THEN 1 END) as column_count
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
          AND t.table_name NOT LIKE 'pg_%'
          AND t.table_name NOT LIKE '_pg_%'
          AND t.table_name != 'spatial_ref_sys'
        GROUP BY t.table_name
        ORDER BY t.table_name
      `);

      const tables: TableInfo[] = [];
      
      for (const table of (tablesResult as unknown) as Array<Record<string, any>>) {
        const tableName = table.table_name as string;
        const tableInfo = await this.getTableInfo(tableName);
        if (tableInfo) {
          tables.push(tableInfo);
        }
      }

      return tables;
    } catch (error) {
      console.error("Error getting tables:", error);
      return [];
    }
  }

  async getTableInfo(tableName: string): Promise<TableInfo | null> {
    try {
      // Get column information
      const columnsResult = await db.execute(sql`
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          WHERE tc.table_name = ${tableName}
            AND tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_name = ${tableName}
          AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
      `);

      const columnsArray = (columnsResult as unknown) as Array<Record<string, any>>;
      if (columnsArray.length === 0) {
        return null;
      }

      // Get row count
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${tableName}"`));
      const countArray = (countResult as unknown) as Array<Record<string, any>>;
      const rowCount = Number(countArray[0]?.count || 0);

      const columns = columnsArray.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        primaryKey: col.is_primary_key,
        defaultValue: col.column_default,
      }));

      return {
        tableName,
        columns,
        rowCount,
      };
    } catch (error) {
      console.error(`Error getting table info for ${tableName}:`, error);
      return null;
    }
  }

  async getRecords(tableName: string, params: PaginationParams): Promise<{
    data: DynamicRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page, limit, search, sortBy, sortOrder, filters } = params;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      let whereClause = '';
      const whereParams: any[] = [];
      
      if (search) {
        // Get table columns for search
        const tableInfo = await this.getTableInfo(tableName);
        if (tableInfo && tableInfo.columns.length > 0) {
          const textColumns = tableInfo.columns
            .filter(col => ['text', 'varchar', 'character varying'].includes(col.type))
            .map(col => `"${col.name}" ILIKE $${whereParams.length + 1}`)
            .join(' OR ');
          
          if (textColumns) {
            whereClause = `WHERE (${textColumns})`;
            whereParams.push(`%${search}%`);
          }
        }
      }

      // Add filters
      if (filters && Object.keys(filters).length > 0) {
        const filterClauses: string[] = [];
        for (const [column, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null && value !== '') {
            filterClauses.push(`"${column}" = $${whereParams.length + 1}`);
            whereParams.push(value);
          }
        }
        
        if (filterClauses.length > 0) {
          const filterClause = filterClauses.join(' AND ');
          whereClause = whereClause 
            ? `${whereClause} AND ${filterClause}`
            : `WHERE ${filterClause}`;
        }
      }

      // Build ORDER BY clause
      let orderClause = '';
      if (sortBy) {
        orderClause = `ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`;
      const countResult = await db.execute(sql.raw(countQuery, whereParams));
      const countArray = (countResult as unknown) as Array<Record<string, any>>;
      const total = Number(countArray[0]?.count || 0);

      // Get paginated data
      const dataQuery = `
        SELECT * FROM "${tableName}" 
        ${whereClause} 
        ${orderClause} 
        LIMIT $${whereParams.length + 1} 
        OFFSET $${whereParams.length + 2}
      `;
      whereParams.push(limit, offset);
      
      const dataResult = await db.execute(sql.raw(dataQuery, whereParams));
      const dataArray = (dataResult as unknown) as Array<Record<string, any>>;

      return {
        data: dataArray as DynamicRecord[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error(`Error getting records from ${tableName}:`, error);
      throw error;
    }
  }

  async getRecord(tableName: string, id: string): Promise<DynamicRecord | null> {
    try {
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) return null;

      const primaryKey = tableInfo.columns.find(col => col.primaryKey)?.name || 'id';
      
      const query = `SELECT * FROM "${tableName}" WHERE "${primaryKey}" = $1`;
      const result = await db.execute(sql.raw(query, [id]));
      const resultArray = result as Array<Record<string, any>>;
      
      return resultArray[0] as DynamicRecord || null;
    } catch (error) {
      console.error(`Error getting record from ${tableName}:`, error);
      return null;
    }
  }

  async createRecord(tableName: string, data: DynamicRecord): Promise<DynamicRecord> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query, values));
      const resultArray = result as Array<Record<string, any>>;
      return resultArray[0] as DynamicRecord;
    } catch (error) {
      console.error(`Error creating record in ${tableName}:`, error);
      throw error;
    }
  }

  async updateRecord(tableName: string, id: string, data: DynamicRecord): Promise<DynamicRecord> {
    try {
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) throw new Error(`Table ${tableName} not found`);

      const primaryKey = tableInfo.columns.find(col => col.primaryKey)?.name || 'id';
      
      const entries = Object.entries(data);
      const setClause = entries.map(([key], i) => `"${key}" = $${i + 1}`).join(', ');
      const values = entries.map(([, value]) => value);
      values.push(id);
      
      const query = `
        UPDATE "${tableName}" 
        SET ${setClause}
        WHERE "${primaryKey}" = $${values.length}
        RETURNING *
      `;
      
      const result = await db.execute(sql.raw(query, values));
      const resultArray = result as Array<Record<string, any>>;
      return resultArray[0] as DynamicRecord;
    } catch (error) {
      console.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  }

  async deleteRecord(tableName: string, id: string): Promise<boolean> {
    try {
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) return false;

      const primaryKey = tableInfo.columns.find(col => col.primaryKey)?.name || 'id';
      
      const query = `DELETE FROM "${tableName}" WHERE "${primaryKey}" = $1`;
      await db.execute(sql.raw(query, [id]));
      
      return true;
    } catch (error) {
      console.error(`Error deleting record from ${tableName}:`, error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
