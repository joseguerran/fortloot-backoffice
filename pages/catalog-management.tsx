import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CatalogItem {
  id: string;
  itemId?: string;
  name: string;
  description: string;
  type: string;
  rarity?: string;
  image: string;
  baseVbucks?: number;
  basePriceUsd?: number;
  profitMargin?: number;
  discount: number;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  isCustom: boolean;
  requiresManualProcess: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function CatalogManagementPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    isCustom: '',
    search: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [currentPage, filters]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.type && { type: filters.type }),
        ...(filters.isCustom && { isCustom: filters.isCustom }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await axios.get(`${API_BASE_URL}/catalog/items?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      setItems(response.data.data.items);
      setTotalPages(response.data.data.pagination.pages);
      setTotalItems(response.data.data.pagination.total);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCatalog = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/catalog/update`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      alert('Catálogo actualizado correctamente');
      fetchItems();
    } catch (error) {
      console.error('Error updating catalog:', error);
      alert('Error al actualizar catálogo');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar este item?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/catalog/items/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      alert('Item desactivado');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al desactivar item');
    }
  };

  const handleCreateFlashSale = async (itemId: string, price: number, hours: number) => {
    try {
      await axios.post(
        `${API_BASE_URL}/catalog/items/${itemId}/flash-sale`,
        {
          flashSalePrice: price,
          durationHours: hours,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );
      alert('Flash sale creada');
      setShowFlashSaleModal(false);
      fetchItems();
    } catch (error) {
      console.error('Error creating flash sale:', error);
      alert('Error al crear flash sale');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Gestión de Catálogo</h1>
          <div className="space-x-4">
            <button
              onClick={handleUpdateCatalog}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Actualizar Catálogo (API)
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
            >
              + Crear Item Custom
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-300">
              Filtros
            </h2>
            <div className="bg-blue-600/20 border border-blue-500/50 px-4 py-2 rounded-lg">
              <span className="text-blue-400 font-semibold">
                Total de items: <span className="text-white text-xl">{totalItems}</span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="SKIN">Skin</option>
              <option value="PICKAXE">Pickaxe</option>
              <option value="EMOTE">Emote</option>
              <option value="GLIDER">Glider</option>
              <option value="BACKPACK">Backpack</option>
              <option value="BUNDLE">Bundle</option>
              <option value="VBUCKS">V-Bucks</option>
              <option value="BATTLE_PASS">Battle Pass</option>
              <option value="WRAP">Wrap</option>
            </select>
            <select
              value={filters.isCustom}
              onChange={(e) => setFilters({ ...filters, isCustom: e.target.value })}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Solo Custom</option>
              <option value="false">Solo API</option>
            </select>
            <button
              onClick={() => setFilters({ type: '', isCustom: '', search: '' })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Cargando items...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      {item.isCustom && (
                        <span className="bg-purple-600 text-xs px-2 py-1 rounded">CUSTOM</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{item.type}</p>
                    <div className="space-y-1 text-sm mb-4">
                      {item.baseVbucks && (
                        <p>V-Bucks: {item.baseVbucks}</p>
                      )}
                      {item.basePriceUsd && (
                        <p>Precio USD: ${item.basePriceUsd}</p>
                      )}
                      {item.profitMargin && (
                        <p>Margen: {item.profitMargin}%</p>
                      )}
                      {item.discount > 0 && (
                        <p className="text-green-500">Descuento: {item.discount}%</p>
                      )}
                      {item.flashSalePrice && item.flashSaleEndsAt && new Date(item.flashSaleEndsAt) > new Date() && (
                        <p className="text-yellow-500">Flash Sale: ${item.flashSalePrice}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowEditModal(true);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowFlashSaleModal(true);
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2 rounded"
                      >
                        Flash Sale
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-4 bg-red-600 hover:bg-red-700 py-2 rounded"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Create/Edit/Flash Sale Modals would go here */}
      {showFlashSaleModal && selectedItem && (
        <FlashSaleModal
          item={selectedItem}
          onClose={() => setShowFlashSaleModal(false)}
          onCreate={handleCreateFlashSale}
        />
      )}
    </div>
  );
}

function FlashSaleModal({
  item,
  onClose,
  onCreate,
}: {
  item: CatalogItem;
  onClose: () => void;
  onCreate: (itemId: string, price: number, hours: number) => void;
}) {
  const [price, setPrice] = useState('');
  const [hours, setHours] = useState('24');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(item.id, parseFloat(price), parseInt(hours));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Crear Flash Sale</h2>
        <p className="text-gray-400 mb-4">Item: {item.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Precio Flash Sale (USD)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duración (horas)</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-3 rounded-lg"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
