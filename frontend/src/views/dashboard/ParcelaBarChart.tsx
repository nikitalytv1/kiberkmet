import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface BarItem {
  id: string;
  name: string;
  color: string;
  ph: number | null;
  area: number | null;
}

type Metric = 'ph' | 'area';

interface Props {
  items: BarItem[];
  onClickItem?: (id: string) => void;
}

const MARGIN = { top: 8, right: 48, bottom: 8, left: 110 };
const ROW_H = 32;
const MIN_H = 80;
const MAX_VISIBLE = 5;

function BarChartSvg({
  data,
  metric,
  onClickItem,
}: {
  data: (BarItem & { value: number | null })[];
  metric: Metric;
  onClickItem?: (id: string) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const svgH = Math.max(MIN_H, data.length * ROW_H + MARGIN.top + MARGIN.bottom);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const W = ref.current.getBoundingClientRect().width || 400;
    const innerW = W - MARGIN.left - MARGIN.right;
    const innerH = svgH - MARGIN.top - MARGIN.bottom;

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const maxVal = d3.max(data, d => d.value ?? 0) ?? 1;
    const x = d3.scaleLinear().domain([0, maxVal * 1.1]).range([0, innerW]);
    const y = d3.scaleBand()
      .domain(data.map(d => d.id))
      .range([0, innerH])
      .padding(0.28);

    g.append('g')
      .selectAll('line')
      .data(x.ticks(4))
      .enter()
      .append('line')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    const bars = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .style('cursor', onClickItem ? 'pointer' : 'default')
      .on('click', (_, d) => onClickItem?.(d.id));

    bars.append('rect')
      .attr('y', d => y(d.id) ?? 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('rx', 5)
      .attr('fill', d => d.color)
      .transition()
      .duration(500)
      .ease(d3.easeCubicOut)
      .attr('width', d => x(d.value ?? 0));

    bars.append('text')
      .attr('x', d => x(d.value ?? 0) + 6)
      .attr('y', d => (y(d.id) ?? 0) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 11)
      .attr('font-weight', 700)
      .attr('fill', '#64748b')
      .text(d => metric === 'ph'
        ? (d.value ?? 0).toFixed(1)
        : `${(d.value ?? 0).toFixed(1)} ha`
      );

    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', -8)
      .attr('y', d => (y(d.id) ?? 0) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('fill', '#374151')
      .text(d => d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name);

  }, [data, metric, svgH, onClickItem]);

  return (
    <svg
      ref={ref}
      width="100%"
      height={svgH}
      style={{ display: 'block', overflow: 'visible' }}
    />
  );
}

function AllChartsModal({
  items,
  metric,
  onChangeMetric,
  onClickItem,
  onClose,
}: {
  items: BarItem[];
  metric: Metric;
  onChangeMetric: (m: Metric) => void;
  onClickItem?: (id: string) => void;
  onClose: () => void;
}) {
  const data = items
    .map(d => ({ ...d, value: metric === 'ph' ? d.ph : d.area }))
    .filter(d => d.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: '20px 22px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: '1px solid #f3f4f6',
        width: '100%', maxWidth: 600,
        maxHeight: '80vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            margin: 0, fontSize: 11, fontWeight: 600,
            color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            Primerjava parcel — vse
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: '#9ca3af',
              width: 26, height: 26, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['ph', 'area'] as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => onChangeMetric(m)}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 12px',
                borderRadius: 20, border: 'none', cursor: 'pointer',
                background: metric === m ? '#0f6b4f' : '#f1f5f9',
                color: metric === m ? '#ffffff' : '#64748b',
                transition: 'background 0.15s',
              }}
            >
              {m === 'ph' ? 'pH tal' : 'Površina (ha)'}
            </button>
          ))}
        </div>

        {data.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Ni dovolj podatkov za prikaz.</p>
        ) : (
          <BarChartSvg data={data} metric={metric} onClickItem={id => { onClickItem?.(id); onClose(); }} />
        )}
      </div>
    </div>
  );
}

export default function ParcelaBarChart({ items, onClickItem }: Props) {
  const [metric, setMetric] = useState<Metric>('ph');
  const [showAll, setShowAll] = useState(false);

  const allData = items
    .map(d => ({ ...d, value: metric === 'ph' ? d.ph : d.area }))
    .filter(d => d.value != null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const visibleData = allData.slice(0, MAX_VISIBLE);
  const hasMore = allData.length > MAX_VISIBLE;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {(['ph', 'area'] as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '4px 12px',
              borderRadius: 20, border: 'none', cursor: 'pointer',
              background: metric === m ? '#0f6b4f' : '#f1f5f9',
              color: metric === m ? '#ffffff' : '#64748b',
              transition: 'background 0.15s',
            }}
          >
            {m === 'ph' ? 'pH tal' : 'Površina (ha)'}
          </button>
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 600,
              color: '#6b7280', background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
          >
            Prikaži vse ({allData.length})
          </button>
        )}
      </div>

      {visibleData.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
          Ni dovolj podatkov za prikaz.
        </p>
      ) : (
        <>
          <BarChartSvg data={visibleData} metric={metric} onClickItem={onClickItem} />
        </>
      )}

      {showAll && (
        <AllChartsModal
          items={items}
          metric={metric}
          onChangeMetric={setMetric}
          onClickItem={onClickItem}
          onClose={() => setShowAll(false)}
        />
      )}
    </div>
  );
}