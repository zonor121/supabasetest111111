import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TableInfo } from "@shared/schema";

interface FilterRule {
  column: string;
  operator: string;
  value: string;
}

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableInfo?: TableInfo;
  currentFilters: Record<string, any>;
  onApplyFilters: (filters: Record<string, any>) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'is_null', label: 'Is null' },
  { value: 'is_not_null', label: 'Is not null' },
];

export function FilterDialog({
  open,
  onOpenChange,
  tableInfo,
  currentFilters,
  onApplyFilters,
}: FilterDialogProps) {
  const [filterRules, setFilterRules] = useState<FilterRule[]>(() => {
    // Convert current filters to filter rules
    return Object.entries(currentFilters).map(([column, value]) => ({
      column,
      operator: 'equals',
      value: String(value),
    }));
  });

  if (!tableInfo) {
    return null;
  }

  const addFilterRule = () => {
    setFilterRules(prev => [
      ...prev,
      { column: '', operator: 'equals', value: '' }
    ]);
  };

  const removeFilterRule = (index: number) => {
    setFilterRules(prev => prev.filter((_, i) => i !== index));
  };

  const updateFilterRule = (index: number, field: keyof FilterRule, value: string) => {
    setFilterRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    ));
  };

  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    
    filterRules.forEach(rule => {
      if (rule.column && rule.operator) {
        if (rule.operator === 'is_null' || rule.operator === 'is_not_null') {
          filters[rule.column] = rule.operator === 'is_null' ? null : { not: null };
        } else if (rule.value !== '') {
          // For now, we'll use simple equality filtering
          // In a real app, you'd implement more complex operators
          filters[rule.column] = rule.value;
        }
      }
    });
    
    onApplyFilters(filters);
  };

  const handleClearAll = () => {
    setFilterRules([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="filter-dialog">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {filterRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No filters applied</p>
              <Button
                onClick={addFilterRule}
                variant="outline"
                className="mt-4"
                data-testid="button-add-first-filter"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Filter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filterRules.map((rule, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg"
                  data-testid={`filter-rule-${index}`}
                >
                  <div>
                    <Label htmlFor={`column-${index}`} className="text-sm font-medium">
                      Column
                    </Label>
                    <Select
                      value={rule.column}
                      onValueChange={(value) => updateFilterRule(index, 'column', value)}
                    >
                      <SelectTrigger data-testid={`select-column-${index}`}>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tableInfo.columns.map((column) => (
                          <SelectItem key={column.name} value={column.name}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`operator-${index}`} className="text-sm font-medium">
                      Operator
                    </Label>
                    <Select
                      value={rule.operator}
                      onValueChange={(value) => updateFilterRule(index, 'operator', value)}
                    >
                      <SelectTrigger data-testid={`select-operator-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`value-${index}`} className="text-sm font-medium">
                      Value
                    </Label>
                    <Input
                      id={`value-${index}`}
                      value={rule.value}
                      onChange={(e) => updateFilterRule(index, 'value', e.target.value)}
                      placeholder="Enter value..."
                      disabled={rule.operator === 'is_null' || rule.operator === 'is_not_null'}
                      data-testid={`input-value-${index}`}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFilterRule(index)}
                      data-testid={`button-remove-filter-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                onClick={addFilterRule}
                variant="outline"
                className="w-full"
                data-testid="button-add-filter"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Filter
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
          <Button
            variant="outline"
            onClick={handleClearAll}
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApplyFilters}
            data-testid="button-apply-filters"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
