import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, TrendingUp, Vault, BarChart2, ChevronDown } from "lucide-react";
import logo from "../assets/aegis-logo.png";
import { MARKETS } from "../data/mockData";
import MarketIcon from "../components/MarketIcon";
import { useCountUp } from "../hooks/useCountUp";
import StarBorder from "../components/ui/StarBorder";
import { Tiles } from "../components/ui/Tiles";

// ASCII chars pool for background rain
const RAIN_CHARS = "₹$%▲▼│─┼+*=01234567890.,:;!?#@<>[]{}".split("");

// Utility
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate ASCII candlestick chart
function buildAsciiChart(prices, width = 60, height = 12) {
  if (!prices.length) return "";
  const slice = prices.slice(-width);
  const min = Math.min(...slice) * 0.998;
  const max = Math.max(...slice) * 1.002;
  const range = max - min || 1;
  const rows = Array.from({ length: height }, () => Array(width).fill(" "));

  slice.forEach((p, x) => {
    const y = height - 1 - Math.round(((p - min) / range) * (height - 1));
    if (y >= 0 && y < height) {
      rows[y][x] = "●";
      for (let fy = y + 1; fy < height; fy++) {
        rows[fy][x] = slice[x - 1] !== undefined && p > slice[x - 1] ? "▒" : "░";
      }
    }
  });

  const maxPrice = max.toFixed(0).padStart(6);
  const midPrice = ((max + min) / 2).toFixed(0).padStart(6);
  const minPrice = min.toFixed(0).padStart(6);

  return (
    rows
      .map((row, i) => {
        const label =
          i === 0
            ? `$${maxPrice} `
            : i === Math.floor(height / 2)
              ? `$${midPrice} `
              : i === height - 1
                ? `$${minPrice} `
                : "         ";
        return label + "│" + row.join("") + "│";
      })
      .join("\n") +
    "\n         └" +
    "─".repeat(width) +
    "┘"
  );
}

// ASCII Rain Column
function useAsciiRain(cols, rows) {
  const [grid, setGrid] = useState(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ char: " ", opacity: 0 }))
    )
  );

  useEffect(() => {
    const drops = Array.from({ length: cols }, () => ({
      y: Math.floor(Math.random() * rows),
      speed: 0.2 + Math.random() * 0.6,
      progress: Math.random(),
    }));

    const id = setInterval(() => {
      setGrid((prev) => {
        const next = prev.map((row) =>
          row.map((c) => ({ ...c, opacity: Math.max(0, c.opacity - 0.04) }))
        );
        drops.forEach((drop, x) => {
          drop.progress += drop.speed * 0.1;
          if (drop.progress >= 1) {
            drop.progress = 0;
            drop.y = (drop.y + 1) % rows;
          }
          const y = drop.y;
          if (y < rows && x < cols) {
            next[y][x] = { char: rand(RAIN_CHARS), opacity: 0.6 + Math.random() * 0.4 };
          }
        });
        return next;
      });
    }, 80);
    return () => clearInterval(id);
  }, [cols, rows]);

  return grid;
}

// Live price ticker state
function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    MARKETS.reduce((acc, m) => ({ ...acc, [m.id]: m.currentPrice }), {})
  );
  const [charts, setCharts] = useState(() =>
    MARKETS.reduce((acc, m) => ({ ...acc, [m.id]: [m.basePrice] }), {})
  );
  const latestPricesRef = useRef(prices);

  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) => {
        const next = {};
        MARKETS.forEach((m) => {
          const delta = prev[m.id] * m.volatility * (Math.random() - 0.48);
          next[m.id] = Math.max(0, prev[m.id] + delta + prev[m.id] * m.drift);
        });
        latestPricesRef.current = next;
        return next;
      });
      setCharts((prev) => {
        const next = {};
        const current = latestPricesRef.current;
        MARKETS.forEach((m) => {
          const arr = [...(prev[m.id] || []), current[m.id] ?? prev[m.id]?.[prev[m.id].length - 1]].slice(-80);
          next[m.id] = arr;
        });
        return next;
      });
    }, 600);
    return () => clearInterval(id);
  }, []);

  return { prices, charts };
}

// ASCII Background Grid
function AsciiBackground() {
  const COLS = 80,
    ROWS = 30;
  const grid = useAsciiRain(COLS, ROWS);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-[11px] leading-[1.35] select-none">
      {grid.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <span
              key={x}
              style={{
                color: `rgba(167,139,250,${cell.opacity * 0.12})`,
                width: "1ch",
                display: "inline-block",
              }}
            >
              {cell.char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ASCII Chart Terminal Panel
function AsciiChartPanel({ market, prices, charts }) {
  const price = prices[market.id] ?? market.currentPrice;
  const hist = charts[market.id] ?? [market.basePrice];
  const chart = useMemo(() => buildAsciiChart(hist, 40, 8), [hist]);
  const change =
    hist.length > 1 ? ((hist[hist.length - 1] - hist[0]) / hist[0]) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="rounded-lg border border-[var(--t-border)] bg-[var(--t-bg-secondary)] p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--t-text-muted)] tracking-wider uppercase flex items-center gap-1.5">
          <MarketIcon market={market} className="w-3 h-3 shrink-0" />
          {market.name}
        </span>
        <span
          className={`font-mono text-[10px] ${isUp ? "text-[var(--t-blue)]" : "text-[var(--t-red)]"}`}
        >
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
      </div>
      <div className="font-mono text-sm font-bold text-[var(--t-text)]">
        ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </div>
      <pre
        className="mt-1.5 overflow-hidden font-mono text-[7px] leading-[1.2]"
        style={{
          color: isUp ? "rgba(167,139,250,0.7)" : "rgba(220,38,38,0.7)",
        }}
      >
        {chart}
      </pre>
      <p className="mt-1.5 font-mono text-[9px]" style={{ color: isUp ? '#00E5D4' : '#A78BFA' }}>
        {isUp ? 'Agent hedge in profit' : 'Shield envelope holding'}
      </p>
    </div>
  );
}

// Main Terminal Display
function TerminalDisplay({ prices, charts }) {
  const featured = MARKETS[0];
  const price = prices[featured.id] ?? featured.currentPrice;
  const hist = charts[featured.id] ?? [featured.basePrice];
  const chart = useMemo(() => buildAsciiChart(hist, 70, 8), [hist]);
  const change =
    hist.length > 1 ? ((hist[hist.length - 1] - hist[0]) / hist[0]) * 100 : 0;
  const isUp = change >= 0;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  const scanline = tick % 18;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--t-border)] bg-[var(--t-bg-secondary)] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--t-border)] pb-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28CA41]" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-[var(--t-text-muted)]">
          aegis-terminal . live agent feed
        </span>
        <span className="ml-auto font-mono text-[9px] text-[var(--t-blue)]">
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--t-text-muted)] flex items-center gap-1.5">
            <MarketIcon market={featured} className="w-3 h-3 shrink-0" />
            {featured.name}
          </span>
          <span
            className={`font-mono text-xs font-bold ${isUp ? "text-[var(--t-blue)]" : "text-[var(--t-red)]"}`}
          >
            ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
            {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </span>
        </div>
        <div className="relative">
          <pre
            className="font-mono text-[7px] leading-[1.2] overflow-hidden"
            style={{
              color: isUp ? "rgba(167,139,250,0.85)" : "rgba(220,38,38,0.85)",
            }}
          >
            {chart}
          </pre>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent ${scanline * 5.5}%, rgba(167,139,250,0.04) ${scanline * 5.5}%, rgba(167,139,250,0.04) ${scanline * 5.5 + 3}%, transparent ${scanline * 5.5 + 3}%)`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-[var(--t-border)] pt-2">
        {[
          { label: "24h Vol", value: `$${(featured.volume24h / 1e6).toFixed(1)}M` },
          { label: "Open Int", value: `$${(featured.openInterest / 1e6).toFixed(1)}M` },
          { label: "Funding", value: `${(featured.fundingRate * 100).toFixed(4)}%` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-mono text-[9px] text-[var(--t-text-muted)] uppercase tracking-wider">
              {s.label}
            </div>
            <div className="font-mono text-[11px] font-bold text-[var(--t-text)]">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-[var(--t-border)] pt-1.5">
        <span className="font-mono text-[9px] text-[var(--t-blue)]/80">
          {">"} aegis-0g@0g:~${" "}
          <span className="inline-block h-2 w-1.5 bg-[var(--t-blue)]/80 align-middle animate-pulse" />
        </span>
      </div>
    </div>
  );
}

// Landing Page
export default function LandingPage() {
  const { prices, charts } = useLivePrices();
  const tvl = useCountUp(2450000, 2000, 800);
  const shields = useCountUp(342, 1600, 1000);
  const marketsCount = useCountUp(MARKETS.length, 1200, 900);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] font-sans">
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "border-b border-[var(--t-border)] bg-[var(--t-panel)] backdrop-blur-sm" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7" />
            <span className="text-sm font-bold tracking-[0.15em] uppercase text-[var(--t-text)]">Aegis.0G</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <span className="mr-3 text-[0.6rem] uppercase tracking-[0.15em] text-[var(--t-text-dim)]">
              :: NAVIGATION ::
            </span>
            {[
              { to: "/app/shield", label: "Shield", icon: "\u25C8" },
              { to: "/app/markets", label: "Assets", icon: "\u25A0" },
              { to: "/app/agents", label: "Agents", icon: "\u25C9" },
              { to: "/app/portfolio", label: "Dashboard", icon: "\u25C6" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-2 px-3 py-2 text-[0.7rem] uppercase tracking-[0.08em] text-[var(--t-text-muted)] transition-colors hover:bg-[var(--t-green)]/10 hover:text-[var(--t-text)]"
              >
                <span className="w-4 text-center text-[var(--t-text-dim)] transition-colors group-hover:text-[var(--t-text)]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <Link
            to="/app/shield"
            className="flex items-center gap-1.5 rounded-full bg-[var(--t-green)] px-4 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-[var(--t-green)]/90 hover:shadow-[0_0_20px_rgba(0,255,148,0.3)]"
          >
            Launch App <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center overflow-hidden bg-[var(--t-bg)]">
        {/* Subtle grid background behind the hero */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Tiles rowCount={26} colCount={42} cellSize={48} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--t-bg)]/70 via-[var(--t-bg)]/40 to-[var(--t-bg)]/60" style={{ zIndex: 1 }} />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-20 md:grid-cols-2 md:pt-0">
          <div className="flex flex-col gap-3 md:order-1">
            <p className="text-xs font-medium text-[var(--t-text-muted)]">Live agent feed. Signals your shield can hedge against.</p>
            <TerminalDisplay prices={prices} charts={charts} />
            <div className="grid grid-cols-2 gap-2.5">
              {MARKETS.slice(1, 5).map((m) => (
                <AsciiChartPanel key={m.id} market={m} prices={prices} charts={charts} />
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center md:order-2">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--t-blue)]/30 bg-[var(--t-bg-secondary)] px-3 py-1 text-[11px] text-[var(--t-blue)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--t-blue)]" />
              <span className="tracking-wide">0G Native. TEE attested. Agent first.</span>
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-[1.15] tracking-tight text-[var(--t-text)] md:text-5xl lg:text-6xl">
              The shield layer for the agent economy.
            </h1>

            <p className="mb-6 leading-relaxed max-w-[520px]" style={{ fontSize: '20px', color: '#8B8BA8', lineHeight: 1.5 }}>
              Aegis.0G turns principal protection into a primitive your agents can call. Sign a strategy in a TEE, anchor proofs on 0G Chain, store the receipts on 0G Storage; the math stays verifiable from end to end.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <StarBorder as="div" color="#A78BFA" speed="3s">
                <Link
                  to="/app/shield"
                  className="hedge-pulse flex items-center gap-2 bg-[var(--t-green)] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[var(--t-green)]/90 hover:shadow-[0_0_30px_rgba(167,139,250,0.4)]"
                >
                  <Shield className="h-4 w-4" />
                  Spin up a shield
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </StarBorder>
              <StarBorder as="div" color="#A78BFA" speed="5s">
                <Link
                  to="/app/agents"
                  className="flex items-center gap-2 border border-[var(--t-border)] px-6 py-3 text-sm text-[var(--t-text-muted)] transition-colors hover:border-[var(--t-text-muted)] hover:text-[var(--t-text)]"
                >
                  Deploy an agent
                </Link>
              </StarBorder>
            </div>

            <div className="mt-10 rounded-xl border border-[var(--t-border)] bg-[var(--t-panel)] p-4 shadow-sm">
              <p className="text-sm leading-relaxed text-[var(--t-text-muted)]">
                <span className="font-semibold text-[var(--t-text)]">${(tvl / 1e6).toFixed(1)}M</span> in active shields across <span className="font-semibold text-[var(--t-text)]">{Math.floor(shields)}</span> agents. Top strategy printing <span className="font-semibold text-[var(--t-blue)]">8.2%</span> over <span className="font-semibold text-[var(--t-text)]">{Math.floor(marketsCount)}</span> attested markets.{' '}
                <span className="inline-block rounded-md px-2.5 py-0.5 font-semibold whitespace-nowrap" style={{ background: 'rgba(0,229,212,0.10)', color: '#00E5D4' }}>Provable, not promised.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-[var(--t-text-muted)]">
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      <div className="overflow-hidden border-y border-[var(--t-border)] bg-[var(--t-panel)] py-2">
        <div className="flex animate-ticker-25s gap-8 whitespace-nowrap text-xs text-[var(--t-text-muted)]">
          {[...MARKETS, ...MARKETS].map((m, i) => {
            const p = prices[m.id] ?? m.currentPrice;
            const chg = m.change24hPct ?? 0;
            const up = chg >= 0;
            return (
              <span key={i} className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[var(--t-text-muted)] flex items-center gap-1.5">
                  <MarketIcon market={m} className="w-3.5 h-3.5 shrink-0" />
                  {m.name}
                </span>
                <span className="text-[var(--t-text)]">
                  ${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
                <span className={up ? "text-[var(--t-blue)]" : "text-[var(--t-red)]"}>
                  {up ? "▲" : "▼"} {Math.abs(chg * 100).toFixed(2)}%. {up ? "Agents printing alpha on this signal" : "Shield holding the floor on this signal"}
                </span>
                <span className="text-[var(--t-border)]">|</span>
              </span>
            );
          })}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--t-blue)]">
            The agent loop
          </p>
          <h2 className="text-3xl font-bold text-[var(--t-text)]">From session key to signed shield in three calls</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Drop a session key into Claude",
              body: "Mint a scoped key for your Aegis agent. The skill loads into Claude or any MCP client; from there the agent can read markets, draft strategies, and request signatures.",
              icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="16" r="12" stroke="#A78BFA" strokeWidth="2" fill="rgba(167,139,250,0.10)"/>
                  <text x="20" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#A78BFA">$</text>
                  <ellipse cx="20" cy="28" rx="12" ry="4" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
                </svg>
              ),
            },
            {
              step: "2",
              title: "Let the TEE-signed agent build your hedge",
              body: "0G Compute runs the strategy inside a trusted enclave. The signed envelope, the inputs, and the attestation land on 0G Storage so anyone can replay the decision.",
              icon: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '40px' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(245,158,11,0.20)' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(167,139,250,0.20)' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(0,229,212,0.20)' }} />
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(242,85,85,0.20)' }} />
                </div>
              ),
            },
            {
              step: "3",
              title: "Settle on 0G Chain, verify forever",
              body: "Shields settle on 0G Chain with payoff math you can audit. Upside flows to the deposit; downside is contained by design. Every leg is reproducible from storage.",
              icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4 L34 10 L34 22 C34 30 20 38 20 38 C20 38 6 30 6 22 L6 10 Z" stroke="#00E5D4" strokeWidth="2" fill="rgba(0,229,212,0.10)"/>
                  <path d="M14 20 L18 24 L26 16" stroke="#00E5D4" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                </svg>
              ),
            },
          ].map((card) => (
            <div
              key={card.step}
              className="group relative overflow-hidden rounded-xl border border-[var(--t-border)] bg-[var(--t-panel)] p-6 transition-all hover:border-[var(--t-blue)] hover:bg-[var(--t-bg-secondary)] shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--t-blue)]/10 text-lg font-bold text-[var(--t-blue)]">
                  {card.step}
                </div>
                {card.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[var(--t-text)]">{card.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--t-text-muted)]">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl p-6 text-center shadow-sm" style={{ border: '2px solid #A78BFA', background: '#0F0F18' }}>
            <p className="text-[13px] text-[#8B8BA8] mb-2">Aegis Shield, agent steered</p>
            <p className="text-[32px] font-bold" style={{ color: '#00E5D4' }}>$10,481</p>
            <p className="text-sm text-[#8B8BA8]">+4.81% net</p>
            <p className="text-xs text-[#5C5C80] mt-2">Median across 552 replayed windows</p>
            <span className="inline-block mt-3 text-[11px] font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(0,229,212,0.10)', color: '#00E5D4' }}>Zero floor breaches</span>
          </div>
          <div className="rounded-xl border border-[var(--t-border)] bg-[var(--t-panel)] p-6 text-center shadow-sm">
            <p className="text-[13px] text-[#8B8BA8] mb-2">Naive DeFi yield, no hedge</p>
            <p className="text-[32px] font-bold text-[var(--t-text)]">$10,319</p>
            <p className="text-sm text-[#8B8BA8]">+3.19% net</p>
            <p className="text-xs text-[#5C5C80] mt-2">Lending APY alone, no asset linkage</p>
          </div>
          <div className="rounded-xl border border-[var(--t-border)] bg-[var(--t-panel)] p-6 text-center shadow-sm">
            <p className="text-[13px] text-[#8B8BA8] mb-2">Worst window the agent saw</p>
            <p className="text-[32px] font-bold text-[var(--t-text)]">$10,026</p>
            <p className="text-sm text-[#8B8BA8]">+0.26% net</p>
            <p className="text-xs text-[#5C5C80] mt-2">Floor held even in the bad tape</p>
            <span className="inline-block mt-3 text-[11px] font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(167,139,250,0.10)', color: '#A78BFA' }}>Floor never broke</span>
          </div>
        </div>
        <div className="mt-12 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--t-blue)]">
            REPLAYED ON 0G STORAGE
          </p>
          <h2 className="text-3xl font-bold text-[var(--t-text)]">Every shield is a receipt you can re-execute</h2>
          <p className="mt-3 text-sm text-[var(--t-text-muted)] max-w-lg mx-auto">
            We rolled the agent through 552 six-month windows of real Gold tape and real lending curves. The TEE signed each call, 0G Storage kept the receipts, the math reproduced byte-for-byte.
          </p>
        </div>
        <p className="text-[11px] text-[#5C5C80] text-center mt-4">
          Data sources: CoinGecko spot Gold, DefiLlama lending rates (Morpho, Aave, Moonwell). Window: March 2024 to March 2026, 552 rolling six-month replays.
        </p>
      </section>

      <section className="border-y border-[var(--t-border)] bg-[var(--t-bg-secondary)]/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--t-blue)]">
              Stack
            </p>
            <h2 className="text-3xl font-bold text-[var(--t-text)]">A protocol that an agent can actually trust</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: "22 attested signals",
                body: "Metals, energy, BTC, ETH, 15 metro real estate prints, FX. Each feed has a 0G Storage receipt; the agent can prove it read the right tape.",
                cta: "Inspect signals",
                to: "/app/markets",
                color: "var(--t-blue)",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Floor enforced by math",
                body: "Shields settle inside a contract that refuses to break the deposit floor. No oracle gymnastics, no liquidation games, no surprise haircuts.",
                cta: "Open a shield",
                to: "/app/shield",
                color: "var(--t-blue)",
              },
              {
                icon: <Vault className="h-5 w-5" />,
                title: "LPs paid per signed envelope",
                body: "Provide USDC to the vault. Every TEE-signed shield routes fees back to you in real time, with the cap table visible on chain.",
                cta: "Stake into the vault",
                to: "/app/vault",
                color: "var(--t-blue)",
              },
              {
                icon: <BarChart2 className="h-5 w-5" />,
                title: "Audit trail by default",
                body: "Every signal read, every signature, every settlement lives on 0G Storage. Replay a strategy in one CLI call; no trust required.",
                cta: "Read the trail",
                to: "/app/portfolio",
                color: "var(--t-blue)",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--t-border)] bg-[var(--t-panel)] p-5 transition-all hover:border-[var(--t-blue)] hover:bg-[var(--t-bg-secondary)] shadow-sm"
              >
                <div
                  className="mb-3 inline-flex rounded-lg p-2"
                  style={{ background: f.color + "18", color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-[var(--t-text)]">{f.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-[var(--t-text-muted)]">
                  {f.body}
                </p>
                <Link
                  to={f.to}
                  className="text-xs font-semibold text-[var(--t-blue)] hover:underline"
                >
                  {f.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[var(--t-blue)]">
              Signals
            </p>
            <h2 className="text-2xl font-bold text-[var(--t-text)]">Signals your agent can shield against</h2>
          </div>
          <Link
            to="/app/markets"
            className="text-sm font-medium text-[var(--t-blue)] hover:underline"
          >
            6 of 22 signals shown. See the full feed.
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(() => {
            const LANDING_IDS = ['gold', 'silver', 'wti_oil', 're_nyc', 'bitcoin', 'ethereum'];
            const BADGES = {
              gold: { text: 'MOST SHIELDED', bg: 'rgba(245,158,11,0.10)', color: '#F59E0B' },
              re_nyc: { text: 'AEGIS NATIVE FEED', bg: 'rgba(167,139,250,0.10)', color: '#A78BFA' },
            };
            return LANDING_IDS.map((id) => {
              const m = MARKETS.find((x) => x.id === id) || MARKETS[0];
              const p = prices[m.id] ?? m.currentPrice;
              const chg = m.change24hPct ?? 0;
              const hist = charts[m.id] ?? [m.basePrice];
              const badge = BADGES[m.id];
              return (
                <div
                  key={m.id}
                  className="group flex flex-col rounded-xl border border-[var(--t-border)] bg-[var(--t-panel)] p-4 transition-all hover:border-[var(--t-blue)] hover:bg-[var(--t-bg-secondary)] shadow-sm"
                >
                  {badge && (
                    <span className="mb-2 inline-block w-fit rounded text-[10px] font-semibold px-2 py-0.5" style={{ background: badge.bg, color: badge.color }}>
                      {badge.text}
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <MarketIcon market={m} className="w-5 h-5 text-[var(--t-text-muted)] shrink-0" />
                        <span className="text-xs text-[var(--t-text-muted)] uppercase tracking-wide">
                          {m.category}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[var(--t-text)]">{m.name}</div>
                      <div className="mt-1 text-lg font-bold text-[var(--t-text)]">
                        ${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </div>
                      <div className={`text-xs ${chg >= 0 ? "text-[var(--t-blue)]" : "text-[var(--t-red)]"}`}>
                        {chg >= 0 ? "▲" : "▼"} {Math.abs(chg * 100).toFixed(2)}% 24h
                      </div>
                    </div>
                    <pre
                      className="font-mono text-[6px] leading-[1.1] opacity-60"
                      style={{ color: chg >= 0 ? "var(--t-blue)" : "var(--t-red)" }}
                    >
                      {buildAsciiChart(hist.slice(-20), 14, 6)}
                    </pre>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to="/app/shield"
                      className="flex-1 rounded-lg border border-[var(--t-blue)] bg-[var(--t-panel)] py-2 text-center text-xs font-medium text-[var(--t-blue)] transition-colors hover:bg-[var(--t-bg-secondary)]"
                    >
                      Shield
                    </Link>
                    <Link
                      to={`/app/trade/${m.id}`}
                      className="flex-1 rounded-lg bg-[var(--t-blue)] py-2 text-center text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Agent trade
                    </Link>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-[var(--t-border)]/60 py-24" style={{ isolation: 'isolate' }}>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
          <div className="h-64 w-64 rounded-full bg-[var(--t-green)]/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center" style={{ zIndex: 3 }}>
          <h2 className="mb-4 text-3xl font-bold text-[var(--t-text)] md:text-4xl">
            Give your agent something worth signing.
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-[var(--t-text-muted)]">
            Mint a session key. Hand it to your favorite model. The TEE drafts the hedge, 0G Storage holds the receipt, the chain settles the payoff. You stay in the verifier seat.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app/shield"
              className="hedge-pulse flex items-center gap-2 rounded-xl bg-[var(--t-blue)] px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90"
            >
              <Shield className="h-4 w-4" />
              Open the first shield
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/vault"
              className="flex items-center gap-2 rounded-xl border border-[var(--t-border)] px-8 py-3.5 text-sm text-[var(--t-text-muted)] transition-colors hover:border-[var(--t-text-muted)] hover:text-[var(--t-text)]"
            >
              Stake the vault, earn the fees
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--t-border)] bg-[var(--t-bg-secondary)] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-6" />
            <span className="text-sm font-bold tracking-[0.1em] uppercase text-[var(--t-text)]">Aegis.0G</span>
            <span className="text-xs text-[var(--t-text-muted)]">
              . The shield layer for the agent economy
            </span>
          </div>
          <div className="flex gap-6 text-xs text-[var(--t-text-muted)]">
            {[
              { label: "Shield", to: "/app/shield" },
              { label: "Signals", to: "/app/markets" },
              { label: "Vault", to: "/app/vault" },
              { label: "Agents", to: "/app/agents" },
              { label: "Leaderboard", to: "/app/leaderboard" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="transition-colors hover:text-[var(--t-text)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="text-[10px] text-[var(--t-text-dim)]">
            Aegis.0G runs on 0G testnet today. Mainnet attestation is in review. Not financial advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
