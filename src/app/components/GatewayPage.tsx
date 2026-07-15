import { ArrowRight, Brain, Cpu, BarChart2, GitBranch, Zap, Building2 } from 'lucide-react';
import atlasLogo from '../../imports/Chalega.png';
import type { ReactNode } from 'react';

interface GatewayCardProps {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  active?: boolean;
  size: number;
  onClick?: () => void;
}

function GatewayCard({ icon, label, sublabel, active = false, size, onClick }: GatewayCardProps) {
  const h = size;
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        width: size,
        height: h,
      }}
    >
      <div
        className={`w-full h-full flex flex-col items-center justify-center gap-2 relative transition-all duration-300 ease-out select-none ${
          active
            ? 'rounded-[28px] text-white shadow-[0_16px_36px_rgba(37,99,235,0.22)] hover:shadow-[0_20px_48px_rgba(37,99,235,0.4)] hover:-translate-y-1 cursor-pointer'
            : 'rounded-[20px] text-slate-800 border border-slate-200/80 bg-white/75 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-slate-300/80'
        }`}
        style={{
          background: active
            ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E40AF 100%)'
            : undefined,
        }}
        onClick={onClick}
      >
        {/* Icon container */}
        <div
          className={`flex items-center justify-center rounded-2xl transition-all duration-300 ${
            active
              ? 'bg-white/15 border border-white/20'
              : 'bg-slate-50 border border-slate-200/60'
          }`}
          style={{
            width: active ? 52 : 40,
            height: active ? 52 : 40,
          }}
        >
          <div
            className="transition-colors duration-300"
            style={{
              color: active ? '#FFFFFF' : '#64748B',
              width: active ? 24 : 18,
              height: active ? 24 : 18,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Label and Sublabel */}
        <div className="text-center px-3">
          <p
            className="font-extrabold leading-tight tracking-wide text-xs uppercase"
            style={{
              color: active ? '#FFFFFF' : '#0F172A',
            }}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className="text-[9px] mt-1 font-medium tracking-wider"
              style={{
                color: active ? 'rgba(255,255,255,0.75)' : '#64748B',
              }}
            >
              {sublabel}
            </p>
          )}
        </div>

        {/* CTA arrow on active */}
        {active && (
          <div
            className="flex items-center justify-center rounded-full bg-white/15 border border-white/20 mt-1 hover:bg-white/25 transition-colors"
            style={{
              width: 28,
              height: 28,
            }}
          >
            <ArrowRight style={{ width: 13, height: 13, color: '#FFFFFF' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export function GatewayPage({ onEnter }: GatewayPageProps) {
  // Container size
  const CW = 580, CH = 510;

  // Center (MFG Insights)
  const CS = 192; // size of center hex
  const CX = 290, CY = 252; // center of cluster

  // Surrounding hex size
  const SS = 148;
  const R  = 172; // radius from cluster center to surrounding hex centers

  // Pentagon: 5 apps at angles (degrees), -90° = top
  const apps = [
    { angle: -90, label: 'App 2',     sublabel: 'AI Shopfloor Assistant',  icon: <Brain  style={{ width: '100%', height: '100%' }} /> },
    { angle: -18, label: 'App 3',     sublabel: 'Machine health Monitoring',    icon: <Cpu    style={{ width: '100%', height: '100%' }} /> },
    { angle:  54, label: 'App 4',     sublabel: 'Demand Forecasting',     icon: <BarChart2 style={{ width: '100%', height: '100%' }} /> },
    { angle: 126, label: 'App 5',     sublabel: 'Business Forecasting',      icon: <GitBranch style={{ width: '100%', height: '100%' }} /> },
    { angle: 198, label: 'App 6',     sublabel: 'Digital Initiatives',  icon: <Zap    style={{ width: '100%', height: '100%' }} /> },
  ].map(a => {
    const rad = (a.angle * Math.PI) / 180;
    return { ...a, cx: CX + R * Math.cos(rad), cy: CY + R * Math.sin(rad) };
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative select-none bg-slate-50"
      style={{ background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)' }}
    >
      {/* ── Background: grid + hex pattern + glow ── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.28]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {/* Grid lines */}
        {Array.from({ length: 30 }, (_, i) => (
          <line key={`v${i}`} x1={i * 52} y1="0" x2={i * 52} y2="900" stroke="#E2E8F0" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 52} x2="1440" y2={i * 52} stroke="#E2E8F0" strokeWidth="0.5" />
        ))}
        {/* Hex pattern overlay */}
        {Array.from({ length: 60 }, (_, i) => {
          const col = i % 8, row = Math.floor(i / 8);
          const x = col * 160 + (row % 2 ? 80 : 0) + 20;
          const y = row * 90 + 20;
          const pts = `${x+50},${y} ${x+100},${y+29} ${x+100},${y+87} ${x+50},${y+116} ${x},${y+87} ${x},${y+29}`;
          return <polygon key={i} points={pts} fill="none" stroke="#94A3B8" strokeWidth="0.4" opacity="0.3" />;
        })}
        {/* Network nodes */}
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={80 + i * 56} cy={680 + Math.sin(i * 0.9) * 55} r="2.5" fill="#3B82F6" opacity="0.6" />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <line key={i}
            x1={80 + i * 56} y1={680 + Math.sin(i * 0.9) * 55}
            x2={80 + (i + 1) * 56} y2={680 + Math.sin((i + 1) * 0.9) * 55}
            stroke="#93C5FD" strokeWidth="0.6" opacity="0.5" />
        ))}
      </svg>

      {/* Radial glow behind cluster */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '8%', top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 600,
          background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.2) 0%, rgba(37,99,235,0.08) 35%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating ambient particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" viewBox="0 0 1440 900">
        {[
          [200, 180, '#3B82F6'], [400, 320, '#6366F1'], [1100, 200, '#3B82F6'],
          [1200, 400, '#60A5FA'], [900, 720, '#3B82F6'], [300, 650, '#6366F1'],
          [1050, 500, '#3B82F6'], [680, 120, '#60A5FA'], [150, 500, '#6366F1'],
        ].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r="2" fill={c as string} opacity="0.5" />
        ))}
      </svg>

      {/* ── Content ── */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl px-16 gap-12">

        {/* ── LEFT: Branding ── */}
        <div className="flex flex-col items-center text-center shrink-0">
          {/* Logo with glow */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(37,99,235,0.12) 50%, transparent 80%)', transform: 'scale(1.4)' }}
            />
            <img
              src={atlasLogo}
              alt="ATLAS"
              className="relative"
              style={{ width: 180, height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(37,99,235,0.15))' }}
            />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="font-black tracking-[0.12em] uppercase text-slate-900" style={{ fontSize: 38, letterSpacing: '0.1em' }}>
              ATLAS
            </h1>
            <p className="font-semibold tracking-widest uppercase text-blue-600" style={{ fontSize: 11, letterSpacing: '0.2em' }}>
              Manufacturing Control Tower
            </p>
            <div className="w-24 h-px mx-auto mt-4" style={{ background: 'linear-gradient(90deg, transparent, #2563EB, transparent)' }} />
            <p className="text-slate-500 font-medium" style={{ fontSize: 11, letterSpacing: '0.06em', marginTop: 8 }}>
              AI for TACO – Lead And Scale
            </p>
          </div>

          {/* Bottom badge */}
          <div
            className="mt-10 px-5 py-2 rounded-full flex items-center gap-2"
            style={{
              background: 'rgba(37,99,235,0.06)',
              border: '1px solid rgba(37,99,235,0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
              Enterprise Platform · v2.0.1
            </span>
          </div>
        </div>

        {/* ── RIGHT: Cluster ── */}
        <div className="shrink-0 flex items-center justify-center" style={{ position: 'relative', width: CW, height: CH }}>

          {/* SVG connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CW} height={CH}
            viewBox={`0 0 ${CW} ${CH}`}
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#C7D2FE" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.8" />
              </linearGradient>
              <filter id="lineGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {apps.map((a, i) => (
              <line
                key={i}
                x1={CX} y1={CY}
                x2={a.cx} y2={a.cy}
                stroke="url(#lineGrad)"
                strokeWidth="1.5"
                filter="url(#lineGlow)"
                opacity="0.65"
              />
            ))}
            {/* Midpoint nodes */}
            {apps.map((a, i) => (
              <circle
                key={i}
                cx={(CX + a.cx) / 2}
                cy={(CY + a.cy) / 2}
                r="3"
                fill="#3B82F6"
                opacity="0.8"
                filter="url(#lineGlow)"
              />
            ))}
          </svg>

          {/* Center card — MFG Insights */}
          <div style={{ position: 'absolute', left: CX - CS / 2, top: CY - CS / 2 }}>
            <GatewayCard
              icon={<Building2 style={{ width: '100%', height: '100%' }} />}
              label="MFG Insights"
              sublabel="Active Application"
              active
              size={CS}
              onClick={onEnter}
            />
          </div>

          {/* Surrounding cards */}
          {apps.map((a, i) => (
            <div key={i} style={{ position: 'absolute', left: a.cx - SS / 2, top: a.cy - SS / 2 }}>
              <GatewayCard
                icon={a.icon}
                label={a.label}
                sublabel={a.sublabel}
                active={false}
                size={SS}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom footer */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <p style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
          Click MFG Insights to launch the Control Tower
        </p>
      </div>
    </div>
  );
}
