'use client';

import { useState, useEffect } from 'react';
import { logsApi, type BotError } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface BotErrorLogProps {
  botId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function BotErrorLog({
  botId,
  autoRefresh = false,
  refreshInterval = 30000,
}: BotErrorLogProps) {
  const [errors, setErrors] = useState<BotError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchErrors = async () => {
    try {
      setError(null);
      const response = await logsApi.getBotErrors(botId, 100);
      setErrors(response.errors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();

    if (autoRefresh) {
      const interval = setInterval(fetchErrors, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [botId, autoRefresh, refreshInterval]);

  const filteredErrors = errors.filter((err) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      err.message.toLowerCase().includes(search) ||
      err.orderId?.toLowerCase().includes(search) ||
      err.itemName?.toLowerCase().includes(search) ||
      err.error?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={fetchErrors}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={fetchErrors}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Error count */}
      <div className="text-sm text-gray-600">
        {filteredErrors.length === 0 ? (
          <span className="text-green-600">✓ No errors found</span>
        ) : (
          <span>
            Showing {filteredErrors.length} error{filteredErrors.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error list */}
      {filteredErrors.length > 0 && (
        <div className="space-y-3">
          {filteredErrors.map((err, index) => (
            <div
              key={index}
              className="bg-white border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Timestamp and level */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">
                      {formatDistanceToNow(new Date(err.timestamp), { addSuffix: true })}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      ERROR
                    </span>
                    {err.botId && (
                      <span className="text-gray-600 text-xs">
                        Bot: {err.botId.substring(0, 8)}...
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-gray-900 font-medium">{err.message}</p>

                  {/* Additional details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {err.orderId && (
                      <span>
                        <strong>Order:</strong> {err.orderId.substring(0, 8)}...
                      </span>
                    )}
                    {err.itemName && (
                      <span>
                        <strong>Item:</strong> {err.itemName}
                      </span>
                    )}
                    {err.itemId && (
                      <span className="text-xs text-gray-500">ID: {err.itemId}</span>
                    )}
                  </div>

                  {/* Error details */}
                  {err.error && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                      <code className="text-xs text-gray-700 break-all">{err.error}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredErrors.length === 0 && errors.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No errors match your search criteria
        </div>
      )}
    </div>
  );
}
