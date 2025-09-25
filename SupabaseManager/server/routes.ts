import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { paginationSchema, dynamicRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection
  app.get("/api/database/test", async (req, res) => {
    try {
      const isConnected = await storage.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      res.status(500).json({ message: "Database connection failed", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get all tables
  app.get("/api/database/tables", async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tables", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get table info
  app.get("/api/database/tables/:tableName", async (req, res) => {
    try {
      const { tableName } = req.params;
      const tableInfo = await storage.getTableInfo(tableName);
      
      if (!tableInfo) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(tableInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table info", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get records with pagination, search, and filtering
  app.get("/api/database/tables/:tableName/records", async (req, res) => {
    try {
      const { tableName } = req.params;
      
      // Parse query parameters
      const params = paginationSchema.parse({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as string || "asc",
        filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
      });

      const result = await storage.getRecords(tableName, params);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch records", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get single record
  app.get("/api/database/tables/:tableName/records/:id", async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const record = await storage.getRecord(tableName, id);
      
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch record", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Create record
  app.post("/api/database/tables/:tableName/records", async (req, res) => {
    try {
      const { tableName } = req.params;
      const data = dynamicRecordSchema.parse(req.body);
      
      const record = await storage.createRecord(tableName, data);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to create record", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update record
  app.put("/api/database/tables/:tableName/records/:id", async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const data = dynamicRecordSchema.parse(req.body);
      
      const record = await storage.updateRecord(tableName, id, data);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to update record", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete record
  app.delete("/api/database/tables/:tableName/records/:id", async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const success = await storage.deleteRecord(tableName, id);
      
      if (!success) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      res.json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete record", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
