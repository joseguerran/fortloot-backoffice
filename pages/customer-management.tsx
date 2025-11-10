import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Customer {
  id: string;
  epicAccountId: string;
  email: string;
  tier: 'REGULAR' | 'VIP' | 'PREMIUM';
  isBlacklisted: boolean;
  blacklistReason?: string;
  totalOrders: number;
  totalSpent: number;
  lifetimeValue: number;
  createdAt: string;
}

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    tier: '',
    isBlacklisted: '',
    search: '',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, filters]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.tier && { tier: filters.tier }),
        ...(filters.isBlacklisted && { isBlacklisted: filters.isBlacklisted }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await axios.get(`${API_BASE_URL}/customers?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      setCustomers(response.data.data.customers);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeTier = async (customerId: string, newTier: string) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/customers/${customerId}/tier`,
        { tier: newTier },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      alert('Tier actualizado correctamente');
      setShowTierModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error changing tier:', error);
      alert('Error al actualizar tier');
    }
  };

  const handleBlacklist = async (customerId: string, reason: string) => {
    try {
      await axios.post(
        `${API_BASE_URL}/customers/${customerId}/blacklist`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      alert('Cliente agregado a blacklist');
      setShowBlacklistModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error blacklisting customer:', error);
      alert('Error al agregar a blacklist');
    }
  };

  const handleUnblacklist = async (customerId: string) => {
    if (!confirm('¿Estás seguro de quitar este cliente de la blacklist?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/customers/${customerId}/blacklist`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      alert('Cliente removido de blacklist');
      fetchCustomers();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      alert('Error al remover de blacklist');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PREMIUM': return 'text-yellow-500';
      case 'VIP': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'PREMIUM': return 'bg-yellow-600';
      case 'VIP': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Gestión de Clientes</h1>
          <div className="text-right">
            <p className="text-gray-400">Total Clientes: {customers.length}</p>
            <p className="text-red-500">
              Blacklisted: {customers.filter(c => c.isBlacklisted).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por Epic ID o Email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tiers</option>
              <option value="REGULAR">Regular</option>
              <option value="VIP">VIP</option>
              <option value="PREMIUM">Premium</option>
            </select>
            <select
              value={filters.isBlacklisted}
              onChange={(e) => setFilters({ ...filters, isBlacklisted: e.target.value })}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Solo Blacklisted</option>
              <option value="false">Solo Activos</option>
            </select>
            <button
              onClick={() => setFilters({ tier: '', isBlacklisted: '', search: '' })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Customers Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Cargando clientes...</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left">Epic Account ID</th>
                      <th className="px-6 py-4 text-left">Email</th>
                      <th className="px-6 py-4 text-left">Tier</th>
                      <th className="px-6 py-4 text-right">Órdenes</th>
                      <th className="px-6 py-4 text-right">Total Gastado</th>
                      <th className="px-6 py-4 text-right">Lifetime Value</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {customers.map((customer) => (
                      <tr key={customer.id} className={customer.isBlacklisted ? 'bg-red-900/20' : ''}>
                        <td className="px-6 py-4 font-mono text-sm">{customer.epicAccountId}</td>
                        <td className="px-6 py-4 text-sm">{customer.email}</td>
                        <td className="px-6 py-4">
                          <span className={`${getTierBg(customer.tier)} px-3 py-1 rounded text-sm font-semibold`}>
                            {customer.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">{customer.totalOrders}</td>
                        <td className="px-6 py-4 text-right">${customer.totalSpent.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-green-500">${customer.lifetimeValue.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          {customer.isBlacklisted ? (
                            <span className="bg-red-600 px-3 py-1 rounded text-sm">BLACKLISTED</span>
                          ) : (
                            <span className="bg-green-600 px-3 py-1 rounded text-sm">ACTIVO</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowTierModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            >
                              Cambiar Tier
                            </button>
                            {customer.isBlacklisted ? (
                              <button
                                onClick={() => handleUnblacklist(customer.id)}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                              >
                                Desbloquear
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowBlacklistModal(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                              >
                                Blacklist
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 bg-gray-800 rounded">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tier Modal */}
      {showTierModal && selectedCustomer && (
        <TierModal
          customer={selectedCustomer}
          onClose={() => setShowTierModal(false)}
          onChange={handleChangeTier}
        />
      )}

      {/* Blacklist Modal */}
      {showBlacklistModal && selectedCustomer && (
        <BlacklistModal
          customer={selectedCustomer}
          onClose={() => setShowBlacklistModal(false)}
          onBlacklist={handleBlacklist}
        />
      )}
    </div>
  );
}

function TierModal({
  customer,
  onClose,
  onChange,
}: {
  customer: Customer;
  onClose: () => void;
  onChange: (customerId: string, newTier: string) => void;
}) {
  const [newTier, setNewTier] = useState(customer.tier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(customer.id, newTier);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Cambiar Tier de Cliente</h2>
        <p className="text-gray-400 mb-4">Cliente: {customer.epicAccountId}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nuevo Tier</label>
            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="REGULAR">Regular</option>
              <option value="VIP">VIP</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg"
            >
              Cambiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlacklistModal({
  customer,
  onClose,
  onBlacklist,
}: {
  customer: Customer;
  onClose: () => void;
  onBlacklist: (customerId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Debes proporcionar una razón');
      return;
    }
    onBlacklist(customer.id, reason);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-red-500">Agregar a Blacklist</h2>
        <p className="text-gray-400 mb-4">Cliente: {customer.epicAccountId}</p>
        <p className="text-yellow-500 text-sm mb-4">
          ⚠ Esta acción bloqueará al cliente de realizar nuevas órdenes
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Razón *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Describe la razón del bloqueo..."
              required
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg"
            >
              Blacklist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
