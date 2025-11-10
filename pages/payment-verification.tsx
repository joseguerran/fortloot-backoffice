import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PendingPayment {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentProofUrl?: string;
  paymentNotes?: string;
  paymentUploadedAt?: string;
  customer: {
    id: string;
    epicAccountId: string;
    email: string;
    tier: string;
    isBlacklisted: boolean;
  };
  items: Array<{
    catalogItem: {
      name: string;
      type: string;
    };
    quantity: number;
    priceAtPurchase: number;
  }>;
}

interface PaymentStats {
  pendingPayment: number;
  paymentUploaded: number;
  paymentVerified: number;
  paymentRejected: number;
  totalRevenue: number;
  totalProfit: number;
  averageVerificationTimeMinutes: number;
}

export default function PaymentVerificationPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPayments();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/pending?page=${currentPage}&limit=10`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      setPayments(response.data.data.orders);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVerifyPayment = async (orderId: string, approved: boolean, rejectionReason?: string) => {
    try {
      await axios.post(
        `${API_BASE_URL}/payments/orders/${orderId}/verify`,
        {
          approved,
          rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      alert(approved ? 'Pago verificado correctamente' : 'Pago rechazado');
      setShowVerifyModal(false);
      setSelectedPayment(null);
      fetchPayments();
      fetchStats();
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error al verificar pago');
    }
  };

  const viewImage = (url: string) => {
    setImageUrl(url);
    setShowImageModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Verificación de Pagos</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-orange-600 rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">{stats.paymentUploaded}</div>
              <div className="text-sm">Pendientes de Verificación</div>
            </div>
            <div className="bg-green-600 rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">{stats.paymentVerified}</div>
              <div className="text-sm">Verificados</div>
            </div>
            <div className="bg-red-600 rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">{stats.paymentRejected}</div>
              <div className="text-sm">Rechazados</div>
            </div>
            <div className="bg-blue-600 rounded-lg p-6">
              <div className="text-3xl font-bold mb-2">{stats.averageVerificationTimeMinutes}min</div>
              <div className="text-sm">Tiempo Promedio</div>
            </div>
          </div>
        )}

        {/* Revenue Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Revenue Total</div>
              <div className="text-3xl font-bold text-green-500">${stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Profit Total</div>
              <div className="text-3xl font-bold text-cyan-500">${stats.totalProfit.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Pending Payments List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Cargando pagos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">No hay pagos pendientes</h2>
            <p className="text-gray-400">Todos los pagos han sido verificados</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Orden #{payment.orderNumber}</h3>
                      <p className="text-gray-400 text-sm">
                        Cliente: {payment.customer.epicAccountId} ({payment.customer.email})
                      </p>
                      {payment.customer.isBlacklisted && (
                        <span className="bg-red-600 text-xs px-2 py-1 rounded mt-1 inline-block">
                          ⚠ BLACKLISTED
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">${payment.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Subido: {payment.paymentUploadedAt ? new Date(payment.paymentUploadedAt).toLocaleString('es') : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-700 rounded-lg p-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Método de Pago</div>
                      <div className="font-semibold">{payment.paymentMethod || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">ID de Transacción</div>
                      <div className="font-mono text-sm">{payment.transactionId || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Tier del Cliente</div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          payment.customer.tier === 'PREMIUM' ? 'bg-yellow-600' :
                          payment.customer.tier === 'VIP' ? 'bg-purple-600' : 'bg-gray-600'
                        }`}>
                          {payment.customer.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {payment.paymentNotes && (
                    <div className="bg-gray-700 rounded-lg p-3 mb-4">
                      <div className="text-xs text-gray-400 mb-1">Notas del Cliente:</div>
                      <div className="text-sm">{payment.paymentNotes}</div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2">Items del Pedido:</div>
                    <div className="space-y-2">
                      {payment.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-gray-700 rounded px-3 py-2">
                          <span>{item.catalogItem.name} x{item.quantity}</span>
                          <span className="font-semibold">${(item.priceAtPurchase * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {payment.paymentProofUrl && (
                      <button
                        onClick={() => viewImage(payment.paymentProofUrl!)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
                      >
                        Ver Comprobante
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowVerifyModal(true);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
                    >
                      Verificar Pago
                    </button>
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

      {/* Verify Modal */}
      {showVerifyModal && selectedPayment && (
        <VerifyModal
          payment={selectedPayment}
          onClose={() => {
            setShowVerifyModal(false);
            setSelectedPayment(null);
          }}
          onVerify={handleVerifyPayment}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img src={imageUrl} alt="Comprobante" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

function VerifyModal({
  payment,
  onClose,
  onVerify,
}: {
  payment: PendingPayment;
  onClose: () => void;
  onVerify: (orderId: string, approved: boolean, rejectionReason?: string) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Debes proporcionar una razón para rechazar');
      return;
    }

    onVerify(payment.id, action === 'approve', rejectionReason);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Verificar Pago</h2>
        <p className="text-gray-400 mb-2">Orden: #{payment.orderNumber}</p>
        <p className="text-gray-400 mb-6">Monto: ${payment.totalAmount.toFixed(2)}</p>

        {action === 'reject' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Razón del Rechazo *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Explica por qué se rechaza el pago..."
            />
          </div>
        )}

        <div className="flex gap-4">
          {!action ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => setAction('approve')}
                className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg"
              >
                Aprobar
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg"
              >
                Rechazar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAction(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg"
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirmar {action === 'approve' ? 'Aprobación' : 'Rechazo'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
