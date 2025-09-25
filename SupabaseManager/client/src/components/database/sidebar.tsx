import { Database, Table, Wifi, WifiOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TableInfo } from "@shared/schema";

interface SidebarProps {
  tables: TableInfo[];
  selectedTable: string | null;
  connectionStatus: boolean;
  isLoading: boolean;
  onTableSelect: (tableName: string) => void;
}

export function Sidebar({ 
  tables, 
  selectedTable, 
  connectionStatus, 
  isLoading, 
  onTableSelect 
}: SidebarProps) {
  return (
    <div className="w-80 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Database className="text-primary-foreground text-sm" />
          </div>
          <h1 className="text-xl font-semibold">Database Interface</h1>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm" data-testid="connection-status">
          {connectionStatus ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">Connected to Supabase</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Disconnected</span>
            </>
          )}
        </div>
      </div>
      
      {/* Tables List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Tables
          </h2>
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-1" data-testid="tables-list">
              {tables.map((table) => (
                <div
                  key={table.tableName}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    selectedTable === table.tableName
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onTableSelect(table.tableName)}
                  data-testid={`table-${table.tableName}`}
                >
                  <div className="flex items-center gap-2">
                    <Table 
                      className={`text-sm ${
                        selectedTable === table.tableName ? "text-primary" : "text-muted-foreground"
                      }`} 
                    />
                    <span 
                      className={selectedTable === table.tableName ? "font-medium" : ""}
                    >
                      {table.tableName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {table.rowCount.toLocaleString()}
                  </span>
                </div>
              ))}
              
              {tables.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Table className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">No tables found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Actions */}
      <div className="p-4 border-t border-border">
        <Button 
          className="w-full" 
          variant="secondary"
          disabled={!connectionStatus}
          data-testid="button-create-table"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Table
        </Button>
      </div>
    </div>
  );
}
