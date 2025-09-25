import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/database/sidebar";
import { DataTable } from "@/components/database/data-table";
import { RecordForm } from "@/components/database/record-form";
import { DeleteDialog } from "@/components/database/delete-dialog";
import { FilterDialog } from "@/components/database/filter-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { TableInfo, DynamicRecord, PaginationParams } from "@shared/schema";

export default function DatabaseInterface() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DynamicRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DynamicRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState<Pick<PaginationParams, 'page' | 'limit' | 'sortBy' | 'sortOrder'>>({
    page: 1,
    limit: 25,
    sortBy: undefined,
    sortOrder: "asc",
  });

  // Test database connection
  const { data: connectionStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/database/test"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get all tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery<TableInfo[]>({
    queryKey: ["/api/database/tables"],
  });

  // Get selected table info
  const { data: tableInfo } = useQuery<TableInfo>({
    queryKey: ["/api/database/tables", selectedTable],
    enabled: !!selectedTable,
  });

  // Get table records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery<{
    data: DynamicRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: [
      "/api/database/tables", 
      selectedTable, 
      "records", 
      { 
        ...pagination, 
        search: searchTerm,
        filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
      }
    ],
    enabled: !!selectedTable,
  });

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    setSearchTerm("");
    setFilters({});
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowAddModal(true);
  };

  const handleEditRecord = (record: DynamicRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleDeleteRecord = (record: DynamicRecord) => {
    setDeletingRecord(record);
    setShowDeleteDialog(true);
  };

  const handleRecordSaved = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingRecord(null);
    refetchRecords();
  };

  const handleRecordDeleted = () => {
    setShowDeleteDialog(false);
    setDeletingRecord(null);
    refetchRecords();
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilterDialog(false);
  };

  const handleSort = (column: string) => {
    setPagination(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  return (
    <div className="flex h-screen" data-testid="database-interface">
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        connectionStatus={connectionStatus?.connected || false}
        isLoading={tablesLoading}
        onTableSelect={handleTableSelect}
        data-testid="sidebar"
      />

      <div className="flex-1 flex flex-col">
        <DataTable
          tableInfo={tableInfo}
          recordsData={recordsData}
          isLoading={recordsLoading}
          searchTerm={searchTerm}
          filters={filters}
          pagination={pagination}
          onAddRecord={handleAddRecord}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
          onSearch={handleSearch}
          onFilter={() => setShowFilterDialog(true)}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          data-testid="data-table"
        />
      </div>

      {/* Add Record Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {tableInfo && (
            <RecordForm
              tableInfo={tableInfo}
              record={null}
              onSave={handleRecordSaved}
              onCancel={() => setShowAddModal(false)}
              data-testid="add-record-form"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Record Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {tableInfo && editingRecord && (
            <RecordForm
              tableInfo={tableInfo}
              record={editingRecord}
              onSave={handleRecordSaved}
              onCancel={() => setShowEditModal(false)}
              data-testid="edit-record-form"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingRecord && selectedTable && (
        <DeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          tableName={selectedTable}
          record={deletingRecord}
          onDeleted={handleRecordDeleted}
          data-testid="delete-dialog"
        />
      )}

      {/* Filter Dialog */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        tableInfo={tableInfo}
        currentFilters={filters}
        onApplyFilters={handleFilter}
        data-testid="filter-dialog"
      />
    </div>
  );
}
