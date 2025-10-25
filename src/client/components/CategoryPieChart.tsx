import React from 'react';
import { motion } from 'motion/react';

export type PieDatum = {
  label: string;
  value: number;
  color?: string;
};

type CategoryPieChartProps = {
  data: PieDatum[];
  size?: number; // svg size in px
  stroke?: string; // optional stroke color
  strokeWidth?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z',
  ].join(' ');
}

export default function CategoryPieChart({ data, size = 240, stroke, strokeWidth = 0 }: CategoryPieChartProps) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  let angleCursor = 0;
  const slices = data.map((d, idx) => {
    const value = Math.max(0, d.value);
    const angle = total > 0 ? (value / total) * 360 : 0;
    const start = angleCursor;
    const end = angleCursor + angle;
    angleCursor = end;
    const color = d.color || `hsl(${(idx * 57) % 360}deg 70% 55%)`;
    return {
      path: describeArc(cx, cy, r, start, end),
      color,
      label: d.label,
      value,
      angle,
    };
  });

  const positiveCount = slices.filter((s) => s.value > 0).length;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Category breakdown pie chart"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <defs>
        <filter id="softDrop" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>
      <g filter="url(#softDrop)">
        {total === 0 && (
          <>
            <circle cx={cx} cy={cy} r={r} fill="var(--surface-2)" stroke={stroke} strokeWidth={strokeWidth} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize={14}>
              No data
            </text>
          </>
        )}
        {total > 0 && positiveCount === 1 && (
          // Single-category: draw a full circle with animation
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill={slices.find((s) => s.value > 0)!.color}
            stroke={stroke}
            strokeWidth={strokeWidth}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}
        {total > 0 && positiveCount > 1 && (
          <>
            {slices.map((s, i) => (
              s.value > 0 ? (
                <motion.path
                  key={i}
                  d={s.path}
                  fill={s.color}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.06 }}
                />
              ) : null
            ))}
          </>
        )}
      </g>
    </motion.svg>
  );
}
