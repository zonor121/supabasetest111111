import { useState } from "react";
import { Search, Filter, Download, Settings, Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TableInfo, DynamicRecord, PaginationParams } from "@shared/schema";

interface DataTableProps {
  tableInfo?: TableInfo;
  recordsData?: {
    data: DynamicRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading: boolean;
  searchTerm: string;
  filters: Record<string, any>;
  pagination: Pick<PaginationParams, 'page' | 'limit' | 'sortBy' | 'sortOrder'>;
  onAddRecord: () => void;
  onEditRecord: (record: DynamicRecord) => void;
  onDeleteRecord: (record: DynamicRecord) => void;
  onSearch: (term: string) => void;
  onFilter: () => void;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function DataTable({
  tableInfo,
  recordsData,
  isLoading,
  searchTerm,
  filters,
  pagination,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  onLimitChange,
}: DataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  if (!tableInfo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Select a Table</h3>
          <p className="text-muted-foreground">Choose a table from the sidebar to view its data</p>
        </div>
      </div>
    );
  }

  const primaryKey = tableInfo.columns.find(col => col.primaryKey)?.name || 'id';
  const records = recordsData?.data || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(records.map(record => String(record[primaryKey]))));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const formatValue = (value: any, column: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (column.type.includes('timestamp') || column.type.includes('date')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const getStatusBadge = (value: any) => {
    const stringValue = String(value).toLowerCase();
    if (stringValue === 'active') {
      return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Active</Badge>;
    }
    if (stringValue === 'inactive') {
      return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Inactive</Badge>;
    }
    if (stringValue === 'pending') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">Pending</Badge>;
    }
    return <Badge variant="secondary">{value}</Badge>;
  };

  const renderCellValue = (value: any, column: any) => {
    if (column.name.toLowerCase() === 'status') {
      return getStatusBadge(value);
    }
    return formatValue(value, column);
  };

  return (
    <div className="flex-1 flex flex-col" data-testid="data-table">
      {/* Top Bar */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold" data-testid="table-name">
              {tableInfo.tableName}
            </h2>
            <span className="text-sm text-muted-foreground" data-testid="record-count">
              {recordsData?.total.toLocaleString() || 0} records
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={onAddRecord} data-testid="button-add-record">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
            
            <Button variant="outline" size="icon" data-testid="button-export">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon" data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <Button variant="outline" onClick={onFilter} data-testid="button-filter">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {Object.keys(filters).length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
          
          <Select 
            value={String(pagination.limit)} 
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="w-40" data-testid="select-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto scrollbar-hide">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <table className="w-full" data-testid="records-table">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur">
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 font-medium text-sm">
                    <Checkbox
                      checked={selectedRows.size === records.length && records.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  {tableInfo.columns.map((column) => (
                    <th
                      key={column.name}
                      className="text-left px-6 py-4 font-medium text-sm cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => onSort(column.name)}
                      data-testid={`column-header-${column.name}`}
                    >
                      <div className="flex items-center gap-2">
                        {column.name}
                        {pagination.sortBy === column.name && (
                          <span className="text-xs">
                            {pagination.sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-left px-6 py-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const recordId = String(record[primaryKey]);
                  return (
                    <tr
                      key={recordId}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                      data-testid={`row-${recordId}`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedRows.has(recordId)}
                          onCheckedChange={(checked) => handleSelectRow(recordId, !!checked)}
                          data-testid={`checkbox-row-${recordId}`}
                        />
                      </td>
                      {tableInfo.columns.map((column) => (
                        <td
                          key={column.name}
                          className={`px-6 py-4 ${
                            column.primaryKey ? 'font-mono text-sm' : ''
                          } ${
                            column.type.includes('text') || column.type.includes('varchar')
                              ? 'max-w-xs truncate'
                              : ''
                          }`}
                          data-testid={`cell-${recordId}-${column.name}`}
                        >
                          {renderCellValue(record[column.name], column)}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRecord(record)}
                            data-testid={`button-edit-${recordId}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRecord(record)}
                            data-testid={`button-delete-${recordId}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableInfo.columns.length + 2}
                      className="px-6 py-12 text-center text-muted-foreground"
                      data-testid="empty-state"
                    >
                      {searchTerm || Object.keys(filters).length > 0
                        ? "No records match your search criteria"
                        : "No records found in this table"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Pagination */}
      {recordsData && recordsData.totalPages > 1 && (
        <div className="bg-card border-t border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground" data-testid="pagination-info">
              Showing {((recordsData.page - 1) * recordsData.limit) + 1} to{' '}
              {Math.min(recordsData.page * recordsData.limit, recordsData.total)} of{' '}
              {recordsData.total.toLocaleString()} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(recordsData.page - 1)}
                disabled={recordsData.page <= 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page numbers */}
              {[...Array(Math.min(5, recordsData.totalPages))].map((_, i) => {
                let pageNum: number;
                if (recordsData.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (recordsData.page <= 3) {
                  pageNum = i + 1;
                } else if (recordsData.page >= recordsData.totalPages - 2) {
                  pageNum = recordsData.totalPages - 4 + i;
                } else {
                  pageNum = recordsData.page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={recordsData.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {recordsData.totalPages > 5 && recordsData.page < recordsData.totalPages - 2 && (
                <>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(recordsData.totalPages)}
                    data-testid="button-last-page"
                  >
                    {recordsData.totalPages}
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(recordsData.page + 1)}
                disabled={recordsData.page >= recordsData.totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
