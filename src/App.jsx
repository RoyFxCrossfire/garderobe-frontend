import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { ShoppingBag, X, Plus, Minus, Sparkles, Loader2, ChevronLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const COLORS = {
  stone: "#EDEAE3",
  ink: "#1B1B1F",
  tan: "#8A6E4B",
  brick: "#B23A2E",
  muted: "#7C7A72",
  line: "#C9C4B8",
  card: "#F7F5F0",
};

const FONT = {
  display: "'Oswald', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────────────
// Cart context — shared across every page (header badge, product page
// "Add to cart", cart drawer, checkout).
// ─────────────────────────────────────────────────────────────────────────
const CartContext = createContext(null);
const useCart = () => useContext(CartContext);

function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // { pid, vid, key, name, image, price, qty }
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addToCart = (product, variant) => {
    setCart((c) => {
      const existing = c.find((i) => i.vid === variant.vid);
      if (existing) {
        return c.map((i) => (i.vid === variant.vid ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...c,
        {
          pid: product.pid,
          vid: variant.vid,
          key: variant.key,
          name: product.name,
          image: variant.image || product.image,
          price: variant.price,
          qty: 1,
        },
      ];
    });
    setDrawerOpen(true);
  };

  const changeQty = (vid, delta) =>
    setCart((c) => c.map((i) => (i.vid === vid ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const goToCheckout = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.pid,
            cjVid: i.vid,
            name: `${i.name} (${i.key})`,
            price: i.price,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, changeQty, totalQty, totalPrice, drawerOpen, setDrawerOpen, goToCheckout }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────
function ImageOrFallback({ src, alt, className, style }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div
        className={className}
        style={{ ...style, background: `linear-gradient(135deg, ${COLORS.line} 0%, ${COLORS.stone} 100%)` }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={className}
      style={{ ...style, objectFit: "cover" }}
    />
  );
}

function PriceTag({ value, size = "text-sm" }) {
  return (
    <span style={{ fontFamily: FONT.mono, color: COLORS.ink }} className={size}>
      {value != null ? `€ ${value.toFixed(2)}` : "Price on request"}
    </span>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.pid}`} className="group relative pt-3 block">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-3 origin-top transition-transform duration-300 group-hover:rotate-6"
        style={{ background: COLORS.muted }}
      />
      <div
        className="relative rounded-sm p-3 transition-transform duration-300 group-hover:-rotate-1 group-hover:-translate-y-0.5"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.line}` }}
      >
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
          style={{ background: COLORS.stone, border: `1px solid ${COLORS.line}` }}
        />
        <ImageOrFallback src={product.image} alt={product.name} className="w-full aspect-[4/5] rounded-sm mb-3" />
        <div className="text-[10px] tracking-widest mb-1 truncate" style={{ fontFamily: FONT.mono, color: COLORS.muted }}>
          {product.category || "ZAMARMODE"}
        </div>
        <div className="text-sm leading-tight mb-1 line-clamp-2" style={{ fontFamily: FONT.body, color: COLORS.ink, fontWeight: 500 }}>
          {product.name}
        </div>
        <PriceTag value={product.priceFrom} />
      </div>
    </Link>
  );
}

function Header() {
  const { totalQty, setDrawerOpen } = useCart();
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
      style={{ background: COLORS.stone, borderBottom: `1px solid ${COLORS.line}` }}
    >
      <Link to="/" style={{ fontFamily: FONT.display, color: COLORS.ink, letterSpacing: "0.08em" }} className="text-lg font-semibold uppercase">
        Zamarmode
      </Link>
      <nav className="flex items-center gap-4">
        <Link to="/women" className="text-xs uppercase" style={{ fontFamily: FONT.mono, color: COLORS.muted, letterSpacing: "0.05em" }}>
          Women
        </Link>
        <Link to="/men" className="text-xs uppercase" style={{ fontFamily: FONT.mono, color: COLORS.muted, letterSpacing: "0.05em" }}>
          Men
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center justify-center w-9 h-9 rounded-full shrink-0"
          style={{ border: `1px solid ${COLORS.ink}` }}
        >
          <ShoppingBag size={16} color={COLORS.ink} />
          {totalQty > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{ background: COLORS.brick, fontFamily: FONT.mono }}
            >
              {totalQty}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="px-4 py-6 text-center text-xs" style={{ color: COLORS.muted, fontFamily: FONT.body, borderTop: `1px solid ${COLORS.line}` }}>
      Zamarmode — Women, Men & Accessories
    </footer>
  );
}

function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, changeQty, totalPrice, goToCheckout } = useCart();
  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(27,27,31,0.4)" }} onClick={() => setDrawerOpen(false)} />
      <div className="relative w-[85%] max-w-sm h-full flex flex-col" style={{ background: COLORS.stone }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <span style={{ fontFamily: FONT.display, color: COLORS.ink }} className="uppercase text-sm font-semibold tracking-wide">
            Cart
          </span>
          <button onClick={() => setDrawerOpen(false)}>
            <X size={18} color={COLORS.ink} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <p className="text-sm mt-6 text-center" style={{ color: COLORS.muted, fontFamily: FONT.body }}>
              Nothing added yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.map((item) => (
                <div key={item.vid} className="flex gap-3">
                  <ImageOrFallback src={item.image} alt={item.name} className="w-14 h-16 rounded-sm shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontFamily: FONT.body, color: COLORS.ink, fontWeight: 500 }}>
                      {item.name}
                    </div>
                    <div className="text-xs mb-2" style={{ fontFamily: FONT.mono, color: COLORS.muted }}>
                      {item.key} · <PriceTag value={item.price} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(item.vid, -1)} className="w-6 h-6 flex items-center justify-center rounded-full" style={{ border: `1px solid ${COLORS.line}` }}>
                        <Minus size={11} color={COLORS.ink} />
                      </button>
                      <span className="text-xs w-4 text-center" style={{ fontFamily: FONT.mono }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.vid, 1)} className="w-6 h-6 flex items-center justify-center rounded-full" style={{ border: `1px solid ${COLORS.line}` }}>
                        <Plus size={11} color={COLORS.ink} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="px-4 py-4" style={{ borderTop: `1px solid ${COLORS.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm uppercase" style={{ fontFamily: FONT.mono, color: COLORS.muted }}>Total</span>
              <PriceTag value={totalPrice} size="text-lg" />
            </div>
            <button
              onClick={goToCheckout}
              className="w-full py-3 rounded-sm text-sm uppercase font-medium text-white"
              style={{ background: COLORS.ink, fontFamily: FONT.display, letterSpacing: "0.06em" }}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Home — "New arrivals" only, per the spec: no full trending dump here,
// just curated new products/offers linking straight to the product itself.
// ─────────────────────────────────────────────────────────────────────────
function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/api/catalog/new`);
        if (!res.ok) throw new Error("Could not load new arrivals.");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <section className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-1 text-[11px] mb-3 uppercase" style={{ fontFamily: FONT.mono, color: COLORS.tan, letterSpacing: "0.12em" }}>
          <Sparkles size={12} /> New in this week
        </div>
        <h1 style={{ fontFamily: FONT.display, color: COLORS.ink, lineHeight: 0.95 }} className="text-4xl font-semibold uppercase mb-2">
          New arrivals
        </h1>
        <p className="text-sm" style={{ fontFamily: FONT.body, color: COLORS.muted }}>
          The latest pieces, picked automatically from what's newly listed.
        </p>
      </section>

      {loading && (
        <div className="px-4 py-16 flex flex-col items-center gap-2" style={{ color: COLORS.muted }}>
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs" style={{ fontFamily: FONT.mono }}>Loading new arrivals...</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="px-4 py-16 text-center text-sm" style={{ color: COLORS.brick, fontFamily: FONT.body }}>
          {loadError}
        </div>
      )}

      {!loading && !loadError && products.length === 0 && (
        <div className="px-4 py-16 text-center text-sm" style={{ color: COLORS.muted, fontFamily: FONT.body }}>
          No new arrivals right now — check back soon.
        </div>
      )}

      {!loading && !loadError && products.length > 0 && (
        <section className="px-4 pb-16 pt-2 grid grid-cols-2 gap-x-3 gap-y-6">
          {products.map((p) => (
            <ProductCard key={p.pid} product={p} />
          ))}
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Category page (Women / Men) — reuses the trending feed for now.
// Sub-category navigation matching your full taxonomy doc is the next step.
// ─────────────────────────────────────────────────────────────────────────
function CategoryPage({ section, title }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/api/catalog?section=${section}`);
        if (!res.ok) throw new Error("Could not load products.");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [section]);

  return (
    <div>
      <section className="px-4 pt-6 pb-4">
        <h1 style={{ fontFamily: FONT.display, color: COLORS.ink }} className="text-3xl font-semibold uppercase mb-1">
          {title}
        </h1>
        <p className="text-sm" style={{ fontFamily: FONT.body, color: COLORS.muted }}>
          Trending picks, refreshed automatically.
        </p>
      </section>

      {loading && (
        <div className="px-4 py-16 flex flex-col items-center gap-2" style={{ color: COLORS.muted }}>
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs" style={{ fontFamily: FONT.mono }}>Loading...</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="px-4 py-16 text-center text-sm" style={{ color: COLORS.brick, fontFamily: FONT.body }}>
          {loadError}
        </div>
      )}

      {!loading && !loadError && products.length > 0 && (
        <section className="px-4 pb-16 pt-2 grid grid-cols-2 gap-x-3 gap-y-6">
          {products.map((p) => (
            <ProductCard key={p.pid} product={p} />
          ))}
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Product detail page — shows all images, color/size variants, and
// description. Basic client-side SEO (title + meta description); true
// crawlable SEO for a single-page app like this needs server-side
// rendering or pre-rendering, which is a separate step if you need it.
// ─────────────────────────────────────────────────────────────────────────
function ProductDetail() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      setSelectedVariant(null);
      try {
        const res = await fetch(`${API_BASE}/api/catalog/${pid}`);
        if (!res.ok) throw new Error("Could not load this product.");
        const data = await res.json();
        setProduct(data);
        setActiveImage(data.images?.[0] || null);
        if (data.variants?.length === 1) setSelectedVariant(data.variants[0]);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [pid]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Zamarmode`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = (product.description || product.name || "").slice(0, 160);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="px-4 py-16 flex flex-col items-center gap-2" style={{ color: COLORS.muted }}>
        <Loader2 size={20} className="animate-spin" />
        <span className="text-xs" style={{ fontFamily: FONT.mono }}>Loading product...</span>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="px-4 py-16 text-center text-sm" style={{ color: COLORS.brick, fontFamily: FONT.body }}>
        {loadError || "Product not found."}
      </div>
    );
  }

  // Group variants into distinct color options, so we can show swatch-like
  // buttons instead of one long "Color-Size" list.
  const colorOf = (key) => key?.split("-")[0]?.trim() || key;
  const colors = [...new Set(product.variants.map((v) => colorOf(v.key)))];
  const sizesForColor = (color) => product.variants.filter((v) => colorOf(v.key) === color);

  return (
    <div className="pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 px-4 pt-4 pb-2 text-xs"
        style={{ fontFamily: FONT.mono, color: COLORS.muted }}
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div className="px-4">
        <ImageOrFallback src={activeImage} alt={product.name} className="w-full aspect-square rounded-sm mb-2" />
        {product.images?.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(img)}
                className="shrink-0 w-14 h-16 rounded-sm overflow-hidden"
                style={{ border: img === activeImage ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.line}` }}
              >
                <ImageOrFallback src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-3">
        <h1 style={{ fontFamily: FONT.display, color: COLORS.ink }} className="text-2xl font-semibold uppercase mb-1">
          {product.name}
        </h1>
        <PriceTag value={selectedVariant?.price ?? product.variants[0]?.price} size="text-lg" />

        {product.variants.length === 0 && (
          <p className="text-sm mt-4" style={{ color: COLORS.brick, fontFamily: FONT.body }}>
            This product currently has no orderable variants at CJ.
          </p>
        )}

        {colors.length > 0 && (
          <div className="mt-5">
            <div className="text-xs uppercase mb-2" style={{ fontFamily: FONT.mono, color: COLORS.muted, letterSpacing: "0.05em" }}>
              Color
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const isActive = selectedVariant && colorOf(selectedVariant.key) === color;
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedVariant(sizesForColor(color)[0])}
                    className="px-3 py-1.5 rounded-full text-xs"
                    style={{
                      fontFamily: FONT.body,
                      background: isActive ? COLORS.ink : "transparent",
                      color: isActive ? COLORS.stone : COLORS.ink,
                      border: `1px solid ${COLORS.ink}`,
                    }}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedVariant && sizesForColor(colorOf(selectedVariant.key)).length > 1 && (
          <div className="mt-4">
            <div className="text-xs uppercase mb-2" style={{ fontFamily: FONT.mono, color: COLORS.muted, letterSpacing: "0.05em" }}>
              Size
            </div>
            <div className="flex flex-wrap gap-2">
              {sizesForColor(colorOf(selectedVariant.key)).map((v) => (
                <button
                  key={v.vid}
                  onClick={() => setSelectedVariant(v)}
                  className="px-3 py-1.5 rounded-sm text-xs"
                  style={{
                    fontFamily: FONT.mono,
                    background: v.vid === selectedVariant.vid ? COLORS.ink : "transparent",
                    color: v.vid === selectedVariant.vid ? COLORS.stone : COLORS.ink,
                    border: `1px solid ${COLORS.ink}`,
                  }}
                >
                  {v.key.split("-").slice(1).join("-") || v.key}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          disabled={!selectedVariant}
          onClick={() => selectedVariant && addToCart(product, selectedVariant)}
          className="w-full mt-6 py-3 rounded-sm text-sm uppercase font-medium text-white disabled:opacity-50"
          style={{ background: COLORS.ink, fontFamily: FONT.display, letterSpacing: "0.06em" }}
        >
          Add to cart
        </button>

        {product.description && (
          <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${COLORS.line}` }}>
            <div className="text-xs uppercase mb-2" style={{ fontFamily: FONT.mono, color: COLORS.muted, letterSpacing: "0.05em" }}>
              Details
            </div>
            <div
              className="text-sm leading-relaxed"
              style={{ fontFamily: FONT.body, color: COLORS.ink }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <CartProvider>
      <div style={{ background: COLORS.stone, minHeight: "100vh" }} className="w-full">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          * { -webkit-tap-highlight-color: transparent; }
        `}</style>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/women" element={<CategoryPage section="dames" title="Women" />} />
          <Route path="/men" element={<CategoryPage section="heren" title="Men" />} />
          <Route path="/product/:pid" element={<ProductDetail />} />
        </Routes>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
