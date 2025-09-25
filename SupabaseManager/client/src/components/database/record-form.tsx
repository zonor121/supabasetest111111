import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TableInfo, DynamicRecord } from "@shared/schema";

interface RecordFormProps {
  tableInfo: TableInfo;
  record: DynamicRecord | null;
  onSave: () => void;
  onCancel: () => void;
}

export function RecordForm({ tableInfo, record, onSave, onCancel }: RecordFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initialData: Record<string, any> = {};
    
    tableInfo.columns.forEach(column => {
      if (record) {
        initialData[column.name] = record[column.name] ?? '';
      } else {
        // Set default values for new records
        if (column.primaryKey && column.defaultValue) {
          // Skip auto-generated primary keys
          return;
        }
        
        switch (column.type) {
          case 'boolean':
            initialData[column.name] = false;
            break;
          case 'integer':
          case 'bigint':
          case 'numeric':
            initialData[column.name] = '';
            break;
          default:
            initialData[column.name] = '';
        }
      }
    });
    
    return initialData;
  });

  const primaryKey = tableInfo.columns.find(col => col.primaryKey)?.name || 'id';
  const isEditing = !!record;

  const createMutation = useMutation({
    mutationFn: async (data: DynamicRecord) => {
      const response = await apiRequest(
        'POST',
        `/api/database/tables/${tableInfo.tableName}/records`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/database/tables', tableInfo.tableName],
      });
      toast({
        title: "Success",
        description: "Record created successfully",
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DynamicRecord) => {
      const response = await apiRequest(
        'PUT',
        `/api/database/tables/${tableInfo.tableName}/records/${record![primaryKey]}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/database/tables', tableInfo.tableName],
      });
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission
    const submitData: Record<string, any> = {};
    
    tableInfo.columns.forEach(column => {
      const value = formData[column.name];
      
      // Skip auto-generated primary keys for new records
      if (!isEditing && column.primaryKey && column.defaultValue) {
        return;
      }
      
      // Convert empty strings to null for nullable columns
      if (value === '' && column.nullable) {
        submitData[column.name] = null;
        return;
      }
      
      // Type conversion
      switch (column.type) {
        case 'boolean':
          submitData[column.name] = Boolean(value);
          break;
        case 'integer':
        case 'bigint':
          submitData[column.name] = value === '' ? null : parseInt(value, 10);
          break;
        case 'numeric':
        case 'decimal':
        case 'real':
        case 'double precision':
          submitData[column.name] = value === '' ? null : parseFloat(value);
          break;
        case 'json':
        case 'jsonb':
          try {
            submitData[column.name] = value === '' ? null : JSON.parse(value);
          } catch {
            submitData[column.name] = value;
          }
          break;
        default:
          submitData[column.name] = value;
      }
    });

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleInputChange = (columnName: string, value: any) => {
    setFormData(prev => ({ ...prev, [columnName]: value }));
  };

  const renderInput = (column: any) => {
    const value = formData[column.name] ?? '';
    const isReadonly = isEditing && column.primaryKey;

    switch (column.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={column.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleInputChange(column.name, checked)}
              disabled={isReadonly}
              data-testid={`input-${column.name}`}
            />
            <Label htmlFor={column.name} className="text-sm font-normal">
              {column.name}
            </Label>
          </div>
        );

      case 'text':
        if (column.name.toLowerCase().includes('description') || 
            column.name.toLowerCase().includes('content') ||
            column.name.toLowerCase().includes('notes')) {
          return (
            <Textarea
              id={column.name}
              value={value}
              onChange={(e) => handleInputChange(column.name, e.target.value)}
              placeholder={`Enter ${column.name}`}
              readOnly={isReadonly}
              className={isReadonly ? "bg-muted text-muted-foreground" : ""}
              data-testid={`input-${column.name}`}
            />
          );
        }
        break;

      case 'json':
      case 'jsonb':
        return (
          <Textarea
            id={column.name}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => handleInputChange(column.name, e.target.value)}
            placeholder={`Enter ${column.name} (JSON format)`}
            readOnly={isReadonly}
            className={isReadonly ? "bg-muted text-muted-foreground font-mono" : "font-mono"}
            rows={4}
            data-testid={`input-${column.name}`}
          />
        );
    }

    // Handle special cases based on column name
    if (column.name.toLowerCase() === 'status') {
      return (
        <Select
          value={value}
          onValueChange={(newValue) => handleInputChange(column.name, newValue)}
          disabled={isReadonly}
        >
          <SelectTrigger data-testid={`input-${column.name}`}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (column.name.toLowerCase() === 'role') {
      return (
        <Select
          value={value}
          onValueChange={(newValue) => handleInputChange(column.name, newValue)}
          disabled={isReadonly}
        >
          <SelectTrigger data-testid={`input-${column.name}`}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Default input
    const inputType = ['integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision'].includes(column.type)
      ? 'number'
      : column.type.includes('timestamp') || column.type.includes('date')
      ? 'datetime-local'
      : column.name.toLowerCase().includes('email')
      ? 'email'
      : column.name.toLowerCase().includes('password')
      ? 'password'
      : 'text';

    return (
      <Input
        id={column.name}
        type={inputType}
        value={value}
        onChange={(e) => handleInputChange(column.name, e.target.value)}
        placeholder={`Enter ${column.name}`}
        readOnly={isReadonly}
        className={isReadonly ? "bg-muted text-muted-foreground" : ""}
        data-testid={`input-${column.name}`}
      />
    );
  };

  return (
    <div data-testid="record-form">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Edit Record' : 'Add New Record'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tableInfo.columns.map((column) => (
            <div key={column.name} className="space-y-2">
              <Label htmlFor={column.name} className="text-sm font-medium">
                {column.name}
                {!column.nullable && (
                  <span className="text-destructive ml-1">*</span>
                )}
                <span className="text-xs text-muted-foreground ml-2">
                  ({column.type})
                </span>
              </Label>
              {renderInput(column)}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-save"
          >
            {createMutation.isPending || updateMutation.isPending
              ? (isEditing ? 'Saving...' : 'Creating...')
              : (isEditing ? 'Save Changes' : 'Add Record')
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
