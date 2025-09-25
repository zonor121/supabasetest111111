import { queryClient } from "./queryClient";
import type { TableInfo, DynamicRecord, PaginationParams } from "@shared/schema";

export class DatabaseService {
  static async testConnection(): Promise<boolean> {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["/api/database/test"],
      }) as { connected: boolean };
      return data.connected;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  static async getTables(): Promise<TableInfo[]> {
    return queryClient.fetchQuery({
      queryKey: ["/api/database/tables"],
    });
  }

  static async getTableInfo(tableName: string): Promise<TableInfo> {
    return queryClient.fetchQuery({
      queryKey: ["/api/database/tables", tableName],
    });
  }

  static async getRecords(
    tableName: string,
    params: PaginationParams
  ): Promise<{
    data: DynamicRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.filters && { filters: JSON.stringify(params.filters) }),
    });

    return queryClient.fetchQuery({
      queryKey: [
        "/api/database/tables",
        tableName,
        "records",
        Object.fromEntries(queryParams),
      ],
    });
  }

  static async getRecord(tableName: string, id: string): Promise<DynamicRecord> {
    return queryClient.fetchQuery({
      queryKey: ["/api/database/tables", tableName, "records", id],
    });
  }

  static formatColumnValue(value: any, columnType: string): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }

    if (columnType.includes("timestamp") || columnType.includes("date")) {
      try {
        return new Date(value).toISOString().slice(0, 16);
      } catch {
        return String(value);
      }
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  static parseColumnValue(value: string, columnType: string): any {
    if (value === "") {
      return null;
    }

    switch (columnType) {
      case "boolean":
        return value === "true";
      case "integer":
      case "bigint":
        return parseInt(value, 10);
      case "numeric":
      case "decimal":
      case "real":
      case "double precision":
        return parseFloat(value);
      case "json":
      case "jsonb":
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}
