import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface DonutSlice {
  label: string;
  area: number;
}

interface Props {
  slices: DonutSlice[];
}

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 80;
const INNER_R = 48;

const PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316',
];

export default function RabaDonutChart({ slices }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || slices.length === 0) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const total = d3.sum(slices, d => d.area);

    const pie = d3.pie<DonutSlice>()
      .value(d => d.area)
      .sort(null)
      .padAngle(0.03);

    const arc = d3.arc<d3.PieArcDatum<DonutSlice>>()
      .innerRadius(INNER_R)
      .outerRadius(OUTER_R)
      .cornerRadius(4);

    const arcHover = d3.arc<d3.PieArcDatum<DonutSlice>>()
      .innerRadius(INNER_R)
      .outerRadius(OUTER_R + 6)
      .cornerRadius(4);

    const g = svg.append('g').attr('transform', `translate(${CX},${CY})`);

    const sliceG = g.selectAll('.slice')
      .data(pie(slices))
      .enter()
      .append('g')
      .attr('class', 'slice')
      .style('cursor', 'default');

    sliceG.append('path')
      .attr('fill', (_, i) => PALETTE[i % PALETTE.length])
      .attr('d', d => {
        const start = { ...d, endAngle: d.startAngle };
        return arc(start) ?? '';
      })
      .on('mouseenter', function (_, d) {
        d3.select(this).attr('d', arcHover(d) ?? '');
        label.text(`${((d.data.area / total) * 100).toFixed(0)}%`);
        sub.text(d.data.label.length > 12 ? d.data.label.slice(0, 11) + '…' : d.data.label);
      })
      .on('mouseleave', function (_, d) {
        d3.select(this).attr('d', arc(d) ?? '');
        label.text(`${slices.length}`);
        sub.text('tipov rabe');
      })
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(d.startAngle, d.endAngle);
        return (t: number) => arc({ ...d, endAngle: interpolate(t) }) ?? '';
      });

    // sredinsko besedilo
    const label = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', -6)
      .attr('font-size', 22)
      .attr('font-weight', 800)
      .attr('fill', '#111827')
      .text(`${slices.length}`);

    const sub = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', 14)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('fill', '#9ca3af')
      .text('tipov rabe');

    // prepreci neuporabljeno opozorilo
    void label; void sub;

  }, [slices]);

  const total = slices.reduce((s, d) => s + d.area, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg ref={ref} width={SIZE} height={SIZE} style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {slices.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              background: PALETTE[i % PALETTE.length],
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto', paddingLeft: 8, flexShrink: 0 }}>
              {total > 0 ? `${((s.area / total) * 100).toFixed(0)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
