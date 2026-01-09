import { motion } from "framer-motion";
import trufflesImage from "@assets/generated_images/luxury_chocolate_truffles_display.png";
import cookiesImage from "@assets/generated_images/elegant_gourmet_cookies_arrangement.png";
import dessertsImage from "@assets/generated_images/luxury_french_desserts_display.png";

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
  href 
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "secondary";
  href?: string;
}) => {
  const baseClasses = "relative px-8 py-4 text-sm tracking-[0.25em] uppercase font-light transition-all duration-700 overflow-hidden group";
  const variants = {
    primary: "bg-rose/90 text-cocoa hover:bg-rose border border-rose/20",
    secondary: "glass-rose text-rose hover:bg-rose/20 border border-rose/30"
  };

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </>
  );

  if (href) {
    return (
      <a href={href} className={`${baseClasses} ${variants[variant]}`} data-testid={`button-${children?.toString().toLowerCase().replace(/\s/g, '-')}`}>
        {content}
      </a>
    );
  }

  return (
    <button className={`${baseClasses} ${variants[variant]}`} data-testid={`button-${children?.toString().toLowerCase().replace(/\s/g, '-')}`}>
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

export default function Home() {
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
            <NavLink href="#collection">Collection</NavLink>
            <NavLink href="#atelier">L'Atelier</NavLink>
            <NavLink href="#story">Notre Histoire</NavLink>
          </div>

          <PremiumButton variant="secondary" href="#collection">
            Découvrir
          </PremiumButton>
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
              <PremiumButton href="#collection">Explore Collection</PremiumButton>
              <PremiumButton variant="secondary" href="#story">Our Story</PremiumButton>
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
