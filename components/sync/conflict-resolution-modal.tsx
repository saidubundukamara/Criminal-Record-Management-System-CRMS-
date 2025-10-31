/**
 * Conflict Resolution Modal
 *
 * UI component for manual resolution of sync conflicts.
 * Shows side-by-side comparison of local vs server data.
 *
 * Pan-African Design:
 * - Clear visual diff for officers
 * - Simple 3-choice UI (Keep Local, Use Server, Merge)
 * - Accessible for low-end devices
 * - Field-by-field selection for merge strategy
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ConflictDetails,
  ConflictResolutionStrategy,
  getFieldDiff,
  getConflictSummary,
} from '@/lib/sync/conflict-detector';
import { AlertCircle, Check, ArrowRight, Info } from 'lucide-react';

interface ConflictResolutionModalProps {
  conflict: ConflictDetails | null;
  open: boolean;
  onResolve: (strategy: ConflictResolutionStrategy, mergedData?: any) => Promise<void>;
  onCancel: () => void;
}

export function ConflictResolutionModal({
  conflict,
  open,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy | null>(
    null
  );
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'local' | 'server'>>({});
  const [isResolving, setIsResolving] = useState(false);

  if (!conflict) return null;

  const handleResolve = async () => {
    if (!selectedStrategy) return;

    setIsResolving(true);
    try {
      let mergedData: any = undefined;

      // If merge strategy, build merged data from field selections
      if (selectedStrategy === 'merge') {
        mergedData = { ...conflict.serverData };

        Object.entries(fieldSelections).forEach(([field, source]) => {
          mergedData[field] = source === 'local' ? conflict.localData[field] : conflict.serverData[field];
        });

        // Ensure all conflict fields have a selection
        const unselectedFields = conflict.conflicts.filter(
          (c) => !(c.field in fieldSelections)
        );

        if (unselectedFields.length > 0) {
          alert(`Please select a version for: ${unselectedFields.map((f) => f.field).join(', ')}`);
          setIsResolving(false);
          return;
        }
      }

      await onResolve(selectedStrategy, mergedData);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleFieldSelection = (field: string, source: 'local' | 'server') => {
    setFieldSelections((prev) => ({
      ...prev,
      [field]: source,
    }));
  };

  const summary = getConflictSummary(conflict);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            The {conflict.entityType} has been modified both locally and on the server.
            Please choose how to resolve this conflict.
          </DialogDescription>
        </DialogHeader>

        {/* Conflict Summary */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{summary}</strong>
            <br />
            {conflict.reason}
          </AlertDescription>
        </Alert>

        {/* Strategy Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Resolution Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Keep Local */}
            <button
              onClick={() => {
                setSelectedStrategy('local');
                setFieldSelections({});
              }}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedStrategy === 'local'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold mb-1">Keep Local Version</div>
              <div className="text-sm text-gray-600">
                Use your offline changes and discard server version
              </div>
              {conflict.recommendedStrategy === 'local' && (
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </button>

            {/* Use Server */}
            <button
              onClick={() => {
                setSelectedStrategy('server');
                setFieldSelections({});
              }}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedStrategy === 'server'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold mb-1">Use Server Version</div>
              <div className="text-sm text-gray-600">
                Discard your offline changes and use server version
              </div>
              {conflict.recommendedStrategy === 'server' && (
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </button>

            {/* Merge Manually */}
            <button
              onClick={() => {
                setSelectedStrategy('merge');
                // Pre-select server values
                const selections: Record<string, 'local' | 'server'> = {};
                conflict.conflicts.forEach((c) => {
                  selections[c.field] = 'server';
                });
                setFieldSelections(selections);
              }}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedStrategy === 'merge'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold mb-1">Merge Manually</div>
              <div className="text-sm text-gray-600">
                Choose specific fields from each version
              </div>
              {conflict.recommendedStrategy === 'merge' && (
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Field-by-Field Comparison (shown for merge strategy) */}
        {selectedStrategy === 'merge' && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-sm">Select Value for Each Field</h3>
            <div className="space-y-3">
              {conflict.conflicts.map((conflictField) => {
                const diff = getFieldDiff(conflictField);
                const selected = fieldSelections[conflictField.field];

                return (
                  <div
                    key={conflictField.field}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <span className="capitalize">{conflictField.field}</span>
                      <Badge variant="outline">{diff.type}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Local Value */}
                      <button
                        onClick={() => handleFieldSelection(conflictField.field, 'local')}
                        className={`p-3 border-2 rounded text-left transition-colors ${
                          selected === 'local'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          Local (updated {conflict.localTimestamp.toLocaleString()})
                        </div>
                        <div className="text-sm font-mono break-all">
                          {diff.localValueDisplay}
                        </div>
                        {selected === 'local' && (
                          <Check className="h-4 w-4 text-blue-600 mt-2" />
                        )}
                      </button>

                      {/* Server Value */}
                      <button
                        onClick={() => handleFieldSelection(conflictField.field, 'server')}
                        className={`p-3 border-2 rounded text-left transition-colors ${
                          selected === 'server'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          Server (updated {conflict.serverTimestamp.toLocaleString()})
                        </div>
                        <div className="text-sm font-mono break-all">
                          {diff.serverValueDisplay}
                        </div>
                        {selected === 'server' && (
                          <Check className="h-4 w-4 text-blue-600 mt-2" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conflict Details (shown for keep local or use server) */}
        {selectedStrategy && selectedStrategy !== 'merge' && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-sm">Conflicting Fields</h3>
            <div className="space-y-2">
              {conflict.conflicts.map((conflictField) => {
                const diff = getFieldDiff(conflictField);
                const showValue = selectedStrategy === 'local' ? diff.localValueDisplay : diff.serverValueDisplay;

                return (
                  <div key={conflictField.field} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{conflictField.field}</span>
                      <Badge variant="outline" className="text-xs">{diff.type}</Badge>
                    </div>
                    <div className="text-sm font-mono text-gray-700 break-all">
                      {showValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onCancel} disabled={isResolving}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selectedStrategy || isResolving}
          >
            {isResolving ? (
              <>Resolving...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Resolve Conflict
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
