import { motion } from "framer-motion";
import { useState } from "react";
import { ShoppingBag, Plus, Minus, X, Check } from "lucide-react";
import trufflesImage from "@assets/generated_images/luxury_chocolate_truffles_display.png";
import cookiesImage from "@assets/generated_images/elegant_gourmet_cookies_arrangement.png";
import dessertsImage from "@assets/generated_images/luxury_french_desserts_display.png";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

const products = [
  { id: "choc-chip", name: "Chocolate Chip Cookies", price: 24, category: "cookies", description: "Classic brown butter cookies with Valrhona chocolate chunks" },
  { id: "red-velvet-cookie", name: "Red Velvet Cookies", price: 26, category: "cookies", description: "Velvety cocoa cookies with white chocolate cream cheese center" },
  { id: "biscoff", name: "Biscoff Truffles", price: 38, category: "truffles", description: "Belgian chocolate ganache with caramelized speculoos" },
  { id: "red-velvet-truffle", name: "Red Velvet Truffles", price: 38, category: "truffles", description: "Cream cheese infused ganache in ruby cocoa shell" },
  { id: "lemon", name: "Lemon Truffles", price: 36, category: "truffles", description: "Amalfi lemon curd center with white chocolate coating" },
  { id: "dubai", name: "Dubai Chocolate Truffles", price: 42, category: "truffles", description: "Pistachio kunafa filled dark chocolate, inspired by Dubai" },
];

const Logo = () => (
  <svg
    viewBox="0 0 120 120"
    className="w-16 h-16 md:w-20 md:h-20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <text
      x="60"
      y="72"
      textAnchor="middle"
      className="font-display"
      style={{ 
        fontFamily: "'Playfair Display', serif",
        fontSize: "48px",
        fontWeight: 400,
        fontStyle: "italic",
        fill: "currentColor"
      }}
    >
      É
    </text>
  </svg>
);

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="text-rose/80 hover:text-rose transition-all duration-500 text-sm tracking-[0.2em] uppercase font-light relative group"
    data-testid={`nav-link-${children?.toString().toLowerCase().replace(/\s/g, '-')}`}
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-px bg-rose/50 transition-all duration-500 group-hover:w-full" />
  </a>
);

const PremiumButton = ({ 
  children, 
  variant = "primary",
  href,
  onClick,
  className = ""
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary" | "small";
  href?: string;
  onClick?: () => void;
  className?: string;
}) => {
  const baseClasses = "relative text-sm tracking-[0.25em] uppercase font-light transition-all duration-700 overflow-hidden group";
  const sizeClasses = variant === "small" ? "px-4 py-2 text-xs tracking-[0.15em]" : "px-8 py-4";
  const variants = {
    primary: "bg-rose/90 text-cocoa hover:bg-rose border border-rose/20",
    secondary: "glass-rose text-rose hover:bg-rose/20 border border-rose/30",
    small: "bg-cocoa text-cream hover:bg-cocoa/90 border border-cocoa/20"
  };

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </>
  );

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${sizeClasses} ${variants[variant]} ${className}`} data-testid={`button-${children?.toString().toLowerCase().replace(/\s/g, '-')}`}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${sizeClasses} ${variants[variant]} ${className}`} data-testid={`button-${children?.toString().toLowerCase().replace(/\s/g, '-')}`}>
      {content}
    </button>
  );
};

const CollectionCard = ({ 
  image, 
  title, 
  description, 
  index 
}: { 
  image: string; 
  title: string; 
  description: string; 
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    className="group cursor-pointer"
    data-testid={`card-collection-${index}`}
  >
    <div className="relative overflow-hidden mb-6">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-cocoa/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-700">
        <span className="text-cream text-sm tracking-[0.2em] uppercase">Explore</span>
      </div>
    </div>
    <h3 className="font-display text-2xl md:text-3xl text-cocoa mb-2 group-hover:text-cocoa-light transition-colors duration-500">
      {title}
    </h3>
    <p className="text-cocoa/60 font-light text-sm leading-relaxed">
      {description}
    </p>
  </motion.div>
);

const ProductCard = ({ 
  product, 
  onAdd 
}: { 
  product: typeof products[0]; 
  onAdd: (product: typeof products[0]) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="group bg-white/80 backdrop-blur-sm border border-cocoa/10 p-6 hover:shadow-xl hover:shadow-cocoa/5 transition-all duration-500"
    data-testid={`product-${product.id}`}
  >
    <div className="flex justify-between items-start mb-3">
      <span className="text-[10px] tracking-[0.3em] uppercase text-cocoa/40">{product.category}</span>
      <span className="text-gold font-display text-lg">${product.price}</span>
    </div>
    <h4 className="font-display text-xl text-cocoa mb-2">{product.name}</h4>
    <p className="text-cocoa/50 text-sm leading-relaxed mb-5">{product.description}</p>
    <button
      onClick={() => onAdd(product)}
      className="w-full py-3 bg-cocoa text-cream text-xs tracking-[0.2em] uppercase hover:bg-cocoa/90 transition-all duration-300 flex items-center justify-center gap-2 group"
      data-testid={`add-${product.id}`}
    >
      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
      Add to Order
    </button>
  </motion.div>
);

const CartDrawer = ({ 
  cart, 
  isOpen, 
  onClose, 
  onUpdateQuantity, 
  onCheckout 
}: { 
  cart: CartItem[]; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
}) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-cocoa/60 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-cream z-50 shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-cocoa/10 flex justify-between items-center">
          <h3 className="font-display text-2xl text-cocoa">Your Order</h3>
          <button onClick={onClose} className="text-cocoa/50 hover:text-cocoa transition-colors" data-testid="button-close-cart">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          {cart.length === 0 ? (
            <p className="text-cocoa/50 text-center py-12">Your cart is empty</p>
          ) : (
            <div className="space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 pb-6 border-b border-cocoa/10">
                  <div className="flex-1">
                    <h4 className="font-display text-lg text-cocoa">{item.name}</h4>
                    <p className="text-gold text-sm">${item.price} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center border border-cocoa/20 text-cocoa hover:bg-cocoa hover:text-cream transition-colors"
                      data-testid={`decrease-${item.id}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-display text-lg">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center border border-cocoa/20 text-cocoa hover:bg-cocoa hover:text-cream transition-colors"
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
          <div className="p-8 border-t border-cocoa/10 bg-white/50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-cocoa/60 uppercase tracking-wide text-sm">Total</span>
              <span className="font-display text-3xl text-cocoa">${total}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-cocoa text-cream tracking-[0.2em] uppercase text-sm hover:bg-cocoa/90 transition-colors flex items-center justify-center gap-2"
              data-testid="button-checkout"
            >
              <Check className="w-4 h-4" />
              Place Order
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
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
    }).filter(item => item.quantity > 0 || delta >= 0));
    
    setCart(prev => prev.filter(item => item.quantity > 0));
  };

  const handleCheckout = () => {
    setOrderPlaced(true);
    setCart([]);
    setCartOpen(false);
    setTimeout(() => setOrderPlaced(false), 4000);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const collections = [
    {
      image: trufflesImage,
      title: "Artisan Truffles",
      description: "Hand-rolled Belgian chocolate truffles infused with single-origin cacao and rare botanicals."
    },
    {
      image: cookiesImage,
      title: "Gourmet Cookies",
      description: "Delicate sablés and florentines crafted with French butter and organic Madagascar vanilla."
    },
    {
      image: dessertsImage,
      title: "Haute Pâtisserie",
      description: "Exquisite petit fours and signature desserts inspired by Parisian haute couture."
    }
  ];

  return (
    <div className="min-h-screen bg-cream">
      <CartDrawer 
        cart={cart} 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        onUpdateQuantity={updateQuantity}
        onCheckout={handleCheckout}
      />

      {orderPlaced && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-cocoa text-cream px-8 py-4 flex items-center gap-3 shadow-2xl"
        >
          <Check className="w-5 h-5 text-gold" />
          <span className="tracking-wide">Order placed successfully!</span>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen bg-cocoa noise overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-rose/30 blur-3xl" />
          <div className="absolute bottom-40 right-40 w-64 h-64 rounded-full bg-gold/20 blur-2xl" />
        </div>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 flex items-center justify-between px-8 md:px-16 py-8"
        >
          <div className="flex items-center gap-4 text-rose">
            <Logo />
            <div className="hidden md:block">
              <h1 className="font-display text-xl tracking-wide">Maison Élise</h1>
              <p className="text-rose/50 text-xs tracking-[0.3em] uppercase">Paris · Since 1892</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-12">
            <NavLink href="#shop">Shop</NavLink>
            <NavLink href="#collection">Collection</NavLink>
            <NavLink href="#story">Notre Histoire</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-3 glass-rose text-rose hover:bg-rose/20 transition-colors"
              data-testid="button-cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-cocoa text-xs flex items-center justify-center rounded-full font-medium">
                  {cartCount}
                </span>
              )}
            </button>
            <PremiumButton variant="secondary" href="#shop">
              Order Now
            </PremiumButton>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-8 text-center">
          {/* Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass px-12 md:px-24 py-16 md:py-20 max-w-4xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-gold/80 text-sm tracking-[0.4em] uppercase mb-6"
            >
              Artisan Confections
            </motion.p>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-rose leading-[1.1] mb-8"
            >
              The Art of
              <br />
              <span className="italic">Indulgence</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-rose/60 font-light text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10"
            >
              Where heritage meets innovation. Each creation is a symphony of 
              rare ingredients and timeless craftsmanship.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <PremiumButton href="#shop">Order Now</PremiumButton>
              <PremiumButton variant="secondary" href="#collection">Explore Collection</PremiumButton>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-3">
              <span className="text-rose/40 text-xs tracking-[0.3em] uppercase">Scroll</span>
              <div className="w-px h-12 bg-gradient-to-b from-rose/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="py-32 md:py-40 px-8 md:px-16 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-cocoa/50 text-sm tracking-[0.4em] uppercase mb-4">Order Online</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cocoa mb-6">
              Shop Our Favorites
            </h2>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="text-cocoa/60 max-w-xl mx-auto">Select your favorites and place your order. Each item is handcrafted to order.</p>
          </motion.div>

          <div className="mb-12">
            <h3 className="font-display text-2xl text-cocoa mb-6 text-center">Artisan Truffles</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.filter(p => p.category === "truffles").map(product => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl text-cocoa mb-6 text-center">Gourmet Cookies</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.filter(p => p.category === "cookies").map(product => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Collection Section */}
      <section id="collection" className="py-32 md:py-40 px-8 md:px-16 bg-cream">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <p className="text-cocoa/50 text-sm tracking-[0.4em] uppercase mb-4">Curated Excellence</p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cocoa mb-6">
              The Collection
            </h2>
            <div className="w-16 h-px bg-gold mx-auto" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {collections.map((item, index) => (
              <CollectionCard key={item.title} {...item} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-32 md:py-40 px-8 md:px-16 bg-cocoa noise">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-gold/70 text-sm tracking-[0.4em] uppercase mb-6">Notre Histoire</p>
            <h2 className="font-display text-3xl md:text-5xl text-rose leading-relaxed mb-8">
              "True luxury is not in excess, but in the reverence for craft 
              and the patience of perfection."
            </h2>
            <p className="text-rose/50 font-serif text-lg italic">
              — Élise Beaumont, Founder
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 grid md:grid-cols-3 gap-12 text-left"
          >
            <div className="glass-rose p-8">
              <p className="text-gold text-4xl font-display mb-3">130+</p>
              <p className="text-rose/70 text-sm tracking-wide">Years of Heritage</p>
            </div>
            <div className="glass-rose p-8">
              <p className="text-gold text-4xl font-display mb-3">47</p>
              <p className="text-rose/70 text-sm tracking-wide">Master Chocolatiers</p>
            </div>
            <div className="glass-rose p-8">
              <p className="text-gold text-4xl font-display mb-3">12</p>
              <p className="text-rose/70 text-sm tracking-wide">Countries Served</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 md:px-16 bg-cream border-t border-cocoa/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-cocoa">
            <Logo />
            <div>
              <h3 className="font-display text-lg">Maison Élise</h3>
              <p className="text-cocoa/50 text-xs tracking-[0.2em] uppercase">Paris · Since 1892</p>
            </div>
          </div>

          <div className="flex gap-8">
            <a href="#" className="text-cocoa/50 hover:text-cocoa text-sm tracking-wide transition-colors duration-300" data-testid="link-instagram">Instagram</a>
            <a href="#" className="text-cocoa/50 hover:text-cocoa text-sm tracking-wide transition-colors duration-300" data-testid="link-pinterest">Pinterest</a>
            <a href="#" className="text-cocoa/50 hover:text-cocoa text-sm tracking-wide transition-colors duration-300" data-testid="link-contact">Contact</a>
          </div>

          <p className="text-cocoa/40 text-xs tracking-wide">
            © 2024 Maison Élise. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
