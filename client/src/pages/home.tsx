import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, X, Instagram, Facebook, Twitter, Sparkles, Send } from "lucide-react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const products = [
  { 
    id: "strawberry-shortcake", 
    name: "Strawberry Shortcake Truffles", 
    price: 50, 
    batch: 25,
    description: "Fresh strawberry cream infused ganache with shortcake crumble coating",
    isCustom: false
  },
  { 
    id: "cookies-cream", 
    name: "Cookies & Cream Truffles", 
    price: 50, 
    batch: 25,
    description: "Rich Oreo-infused white chocolate ganache with cookie dust finish",
    isCustom: false
  },
  { 
    id: "gourmet-cookies", 
    name: "Gourmet Cookies", 
    price: 50, 
    batch: 25,
    description: "Assorted premium cookies with brown butter and sea salt",
    isCustom: false
  },
  { 
    id: "custom-creation", 
    name: "Custom Creation Request", 
    price: 0, 
    batch: 0,
    description: "Have a unique flavor idea? Submit your custom request for approval",
    isCustom: true
  },
];

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dymon-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [customForm, setCustomForm] = useState({ flavorIdea: '', eventDate: '', name: '', email: '' });

  useEffect(() => {
    localStorage.setItem('dymon-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: typeof products[0]) => {
    if (product.isCustom) {
      setCustomModalOpen(true);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0 || delta >= 0);
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setCustomModalOpen(false);
      setFormSubmitted(false);
      setCustomForm({ flavorIdea: '', eventDate: '', name: '', email: '' });
    }, 2000);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#3D2B1F] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <span className="text-[#FF66B2] text-2xl">✦</span>
              <div>
                <h1 className="font-display text-xl sm:text-2xl text-white tracking-wide">DYMON DULCERÍA</h1>
                <p className="text-[#FF66B2] text-[10px] sm:text-xs tracking-[0.2em]">ESTD. 2025</p>
              </div>
            </div>
            
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-3 sm:p-4 bg-[#FF66B2] hover:bg-[#FF4DA6] text-white rounded-full transition-all duration-300 active:scale-95"
              data-testid="button-cart"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-[#3D2B1F] text-xs font-bold flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 bg-gradient-to-b from-[#3D2B1F] to-[#2a1e15] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#FF66B2] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#FF66B2] blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#FF66B2]/20 text-[#FF66B2] text-sm tracking-[0.3em] uppercase rounded-full mb-6">
              Handcrafted with Love
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
              Artisan Truffles &<br />
              <span className="text-[#FF66B2]">Gourmet Cookies</span>
            </h2>
            <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              Every batch is handcrafted to perfection. Order your favorite flavors or request a custom creation.
            </p>
            <a 
              href="#shop" 
              className="inline-block px-8 py-4 sm:px-10 sm:py-5 bg-[#FF66B2] hover:bg-[#FF4DA6] text-white text-lg font-medium tracking-wide rounded-full transition-all duration-300 active:scale-95"
              data-testid="button-shop-now"
            >
              Shop Now
            </a>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="shop" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#3D2B1F] mb-4">
              Our Collection
            </h2>
            <p className="text-[#3D2B1F]/60 text-lg">Fresh batches made to order</p>
            <div className="w-16 h-1 bg-[#FF66B2] mx-auto mt-6 rounded-full" />
          </div>

          {/* Product Grid - 2 cols desktop, 1 col mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                  product.isCustom ? 'border-[#FF66B2] border-dashed' : 'border-transparent hover:border-[#FF66B2]/30'
                }`}
                data-testid={`product-${product.id}`}
              >
                <div className="p-6 sm:p-8">
                  {product.isCustom ? (
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[#FF66B2]" />
                      <span className="text-[#FF66B2] text-sm font-medium tracking-wide uppercase">Custom Order</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#3D2B1F]/50 text-sm tracking-wide uppercase">Batch of {product.batch}</span>
                      <span className="text-[#FF66B2] font-display text-2xl sm:text-3xl">${product.price}</span>
                    </div>
                  )}
                  
                  <h3 className="font-display text-xl sm:text-2xl text-[#3D2B1F] mb-3">{product.name}</h3>
                  <p className="text-[#3D2B1F]/60 text-sm sm:text-base leading-relaxed mb-6">{product.description}</p>
                  
                  <button
                    onClick={() => addToCart(product)}
                    className={`w-full py-4 sm:py-5 text-base sm:text-lg font-medium tracking-wide rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] ${
                      product.isCustom 
                        ? 'bg-[#3D2B1F] hover:bg-[#2a1e15] text-white' 
                        : 'bg-[#FF66B2] hover:bg-[#FF4DA6] text-white'
                    }`}
                    data-testid={`add-${product.id}`}
                  >
                    {product.isCustom ? (
                      <>
                        <Send className="w-5 h-5" />
                        Request Quote
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3D2B1F] py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="font-display text-2xl sm:text-3xl text-white mb-2">DYMON DULCERÍA</h3>
            <p className="text-[#FF66B2] text-sm tracking-[0.3em]">ESTD. 2025</p>
          </div>
          
          <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="p-3 rounded-full bg-[#FF66B2]/20 hover:bg-[#FF66B2] text-[#FF66B2] hover:text-white transition-all duration-300" data-testid="link-instagram">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" className="p-3 rounded-full bg-[#FF66B2]/20 hover:bg-[#FF66B2] text-[#FF66B2] hover:text-white transition-all duration-300" data-testid="link-facebook">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="p-3 rounded-full bg-[#FF66B2]/20 hover:bg-[#FF66B2] text-[#FF66B2] hover:text-white transition-all duration-300" data-testid="link-twitter">
              <Twitter className="w-6 h-6" />
            </a>
          </div>
          
          <p className="text-white/50 text-sm">
            © 2025 DYMON DULCERÍA. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Sliding Cart */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-[#3D2B1F] flex justify-between items-center">
                <h3 className="font-display text-xl text-white">Your Cart</h3>
                <button 
                  onClick={() => setCartOpen(false)} 
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  data-testid="button-close-cart"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-[#3D2B1F]/20 mx-auto mb-4" />
                    <p className="text-[#3D2B1F]/50">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="bg-cream rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-4">
                            <h4 className="font-display text-lg text-[#3D2B1F]">{item.name}</h4>
                            <p className="text-[#FF66B2] font-medium">${item.price} × {item.quantity}</p>
                          </div>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-[#3D2B1F]/40 hover:text-[#FF66B2] transition-colors"
                            data-testid={`remove-${item.id}`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border-2 border-[#3D2B1F]/10 text-[#3D2B1F] hover:border-[#FF66B2] hover:text-[#FF66B2] transition-colors"
                            data-testid={`decrease-${item.id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-display text-xl text-[#3D2B1F]">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border-2 border-[#3D2B1F]/10 text-[#3D2B1F] hover:border-[#FF66B2] hover:text-[#FF66B2] transition-colors"
                            data-testid={`increase-${item.id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-6 border-t border-[#3D2B1F]/10 bg-cream">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[#3D2B1F]/60 text-lg">Subtotal</span>
                    <span className="font-display text-3xl text-[#3D2B1F]">${subtotal}</span>
                  </div>
                  <button
                    className="w-full py-5 bg-[#FF66B2] hover:bg-[#FF4DA6] text-white text-lg font-medium tracking-wide rounded-xl transition-all duration-300 active:scale-[0.98]"
                    data-testid="button-checkout"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Request Modal */}
      <AnimatePresence>
        {customModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => !formSubmitted && setCustomModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 bg-[#3D2B1F] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FF66B2]" />
                    <h3 className="font-display text-xl text-white">Custom Creation Request</h3>
                  </div>
                  <button 
                    onClick={() => setCustomModalOpen(false)}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    data-testid="button-close-modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formSubmitted ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#FF66B2]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-[#FF66B2]" />
                    </div>
                    <h4 className="font-display text-2xl text-[#3D2B1F] mb-2">Request Submitted!</h4>
                    <p className="text-[#3D2B1F]/60">We'll review your idea and get back to you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="p-6 space-y-5">
                    <p className="text-[#3D2B1F]/70 text-sm mb-4">
                      Tell us about your dream dessert! All custom requests are subject to approval.
                    </p>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-medium mb-2">Your Name</label>
                      <input
                        type="text"
                        required
                        value={customForm.name}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-4 rounded-xl border-2 border-[#3D2B1F]/10 focus:border-[#FF66B2] outline-none transition-colors text-lg"
                        placeholder="Jane Doe"
                        data-testid="input-name"
                      />
                    </div>

                    <div>
                      <label className="block text-[#3D2B1F] font-medium mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={customForm.email}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-4 rounded-xl border-2 border-[#3D2B1F]/10 focus:border-[#FF66B2] outline-none transition-colors text-lg"
                        placeholder="jane@email.com"
                        data-testid="input-email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-medium mb-2">Flavor Idea</label>
                      <textarea
                        required
                        value={customForm.flavorIdea}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, flavorIdea: e.target.value }))}
                        className="w-full px-4 py-4 rounded-xl border-2 border-[#3D2B1F]/10 focus:border-[#FF66B2] outline-none transition-colors text-lg resize-none"
                        rows={3}
                        placeholder="Describe your dream flavor combination..."
                        data-testid="input-flavor"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-medium mb-2">Event Date</label>
                      <input
                        type="date"
                        required
                        value={customForm.eventDate}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, eventDate: e.target.value }))}
                        className="w-full px-4 py-4 rounded-xl border-2 border-[#3D2B1F]/10 focus:border-[#FF66B2] outline-none transition-colors text-lg"
                        data-testid="input-date"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-5 bg-[#FF66B2] hover:bg-[#FF4DA6] text-white text-lg font-medium tracking-wide rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
                      data-testid="button-submit-request"
                    >
                      <Send className="w-5 h-5" />
                      Submit Request
                    </button>
                  </form>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
