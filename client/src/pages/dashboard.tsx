import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, CheckCircle, RefreshCw, ArrowLeft, Phone, Mail, 
  MapPin, FileText, DollarSign, X, Send, Edit, Trash2, Plus,
  Eye, EyeOff, Users, TrendingUp, Calendar, MessageSquare, Settings
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4C2C2' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl shadow-xl"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <div className="text-center mb-8">
          <DiamondLogo className="w-16 h-16 mx-auto text-[#3D2B1F] mb-4" />
          <h1 className="font-display text-2xl text-[#3D2B1F]">Diamond Dulceria</h1>
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
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "settings">("overview");
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
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedAdmin = localStorage.getItem("adminInfo");
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, productsRes, statsRes] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/admin/products", { headers }),
        fetch("/api/admin/stats", { headers }),
      ]);
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const statsData = await statsRes.json();
      
      if (ordersRes.status === 401) {
        handleLogout();
        return;
      }
      
      if (ordersData.success) setOrders(ordersData.orders);
      if (productsData.success) setProducts(productsData.products);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

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
        fetchData();
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

  if (!token) {
    return <LoginForm onLogin={(t, a) => { setToken(t); setAdmin(a); }} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4C2C2' }}>
      <header className="sticky top-0 z-40 border-b border-[#3D2B1F]/10" style={{ backgroundColor: '#3D2B1F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DiamondLogo className="w-8 h-8 text-[#F4C2C2]" />
              <div>
                <h1 className="font-display text-xl text-[#F4C2C2] tracking-wide">CRM Dashboard</h1>
                <p className="text-[#F4C2C2]/60 text-xs">Welcome, {admin?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchData} disabled={loading} className="p-2 text-[#F4C2C2]/70 hover:text-[#F4C2C2] transition-colors" data-testid="button-refresh">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <a href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4C2C2] hover:text-[#F4C2C2]/80 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Store
              </a>
              <button onClick={handleLogout} className="px-4 py-2 text-sm text-[#F4C2C2]/70 hover:text-[#F4C2C2]" data-testid="button-logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'products', label: 'Products', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#3D2B1F] text-[#F4C2C2]' 
                  : 'bg-[#F9F1F1] text-[#3D2B1F] hover:bg-[#3D2B1F]/10'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Today's Orders", value: stats.todaysOrders, icon: Calendar, color: 'bg-purple-100' },
                { label: "Pending", value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-100' },
                { label: "Ready for Pickup", value: stats.readyForPickup, icon: CheckCircle, color: 'bg-green-100' },
                { label: "Total Revenue", value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'bg-emerald-100' },
                { label: "Total Orders", value: stats.totalOrders, icon: Package, color: 'bg-blue-100' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${stat.color}`}>
                      <stat.icon className="w-5 h-5 text-[#3D2B1F]" />
                    </div>
                    <div>
                      <p className="text-[#3D2B1F]/60 text-xs">{stat.label}</p>
                      <p className="text-xl font-display text-[#3D2B1F]">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#3D2B1F]/10 p-6" style={{ backgroundColor: '#F9F1F1' }}>
              <h3 className="font-display text-lg text-[#3D2B1F] mb-4">Recent Orders</h3>
              {orders.slice(0, 5).map(order => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between py-3 border-b border-[#3D2B1F]/10 last:border-0 cursor-pointer hover:bg-[#3D2B1F]/5 -mx-2 px-2 rounded"
                  onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                >
                  <div>
                    <p className="font-medium text-[#3D2B1F]">{order.customerName}</p>
                    <p className="text-sm text-[#3D2B1F]/60">{order.items.length} item(s) • {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[#3D2B1F]">${order.total}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'paid', 'ready', 'completed', 'cancelled'].map(filter => (
                <button
                  key={filter}
                  className="px-3 py-1 rounded-full text-sm bg-[#F9F1F1] text-[#3D2B1F] hover:bg-[#3D2B1F]/10"
                  onClick={() => {}}
                  data-testid={`filter-${filter}`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {loading && orders.length === 0 ? (
              <div className="text-center py-20">
                <RefreshCw className="w-10 h-10 text-[#3D2B1F]/30 mx-auto mb-4 animate-spin" />
                <p className="text-[#3D2B1F]/50">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-[#3D2B1F]/20 mx-auto mb-4" />
                <p className="text-[#3D2B1F]/50 font-display text-lg">No orders yet</p>
              </div>
            ) : (
              orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                  className="p-4 rounded-lg border border-[#3D2B1F]/10 cursor-pointer hover:shadow-md transition-all"
                  style={{ backgroundColor: '#F9F1F1' }}
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-[#3D2B1F]">{order.customerName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {order.paymentMethod === 'card' && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Paid Online</span>
                        )}
                      </div>
                      <p className="text-[#3D2B1F]/60 text-sm">
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
              ))
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl text-[#3D2B1F]">Products ({products.length})</h2>
              <button
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#3D2B1F' }}
                data-testid="button-add-product"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className={`p-4 rounded-lg border transition-all ${product.active ? 'border-[#3D2B1F]/10' : 'border-red-200 opacity-60'}`}
                  style={{ backgroundColor: '#F9F1F1' }}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display text-[#3D2B1F]">{product.name}</h3>
                      <p className="text-xs text-[#3D2B1F]/60 capitalize">{product.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                        className="p-1 text-[#3D2B1F]/50 hover:text-[#3D2B1F]"
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#3D2B1F]/70 line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="font-display text-lg text-[#3D2B1F]">${product.price}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            onRefresh={fetchData}
          />
        )}

        {showQuoteModal && selectedOrder && (
          <QuoteModal
            order={selectedOrder}
            token={token}
            onClose={() => setShowQuoteModal(false)}
            onSuccess={() => { setShowQuoteModal(false); fetchData(); }}
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
            onSuccess={() => { setShowProductModal(false); setEditingProduct(null); fetchData(); }}
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
  const { toast } = useToast();

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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ backgroundColor: '#F9F1F1' }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-2xl text-[#3D2B1F]">{order.customerName}</h2>
            <p className="text-[#3D2B1F]/60 text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#3D2B1F]/10 rounded-full">
            <X className="w-5 h-5 text-[#3D2B1F]" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
            <div>
              <p className="text-xs text-[#3D2B1F]/50">Phone</p>
              <a href={`tel:${order.customerPhone}`} className="text-[#3D2B1F] hover:underline">{order.customerPhone}</a>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
            <div>
              <p className="text-xs text-[#3D2B1F]/50">Email</p>
              <a href={`mailto:${order.customerEmail}`} className="text-[#3D2B1F] hover:underline">{order.customerEmail}</a>
            </div>
          </div>
          <div className="col-span-2 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
            <div>
              <p className="text-xs text-[#3D2B1F]/50">Address</p>
              <p className="text-[#3D2B1F]">{order.deliveryAddress}</p>
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

        <div className="mb-6">
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

        <div className="flex flex-wrap gap-2 mb-4">
          <p className="w-full text-sm text-[#3D2B1F]/60 mb-1">Update Status:</p>
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

        <div className="flex gap-2">
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6"
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6"
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
          category, isCustom, trending, active
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6"
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
