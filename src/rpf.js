/**
 * RPF offensive progression layer: mobile-force routes, commander labels, and moving unit markers.
 */
import * as d3 from 'd3';
import { gRpf, projection } from './map.js';
import { showInfoCard } from './infocard.js';
import rpfRoutes from '../data/rpfAdvance.json';

export let showRpfLayer = true;

export function toggleRpfLayer() {
  showRpfLayer = !showRpfLayer;
  document.getElementById('rpfBtn')?.classList.toggle('on-rpf', showRpfLayer);
  return showRpfLayer;
}

function projectedPoint(point) {
  const p = projection([point.lng, point.lat]);
  return p ? { ...point, x: p[0], y: p[1] } : null;
}

function routeState(route, day) {
  if (day < route.startDay) return null;

  const points = [...route.points].sort((a, b) => a.day - b.day);
  const visible = [];

  for (let i = 0; i < points.length; i++) {
    if (points[i].day <= day) visible.push(points[i]);
  }

  if (day >= route.endDay || visible.length === points.length) {
    return {
      points,
      current: points[points.length - 1],
      complete: true,
    };
  }

  const next = points.find(p => p.day > day);
  const prev = [...visible].pop() || points[0];
  if (!next) return { points: visible, current: prev, complete: true };

  const span = Math.max(1, next.day - prev.day);
  const t = Math.max(0, Math.min(1, (day - prev.day) / span));
  const current = {
    day,
    lat: prev.lat + (next.lat - prev.lat) * t,
    lng: prev.lng + (next.lng - prev.lng) * t,
    label: `${prev.label} -> ${next.label}`,
  };

  return {
    points: [...visible, current],
    current,
    complete: false,
  };
}

function modeColor(route, mode) {
  if (mode === 'nvg') return '#00ff88';
  if (mode === 'crt') return '#ffb800';
  if (mode === 'flir') return '#ff4455';
  return route.color || '#00ff88';
}

function showRpfCard(route, point, screenPos) {
  const companies = route.companies?.length
    ? `\n\n3rd Battalion companies:\n${route.companies.map(c => `- ${c}`).join('\n')}`
    : '';

  showInfoCard({
    name: route.unit,
    _isRpf: true,
    day: Math.round(point.day),
    lives: route.livesSaved,
    livesSaved: route.livesSaved,
    type: route.type,
    prov: route.region || 'RPF offensive',
    commander: route.commander,
    commanderPhoto: route.commanderPhoto,
    deputy: route.deputy,
    deputyPhoto: route.deputyPhoto,
    desc: `Commander: ${route.commander}. Region/axis: ${route.region}. Current axis: ${point.label}. Estimated lives saved by this unit: ${route.livesSaved.toLocaleString()} of the 300,000 modeled total. ${route.desc}${companies}`,
  }, screenPos);
}

/**
 * Render RPF routes through the current timeline day.
 * @param {number} day
 * @param {string} mode
 */
export function renderRpfAdvance(day, mode) {
  gRpf.selectAll('*').remove();
  if (!showRpfLayer) return;

  const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveCatmullRom.alpha(0.5));

  rpfRoutes.forEach(route => {
    const state = routeState(route, day);
    if (!state || state.points.length < 1) return;

    const color = modeColor(route, mode);
    const points = state.points.map(projectedPoint).filter(Boolean);
    const current = projectedPoint(state.current);
    if (!current) return;

    if (points.length > 1) {
      gRpf.append('path')
        .datum(points)
        .attr('class', 'rpf-route-halo')
        .attr('d', line);

      gRpf.append('path')
        .datum(points)
        .attr('class', 'rpf-route')
        .attr('d', line)
        .attr('stroke', color);
    }

    points.slice(0, -1).forEach(p => {
      gRpf.append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', 2)
        .attr('class', 'rpf-waypoint')
        .attr('stroke', color);
    });

    const unit = gRpf.append('g')
      .attr('class', 'rpf-unit')
      .attr('transform', `translate(${current.x},${current.y})`)
      .attr('cursor', 'pointer')
      .on('click', () => showRpfCard(route, state.current, [current.x, current.y]))
      .on('mouseenter', () => {
        const t = document.getElementById('ttip');
        t.innerHTML = `<strong>${route.unit}</strong><br>${route.commander}<br>${state.current.label}`;
        t.style.left = current.x + 'px';
        t.style.top = (current.y - 10) + 'px';
        t.classList.add('vis');
      })
      .on('mouseleave', () => {
        document.getElementById('ttip').classList.remove('vis');
      });

    unit.append('circle')
      .attr('r', 8)
      .attr('fill', 'rgba(4,8,14,.86)')
      .attr('stroke', color)
      .attr('stroke-width', 1.6);

    unit.append('path')
      .attr('d', d3.symbol().type(d3.symbolTriangle).size(44))
      .attr('fill', color)
      .attr('transform', 'rotate(90)');

    unit.append('circle')
      .attr('r', 12)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 0.7)
      .attr('opacity', 0.35);

    gRpf.append('text')
      .attr('x', current.x + 11)
      .attr('y', current.y - 7)
      .attr('class', 'rpf-label')
      .attr('fill', color)
      .text(route.unit);

    gRpf.append('text')
      .attr('x', current.x + 11)
      .attr('y', current.y + 5)
      .attr('class', 'rpf-sub-label')
      .text(route.commander);
  });
}
