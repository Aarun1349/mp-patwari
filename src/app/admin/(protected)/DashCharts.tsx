// Lightweight, dependency-free SSR chart kit for the admin dashboard.
// Pure SVG server components with native <title> hover tooltips. Single hue for
// magnitude/time series (dataviz: color follows job, magnitude = one hue);
// status colors are passed explicitly for state charts and always paired with a
// labelled legend, never color-alone.

const NAVY = "#1a2a44";
const INK_MUTED = "#8a8372";
const GRID = "rgba(26,42,68,0.10)";

export interface Point {
  label: string;
  value: number;
}

/** Vertical bar chart for a time series (e.g. revenue/signups per day). */
export function BarChart({
  data,
  color = "#c9a227",
  height = 170,
  format = (n: number) => String(n),
}: {
  data: Point[];
  color?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  if (data.length === 0) return <p className="dash-empty">No data yet.</p>;

  const W = 680;
  const H = height;
  const padL = 6;
  const padR = 6;
  const padT = 14;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const gap = n > 40 ? 1 : 3;
  const barW = (plotW - gap * (n - 1)) / n;
  const baseY = padT + plotH;

  // Label roughly 6 ticks along x.
  const labelEvery = Math.max(1, Math.ceil(n / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" role="img" style={{ display: "block" }}>
      {/* gridlines at 0 / 50% / 100% */}
      {[0, 0.5, 1].map((f) => {
        const y = padT + plotH * (1 - f);
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={GRID} strokeWidth={1} />
            <text x={padL} y={y - 3} fontSize={9} fill={INK_MUTED}>
              {f === 0 ? "" : format(Math.round(max * f))}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = (d.value / max) * plotH;
        const x = padL + i * (barW + gap);
        const y = baseY - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(0, bh)} rx={2} fill={color}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={x + barW / 2} y={H - 6} fontSize={9} fill={INK_MUTED} textAnchor="middle">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal ranked bars (e.g. revenue by package / acquisition source). */
export function HBars({
  data,
  color = NAVY,
  format = (n: number) => String(n),
}: {
  data: Point[];
  color?: string;
  format?: (n: number) => string;
}) {
  if (data.length === 0) return <p className="dash-empty">No data yet.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="hbars">
      {data.map((d) => (
        <div className="hbar-row" key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <span className="hbar-label">{d.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </span>
          <span className="hbar-value">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

function ring(cx: number, cy: number, R: number, r: number, a0: number, a1: number): string {
  const pt = (rad: number, a: number) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(R, a0);
  const [x1, y1] = pt(R, a1);
  const [x2, y2] = pt(r, a1);
  const [x3, y3] = pt(r, a0);
  return `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${large} 0 ${x3},${y3} Z`;
}

/** Donut for a small set of states (status colors + labelled legend). */
export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 52;
  const r = 34;
  const cx = 60;
  const cy = 60;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" width="132" height="132" role="img">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={GRID} strokeWidth={R - r} />
        ) : (
          (() => {
            let a = -Math.PI / 2;
            return segments
              .filter((s) => s.value > 0)
              .map((s) => {
                const frac = s.value / total;
                const a0 = a;
                const a1 = a + frac * 2 * Math.PI;
                a = a1;
                // A single full-circle segment can't be one arc — draw a ring.
                if (frac > 0.999) {
                  return (
                    <circle key={s.label} cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={s.color} strokeWidth={R - r}>
                      <title>{`${s.label}: ${s.value}`}</title>
                    </circle>
                  );
                }
                return (
                  <path key={s.label} d={ring(cx, cy, R, r, a0, a1)} fill={s.color} stroke="#fff" strokeWidth={2}>
                    <title>{`${s.label}: ${s.value} (${Math.round(frac * 100)}%)`}</title>
                  </path>
                );
              });
          })()
        )}
        {centerValue && (
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize={20} fontWeight={800} fill={NAVY}>
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill={INK_MUTED}>
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            {s.label}
            <b>{s.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
