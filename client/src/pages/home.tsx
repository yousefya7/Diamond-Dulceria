import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Minus, X, Instagram, Sparkles, Send, Star, ChevronDown } from "lucide-react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customNotes?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  batch: number;
  description: string;
  isCustom: boolean;
  category: string;
  image: string | null;
  trending?: boolean;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
};

const defaultProducts: Product[] = [
  { 
    id: "dubai-chocolate", 
    name: "Dubai Chocolate Truffles", 
    price: 50, 
    batch: 25,
    description: "A rich pistachio cream filling, coated in silky milk chocolate and topped with a pistachio crunch and drizzle.",
    isCustom: false,
    category: "truffle",
    image: "/dubai_chocolate.png",
    trending: true
  },
  { 
    id: "cookie-butter", 
    name: "Cookie Butter Truffles", 
    price: 50, 
    batch: 25,
    description: "Spiced cookie filling wrapped in smooth white chocolate, finished with Biscoff crumb topping.",
    isCustom: false,
    category: "truffle",
    image: "/cookie_butter.png"
  },
  { 
    id: "strawberry-shortcake", 
    name: "Strawberry Shortcake Truffles", 
    price: 50, 
    batch: 25,
    description: "A rich strawberry-infused cheesecake filling enrobed in smooth pink white chocolate topped with a strawberry crumble.",
    isCustom: false,
    category: "truffle",
    image: "/strawberry_shortcake.png"
  },
  { 
    id: "cookies-cream", 
    name: "Cookies & Cream Truffles", 
    price: 50, 
    batch: 25,
    description: "Classic cookies & cream filling enrobed in milk chocolate, finished with a white chocolate drizzle and Oreo crumble.",
    isCustom: false,
    category: "truffle",
    image: "/cookies_cream.png"
  },
  { 
    id: "red-velvet", 
    name: "Red Velvet Cookies", 
    price: 50, 
    batch: 25,
    description: "Deep red cocoa base mixed with white chocolate chips, crushed Oreo cookies, and a smooth cream cheese swirl.",
    isCustom: false,
    category: "cookie",
    image: "/red_velvet.png"
  },
  { 
    id: "snickerdoodle", 
    name: "Snickerdoodle Cookies", 
    price: 50, 
    batch: 25,
    description: "Classic cinnamon-sugar dusting with soft, chewy center",
    isCustom: false,
    category: "cookie",
    image: "/snickerdoodle.png"
  },
  { 
    id: "signature-cookies", 
    name: "Signature Cookies", 
    price: 50, 
    batch: 25,
    description: "Our signature brown butter cookies with premium chocolate and sea salt",
    isCustom: false,
    category: "cookie",
    image: "/signature_cookies.png"
  },
  { 
    id: "chocolate-strawberries", 
    name: "Chocolate Covered Strawberries", 
    price: 50, 
    batch: 12,
    description: "Fresh strawberries dipped in rich chocolate with elegant drizzle and toppings.",
    isCustom: false,
    category: "seasonal",
    image: "/strawberries.jpg",
    trending: true
  },
  { 
    id: "pink-chocolate-cookies", 
    name: "Pink Chocolate Cookies", 
    price: 50, 
    batch: 25,
    description: "Soft-baked cookies with pink white chocolate chips and a touch of strawberry.",
    isCustom: false,
    category: "seasonal",
    image: "/pink-cookies.jpg",
    trending: true
  },
  { 
    id: "strawberry-truffles", 
    name: "Strawberry Truffles", 
    price: 50, 
    batch: 25,
    description: "Strawberry center with milk chocolate on the outside.",
    isCustom: false,
    category: "seasonal",
    image: "/strawberry-truffle.jpg",
    trending: true
  },
  { 
    id: "bespoke-diamond", 
    name: "Bespoke Creation", 
    price: 0, 
    batch: 0,
    description: "Custom flavors crafted exclusively for you. Subject to approval.",
    isCustom: true,
    category: "custom",
    image: "/bespoke_creation.png"
  },
];

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    review: "The Dubai Chocolate is life-changing! Best truffles I've ever had.",
    product: "Dubai Chocolate Truffles",
    image: "/review_dubai.jpg" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
  {
    id: 2,
    name: "Jessica L.",
    review: "The biscoff and strawberry shortcake truffles were amazing! Truly a work of art.",
    product: "Truffle Assortment",
    image: "/review_mix.jpg" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
  {
    id: 3,
    name: "Amanda K.",
    review: "The signature cookies are incredible and never fail to impress. Perfect every time.",
    product: "Signature Cookies",
    image: "/review_signature.jpg" // <!-- UPLOAD REVIEW IMAGE HERE -->
  },
];

const DiamondStar = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 1Z" />
  </svg>
);

// Inline Payment Section with Stripe hooks capture
function InlinePaymentSection({ 
  onReady,
  stripeRef
}: { 
  onReady: (ready: boolean) => void;
  stripeRef: React.MutableRefObject<{ stripe: Stripe | null; elements: any } | null>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  
  useEffect(() => {
    if (stripe && elements) {
      stripeRef.current = { stripe, elements };
    }
  }, [stripe, elements, stripeRef]);
  
  return (
    <div className="space-y-3">
      <h5 className="text-[#3D2B1F] font-display text-sm tracking-wide flex items-center gap-2">
        <svg className="w-4 h-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Payment Details
      </h5>
      <div className="p-4 bg-white rounded-lg border border-[#3D2B1F]/10">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
          onReady={() => onReady(true)}
          onChange={(event) => onReady(event.complete)}
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-[#3D2B1F]/50 text-xs">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Stripe
      </div>
    </div>
  );
}

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
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diamond-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    notes: ''
  });
  
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [customForm, setCustomForm] = useState({ dessertType: '', flavorRequest: '', eventDate: '' });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentPaymentIntentId, setCurrentPaymentIntentId] = useState<string | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [skipPayment, setSkipPayment] = useState(false);

  const truffles = useMemo(() => products.filter(p => p.category === "truffle" || p.category === "truffles"), [products]);
  const cookies = useMemo(() => products.filter(p => p.category === "cookie" || p.category === "cookies"), [products]);
  const seasonal = useMemo(() => products.filter(p => p.category === "seasonal"), [products]);
  const custom = useMemo(() => products.filter(p => p.category === "custom"), [products]);

  const getCategoryInfo = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    return cat || { title: slug.charAt(0).toUpperCase() + slug.slice(1), description: null };
  };

  const getProductsBySlug = (slug: string) => {
    const singularSlug = slug.endsWith('s') ? slug.slice(0, -1) : slug;
    return products.filter(p => 
      p.category === slug || 
      p.category === singularSlug || 
      p.category === slug + 's' ||
      (slug === 'custom' && p.isCustom)
    );
  };

  const defaultCategories = [
    { id: 'default-truffles', slug: 'truffles', name: 'Truffles', title: 'Truffle Collection', description: 'Luxurious filled center, handcrafted to order', displayOrder: 1, active: true },
    { id: 'default-cookies', slug: 'cookies', name: 'Cookies', title: 'Cookie Collection', description: 'Soft-baked perfection in every bite', displayOrder: 2, active: true },
    { id: 'default-seasonal', slug: 'seasonal', name: 'Seasonal', title: 'Seasonal Specials', description: 'Limited-time treats for the season', displayOrder: 3, active: true },
    { id: 'default-custom', slug: 'custom', name: 'Custom', title: 'Bespoke Creations', description: 'Custom flavors crafted just for you', displayOrder: 4, active: true },
  ];

  const allCategories = categories.length > 0 ? categories : defaultCategories;
  const visibleCategories = allCategories.filter(cat => cat.active && (cat.slug === 'custom' || getProductsBySlug(cat.slug).length > 0));
  const firstCategorySlug = visibleCategories.length > 0 ? visibleCategories[0].slug : 'truffles';

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(err => {
        console.error('Error fetching products:', err);
      });

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.categories) {
          const sorted = [...data.categories].sort((a, b) => a.displayOrder - b.displayOrder);
          setCategories(sorted);
        }
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
      });

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
      });
  }, []);

  // Load Stripe publishable key
  useEffect(() => {
    fetch('/api/stripe/publishable-key')
      .then(res => res.json())
      .then(data => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(err => console.error('Error loading Stripe:', err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Prepare payment intent when checkout modal opens
  useEffect(() => {
    if (checkoutModalOpen && cart.length > 0 && !clientSecret && !paymentError) {
      console.log('Preparing payment with cart:', cart);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      fetch('/api/checkout/prepare-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.error || `Server error: ${res.status}`);
            });
          }
          return res.json();
        })
        .then(data => {
          console.log('Prepare payment response:', data);
          if (data.skipPayment) {
            setSkipPayment(true);
            setClientSecret(null);
            setCurrentPaymentIntentId(null);
          } else if (data.clientSecret) {
            setSkipPayment(false);
            setClientSecret(data.clientSecret);
            setCurrentPaymentIntentId(data.paymentIntentId);
          } else if (data.error) {
            console.error('Prepare payment error:', data.error);
            setPaymentError(data.error);
          }
        })
        .catch(err => {
          console.error('Error preparing payment:', err);
          if (err.name === 'AbortError') {
            setPaymentError('Payment initialization timed out. Please try again.');
          } else {
            setPaymentError(err.message || 'Failed to initialize payment. Please try again.');
          }
        })
        .finally(() => {
          clearTimeout(timeoutId);
        });
        
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [checkoutModalOpen, cart, clientSecret, paymentError]);

  useEffect(() => {
    localStorage.setItem('diamond-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: typeof products[0], customNotes?: string) => {
    if (product.isCustom && !customNotes) {
      setCustomModalOpen(true);
      return;
    }
    setCart(prev => {
      // For custom products, always add as new item (don't combine)
      if (product.isCustom) {
        return [...prev, { id: `${product.id}-${Date.now()}`, name: product.name, price: product.price, quantity: 1, customNotes }];
      }
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

  // Stripe hooks ref for form submission
  const stripeRef = useRef<{ stripe: Stripe | null; elements: any } | null>(null);
  
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const stripe = stripeRef.current?.stripe;
    const elements = stripeRef.current?.elements;
    
    if (!stripe || !elements) {
      setPaymentError('Payment system not ready. Please wait a moment and try again.');
      return;
    }
    
    if (!paymentElementReady) {
      setPaymentError('Please complete the payment details.');
      return;
    }
    
    try {
      setPaymentProcessing(true);
      setPaymentError(null);
      
      // Step 1: Process payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });
      
      if (error) {
        setPaymentError(error.message || 'Payment failed. Please try again.');
        setPaymentProcessing(false);
        return;
      }
      
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        setPaymentError('Payment was not completed. Please try again.');
        setPaymentProcessing(false);
        return;
      }
      
      // Step 2: Payment succeeded - now create the order
      const response = await fetch('/api/checkout/complete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          customerName: checkoutForm.name,
          customerEmail: checkoutForm.email,
          customerPhone: checkoutForm.phone,
          deliveryAddress: `${checkoutForm.street}, ${checkoutForm.city}, ${checkoutForm.state} ${checkoutForm.zip}`,
          specialInstructions: checkoutForm.notes || null,
          items: cart,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Order creation failed:', data);
        setPaymentError('Payment succeeded but order creation failed. Please contact support.');
        setPaymentProcessing(false);
        return;
      }
      
      // Success! Clear cart and show confirmation
      setCart([]);
      localStorage.removeItem('diamond-cart');
      setOrderPlaced(true);
      
    } catch (error: any) {
      console.error('Error processing order:', error);
      setPaymentError(error.message || 'An error occurred. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Handle $0 order submission (custom orders only)
  const handleFreeOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setPaymentProcessing(true);
      setPaymentError(null);
      
      const response = await fetch('/api/checkout/submit-free-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: checkoutForm.name,
          customerEmail: checkoutForm.email,
          customerPhone: checkoutForm.phone,
          deliveryAddress: `${checkoutForm.street}, ${checkoutForm.city}, ${checkoutForm.state} ${checkoutForm.zip}`,
          specialInstructions: checkoutForm.notes || null,
          items: cart,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Order creation failed:', data);
        setPaymentError(data.error || 'Failed to submit order. Please try again.');
        return;
      }
      
      // Success! Clear cart and show confirmation
      setCart([]);
      localStorage.removeItem('diamond-cart');
      setOrderPlaced(true);
      
    } catch (error: any) {
      console.error('Error submitting order:', error);
      setPaymentError(error.message || 'An error occurred. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
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
    // Add bespoke as a $0 item with custom notes
    const bespokeProduct = products.find(p => p.isCustom);
    if (bespokeProduct) {
      const customNotes = `Dessert Type: ${customForm.dessertType}\nFlavor Request: ${customForm.flavorRequest}${customForm.eventDate ? `\nEvent Date: ${customForm.eventDate}` : ''}`;
      addToCart(bespokeProduct, customNotes);
    }
    setFormSubmitted(true);
    setTimeout(() => {
      setCustomModalOpen(false);
      setFormSubmitted(false);
      setCustomForm({ dessertType: '', flavorRequest: '', eventDate: '' });
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
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col ${
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
      <div className="aspect-[4/3] relative overflow-hidden flex-shrink-0" style={{ backgroundColor: 'rgba(61, 43, 31, 0.02)' }}>
        {'trending' in product && product.trending && (
          <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-[#D4AF37] text-white text-xs font-display tracking-[0.15em] uppercase rounded-full shadow-lg">
            ✦ Trending
          </div>
        )}
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
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

      <div className="p-6 sm:p-8 flex flex-col flex-grow">
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
        
        <div className="bg-[#3D2B1F]/5 rounded-lg p-4 mb-6 border border-[#3D2B1F]/10 flex-grow">
          <p className="text-[#3D2B1F]/70 text-sm sm:text-base leading-relaxed">{product.description}</p>
        </div>
        
        <button
          onClick={() => addToCart(product)}
          className="w-full py-5 sm:py-6 text-base sm:text-lg font-display tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] rounded-full bg-[#3D2B1F] text-[#F9F1F1] hover:bg-[#2a1e15] mt-auto"
          data-testid={`add-${product.id}`}
        >
          <Plus className="w-5 h-5" />
          {product.isCustom ? 'CUSTOM ORDER' : 'ADD TO CART'}
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
              transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 w-1/2 h-full z-[100]"
              style={{ backgroundColor: '#3D2B1F' }}
            />
            {/* Right Door */}
            <motion.div
              initial={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
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
                {siteSettings.heroTitle || 'DIAMOND DULCERIA'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-[#D4AF37]/50 text-xs tracking-[0.3em] mt-3"
              >
                {siteSettings.establishedYear || 'ESTD. 2025'}
              </motion.p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-screen" style={{ backgroundColor: '#F4C2C2' }}>
        {/* Sticky Header - Centered Logo with Cart Pinned Right */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="sticky top-0 z-40 shadow-lg"
          style={{ backgroundColor: '#3D2B1F' }}
        >
          <div className="relative px-0">
            <div className="flex items-center justify-center h-18 sm:h-24">
              {/* Centered Logo & Brand */}
              <div className="flex items-center gap-3">
                <DiamondLogo className="w-8 h-8 sm:w-10 sm:h-10 text-[#F4C2C2]" />
                <div className="text-center">
                  <h1 className="font-display text-lg sm:text-xl text-[#F4C2C2] tracking-[0.15em]">{siteSettings.heroTitle || 'DIAMOND DULCERIA'}</h1>
                  <p className="text-[#F4C2C2]/60 text-[10px] tracking-[0.25em]">{siteSettings.establishedYear || 'ESTD. 2025'}</p>
                </div>
              </div>
              
              {/* Cart Button - Pinned to Top Right Corner - Pink on Brown */}
              <button
                onClick={() => setCartOpen(true)}
                className="fixed right-0 top-0 z-50 p-4 sm:p-5 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F4C2C2] transition-all duration-300 active:scale-95"
                data-testid="button-cart"
              >
                <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-6 h-6 bg-[#F4C2C2] text-[#3D2B1F] text-xs font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Shortcut Navigation Bar */}
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="sticky top-[72px] sm:top-24 z-30 border-b border-[#3D2B1F]/10"
          style={{ backgroundColor: '#F4C2C2' }}
        >
          <div className="w-full overflow-hidden">
            <div 
              className="flex items-center justify-around w-full px-2 sm:px-6 py-3 sm:py-4"
            >
              {visibleCategories.map((cat, idx) => (
                <span key={cat.id} className="contents">
                  <a 
                    href={`#${cat.slug}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(cat.slug)?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="flex-shrink font-display text-[3.2vw] sm:text-lg tracking-[0.05em] sm:tracking-[0.15em] text-[#3D2B1F] hover:text-[#3D2B1F]/70 transition-colors text-center py-2 px-1 sm:px-3 rounded-lg hover:bg-[#3D2B1F]/5 active:bg-[#3D2B1F]/10"
                  >
                    {cat.name}
                  </a>
                  {idx < visibleCategories.length - 1 && <span className="text-[#3D2B1F]/30 text-[3vw] sm:text-lg">|</span>}
                </span>
              ))}
              <span className="text-[#3D2B1F]/30 text-[3vw] sm:text-lg">|</span>
              <a 
                href="#wall-of-love" 
                onClick={(e) => { e.preventDefault(); document.getElementById('wall-of-love')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex-shrink font-display text-[3.2vw] sm:text-lg tracking-[0.05em] sm:tracking-[0.15em] text-[#3D2B1F] hover:text-[#3D2B1F]/70 transition-colors text-center py-2 px-1 sm:px-3 rounded-lg hover:bg-[#3D2B1F]/5 active:bg-[#3D2B1F]/10"
              >
                Reviews
              </a>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section - Full Screen */}
        <section className="relative min-h-[100vh] flex items-center justify-center px-4 overflow-hidden">
          {/* Subtle marble/parchment texture background */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233D2B1F' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Soft gradient orbs */}
          <div className="absolute inset-0 opacity-30 -z-10">
            <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-[#3D2B1F]/10 blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-[#3D2B1F]/10 blur-3xl" />
          </div>
          
          {/* Floating Decorative Elements - Hidden on Mobile */}
          <div className="hidden sm:block absolute inset-0 -z-10 pointer-events-none overflow-hidden">
            {/* Gold leaf flake - top left */}
            <motion.div 
              initial={{ opacity: 0, rotate: -15 }}
              animate={{ opacity: 0.6, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="absolute top-[15%] left-[8%] text-[#D4AF37]/40"
            >
              <svg width="40" height="50" viewBox="0 0 40 50" fill="currentColor">
                <path d="M20 0c5 10 15 15 20 25-5 10-15 15-20 25-5-10-15-15-20-25C5 15 15 10 20 0z"/>
              </svg>
            </motion.div>
            
            {/* Cocoa bean - top right */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute top-[20%] right-[10%] text-[#3D2B1F]/25"
            >
              <svg width="35" height="50" viewBox="0 0 35 50" fill="currentColor">
                <ellipse cx="17.5" cy="25" rx="14" ry="22" />
                <path d="M17.5 5v40" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
              </svg>
            </motion.div>
            
            {/* Chocolate drizzle - bottom left */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute bottom-[25%] left-[5%] text-[#3D2B1F]/20"
            >
              <svg width="60" height="80" viewBox="0 0 60 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M10 5 Q30 20, 20 40 Q10 60, 30 75"/>
                <path d="M40 10 Q50 30, 45 50 Q40 70, 50 80"/>
              </svg>
            </motion.div>
            
            {/* Gold flake - bottom right */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="absolute bottom-[18%] right-[12%] text-[#D4AF37]/30"
            >
              <svg width="30" height="35" viewBox="0 0 30 35" fill="currentColor">
                <path d="M15 0c3 7 10 10 15 17.5-5 7.5-12 10.5-15 17.5-3-7-10-10-15-17.5C10 10 12 7 15 0z"/>
              </svg>
            </motion.div>
            
            {/* Small cocoa bean - mid left */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="absolute top-[45%] left-[3%] text-[#3D2B1F]/20"
            >
              <svg width="25" height="35" viewBox="0 0 35 50" fill="currentColor">
                <ellipse cx="17.5" cy="25" rx="12" ry="20" />
              </svg>
            </motion.div>
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <DiamondLogo className="w-16 h-16 sm:w-20 sm:h-20 text-[#3D2B1F] mx-auto mb-6" />
              
              {/* Brand Tagline */}
              <p className="text-[#D4AF37] text-sm sm:text-base tracking-[0.3em] uppercase mb-4 font-light italic">
                {siteSettings.heroTagline || 'The Art of the Sweet Treat'}
              </p>
              
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#3D2B1F] leading-tight mb-6 tracking-wide">
                {siteSettings.heroSubtitle || 'Artisan Confections'}
              </h2>
              <p className="text-[#3D2B1F]/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                {siteSettings.heroDescription || 'Handcrafted truffles and signature cookies, made with passion and the finest ingredients.'}
              </p>
              <button 
                onClick={() => document.getElementById(firstCategorySlug)?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-block px-12 py-5 sm:px-16 sm:py-6 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F9F1F1] text-lg font-display tracking-[0.2em] rounded-full transition-all duration-300 active:scale-95 cursor-pointer"
                data-testid="button-shop-now"
              >
                VIEW COLLECTION
              </button>
            </motion.div>
          </div>
          
          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => document.getElementById(firstCategorySlug)?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-[#3D2B1F]/50 text-xs tracking-[0.25em] uppercase font-display">Explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5 text-[#3D2B1F]/50" />
            </motion.div>
          </motion.div>
        </section>

        {/* Section Separator */}
        <div className="flex items-center justify-center px-8 sm:px-16">
          <div className="flex-1 h-[0.5px] bg-[#3D2B1F]/30" />
          <DiamondLogo className="w-4 h-4 mx-4 text-[#3D2B1F]/40" />
          <div className="flex-1 h-[0.5px] bg-[#3D2B1F]/30" />
        </div>

        {/* Dynamic Product Sections */}
        {allCategories.map((cat, catIndex) => {
          const categoryProducts = getProductsBySlug(cat.slug);
          const isCustomCategory = cat.slug === 'custom';
          
          if (!cat.active) return null;
          
          return (
            <div key={cat.id}>
              {isCustomCategory ? (
                <section id={cat.slug} className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 scroll-mt-28">
                  <div className="relative max-w-lg mx-auto w-full">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="text-center mb-5"
                    >
                      <Sparkles className="w-7 h-7 text-[#D4AF37] mx-auto mb-3" />
                      <h2 className="font-display text-2xl sm:text-3xl text-[#3D2B1F] mb-2 tracking-wide font-semibold">
                        {cat.title}
                      </h2>
                      <p className="text-[#3D2B1F]/70 text-base sm:text-lg font-medium">{cat.description || 'Custom flavors crafted just for you'}</p>
                    </motion.div>

                    <div className="bg-[#F9F1F1] border border-[#3D2B1F]/15 rounded-xl p-6 text-center shadow-sm">
                      <p className="text-[#3D2B1F]/80 text-base sm:text-lg mb-4 font-medium">Have a unique flavor in mind? Subject to approval.</p>
                      <button
                        onClick={() => categoryProducts[0] && addToCart(categoryProducts[0])}
                        className="px-8 py-3 text-base font-display tracking-[0.12em] bg-[#3D2B1F] text-[#F9F1F1] rounded-full hover:bg-[#2a1e15] transition-all font-semibold"
                        data-testid="add-bespoke-diamond"
                      >
                        CUSTOM ORDER
                      </button>
                    </div>
                  </div>
                </section>
              ) : categoryProducts.length > 0 && (
                <section id={cat.slug} className="py-24 sm:py-36 px-4 sm:px-6 lg:px-8 scroll-mt-28">
                  <div className="max-w-6xl mx-auto">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="text-center mb-16 sm:mb-20"
                    >
                      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#3D2B1F] mb-5 tracking-wide">
                        {cat.title}
                      </h2>
                      <p className="text-[#3D2B1F]/60 text-lg sm:text-xl max-w-xl mx-auto">{cat.description}</p>
                      <div className="flex items-center justify-center gap-4 mt-8">
                        <div className="w-16 h-px bg-[#3D2B1F]/30" />
                        <DiamondLogo className="w-6 h-6 text-[#3D2B1F]/40" />
                        <div className="w-16 h-px bg-[#3D2B1F]/30" />
                      </div>
                    </motion.div>

                    <div className={`grid grid-cols-2 ${categoryProducts.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 sm:gap-6`}>
                      {categoryProducts.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                      ))}
                    </div>
                  </div>
                </section>
              )}
              
              {/* Section Separator */}
              <div className="flex items-center justify-center px-8 sm:px-16">
                <div className="flex-1 h-[0.5px] bg-[#3D2B1F]/30" />
                <DiamondLogo className="w-4 h-4 mx-4 text-[#3D2B1F]/40" />
                <div className="flex-1 h-[0.5px] bg-[#3D2B1F]/30" />
              </div>
            </div>
          );
        })}

        {/* Diamond Wall of Love - Reviews Section */}
        <section id="wall-of-love" className="py-28 sm:py-40 scroll-mt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 sm:mb-20"
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <DiamondStar key={i} className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37]" />
                ))}
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#3D2B1F] mb-5 tracking-wide">
                Our Sparkling Clients
              </h2>
              <p className="text-[#3D2B1F]/60 text-lg sm:text-xl">The Diamond Wall of Love</p>
              <div className="flex items-center justify-center gap-4 mt-8">
                <div className="w-16 h-px bg-[#3D2B1F]/30" />
                <DiamondLogo className="w-6 h-6 text-[#3D2B1F]/40" />
                <div className="w-16 h-px bg-[#3D2B1F]/30" />
              </div>
            </motion.div>

            {/* Grid Layout matching product rows */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full flex flex-col"
                >
                  <div 
                    className="h-full flex flex-col border border-[#3D2B1F]/20 rounded-lg overflow-hidden"
                    style={{ 
                      backgroundColor: '#F9F1F1',
                      boxShadow: '0 8px 32px rgba(61, 43, 31, 0.10)'
                    }}
                  >
                    {/* Square Product Photo */}
                    <div className="aspect-[4/3] relative overflow-hidden flex-shrink-0" style={{ backgroundColor: 'rgba(61, 43, 31, 0.03)' }}>
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
                          <DiamondLogo className="w-10 h-10 text-[#3D2B1F]/15 mb-2" />
                          <span className="text-[#3D2B1F]/30 text-xs font-display tracking-[0.1em] text-center px-2">{review.product}</span>
                        </div>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="p-4 sm:p-6 flex flex-col flex-grow">
                      {/* 5-Star Diamond Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <DiamondStar key={i} className="w-4 h-4 text-[#D4AF37]" />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-[#3D2B1F]/80 text-sm sm:text-base leading-relaxed mb-3 italic flex-grow">
                        "{review.review}"
                      </p>

                      {/* Customer Name */}
                      <p className="font-display text-[#3D2B1F] tracking-wide text-sm mt-auto">
                        — {review.name}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 sm:py-20 px-4" style={{ backgroundColor: '#3D2B1F' }}>
          <div className="max-w-6xl mx-auto text-center">
            <DiamondLogo className="w-12 h-12 text-[#F4C2C2] mx-auto mb-6" />
            <h3 className="font-display text-2xl sm:text-3xl text-[#F4C2C2] tracking-[0.2em] mb-2">{siteSettings.heroTitle || 'DIAMOND DULCERIA'}</h3>
            <p className="font-display text-[#F4C2C2]/40 text-xs tracking-[0.3em] mb-8 italic">{siteSettings.establishedYear || 'Estd. 2025'}</p>
            
            <div className="flex justify-center gap-4 mb-10">
              <a href="https://www.instagram.com/diamonddulceria/" target="_blank" rel="noopener noreferrer" className="p-4 border border-[#F4C2C2]/30 text-[#F4C2C2] hover:bg-[#F4C2C2] hover:text-[#3D2B1F] rounded-full transition-all duration-300" data-testid="link-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://snapchat.com/t/RwuahOMo" target="_blank" rel="noopener noreferrer" className="p-4 border border-[#F4C2C2]/30 text-[#F4C2C2] hover:bg-[#F4C2C2] hover:text-[#3D2B1F] rounded-full transition-all duration-300" data-testid="link-snapchat">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12.166 3c1.672 0 3.156.647 4.175 1.82.934 1.075 1.429 2.52 1.429 4.178l-.002.393c-.009.343-.017.672-.017.953 0 .24.13.362.396.362.158 0 .356-.046.59-.137.195-.076.37-.114.523-.114.268 0 .508.098.693.283.17.17.253.385.253.657 0 .563-.527.963-1.165 1.215-.188.074-.396.147-.612.222-.479.167-.975.34-1.133.538-.087.109-.104.221-.053.353.275.713.679 1.403 1.2 2.052.474.59.995 1.042 1.549 1.345.297.163.635.293.948.362.386.085.64.337.64.638 0 .283-.196.57-.6.877-.49.374-1.17.662-2.078.882-.078.019-.131.11-.17.291-.031.146-.065.298-.14.471-.091.21-.267.315-.535.315-.168 0-.369-.033-.615-.102-.387-.108-.731-.163-1.053-.163-.262 0-.512.033-.765.101-.355.095-.676.233-1.013.378l-.108.046c-.404.173-.824.27-1.248.27-.423 0-.834-.093-1.224-.26l-.135-.057c-.33-.14-.642-.273-.986-.365-.253-.068-.503-.101-.765-.101-.346 0-.705.062-1.098.173-.22.063-.41.091-.58.091-.35 0-.551-.165-.62-.333a2.502 2.502 0 01-.134-.453c-.04-.183-.093-.275-.171-.294-.908-.22-1.588-.508-2.078-.882-.404-.307-.6-.594-.6-.877 0-.301.254-.553.64-.638.313-.07.651-.2.948-.362.554-.303 1.075-.756 1.55-1.345.52-.65.924-1.34 1.199-2.052.051-.132.034-.244-.053-.353-.158-.198-.654-.371-1.133-.538a11.47 11.47 0 01-.612-.222c-.638-.252-1.165-.652-1.165-1.215 0-.272.084-.487.253-.657.185-.185.425-.283.693-.283.153 0 .328.038.522.114.235.091.433.137.591.137.266 0 .396-.122.396-.362 0-.281-.008-.61-.017-.953l-.002-.393c0-1.658.495-3.103 1.43-4.178C9.01 3.647 10.493 3 12.166 3z"/>
                </svg>
              </a>
            </div>
            
            <p className="text-[#F4C2C2]/40 text-sm tracking-wide">
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
                              {item.customNotes ? (
                                <p className="text-[#3D2B1F]/60 text-sm">Custom Request (Quote TBD)</p>
                              ) : (
                                <p className="text-[#3D2B1F]/60 text-sm">${item.price} × {item.quantity}</p>
                              )}
                            </div>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-[#3D2B1F]/40 hover:text-[#3D2B1F] transition-colors"
                              data-testid={`remove-${item.id}`}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          {item.customNotes && (
                            <div className="mb-4 p-3 bg-white/50 rounded-lg text-xs text-[#3D2B1F]/70">
                              <p className="font-medium text-[#3D2B1F] mb-1">Request Details:</p>
                              <p className="whitespace-pre-line">{item.customNotes}</p>
                            </div>
                          )}
                          {!item.customNotes && (
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
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {cart.length > 0 && (
                  <div className="p-6" style={{ backgroundColor: '#3D2B1F' }}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[#F4C2C2]/70 text-lg tracking-wide">Total</span>
                      <span className="font-display text-3xl text-[#F4C2C2]">${subtotal}</span>
                    </div>
                    <div className="mb-4 p-3 bg-[#F4C2C2]/10 rounded-lg border border-[#F4C2C2]/20">
                      <p className="text-[#F4C2C2] text-xs text-center font-medium">
                        Note: All orders must be picked up unless delivery is coordinated beforehand.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutModalOpen(true);
                      }}
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

        {/* Checkout Modal */}
        {checkoutModalOpen && (
          <div
            className="fixed inset-0 bg-[#3D2B1F]/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => !orderPlaced && setCheckoutModalOpen(false)}
          >
            <div
              className="w-full max-w-lg overflow-hidden shadow-2xl rounded-lg max-h-[90vh] flex flex-col"
              style={{ backgroundColor: '#F9F1F1' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex justify-between items-center flex-shrink-0" style={{ backgroundColor: '#3D2B1F' }}>
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="font-display text-xl text-[#F4C2C2] tracking-wide">Secure Checkout</h3>
                  </div>
                  <button 
                    onClick={() => setCheckoutModalOpen(false)}
                    className="p-2 text-[#F4C2C2]/70 hover:text-[#F4C2C2] transition-colors"
                    disabled={orderPlaced}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {orderPlaced ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-[#D4AF37]" />
                    </div>
                    <h4 className="font-display text-2xl text-[#3D2B1F] mb-3 tracking-wide">
                      {skipPayment ? 'Request Submitted!' : 'Payment Successful!'}
                    </h4>
                    <p className="text-[#3D2B1F]/60 mb-4">
                      {skipPayment ? (
                        <>Thank you for your request!<br/>We'll contact you shortly with a quote.</>
                      ) : (
                        <>Thank you for your payment!<br/>We'll contact you shortly when your order is ready for pickup.</>
                      )}
                    </p>
                    <div className="p-4 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30 text-left mb-4">
                      <p className="text-[#3D2B1F] text-xs font-medium mb-2 uppercase tracking-wide">A confirmation email has been sent to:</p>
                      <p className="text-[#3D2B1F]/70 text-sm">{checkoutForm.email || 'your email address'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCheckoutModalOpen(false);
                        setOrderPlaced(false);
                        setClientSecret(null);
                        setCurrentPaymentIntentId(null);
                        setPaymentElementReady(false);
                        setPaymentError(null);
                        setSkipPayment(false);
                        setCheckoutForm({ name: '', email: '', phone: '', street: '', city: '', state: '', zip: '', notes: '' });
                      }}
                      className="mt-6 px-8 py-3 bg-[#3D2B1F] text-[#F9F1F1] font-display tracking-wide rounded-full hover:bg-[#2a1e15] transition-colors"
                    >
                      CONTINUE SHOPPING
                    </button>
                  </div>
                ) : skipPayment ? (
                  <form onSubmit={handleFreeOrderSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                    <div className="p-4 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30 mb-4">
                      <p className="text-[#3D2B1F] text-sm text-center font-medium">
                        Custom Order Request - No payment required now. We'll contact you with a quote!
                      </p>
                    </div>
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={checkoutForm.phone}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          required
                          value={checkoutForm.email}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                          placeholder="jane@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[#3D2B1F] font-display tracking-wide text-sm">
                        Contact Address
                      </h4>
                      <div>
                        <label className="block text-[#3D2B1F]/70 text-xs mb-1">Street Address</label>
                        <input
                          type="text"
                          value={checkoutForm.street}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, street: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                          placeholder="123 Main Street (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[#3D2B1F]/70 text-xs mb-1">City</label>
                          <input
                            type="text"
                            value={checkoutForm.city}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-[#3D2B1F]/70 text-xs mb-1">State</label>
                          <input
                            type="text"
                            value={checkoutForm.state}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-[#3D2B1F]/70 text-xs mb-1">Zip Code</label>
                          <input
                            type="text"
                            value={checkoutForm.zip}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, zip: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Special Instructions / Custom Details</label>
                      <textarea
                        value={checkoutForm.notes}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] resize-none rounded-lg"
                        rows={3}
                        placeholder="Describe your custom order details..."
                      />
                    </div>

                    <div className="pt-2">
                      {paymentError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">{paymentError}</p>
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={paymentProcessing}
                        className="w-full py-4 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F9F1F1] text-lg font-display tracking-[0.15em] rounded-full transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {paymentProcessing ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            SUBMITTING...
                          </>
                        ) : 'SUBMIT REQUEST'}
                      </button>
                    </div>
                  </form>
                ) : clientSecret && stripePromise ? (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#3D2B1F',
                          colorBackground: '#ffffff',
                          colorText: '#3D2B1F',
                          fontFamily: 'Georgia, serif',
                        }
                      }
                    }}
                  >
                    <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                      <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={checkoutForm.phone}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          required
                          value={checkoutForm.email}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                          placeholder="jane@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[#3D2B1F] font-display tracking-wide text-sm">
                        Billing Address <span className="text-red-500">*</span>
                      </h4>
                      <div>
                        <label className="block text-[#3D2B1F]/70 text-xs mb-1">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={checkoutForm.street}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, street: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[#3D2B1F]/70 text-xs mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.city}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-[#3D2B1F]/70 text-xs mb-1">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.state}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-[#3D2B1F]/70 text-xs mb-1">
                            Zip Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.zip}
                            onChange={(e) => setCheckoutForm(prev => ({ ...prev, zip: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] rounded-lg"
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">Special Instructions (Optional)</label>
                      <textarea
                        value={checkoutForm.notes}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] resize-none rounded-lg"
                        rows={2}
                        placeholder="Gate code, delivery preferences, etc."
                      />
                    </div>

                      <InlinePaymentSection 
                        onReady={setPaymentElementReady}
                        stripeRef={stripeRef}
                      />

                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-3 text-[#3D2B1F]">
                          <span className="text-sm opacity-60">Order Total</span>
                          <span className="font-display text-xl">${subtotal}</span>
                        </div>
                        <div className="mb-4 p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30">
                          <p className="text-[#3D2B1F] text-xs text-center font-bold">
                            Note: All orders must be picked up unless delivery is coordinated beforehand.
                          </p>
                        </div>
                        
                        {paymentError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{paymentError}</p>
                          </div>
                        )}
                        
                        <button
                          type="submit"
                          disabled={paymentProcessing || !paymentElementReady}
                          className="w-full py-4 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F9F1F1] text-lg font-display tracking-[0.15em] rounded-full transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                          {paymentProcessing ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              PROCESSING...
                            </>
                          ) : 'PLACE ORDER'}
                        </button>
                      </div>
                    </form>
                  </Elements>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      {paymentError ? (
                        <>
                          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-500" />
                          </div>
                          <p className="text-red-600 text-sm mb-4">{paymentError}</p>
                          <button
                            onClick={() => {
                              setPaymentError(null);
                              setClientSecret(null);
                            }}
                            className="px-6 py-2 bg-[#3D2B1F] text-white rounded-full text-sm hover:bg-[#2a1e15] transition-colors"
                          >
                            Try Again
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="animate-spin h-8 w-8 text-[#3D2B1F] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-[#3D2B1F]/60 text-sm">Loading payment form...</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

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
                    <h4 className="font-display text-2xl text-[#3D2B1F] mb-3 tracking-wide">Added to Cart!</h4>
                    <p className="text-[#3D2B1F]/60">Your custom creation request has been added. Complete checkout to submit your order.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="p-6 sm:p-8 space-y-5">
                    <p className="text-[#3D2B1F]/70 text-sm mb-2">
                      Share your vision for a custom creation. All requests subject to approval.
                    </p>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                        Dessert Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customForm.dessertType}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, dessertType: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg rounded-lg"
                        placeholder="e.g., Cookie, Cake, Tray"
                        data-testid="input-dessert-type"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                        Flavor Request <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={customForm.flavorRequest}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, flavorRequest: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg resize-none rounded-lg"
                        rows={4}
                        placeholder="Describe your custom flavor idea in detail..."
                        data-testid="input-flavor-request"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[#3D2B1F] font-display tracking-wide text-sm mb-2">
                        Event Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={customForm.eventDate}
                        onChange={(e) => setCustomForm(prev => ({ ...prev, eventDate: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-[#3D2B1F]/20 focus:border-[#3D2B1F] outline-none transition-colors text-[#3D2B1F] text-lg rounded-lg"
                        data-testid="input-date"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-5 bg-[#3D2B1F] hover:bg-[#2a1e15] text-[#F9F1F1] text-lg font-display tracking-[0.15em] rounded-full transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                      data-testid="button-add-custom-to-cart"
                    >
                      <Plus className="w-5 h-5" />
                      ADD TO CART
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
