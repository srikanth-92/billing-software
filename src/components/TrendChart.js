import React from 'react';
import Svg, { G, Text as SvgText, Polyline, Line, Circle } from 'react-native-svg';

// SVG line chart — one polyline per series, shared X-axis labels.
// series: [{ label, color, data: number[] }], labels: string[] (same length as data)
export default function TrendChart({ series, labels, width = 320, height = 160 }) {
  const PAD = { top: 16, right: 16, bottom: 32, left: 48 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 1);
  const steps = labels.length;

  function px(i) { return PAD.left + (i / Math.max(steps - 1, 1)) * W; }
  function py(v) { return PAD.top + H - (v / maxVal) * H; }

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <Svg width={width} height={height}>
      {yTicks.map((t) => (
        <G key={t}>
          <Line x1={PAD.left} y1={py(t)} x2={PAD.left + W} y2={py(t)}
            stroke="#e2e8f0" strokeWidth={1} />
          <SvgText x={PAD.left - 6} y={py(t) + 4} textAnchor="end"
            fontSize={9} fill="#94a3b8">
            {t > 999 ? `₹${(t / 1000).toFixed(1)}k` : `₹${t}`}
          </SvgText>
        </G>
      ))}

      {labels.map((l, i) => (
        i % Math.ceil(steps / 7) === 0 ? (
          <SvgText key={i} x={px(i)} y={height - 6} textAnchor="middle"
            fontSize={8} fill="#94a3b8">
            {l}
          </SvgText>
        ) : null
      ))}

      {series.map((s) => {
        const pts = s.data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
        return (
          <G key={s.label}>
            <Polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
            {s.data.map((v, i) => v > 0 ? (
              <Circle key={i} cx={px(i)} cy={py(v)} r={3} fill={s.color} />
            ) : null)}
          </G>
        );
      })}
    </Svg>
  );
}
