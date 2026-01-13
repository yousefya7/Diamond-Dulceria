import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, RefreshCw, ArrowLeft, Phone, Mail, MapPin, FileText } from "lucide-react";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  specialInstructions: string | null;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  status: string;
  createdAt: string;
};

const DiamondLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M20 2L38 15L20 38L2 15L20 2Z" 
      stroke="currentColor"
      strokeWidth="1.5" 
      strokeLinejoin="round"
    />
    <path 
      d="M2 15H38" 
      stroke="currentColor"
      strokeWidth="1" 
      opacity="0.6"
    />
    <path 
      d="M20 2L14 15L20 38L26 15L20 2Z" 
      stroke="currentColor"
      strokeWidth="1" 
      opacity="0.4"
    />
  </svg>
);

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4C2C2' }}>
      <header className="sticky top-0 z-40 border-b border-[#3D2B1F]/10" style={{ backgroundColor: '#3D2B1F' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DiamondLogo className="w-8 h-8 text-[#F4C2C2]" />
              <div>
                <h1 className="font-display text-xl text-[#F4C2C2] tracking-wide">Order Dashboard</h1>
                <p className="text-[#F4C2C2]/60 text-xs">Diamond Dulceria Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="p-2 text-[#F4C2C2]/70 hover:text-[#F4C2C2] transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <a 
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4C2C2] hover:text-[#F4C2C2]/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Store
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-[#D4AF37]/10">
                <Package className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[#3D2B1F]/60 text-sm">Total Orders</p>
                <p className="text-2xl font-display text-[#3D2B1F]">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-[#3D2B1F]/60 text-sm">Pending</p>
                <p className="text-2xl font-display text-[#3D2B1F]">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-[#3D2B1F]/10" style={{ backgroundColor: '#F9F1F1' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-[#3D2B1F]/60 text-sm">Total Revenue</p>
                <p className="text-2xl font-display text-[#3D2B1F]">
                  ${orders.reduce((sum, o) => sum + o.total, 0)}
                </p>
              </div>
            </div>
          </div>
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
            <p className="text-[#3D2B1F]/40 text-sm mt-2">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                className="p-6 rounded-lg border border-[#3D2B1F]/10 cursor-pointer hover:shadow-md transition-all"
                style={{ backgroundColor: '#F9F1F1' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg text-[#3D2B1F]">{order.customerName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[#3D2B1F]/60 text-sm">
                      {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-[#3D2B1F]">${order.total}</p>
                    <p className="text-[#3D2B1F]/50 text-xs">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-[#3D2B1F]/10"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
                        <div>
                          <p className="text-xs text-[#3D2B1F]/50">Phone</p>
                          <a href={`tel:${order.customerPhone}`} className="text-[#3D2B1F] hover:underline">
                            {order.customerPhone}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
                        <div>
                          <p className="text-xs text-[#3D2B1F]/50">Email</p>
                          <a href={`mailto:${order.customerEmail}`} className="text-[#3D2B1F] hover:underline">
                            {order.customerEmail}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
                        <div>
                          <p className="text-xs text-[#3D2B1F]/50">Delivery Address</p>
                          <p className="text-[#3D2B1F]">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      {order.specialInstructions && (
                        <div className="flex items-start gap-3 sm:col-span-2">
                          <FileText className="w-4 h-4 text-[#3D2B1F]/50 mt-1" />
                          <div>
                            <p className="text-xs text-[#3D2B1F]/50">Special Instructions</p>
                            <p className="text-[#3D2B1F]">{order.specialInstructions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
