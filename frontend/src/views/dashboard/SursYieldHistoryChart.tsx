import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export type SursYieldStats = {
  cropCode: string;
  cropName: string;
  unit: string;
  history: {
    year: number;
    value: number;
  }[];
  latest: {
    year: number;
    value: number;
  } | null;
  prediction: {
    year: number | null;
    value: number | null;
  };
};

type Props = {
  stats: SursYieldStats[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(value);
}

export default function SursYieldHistoryChart({ stats }: Props) {
  const uniqueStats = useMemo(() => {
    const byCrop = new Map<string, SursYieldStats>();
    stats.forEach(item => {
      if (item.history.length > 0) byCrop.set(item.cropCode, item);
    });
    return Array.from(byCrop.values());
  }, [stats]);

  const [selectedCropCode, setSelectedCropCode] = useState<string | null>(null);
  const selected = uniqueStats.find(item => item.cropCode === selectedCropCode) ?? uniqueStats[0] ?? null;
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!selectedCropCode && uniqueStats[0]) {
      setSelectedCropCode(uniqueStats[0].cropCode);
    }
  }, [selectedCropCode, uniqueStats]);

  useEffect(() => {
    if (!ref.current || !selected) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const W = ref.current.getBoundingClientRect().width || 720;
    const H = 280;
    const margin = { top: 18, right: 28, bottom: 34, left: 46 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;
    const historical = selected.history.map(item => ({ ...item, predicted: false }));
    const prediction = selected.prediction.year != null && selected.prediction.value != null
      ? [{ year: selected.prediction.year, value: selected.prediction.value, predicted: true }]
      : [];
    const all = [...historical, ...prediction];

    if (all.length === 0) return;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const years = all.map(item => item.year);
    const values = all.map(item => item.value);
    const x = d3.scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, innerW]);
    const y = d3.scaleLinear()
      .domain([0, (d3.max(values) ?? 1) * 1.15])
      .nice()
      .range([innerH, 0]);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.min(8, years.length)).tickFormat(d3.format('d')))
      .call(axis => axis.selectAll('path,line').attr('stroke', '#dbe5df'))
      .call(axis => axis.selectAll('text').attr('fill', '#64748b').attr('font-weight', 700));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(axis => axis.selectAll('path,line').attr('stroke', '#dbe5df'))
      .call(axis => axis.selectAll('text').attr('fill', '#64748b').attr('font-weight', 700));

    g.append('g')
      .selectAll('line')
      .data(y.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#edf2f0')
      .attr('stroke-width', 1);

    const line = d3.line<{ year: number; value: number }>()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historical)
      .attr('fill', 'none')
      .attr('stroke', '#0f6b4f')
      .attr('stroke-width', 3)
      .attr('d', line);

    if (prediction.length > 0 && historical.length > 0) {
      g.append('path')
        .datum([historical[historical.length - 1], prediction[0]])
        .attr('fill', 'none')
        .attr('stroke', '#d97706')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '6 6')
        .attr('d', line);
    }

    g.selectAll('circle.history')
      .data(historical)
      .enter()
      .append('circle')
      .attr('class', 'history')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#0f6b4f');

    g.selectAll('circle.prediction')
      .data(prediction)
      .enter()
      .append('circle')
      .attr('class', 'prediction')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', '#d97706');

    const latest = historical[historical.length - 1];
    if (latest) {
      g.append('text')
        .attr('x', x(latest.year) + 8)
        .attr('y', y(latest.value) - 8)
        .attr('font-size', 11)
        .attr('font-weight', 800)
        .attr('fill', '#0f6b4f')
        .text(`${formatNumber(latest.value)} ${selected.unit}`);
    }

    if (prediction[0]) {
      g.append('text')
        .attr('x', x(prediction[0].year) + 8)
        .attr('y', y(prediction[0].value) + 16)
        .attr('font-size', 11)
        .attr('font-weight', 800)
        .attr('fill', '#d97706')
        .text(`Napoved ${formatNumber(prediction[0].value)} ${selected.unit}`);
    }
  }, [selected]);

  if (uniqueStats.length === 0) {
    return <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Ni SURS podatkov za zgodovinski graf.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {uniqueStats.map(item => (
          <button
            key={item.cropCode}
            onClick={() => setSelectedCropCode(item.cropCode)}
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              background: selected?.cropCode === item.cropCode ? '#0f6b4f' : '#f1f5f9',
              color: selected?.cropCode === item.cropCode ? '#ffffff' : '#64748b',
            }}
          >
            {item.cropName}
          </button>
        ))}
      </div>
      <svg ref={ref} width="100%" height={280} style={{ display: 'block', overflow: 'visible' }} />
    </div>
  );
}
