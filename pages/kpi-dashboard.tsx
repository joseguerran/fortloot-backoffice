import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const COLORS = ['#FF3E9A', '#00E5FF', '#C1FF00', '#FF6B35', '#9B5DE5', '#00F5D4'];

interface RevenueKPI {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
  profitMargin: number;
}

interface ProductKPI {
  productType: string;
  totalSales: number;
  revenue: number;
  profit: number;
  orderCount: number;
  averagePrice: number;
}

interface TierKPI {
  tier: string;
  customerCount: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  averageLifetimeValue: number;
}

export default function KPIDashboardPage() {
  const [revenueKPI, setRevenueKPI] = useState<RevenueKPI | null>(null);
  const [productKPIs, setProductKPIs] = useState<ProductKPI[]>([]);
  const [tierKPIs, setTierKPIs] = useState<TierKPI[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAllKPIs();
  }, [dateRange]);

  const fetchAllKPIs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Calculate date range
      const params: any = {};
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.startDate = startDate.toISOString();
      }

      const [revenue, products, tiers, trend, topProd, topCust] = await Promise.all([
        axios.get(`${API_BASE_URL}/kpis/revenue`, { headers, params }),
        axios.get(`${API_BASE_URL}/kpis/products`, { headers, params }),
        axios.get(`${API_BASE_URL}/kpis/tiers`, { headers, params }),
        axios.get(`${API_BASE_URL}/kpis/daily-trend?days=${dateRange === 'all' ? 90 : parseInt(dateRange)}`, { headers }),
        axios.get(`${API_BASE_URL}/kpis/top-products?limit=5`, { headers, params }),
        axios.get(`${API_BASE_URL}/kpis/top-customers?limit=10`, { headers, params }),
      ]);

      setRevenueKPI(revenue.data.data);
      setProductKPIs(products.data.data);
      setTierKPIs(tiers.data.data);
      setDailyTrend(trend.data.data);
      setTopProducts(topProd.data.data);
      setTopCustomers(topCust.data.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Cargando KPIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard de KPIs</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>

        {/* Revenue KPIs */}
        {revenueKPI && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
              <div className="text-sm text-green-100 mb-2">Revenue Total</div>
              <div className="text-3xl font-bold">${revenueKPI.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-lg p-6">
              <div className="text-sm text-cyan-100 mb-2">Profit Total</div>
              <div className="text-3xl font-bold">${revenueKPI.totalProfit.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
              <div className="text-sm text-blue-100 mb-2">Total Órdenes</div>
              <div className="text-3xl font-bold">{revenueKPI.totalOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
              <div className="text-sm text-purple-100 mb-2">AOV</div>
              <div className="text-3xl font-bold">${revenueKPI.averageOrderValue.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg p-6">
              <div className="text-sm text-pink-100 mb-2">Margen Profit</div>
              <div className="text-3xl font-bold">{revenueKPI.profitMargin.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Daily Revenue Trend */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Tendencia de Revenue Diaria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#06B6D4" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product and Tier KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Products by Revenue */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Revenue por Tipo de Producto</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productKPIs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="productType" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#FF3E9A" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tiers Distribution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Revenue por Tier de Cliente</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierKPIs}
                  dataKey="totalRevenue"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.tier}: $${entry.totalRevenue.toFixed(0)}`}
                >
                  {tierKPIs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Top 5 Productos</h2>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="font-bold">{product.productName}</div>
                    <div className="text-sm text-gray-400">{product.productType}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-500">${product.revenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">{product.salesCount} ventas</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Top 10 Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Epic Account ID</th>
                  <th className="px-4 py-3 text-left">Tier</th>
                  <th className="px-4 py-3 text-right">Órdenes</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-right">LTV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {topCustomers.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 font-bold text-gray-500">#{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm">{customer.epicAccountId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        customer.tier === 'PREMIUM' ? 'bg-yellow-600' :
                        customer.tier === 'VIP' ? 'bg-purple-600' : 'bg-gray-600'
                      }`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{customer.totalOrders}</td>
                    <td className="px-4 py-3 text-right text-green-500">${customer.totalRevenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-cyan-500">${customer.totalProfit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold">${customer.lifetimeValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier Details Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Detalles por Tier</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Tier</th>
                  <th className="px-4 py-3 text-right">Clientes</th>
                  <th className="px-4 py-3 text-right">Órdenes</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-right">AOV</th>
                  <th className="px-4 py-3 text-right">Avg LTV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tierKPIs.map((tier, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded font-semibold ${
                        tier.tier === 'PREMIUM' ? 'bg-yellow-600' :
                        tier.tier === 'VIP' ? 'bg-purple-600' : 'bg-gray-600'
                      }`}>
                        {tier.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{tier.customerCount}</td>
                    <td className="px-4 py-3 text-right">{tier.totalOrders}</td>
                    <td className="px-4 py-3 text-right text-green-500">${tier.totalRevenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-cyan-500">${tier.totalProfit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${tier.averageOrderValue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold">${tier.averageLifetimeValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
