import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DynamicRecord } from "@shared/schema";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  record: DynamicRecord;
  onDeleted: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  tableName,
  record,
  onDeleted,
}: DeleteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get a primary key or first field to identify the record
  const recordIdentifier = record.id || record.name || record.username || record.email || 
    Object.values(record)[0] || 'Unknown';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const primaryKey = record.id || Object.keys(record)[0];
      const recordId = record[primaryKey];
      
      await apiRequest(
        'DELETE',
        `/api/database/tables/${tableName}/records/${recordId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/database/tables', tableName],
      });
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      onDeleted();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="delete-dialog">
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-destructive text-lg h-6 w-6" />
            </div>
            <div>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted/50 rounded-md">
          <p className="text-sm">Are you sure you want to delete this record?</p>
          <p className="font-medium mt-1" data-testid="record-identifier">
            {String(recordIdentifier)}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Record"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
