import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, CheckCircle, RefreshCw, ArrowLeft, Phone, Mail, 
  MapPin, FileText, DollarSign, X, Send, Edit, Trash2, Plus,
  TrendingUp, Calendar, MessageSquare, Settings, Search, Bell,
  BarChart3, PieChart, Activity, Users, Sparkles, Check, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions: string | null;
  items: Array<{ id: string; name: string; price: number; quantity: number; customNotes?: string }>;
  total: number;
  status: string;
  paymentMethod: string | null;
  adminNotes: string | null;
  quotedPrice: number | null;
  quoteStatus: string | null;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  batch: number;
  category: string;
  image: string | null;
  isCustom: boolean;
  trending: boolean;
  active: boolean;
  createdAt: string;
};

type Stats = {
  todaysOrders: number;
  pendingOrders: number;
  readyForPickup: number;
  totalRevenue: number;
  totalOrders: number;
};

const DiamondLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2L38 15L20 38L2 15L20 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M2 15H38" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <path d="M20 2L14 15L20 38L26 15L20 2Z" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

function LoginForm({ onLogin }: { onLogin: (token: string, admin: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminInfo", JSON.stringify(data.admin));
        onLogin(data.token, data.admin);
        toast({ title: "Welcome back!", description: `Logged in as ${data.admin.name}` });
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F4C2C2' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-xl"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <DiamondLogo className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-[#3D2B1F] mb-4" />
          <h1 className="font-display text-xl sm:text-2xl text-[#3D2B1F]">Diamond Dulceria</h1>
          <p className="text-[#3D2B1F]/60 text-sm mt-1">Admin Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-[#3D2B1F]/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              data-testid="input-email"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#3D2B1F]/70 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              data-testid="input-password"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: '#3D2B1F' }}
            data-testid="button-login"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <a href="/" className="block text-center text-[#3D2B1F]/60 text-sm mt-6 hover:text-[#3D2B1F]">
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Store
        </a>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "analytics" | "contacts" | "custom" | "settings">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [newOrderData, setNewOrderData] = useState<Order | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedAdmin = localStorage.getItem("adminInfo");
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, productsRes, statsRes] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/admin/products", { headers }),
        fetch("/api/admin/stats", { headers }),
      ]);
      
      if (ordersRes.status === 401) {
        handleLogout();
        return;
      }

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const statsData = await statsRes.json();
      
      if (ordersData.success) {
        const sortedOrders = ordersData.orders.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        if (lastOrderCount > 0 && sortedOrders.length > lastOrderCount) {
          const newOrder = sortedOrders[0];
          setNewOrderData(newOrder);
          setShowNewOrderAlert(true);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order!', {
              body: `${newOrder.customerName} placed an order for $${newOrder.total}`,
              icon: '/favicon.ico'
            });
          }
        }
        setLastOrderCount(sortedOrders.length);
        setOrders(sortedOrders);
      }
      if (productsData.success) setProducts(productsData.products);
      if (statsData.success) setStats(statsData.stats);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    if (showLoading) setLoading(false);
  }, [token, lastOrderCount]);

  useEffect(() => {
    if (token) {
      fetchData();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      syncIntervalRef.current = setInterval(() => fetchData(false), 15000);
      return () => {
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      };
    }
  }, [token, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setToken(null);
    setAdmin(null);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: "Order Updated", description: `Status changed to ${status}` });
        fetchData(false);
        setShowOrderModal(false);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = searchQuery === "" || 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const getAnalyticsData = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const dailyRevenue = last7Days.map((day, i) => {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - (6 - i));
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === targetDate.toDateString() &&
          (o.status === 'completed' || o.status === 'paid' || o.status === 'ready');
      });
      return dayOrders.reduce((sum, o) => sum + o.total, 0);
    });

    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    const categoryRevenue: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.name.includes('Truffle') ? 'Truffles' : 
                        item.name.includes('Cookie') ? 'Cookies' : 'Other';
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.price * item.quantity);
      });
    });

    return { last7Days, dailyRevenue, statusCounts, categoryRevenue };
  };

  if (!token) {
    return <LoginForm onLogin={(t, a) => { setToken(t); setAdmin(a); }} />;
  }

  const analytics = getAnalyticsData();
  const maxRevenue = Math.max(...analytics.dailyRevenue, 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4C2C2' }}>
      <AnimatePresence>
        {showNewOrderAlert && newOrderData && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl p-4 max-w-sm w-[90%] border-2 border-[#D4AF37]"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#D4AF37]/20 rounded-full">
                <Bell className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-[#3D2B1F] font-bold">New Order!</h3>
                <p className="text-sm text-[#3D2B1F]/70">{newOrderData.customerName}</p>
                <p className="text-lg font-bold text-[#D4AF37]">${newOrderData.total}</p>
              </div>
              <button 
                onClick={() => setShowNewOrderAlert(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedOrder(newOrderData);
                setShowOrderModal(true);
                setShowNewOrderAlert(false);
              }}
              className="w-full mt-3 py-2 bg-[#3D2B1F] text-white rounded-lg text-sm font-medium"
            >
              View Order
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-[#3D2B1F]/10" style={{ backgroundColor: '#3D2B1F' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <DiamondLogo className="w-6 h-6 sm:w-8 sm:h-8 text-[#F4C2C2]" />
              <div className="hidden sm:block">
                <h1 className="font-display text-lg sm:text-xl text-[#F4C2C2] tracking-wide">CRM Dashboard</h1>
                <p className="text-[#F4C2C2]/60 text-xs">Welcome, {admin?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-[#F4C2C2]/60 text-xs">
                {lastSyncTime && (
                  <span>Synced {lastSyncTime.toLocaleTimeString()}</span>
                )}
              </div>
              <button onClick={() => fetchData()} disabled={loading} className="p-2 text-[#F4C2C2]/70 hover:text-[#F4C2C2] transition-colors" data-testid="button-refresh">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <a href="/" className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-[#F4C2C2] hover:text-[#F4C2C2]/80 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Store
              </a>
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-[#F4C2C2]/70 hover:text-[#F4C2C2]" data-testid="button-logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'custom', label: 'Custom', icon: Sparkles },
            { id: 'contacts', label: 'Contacts', icon: Users },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#3D2B1F] text-[#F4C2C2]' 
                  : 'bg-[#F9F1F1] text-[#3D2B1F] hover:bg-[#3D2B1F]/10'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { label: "Today's Orders", value: stats.todaysOrders, icon: Calendar, color: 'bg-purple-100' },
                { label: "Pending", value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-100' },
                { label: "Ready for Pickup", value: stats.readyForPickup, icon: CheckCircle, color: 'bg-green-100' },
                { label: "Total Revenue", value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'bg-emerald-100' },
                { label: "Total Orders", value: stats.totalOrders, icon: Package, color: 'bg-blue-100' },
              ].map((stat, i) => (
                <div key={i} className="p-3 sm:p-4 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-2 rounded-full ${stat.color}`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#3D2B1F]" />
                    </div>
                    <div>
                      <p className="text-[#3D2B1F]/60 text-xs">{stat.label}</p>
                      <p className="text-lg sm:text-xl font-display text-[#3D2B1F]">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#3D2B1F]/10 p-4 sm:p-6" style={{ backgroundColor: '#F9F1F1' }}>
              <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Recent Orders</h3>
              {orders.slice(0, 5).map(order => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between py-3 border-b border-[#3D2B1F]/10 last:border-0 cursor-pointer hover:bg-[#3D2B1F]/5 -mx-2 px-2 rounded"
                  onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#3D2B1F] truncate">{order.customerName}</p>
                    <p className="text-xs sm:text-sm text-[#3D2B1F]/60">{order.items.length} item(s) • {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-display text-[#3D2B1F]">${order.total}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D2B1F]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders by name, email, or ID..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['all', 'pending', 'paid', 'ready', 'completed', 'cancelled'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                      statusFilter === filter
                        ? 'bg-[#3D2B1F] text-white'
                        : 'bg-[#F9F1F1] text-[#3D2B1F] hover:bg-[#3D2B1F]/10'
                    }`}
                    data-testid={`filter-${filter}`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-[#3D2B1F]/60">
              Showing {filteredOrders.length} of {orders.length} orders (sorted by most recent)
            </p>

            {loading && orders.length === 0 ? (
              <div className="text-center py-20">
                <RefreshCw className="w-10 h-10 text-[#3D2B1F]/30 mx-auto mb-4 animate-spin" />
                <p className="text-[#3D2B1F]/50">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-[#3D2B1F]/20 mx-auto mb-4" />
                <p className="text-[#3D2B1F]/50 font-display text-lg">No orders found</p>
                <p className="text-[#3D2B1F]/40 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                    className="p-3 sm:p-4 rounded-lg border border-[#3D2B1F]/10 cursor-pointer hover:shadow-md transition-all"
                    style={{ backgroundColor: '#F9F1F1' }}
                    data-testid={`order-card-${order.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-display text-[#3D2B1F] truncate">{order.customerName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.paymentMethod === 'card' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Paid Online</span>
                          )}
                        </div>
                        <p className="text-[#3D2B1F]/60 text-sm truncate">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </p>
                        {order.items.some(i => i.customNotes) && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#D4AF37] mt-1">
                            <FileText className="w-3 h-3" /> Has custom request
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl text-[#3D2B1F]">${order.total}</p>
                        <p className="text-[#3D2B1F]/50 text-xs">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-lg sm:text-xl text-[#3D2B1F]">Products ({products.length})</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!confirm('Import default products into the database? This will add any missing products.')) return;
                    try {
                      const res = await fetch('/api/admin/seed-products', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast({
                          title: 'Products Imported',
                          description: `Imported ${data.imported} products, skipped ${data.skipped} existing.`
                        });
                        fetchData();
                      } else {
                        toast({
                          title: 'Import Failed',
                          description: data.error || 'Failed to import products',
                          variant: 'destructive'
                        });
                      }
                    } catch (err) {
                      console.error('Seed error:', err);
                      toast({
                        title: 'Import Failed',
                        description: 'Network error while importing products',
                        variant: 'destructive'
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: '#D4AF37' }}
                  data-testid="button-seed-products"
                >
                  <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Import Products</span>
                </button>
                <button
                  onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: '#3D2B1F' }}
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Product</span>
                </button>
              </div>
            </div>

            {['truffles', 'cookies', 'seasonal', 'custom'].map(category => {
              const categoryProducts = products.filter(p => {
                const cat = p.category?.toLowerCase();
                if (category === 'truffles') return cat === 'truffles' || cat === 'truffle';
                if (category === 'cookies') return cat === 'cookies' || cat === 'cookie';
                if (category === 'seasonal') return cat === 'seasonal';
                if (category === 'custom') return cat === 'custom';
                return false;
              });
              if (categoryProducts.length === 0) return null;
              return (
                <div key={category} className="mb-6">
                  <h3 className="font-display text-lg text-[#3D2B1F] mb-3 capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    {category === 'truffles' ? 'Truffles' : category === 'cookies' ? 'Cookies' : category === 'seasonal' ? 'Seasonal' : 'Custom Creations'}
                    <span className="text-sm text-[#3D2B1F]/50 font-normal">({categoryProducts.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {categoryProducts.map(product => (
                      <div 
                        key={product.id} 
                        className={`p-4 rounded-lg border transition-all ${product.active ? 'border-[#3D2B1F]/10' : 'border-red-200 opacity-60'}`}
                        style={{ backgroundColor: '#F9F1F1' }}
                        data-testid={`product-card-${product.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {product.image && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[#3D2B1F]/10">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display text-[#3D2B1F] truncate">{product.name}</h3>
                              <p className="text-xs text-[#3D2B1F]/60">Batch: {product.batch}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                            className="p-1 text-[#3D2B1F]/50 hover:text-[#3D2B1F]"
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-[#3D2B1F]/70 line-clamp-2 mb-2">{product.description}</p>
                        <div className="flex justify-between items-center">
                          <p className="font-display text-lg text-[#3D2B1F]">${product.price}</p>
                          <div className="flex items-center gap-2">
                            {product.trending && <span className="text-xs px-2 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">Trending</span>}
                            <span className={`text-xs px-2 py-1 rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {product.active ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg border border-[#3D2B1F]/10 p-4 sm:p-6" style={{ backgroundColor: '#F9F1F1' }}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-display text-lg text-[#3D2B1F]">Revenue (Last 7 Days)</h3>
              </div>
              <div className="flex items-end gap-2 h-40">
                {analytics.dailyRevenue.map((revenue, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-[#D4AF37] rounded-t transition-all"
                      style={{ height: `${(revenue / maxRevenue) * 100}%`, minHeight: revenue > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-[#3D2B1F]/60">{analytics.last7Days[i]}</span>
                    <span className="text-xs font-medium text-[#3D2B1F]">${revenue}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#3D2B1F]/10 p-4 sm:p-6" style={{ backgroundColor: '#F9F1F1' }}>
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="font-display text-lg text-[#3D2B1F]">Order Status</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(analytics.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                        <span className="text-sm text-[#3D2B1F] capitalize">{status}</span>
                      </div>
                      <span className="font-medium text-[#3D2B1F]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#3D2B1F]/10 p-4 sm:p-6" style={{ backgroundColor: '#F9F1F1' }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="font-display text-lg text-[#3D2B1F]">Revenue by Category</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(analytics.categoryRevenue).map(([category, revenue]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-[#3D2B1F]">{category}</span>
                      <span className="font-medium text-[#D4AF37]">${revenue}</span>
                    </div>
                  ))}
                  {Object.keys(analytics.categoryRevenue).length === 0 && (
                    <p className="text-sm text-[#3D2B1F]/50">No sales data yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#3D2B1F]/10 p-4 sm:p-6" style={{ backgroundColor: '#F9F1F1' }}>
              <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[#3D2B1F]/60 text-xs">Avg Order Value</p>
                  <p className="text-xl font-display text-[#3D2B1F]">
                    ${orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-[#3D2B1F]/60 text-xs">Completion Rate</p>
                  <p className="text-xl font-display text-[#3D2B1F]">
                    {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-[#3D2B1F]/60 text-xs">Custom Orders</p>
                  <p className="text-xl font-display text-[#3D2B1F]">
                    {orders.filter(o => o.items.some(i => i.customNotes)).length}
                  </p>
                </div>
                <div>
                  <p className="text-[#3D2B1F]/60 text-xs">Active Products</p>
                  <p className="text-xl font-display text-[#3D2B1F]">
                    {products.filter(p => p.active).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <CustomOrdersSection 
            orders={orders.filter(o => o.items.some(i => i.customNotes))}
            token={token}
            onRefresh={() => fetchData(false)}
            onSelectOrder={(order) => { setSelectedOrder(order); setShowOrderModal(true); }}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsSection 
            orders={orders}
            token={token}
            onSelectOrder={(order) => { setSelectedOrder(order); setShowOrderModal(true); }}
            onRefresh={() => fetchData(false)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsSection token={token} />
        )}
      </div>

      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <OrderModal
            order={selectedOrder}
            token={token}
            onClose={() => { setShowOrderModal(false); setSelectedOrder(null); }}
            onStatusUpdate={updateOrderStatus}
            onSendQuote={() => { setShowQuoteModal(true); }}
            onContact={() => { setShowContactModal(true); }}
            onRefresh={() => fetchData(false)}
          />
        )}

        {showQuoteModal && selectedOrder && (
          <QuoteModal
            order={selectedOrder}
            token={token}
            onClose={() => setShowQuoteModal(false)}
            onSuccess={() => { setShowQuoteModal(false); fetchData(false); }}
          />
        )}

        {showContactModal && selectedOrder && (
          <ContactModal
            order={selectedOrder}
            token={token}
            onClose={() => setShowContactModal(false)}
            onSuccess={() => { setShowContactModal(false); }}
          />
        )}

        {showProductModal && (
          <ProductModal
            product={editingProduct}
            token={token}
            onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
            onSuccess={() => { setShowProductModal(false); setEditingProduct(null); fetchData(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderModal({ order, token, onClose, onStatusUpdate, onSendQuote, onContact, onRefresh }: {
  order: Order;
  token: string;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onSendQuote: () => void;
  onContact: () => void;
  onRefresh: () => void;
}) {
  const [notes, setNotes] = useState(order.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const deleteOrder = async () => {
    if (!confirm("Are you sure you want to permanently delete this order? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Order Deleted" });
      onRefresh();
      onClose();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setDeleting(false);
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      toast({ title: "Notes saved" });
      onRefresh();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setSavingNotes(false);
  };

  const hasCustomItems = order.items.some(i => i.customNotes);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-[#3D2B1F]">{order.customerName}</h2>
            <p className="text-[#3D2B1F]/60 text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#3D2B1F]/10 rounded-full">
            <X className="w-5 h-5 text-[#3D2B1F]" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <a href={`tel:${order.customerPhone}`} className="flex items-start gap-2 p-3 bg-white rounded-lg">
            <Phone className="w-4 h-4 text-[#3D2B1F]/50 mt-0.5" />
            <div>
              <p className="text-xs text-[#3D2B1F]/50">Phone</p>
              <p className="text-[#3D2B1F]">{order.customerPhone}</p>
            </div>
          </a>
          <a href={`mailto:${order.customerEmail}`} className="flex items-start gap-2 p-3 bg-white rounded-lg">
            <Mail className="w-4 h-4 text-[#3D2B1F]/50 mt-0.5" />
            <div>
              <p className="text-xs text-[#3D2B1F]/50">Email</p>
              <p className="text-[#3D2B1F] text-sm break-all">{order.customerEmail}</p>
            </div>
          </a>
          <div className="sm:col-span-2 flex items-start gap-2 p-3 bg-white rounded-lg">
            <MapPin className="w-4 h-4 text-[#3D2B1F]/50 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#3D2B1F]/50">Address</p>
              <p className="text-[#3D2B1F] text-sm">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#3D2B1F]/10 pt-4 mb-4">
          <h3 className="font-medium text-[#3D2B1F] mb-2">Order Items</h3>
          {order.items.map((item, i) => (
            <div key={i} className="py-2 border-b border-[#3D2B1F]/5 last:border-0">
              <div className="flex justify-between">
                <span className="text-[#3D2B1F]">{item.name} x{item.quantity}</span>
                <span className="text-[#3D2B1F] font-medium">${item.price * item.quantity}</span>
              </div>
              {item.customNotes && (
                <div className="mt-2 p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                  <p className="text-xs text-[#D4AF37] font-medium mb-1">Custom Request:</p>
                  <p className="text-sm text-[#3D2B1F] whitespace-pre-wrap">{item.customNotes}</p>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-between font-display text-xl mt-4 pt-2 border-t border-[#3D2B1F]/10">
            <span className="text-[#3D2B1F]">Total</span>
            <span className="text-[#3D2B1F]">${order.total}</span>
          </div>
        </div>

        {order.specialInstructions && (
          <div className="mb-4 p-3 bg-[#3D2B1F]/5 rounded-lg">
            <p className="text-xs text-[#3D2B1F]/60 mb-1">Special Instructions</p>
            <p className="text-[#3D2B1F] text-sm">{order.specialInstructions}</p>
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Admin Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F] text-sm"
            rows={2}
            placeholder="Internal notes about this order..."
            data-testid="textarea-notes"
          />
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="mt-2 px-3 py-1 text-sm rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F] hover:bg-[#3D2B1F]/20"
            data-testid="button-save-notes"
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-[#3D2B1F]/60 mb-2">Update Status:</p>
          <div className="flex flex-wrap gap-2">
            {['pending', 'paid', 'ready', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => onStatusUpdate(order.id, status)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  order.status === status 
                    ? 'bg-[#3D2B1F] text-white' 
                    : 'bg-[#3D2B1F]/10 text-[#3D2B1F] hover:bg-[#3D2B1F]/20'
                }`}
                data-testid={`status-${status}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={deleteOrder}
            disabled={deleting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
            data-testid="button-delete-order"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "..." : "Delete"}
          </button>
          <button
            onClick={onContact}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F] hover:bg-[#3D2B1F]/20"
            data-testid="button-contact"
          >
            <MessageSquare className="w-4 h-4" /> Contact Customer
          </button>
          {hasCustomItems && (
            <button
              onClick={onSendQuote}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#D4AF37' }}
              data-testid="button-send-quote"
            >
              <DollarSign className="w-4 h-4" /> Send Quote
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuoteModal({ order, token, onClose, onSuccess }: {
  order: Order;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendQuote = async () => {
    if (!price) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quotedPrice: Math.round(parseFloat(price) * 100), message }),
      });
      if (res.ok) {
        toast({ title: "Quote Sent!", description: `Quote of $${price} sent to ${order.customerEmail}` });
        onSuccess();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-4 sm:p-6"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <h2 className="font-display text-xl text-[#3D2B1F] mb-4">Send Quote to {order.customerName}</h2>
        
        <div className="mb-4">
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Quote Price ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
            placeholder="0.00"
            data-testid="input-quote-price"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
            rows={3}
            placeholder="Additional details about the quote..."
            data-testid="textarea-quote-message"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F]">
            Cancel
          </button>
          <button
            onClick={sendQuote}
            disabled={!price || sending}
            className="flex-1 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#D4AF37' }}
            data-testid="button-send-quote-confirm"
          >
            {sending ? "Sending..." : "Send Quote"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ContactModal({ order, token, onClose, onSuccess }: {
  order: Order;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [subject, setSubject] = useState(`Update on Your Order - Diamond Dulceria`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendEmail = async () => {
    if (!message) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message }),
      });
      if (res.ok) {
        toast({ title: "Email Sent!", description: `Message sent to ${order.customerEmail}` });
        onSuccess();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-4 sm:p-6"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <h2 className="font-display text-xl text-[#3D2B1F] mb-4">Contact {order.customerName}</h2>
        
        <div className="mb-4">
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
            data-testid="input-contact-subject"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
            rows={5}
            placeholder="Your message to the customer..."
            data-testid="textarea-contact-message"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F]">
            Cancel
          </button>
          <button
            onClick={sendEmail}
            disabled={!message || sending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#3D2B1F' }}
            data-testid="button-send-email"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProductModal({ product, token, onClose, onSuccess }: {
  product: Product | null;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [batch, setBatch] = useState(product?.batch.toString() || "1");
  const [category, setCategory] = useState(product?.category || "truffles");
  const [image, setImage] = useState(product?.image || "");
  const [isCustom, setIsCustom] = useState(product?.isCustom || false);
  const [trending, setTrending] = useState(product?.trending || false);
  const [active, setActive] = useState(product?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !description || !price) return;
    setSaving(true);
    try {
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = product ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name, description, price: parseInt(price), batch: parseInt(batch),
          category, image: image || null, isCustom, trending, active
        }),
      });
      if (res.ok) {
        toast({ title: product ? "Product Updated" : "Product Created" });
        onSuccess();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!product || !confirm("Are you sure you want to delete this product?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Product Deleted" });
      onSuccess();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <h2 className="font-display text-xl text-[#3D2B1F] mb-4">
          {product ? "Edit Product" : "Add New Product"}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#3D2B1F]/70 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              data-testid="input-product-name"
            />
          </div>

          <div>
            <label className="block text-sm text-[#3D2B1F]/70 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              rows={3}
              data-testid="textarea-product-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#3D2B1F]/70 mb-1">Price ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                data-testid="input-product-price"
              />
            </div>
            <div>
              <label className="block text-sm text-[#3D2B1F]/70 mb-1">Batch Size</label>
              <input
                type="number"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                data-testid="input-product-batch"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#3D2B1F]/70 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              data-testid="select-product-category"
            >
              <option value="truffles">Truffles</option>
              <option value="cookies">Cookies</option>
              <option value="seasonal">Seasonal</option>
              <option value="custom">Custom Creations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#3D2B1F]/70 mb-1">Image URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="/product-image.jpg or https://..."
              className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              data-testid="input-product-image"
            />
            {image && (
              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-[#3D2B1F]/20">
                <img src={image} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-[#3D2B1F]">
              <input
                type="checkbox"
                checked={isCustom}
                onChange={(e) => setIsCustom(e.target.checked)}
                className="rounded"
              />
              Custom Order
            </label>
            <label className="flex items-center gap-2 text-sm text-[#3D2B1F]">
              <input
                type="checkbox"
                checked={trending}
                onChange={(e) => setTrending(e.target.checked)}
                className="rounded"
              />
              Trending
            </label>
            <label className="flex items-center gap-2 text-sm text-[#3D2B1F]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded"
              />
              Active (Visible)
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          {product && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
              data-testid="button-delete-product"
            >
              {deleting ? "..." : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !description || !price || saving}
            className="flex-1 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#3D2B1F' }}
            data-testid="button-save-product"
          >
            {saving ? "Saving..." : (product ? "Update" : "Create")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CustomOrdersSection({ orders, token, onRefresh, onSelectOrder }: {
  orders: Order[];
  token: string;
  onRefresh: () => void;
  onSelectOrder: (order: Order) => void;
}) {
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState<Record<string, string>>({});
  const [declineMessage, setDeclineMessage] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState<Order | null>(null);
  const { toast } = useToast();

  const approveOrder = async (order: Order) => {
    const price = quotePrice[order.id];
    if (!price) {
      toast({ title: "Enter a price", variant: "destructive" });
      return;
    }
    setApprovingOrder(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          quotedPrice: Math.round(parseFloat(price) * 100), 
          message: `Your custom order has been approved! The total cost is $${price}. We'll begin preparing your order once payment is received.`,
          approved: true
        }),
      });
      if (res.ok) {
        toast({ title: "Order Approved!", description: `Quote of $${price} sent to customer` });
        onRefresh();
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setApprovingOrder(null);
  };

  const declineOrder = async () => {
    if (!showDeclineModal) return;
    try {
      await fetch(`/api/admin/orders/${showDeclineModal.id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          subject: "Update on Your Custom Order - Diamond Dulceria",
          message: declineMessage || "Unfortunately, we are unable to fulfill your custom order request at this time. Please feel free to contact us to discuss alternatives."
        }),
      });
      await fetch(`/api/admin/orders/${showDeclineModal.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelled" }),
      });
      toast({ title: "Order Declined", description: "Customer has been notified" });
      onRefresh();
      setShowDeclineModal(null);
      setDeclineMessage("");
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const pendingCustomOrders = orders.filter(o => o.status === 'pending' && (!o.quoteStatus || o.quoteStatus === 'pending'));
  const quotedOrders = orders.filter(o => o.quoteStatus === 'sent' || o.quoteStatus === 'approved');
  const otherCustomOrders = orders.filter(o => !pendingCustomOrders.includes(o) && !quotedOrders.includes(o));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-[#3D2B1F] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          Custom Orders ({orders.length})
        </h2>
      </div>

      {pendingCustomOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-[#3D2B1F] flex items-center gap-2">
            <Clock className="w-4 h-4" /> Awaiting Your Response ({pendingCustomOrders.length})
          </h3>
          {pendingCustomOrders.map(order => (
            <div 
              key={order.id}
              className="p-4 rounded-lg border-2 border-[#D4AF37]/50"
              style={{ backgroundColor: '#F9F1F1' }}
              data-testid={`custom-order-${order.id}`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                <div className="cursor-pointer" onClick={() => onSelectOrder(order)}>
                  <h4 className="font-display text-[#3D2B1F]">{order.customerName}</h4>
                  <p className="text-sm text-[#3D2B1F]/60">{order.customerEmail}</p>
                  <p className="text-xs text-[#3D2B1F]/50">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {order.items.filter(i => i.customNotes).map((item, idx) => (
                <div key={idx} className="mb-3 p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
                  <p className="text-xs font-medium text-[#D4AF37] mb-1">{item.name}</p>
                  <p className="text-sm text-[#3D2B1F] whitespace-pre-wrap">{item.customNotes}</p>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D2B1F]/40" />
                    <input
                      type="number"
                      placeholder="Price"
                      value={quotePrice[order.id] || ""}
                      onChange={(e) => setQuotePrice({...quotePrice, [order.id]: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                      data-testid={`input-quote-${order.id}`}
                    />
                  </div>
                  <button
                    onClick={() => approveOrder(order)}
                    disabled={approvingOrder === order.id || !quotePrice[order.id]}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                    style={{ backgroundColor: '#22c55e' }}
                    data-testid={`approve-${order.id}`}
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">{approvingOrder === order.id ? "..." : "Approve"}</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowDeclineModal(order)}
                  className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                  data-testid={`decline-${order.id}`}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Decline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {quotedOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-[#3D2B1F] flex items-center gap-2">
            <Send className="w-4 h-4" /> Quote Sent ({quotedOrders.length})
          </h3>
          {quotedOrders.map(order => (
            <div 
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-4 rounded-lg border border-[#3D2B1F]/10 cursor-pointer hover:shadow-md transition-all"
              style={{ backgroundColor: '#F9F1F1' }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-display text-[#3D2B1F]">{order.customerName}</h4>
                  <p className="text-sm text-[#3D2B1F]/60">{order.items.filter(i => i.customNotes).map(i => i.name).join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-[#D4AF37]">${order.quotedPrice! / 100}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Quote Sent</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {otherCustomOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-[#3D2B1F]/60">Previous Custom Orders ({otherCustomOrders.length})</h3>
          {otherCustomOrders.slice(0, 5).map(order => (
            <div 
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-3 rounded-lg border border-[#3D2B1F]/10 cursor-pointer hover:shadow-md transition-all opacity-75"
              style={{ backgroundColor: '#F9F1F1' }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-display text-[#3D2B1F] text-sm">{order.customerName}</h4>
                  <p className="text-xs text-[#3D2B1F]/60">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
          <p className="text-[#3D2B1F]/50 font-display">No custom orders yet</p>
          <p className="text-sm text-[#3D2B1F]/40 mt-1">Custom order requests will appear here</p>
        </div>
      )}

      <AnimatePresence>
        {showDeclineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeclineModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: '#F9F1F1' }}
            >
              <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Decline Order</h3>
              <p className="text-sm text-[#3D2B1F]/70 mb-3">
                Send a message to {showDeclineModal.customerName} explaining why this order cannot be fulfilled:
              </p>
              <textarea
                value={declineMessage}
                onChange={(e) => setDeclineMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                rows={4}
                placeholder="Optional message..."
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowDeclineModal(null)} className="flex-1 py-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F]">
                  Cancel
                </button>
                <button onClick={declineOrder} className="flex-1 py-2 rounded-lg bg-red-600 text-white">
                  Decline & Notify
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactsSection({ orders, token, onSelectOrder, onRefresh }: {
  orders: Order[];
  token: string;
  onSelectOrder: (order: Order) => void;
  onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmailModal, setShowEmailModal] = useState<{ email: string; name: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const uniqueCustomers = orders.reduce((acc, order) => {
    if (!acc.find(c => c.email === order.customerEmail)) {
      acc.push({
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.deliveryAddress,
        orderCount: orders.filter(o => o.customerEmail === order.customerEmail).length,
        totalSpent: orders.filter(o => o.customerEmail === order.customerEmail).reduce((sum, o) => sum + o.total, 0),
        lastOrder: orders.filter(o => o.customerEmail === order.customerEmail).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]?.createdAt
      });
    }
    return acc;
  }, [] as Array<{ name: string; email: string; phone: string; address: string; orderCount: number; totalSpent: number; lastOrder: string }>);

  const filteredCustomers = uniqueCustomers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  ).sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());

  const sendEmail = async () => {
    if (!showEmailModal || !emailMessage) return;
    setSending(true);
    try {
      const customerOrder = orders.find(o => o.customerEmail === showEmailModal.email);
      if (customerOrder) {
        await fetch(`/api/admin/orders/${customerOrder.id}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subject: emailSubject || "Message from Diamond Dulceria", message: emailMessage }),
        });
        toast({ title: "Email Sent!", description: `Message sent to ${showEmailModal.name}` });
        setShowEmailModal(null);
        setEmailSubject("");
        setEmailMessage("");
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="font-display text-xl text-[#3D2B1F] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D4AF37]" />
          Customers ({uniqueCustomers.length})
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D2B1F]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-[#3D2B1F]/20 mx-auto mb-4" />
          <p className="text-[#3D2B1F]/50 font-display">No customers found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredCustomers.map((customer, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-[#3D2B1F]/10"
              style={{ backgroundColor: '#F9F1F1' }}
              data-testid={`contact-${customer.email}`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[#3D2B1F] truncate">{customer.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#3D2B1F]/60">
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-[#D4AF37]">
                      <Mail className="w-3 h-3" /> {customer.email}
                    </a>
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-[#D4AF37]">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </a>
                  </div>
                  <p className="text-xs text-[#3D2B1F]/50 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {customer.address}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col gap-3 sm:gap-1 items-center sm:items-end">
                  <div className="text-right">
                    <p className="text-xs text-[#3D2B1F]/50">{customer.orderCount} order(s)</p>
                    <p className="font-display text-[#D4AF37]">${customer.totalSpent}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const customerOrders = orders.filter(o => o.customerEmail === customer.email)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        if (customerOrders[0]) onSelectOrder(customerOrders[0]);
                      }}
                      className="p-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F] hover:bg-[#3D2B1F]/20"
                      title="View Orders"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowEmailModal({ email: customer.email, name: customer.name })}
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: '#3D2B1F' }}
                      title="Send Email"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: '#F9F1F1' }}
            >
              <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Email {showEmailModal.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#3D2B1F]/70 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Message from Diamond Dulceria"
                    className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#3D2B1F]/70 mb-1">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                    rows={5}
                    placeholder="Your message..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowEmailModal(null)} className="flex-1 py-2 rounded-lg bg-[#3D2B1F]/10 text-[#3D2B1F]">
                  Cancel
                </button>
                <button
                  onClick={sendEmail}
                  disabled={!emailMessage || sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#3D2B1F' }}
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsSection({ token }: { token: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [customSections, setCustomSections] = useState<{ key: string; label: string }[]>([]);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const defaultHeaders = {
    heroTitle: "DIAMOND DULCERIA",
    heroSubtitle: "Artisan Confections",
    heroTagline: "Handcrafted truffles and signature cookies. Estd. 2025",
    trufflesTitle: "Handcrafted Truffles",
    cookiesTitle: "Signature Cookies",
    seasonalTitle: "Seasonal Specials",
    customTitle: "Custom Creation",
    footerText: "Diamond Dulceria - Handcrafted with Love",
  };

  const defaultSectionKeys = ['trufflesTitle', 'cookiesTitle', 'seasonalTitle', 'customTitle'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const merged = { ...defaultHeaders, ...data.settings };
        setSettings(merged);
        const customKeys = Object.keys(data.settings || {}).filter(
          k => k.startsWith('section_') && !defaultSectionKeys.includes(k)
        );
        setCustomSections(customKeys.map(k => ({ key: k, label: k.replace('section_', '').replace(/_/g, ' ') })));
      } else {
        setSettings(defaultHeaders);
      }
    } catch {
      setSettings(defaultHeaders);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        toast({ title: "Settings Saved", description: "Your changes are now live on the website." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  };

  const addSection = () => {
    if (!newSectionLabel.trim()) return;
    const key = `section_${newSectionLabel.trim().toLowerCase().replace(/\s+/g, '_')}`;
    if (settings[key] || customSections.find(s => s.key === key)) {
      toast({ title: "Section already exists", variant: "destructive" });
      return;
    }
    setCustomSections(prev => [...prev, { key, label: newSectionLabel.trim() }]);
    setSettings(prev => ({ ...prev, [key]: newSectionLabel.trim() }));
    setNewSectionLabel("");
    toast({ title: "Section Added", description: "Don't forget to save your changes." });
  };

  const deleteSection = async (key: string) => {
    if (!confirm("Delete this section header?")) return;
    setCustomSections(prev => prev.filter(s => s.key !== key));
    setSettings(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    try {
      await fetch("/api/admin/settings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key }),
      });
    } catch {}
    toast({ title: "Section Removed" });
  };

  const deleteDefaultSection = async (key: string, label: string) => {
    if (!confirm(`Remove "${label}" section header?`)) return;
    setSettings(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    try {
      await fetch("/api/admin/settings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key }),
      });
    } catch {}
    toast({ title: "Section Removed", description: "Save changes to apply." });
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-10 h-10 text-[#3D2B1F]/30 mx-auto animate-spin" />
      </div>
    );
  }

  const heroFields = [
    { key: "heroTitle", label: "Main Title" },
    { key: "heroSubtitle", label: "Subtitle" },
    { key: "heroTagline", label: "Tagline" },
  ];

  const defaultSectionFields = [
    { key: "trufflesTitle", label: "Truffles Section" },
    { key: "cookiesTitle", label: "Cookies Section" },
    { key: "seasonalTitle", label: "Seasonal Section" },
    { key: "customTitle", label: "Custom Section" },
  ].filter(f => settings[f.key] !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-[#3D2B1F] flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Site Settings
        </h2>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: '#3D2B1F' }}
          data-testid="button-save-settings"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="p-4 sm:p-6 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
        <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Hero Section</h3>
        <div className="space-y-4">
          {heroFields.map(field => (
            <div key={field.key}>
              <label className="block text-sm text-[#3D2B1F]/70 mb-1">{field.label}</label>
              <input
                type="text"
                value={settings[field.key] || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                data-testid={`input-setting-${field.key}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-[#3D2B1F]">Section Headers</h3>
        </div>
        <div className="space-y-3">
          {defaultSectionFields.map(field => (
            <div key={field.key} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-[#3D2B1F]/70 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={settings[field.key] || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                  data-testid={`input-setting-${field.key}`}
                />
              </div>
              <button
                onClick={() => deleteDefaultSection(field.key, field.label)}
                className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete section"
                data-testid={`delete-section-${field.key}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {customSections.map(section => (
            <div key={section.key} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm text-[#3D2B1F]/70 mb-1 capitalize">{section.label}</label>
                <input
                  type="text"
                  value={settings[section.key] || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, [section.key]: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
                  data-testid={`input-setting-${section.key}`}
                />
              </div>
              <button
                onClick={() => deleteSection(section.key)}
                className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete section"
                data-testid={`delete-section-${section.key}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#3D2B1F]/10">
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Add New Section</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              placeholder="e.g., Valentine's Special"
              className="flex-1 px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
              data-testid="input-new-section"
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
            />
            <button
              onClick={addSection}
              className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
              style={{ backgroundColor: '#D4AF37' }}
              data-testid="button-add-section"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
        <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Footer</h3>
        <div>
          <label className="block text-sm text-[#3D2B1F]/70 mb-1">Footer Text</label>
          <input
            type="text"
            value={settings.footerText || ""}
            onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-[#3D2B1F]/20 focus:border-[#D4AF37] focus:outline-none bg-white text-[#3D2B1F]"
            data-testid="input-setting-footerText"
          />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
        <p className="text-sm text-[#3D2B1F]">
          <strong>Note:</strong> Changes will appear on the website immediately after saving.
        </p>
      </div>
    </div>
  );
}
