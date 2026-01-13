import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, X, Instagram, Sparkles, Send, Star } from "lucide-react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const products = [
  { 
    id: "dubai-chocolate", 
    name: "Dubai Chocolate Truffles", 
    price: 50, 
    batch: 25,
    description: "Pistachio cream & toasted kataifi filling wrapped in dark chocolate",
    isCustom: false,
    category: "truffle",
    image: "/dubai_chocolate_1768272691835.jpg" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "cookie-butter", 
    name: "Cookie Butter Truffles", 
    price: 50, 
    batch: 25,
    description: "Speculoos spice center with silky white chocolate shell",
    isCustom: false,
    category: "truffle",
    image: "" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "strawberry-shortcake", 
    name: "Strawberry Shortcake Truffles", 
    price: 50, 
    batch: 25,
    description: "Fresh strawberry cream infused ganache with delicate shortcake crumble",
    isCustom: false,
    category: "truffle",
    image: "" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "cookies-cream", 
    name: "Cookies & Cream Truffles", 
    price: 50, 
    batch: 25,
    description: "Rich Oreo-infused white chocolate ganache with cookie dust finish",
    isCustom: false,
    category: "truffle",
    image: "" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "red-velvet", 
    name: "Red Velvet Cookies", 
    price: 50, 
    batch: 25,
    description: "Deep red cocoa with white chocolate chips and cream cheese swirl",
    isCustom: false,
    category: "cookie",
    image: "/red_velvet_1768272691836.jpg" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "snickerdoodle", 
    name: "Snickerdoodle Cookies", 
    price: 50, 
    batch: 25,
    description: "Classic cinnamon-sugar dusting with soft, chewy center",
    isCustom: false,
    category: "cookie",
    image: "" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "signature-cookies", 
    name: "Signature Cookies", 
    price: 50, 
    batch: 25,
    description: "Our signature brown butter cookies with premium chocolate and sea salt",
    isCustom: false,
    category: "cookie",
    image: "" // <!-- UPLOAD PRODUCT IMAGE HERE -->
  },
  { 
    id: "bespoke-diamond", 
    name: "Bespoke Diamond", 
    price: 0, 
    batch: 0,
    description: "Custom flavors crafted exclusively for you. Subject to approval.",
    isCustom: true,
    category: "custom",
    image: ""
  },
];

const truffles = products.filter(p => p.category === "truffle");
const cookies = products.filter(p => p.category === "cookie");
const custom = products.filter(p => p.category === "custom");

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    review: "The Dubai Chocolate is life-changing! Best truffles I've ever had.",
    product: "Dubai Chocolate Truffles",
    image: "" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
  {
    id: 2,
    name: "Jessica L.",
    review: "Ordered for my wedding and guests couldn't stop talking about them!",
    product: "Cookie Butter Truffles",
    image: "" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
  {
    id: 3,
    name: "Amanda K.",
    review: "The Snickerdoodles taste like a warm hug. Obsessed!",
    product: "Snickerdoodle Cookies",
    image: "" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
  {
    id: 4,
    name: "Michael R.",
    review: "Bought these for my wife's birthday. She said it was her favorite gift ever.",
    product: "Strawberry Shortcake Truffles",
    image: "" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
  {
    id: 5,
    name: "Taylor B.",
    review: "Red Velvet cookies are absolutely divine. Will order again!",
    product: "Red Velvet Cookies",
    image: "" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
];

const DiamondStar = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 1Z" />
  </svg>
);

const DiamondLogo = ({ className = "", gold = false }: { className?: string; gold?: boolean }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M20 2L38 15L20 38L2 15L20 2Z" 
      stroke={gold ? "#D4AF37" : "currentColor"}
      strokeWidth="1.5" 
      strokeLinejoin="round"
    />
    <path 
      d="M2 15H38" 
      stroke={gold ? "#D4AF37" : "currentColor"}
      strokeWidth="1" 
      opacity="0.6"
    />
    <path 
      d="M20 2L14 15L20 38L26 15L20 2Z" 
      stroke={gold ? "#D4AF37" : "currentColor"}
      strokeWidth="1" 
      opacity="0.4"
    />
  </svg>
);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diamond-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [customForm, setCustomForm] = useState({ flavorIdea: '', eventDate: '', name: '', email: '' });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('diamond-cart', JSON.stringify(cart));
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
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
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
    }, 2500);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const ProductCard = ({ product, index }: { product: typeof products[0]; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer ${
        product.isCustom 
          ? 'border-2 border-dashed border-[#3D2B1F]/50' 
          : 'border border-[#3D2B1F]/25'
      }`}
      style={{ 
        backgroundColor: '#F9F1F1',
        boxShadow: '0 4px 24px rgba(61, 43, 31, 0.08), 0 0 0 1px rgba(61, 43, 31, 0.05)'
      }}
      data-testid={`product-${product.id}`}
    >
      {/* <!-- UPLOAD PRODUCT IMAGE HERE --> */}
      <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: 'rgba(61, 43, 31, 0.02)' }}>
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(61, 43, 31, 0.06) 0%, rgba(61, 43, 31, 0.02) 100%)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <DiamondLogo className="w-10 h-10 text-[#3D2B1F]/15 mb-3" />
            <span className="text-[#3D2B1F]/30 text-sm font-display tracking-[0.15em]">Signature Diamond Selection</span>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {product.isCustom ? (
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#3D2B1F]" />
            <span className="text-[#3D2B1F] text-sm font-display tracking-[0.2em] uppercase">Custom Order</span>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#3D2B1F]/50 text-sm tracking-[0.15em] uppercase">Batch of {product.batch}</span>
            <span className="font-display text-2xl sm:text-3xl text-[#3D2B1F]">${product.price}</span>
          </div>
        )}
        
        <h3 className="font-display text-xl sm:text-2xl text-[#3D2B1F] mb-4 tracking-wide">{product.name}</h3>
        
        <div className="bg-[#3D2B1F]/5 rounded-lg p-4 mb-6 border border-[#3D2B1F]/10">
          <p className="text-[#3D2B1F]/70 text-sm sm:text-base leading-relaxed">{product.description}</p>
        </div>
        
        <button
          onClick={() => addToCart(product)}
          className={`w-full py-5 sm:py-6 text-base sm:text-lg font-display tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] rounded-full ${
            product.isCustom 
              ? 'bg-transparent border-2 border-[#3D2B1F] text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-[#F9F1F1]' 
              : 'bg-[#3D2B1F] text-[#F9F1F1] hover:bg-[#2a1e15]'
          }`}
          data-testid={`add-${product.id}`}
        >
          {product.isCustom ? (
            <>
              <Send className="w-5 h-5" />
              REQUEST QUOTE
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              ADD TO CART
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Split-Door Pre-loader Animation */}
      <AnimatePresence>
        {loading && (
          <>
            {/* Left Door */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="fixed top-0 left-0 w-1/2 h-full z-[100]"
              style={{ backgroundColor: '#3D2B1F' }}
            />
            {/* Right Door */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="fixed top-0 right-0 w-1/2 h-full z-[100]"
              style={{ backgroundColor: '#3D2B1F' }}
            />
            {/* Center Content */}
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[101] flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Gold Diamond Pulse */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.15, 1], 
                  opacity: 1 
                }}
                transition={{ 
                  duration: 1.2, 
                  times: [0, 0.5, 1],
                  ease: "easeOut"
                }}
              >
                <DiamondLogo className="w-20 h-20 sm:w-24 sm:h-24" gold />
              </motion.div>

              {/* Brand Name with Expanding Letter Spacing */}
              <motion.h1
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.35em" }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                className="font-display text-xl sm:text-2xl mt-8"
                style={{ color: '#D4AF37' }}
              >
                DIAMOND DULCERIA
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-[#D4AF37]/50 text-xs tracking-[0.3em] mt-3"
              >
                ESTD. 2025
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-screen" style={{ backgroundColor: '#F4C2C2' }}>
        {/* Sticky Header - Floats in from top */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: loading ? 0 : 2.2, ease: "easeOut" }}
          className="sticky top-0 z-40 shadow-lg"
          style={{ backgroundColor: '#3D2B1F' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-3">
                <DiamondLogo className="w-8 h-8 sm:w-10 sm:h-10 text-[#F4C2C2]" />
                <div>
                  <h1 className="font-display text-lg sm:text-xl text-[#F4C2C2] tracking-[0.15em]">DIAMOND DULCERIA</h1>
                  <p className="text-[#F4C2C2]/60 text-[10px] tracking-[0.25em]">ESTD. 2025</p>
                </div>
              </div>
              
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-3 sm:p-4 bg-[#F4C2C2] hover:bg-[#e8b0b0] text-[#3D2B1F] rounded-full transition-all duration-300 active:scale-95"
                data-testid="button-cart"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#3D2B1F] text-[#F4C2C2] text-xs font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-[#3D2B1F]/10 blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-[#3D2B1F]/10 blur-3xl" />
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: loading ? 0 : 2.4 }}
            >
              <DiamondLogo className="w-16 h-16 sm:w-20 sm:h-20 text-[#3D2B1F] mx-auto mb-8" />
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#3D2B1F] leading-tight mb-6 tracking-wide">
                Artisan Confections
              </h2>
              <p className="text-[#3D2B1F]/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                Handcrafted truffles and signature cookies, made with passion and the finest ingredients.
              </p>
              <a 
                href="#shop" 
                className="inline-block px-12 py-5 sm:px-16 sm:py-6 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F9F1F1] text-lg font-display tracking-[0.2em] rounded-full transition-all duration-300 active:scale-95"
                data-testid="button-shop-now"
              >
                VIEW COLLECTION
              </a>
            </motion.div>
          </div>
        </section>

        {/* Truffle Collection */}
        <section id="shop" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#3D2B1F] mb-4 tracking-wide">
                Truffle Collection
              </h2>
              <p className="text-[#3D2B1F]/60 text-lg">Luxurious ganache centers, handcrafted to order</p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="w-12 h-px bg-[#3D2B1F]/30" />
                <DiamondLogo className="w-5 h-5 text-[#3D2B1F]/40" />
                <div className="w-12 h-px bg-[#3D2B1F]/30" />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {truffles.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Cookie Collection */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#3D2B1F] mb-4 tracking-wide">
                Cookie Collection
              </h2>
              <p className="text-[#3D2B1F]/60 text-lg">Soft-baked perfection in every bite</p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="w-12 h-px bg-[#3D2B1F]/30" />
                <DiamondLogo className="w-5 h-5 text-[#3D2B1F]/40" />
                <div className="w-12 h-px bg-[#3D2B1F]/30" />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {cookies.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Bespoke Diamond Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Sparkles className="w-8 h-8 text-[#3D2B1F] mx-auto mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl text-[#3D2B1F] mb-4 tracking-wide">
                Bespoke Creations
              </h2>
              <p className="text-[#3D2B1F]/60 text-lg">Have a unique flavor in mind?</p>
            </motion.div>

            {custom.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>

        {/* Diamond Wall of Love - Reviews Section */}
        <section className="py-16 sm:py-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <DiamondStar key={i} className="w-5 h-5 text-[#D4AF37]" />
                ))}
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#3D2B1F] mb-4 tracking-wide">
                Our Sparkling Clients
              </h2>
              <p className="text-[#3D2B1F]/60 text-lg">The Diamond Wall of Love</p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="w-12 h-px bg-[#3D2B1F]/30" />
                <DiamondLogo className="w-5 h-5 text-[#3D2B1F]/40" />
                <div className="w-12 h-px bg-[#3D2B1F]/30" />
              </div>
            </motion.div>
          </div>

          {/* Horizontal Scrolling Gallery */}
          <div 
            className="flex gap-6 px-4 sm:px-6 pb-4 overflow-x-auto scrollbar-hide"
            style={{ 
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Spacer for centering on desktop */}
            <div className="flex-shrink-0 w-4 sm:w-[calc((100vw-72rem)/2)]" />
            
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-72 sm:w-80"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div 
                  className="h-full border border-[#3D2B1F]/20"
                  style={{ 
                    backgroundColor: '#F9F1F1',
                    boxShadow: '0 4px 24px rgba(61, 43, 31, 0.08)'
                  }}
                >
                  {/* <!-- UPLOAD REVIEW IMAGE HERE --> */}
                  {/* Square Product Photo */}
                  <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'rgba(61, 43, 31, 0.03)' }}>
                    {review.image ? (
                      <img 
                        src={review.image} 
                        alt={`${review.product} review`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex flex-col items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(61, 43, 31, 0.06) 0%, rgba(61, 43, 31, 0.02) 100%)',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        <DiamondLogo className="w-12 h-12 text-[#3D2B1F]/15 mb-2" />
                        <span className="text-[#3D2B1F]/30 text-xs font-display tracking-[0.1em]">{review.product}</span>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="p-6">
                    {/* 5-Star Diamond Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <DiamondStar key={i} className="w-4 h-4 text-[#D4AF37]" />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-[#3D2B1F]/80 text-sm sm:text-base leading-relaxed mb-4 italic">
                      "{review.review}"
                    </p>

                    {/* Customer Name */}
                    <p className="font-display text-[#3D2B1F] tracking-wide text-sm">
                      — {review.name}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Spacer for centering on desktop */}
            <div className="flex-shrink-0 w-4 sm:w-[calc((100vw-72rem)/2)]" />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 sm:py-20 px-4 border-t border-[#3D2B1F]/10">
          <div className="max-w-6xl mx-auto text-center">
            <DiamondLogo className="w-12 h-12 text-[#3D2B1F] mx-auto mb-6" />
            <h3 className="font-display text-2xl sm:text-3xl text-[#3D2B1F] tracking-[0.2em] mb-2">DIAMOND DULCERIA</h3>
            <p className="font-display text-[#3D2B1F]/40 text-xs tracking-[0.3em] mb-8 italic">Estd. 2025</p>
            
            <div className="flex justify-center gap-4 mb-10">
              <a href="#" className="p-4 border border-[#3D2B1F]/20 text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-[#F4C2C2] rounded-full transition-all duration-300" data-testid="link-instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            
            <p className="text-[#3D2B1F]/40 text-sm tracking-wide">
              © 2025 Diamond Dulceria. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Sliding Mini-Cart */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#3D2B1F]/60 backdrop-blur-sm z-50"
                onClick={() => setCartOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-md z-50 shadow-2xl flex flex-col"
                style={{ backgroundColor: '#F9F1F1' }}
              >
                <div className="p-6 flex justify-between items-center" style={{ backgroundColor: '#3D2B1F' }}>
                  <div className="flex items-center gap-3">
                    <DiamondLogo className="w-6 h-6 text-[#F4C2C2]" />
                    <h3 className="font-display text-xl text-[#F4C2C2] tracking-wide">Your Cart</h3>
                  </div>
                  <button 
                    onClick={() => setCartOpen(false)} 
                    className="p-2 text-[#F4C2C2]/70 hover:text-[#F4C2C2] transition-colors"
                    data-testid="button-close-cart"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingBag className="w-16 h-16 text-[#3D2B1F]/20 mx-auto mb-4" />
                      <p className="text-[#3D2B1F]/50 font-display tracking-wide">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.id} className="p-5 rounded-lg" style={{ backgroundColor: '#F4C2C2', border: '1px solid rgba(61,43,31,0.1)' }}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 pr-4">
                              <h4 className="font-display text-lg text-[#3D2B1F] tracking-wide">{item.name}</h4>
                              <p className="text-[#3D2B1F]/60 text-sm">${item.price} × {item.quantity}</p>
                            </div>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-[#3D2B1F]/40 hover:text-[#3D2B1F] transition-colors"
                              data-testid={`remove-${item.id}`}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-12 h-12 flex items-center justify-center border border-[#3D2B1F]/20 text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-[#F4C2C2] rounded-full transition-colors"
                              data-testid={`decrease-${item.id}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-display text-xl text-[#3D2B1F]">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-12 h-12 flex items-center justify-center border border-[#3D2B1F]/20 text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-[#F4C2C2] rounded-full transition-colors"
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
                  <div className="p-6" style={{ backgroundColor: '#3D2B1F' }}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[#F4C2C2]/70 text-lg tracking-wide">Total</span>
                      <span className="font-display text-3xl text-[#F4C2C2]">${subtotal}</span>
                    </div>
                    <button
                      className="w-full py-5 bg-[#F4C2C2] hover:bg-[#e8b0b0] text-[#3D2B1F] text-lg font-display tracking-[0.15em] rounded-full transition-all duration-300 active:scale-[0.98]"
                      data-testid="button-checkout"
                    >
                      CHECKOUT
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bespoke Diamond Modal */}
        <AnimatePresence>
          {customModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#3D2B1F]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !formSubmitted && setCustomModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg overflow-hidden shadow-2xl rounded-lg"
                style={{ backgroundColor: '#F9F1F1' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 flex justify-between items-center" style={{ backgroundColor: '#3D2B1F' }}>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="font-display text-xl text-[#F4C2C2] tracking-wide">Bespoke Diamond</h3>
                  </div>
                  <button 
                    onClick={() => setCustomModalOpen(false)}
                    className="p-2 text-[#F4C2C2]/70 hover:text-[#F4C2C2] transition-colors"
                    data-testid="button-close-modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formSubmitted ? (
                  <div className="p-10 text-center">
                    <DiamondLogo className="w-16 h-16 text-[#3D2B1F] mx-auto mb-6" />
                    <h4 className="font-display text-2xl text-[#3D2B1F] mb-3 tracking-wide">Request Submitted</h4>
                    <p className="text-[#3D2B1F]/60">We'll review your idea and be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="p-6 sm:p-8 space-y-5">
                    <p className="text-[#3D2B1F]/70 text-sm mb-2">
                      Share your vision for a custom creation. All requests subject to approval.
                    </p>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Your Name</label>
                      <input
                        type="text"
                        required
                        value={customForm.name}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg rounded-lg"
                        placeholder="Jane Doe"
                        data-testid="input-name"
                      />
                    </div>

                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={customForm.email}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg rounded-lg"
                        placeholder="jane@email.com"
                        data-testid="input-email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Flavor Idea</label>
                      <textarea
                        required
                        value={customForm.flavorIdea}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, flavorIdea: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg resize-none rounded-lg"
                        rows={3}
                        placeholder="Describe your dream flavor..."
                        data-testid="input-flavor"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Event Date</label>
                      <input
                        type="date"
                        required
                        value={customForm.eventDate}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, eventDate: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg rounded-lg"
                        data-testid="input-date"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-5 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F9F1F1] text-lg font-display tracking-[0.15em] rounded-full transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                      data-testid="button-submit-request"
                    >
                      <Send className="w-5 h-5" />
                      SUBMIT REQUEST
                    </button>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
