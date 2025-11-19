import React, { useEffect, useRef, useState } from 'react';
import { Beacon } from '../types';

interface Props {
  beacons: Beacon[];
  onSelect: (beaconId: string) => void;
  highlightedBeaconId?: string | null; // when set, map should center on & highlight this beacon
}

export const MallMap: React.FC<Props> = ({ beacons, onSelect, highlightedBeaconId = null }) => {
  // viewBox state to implement zoom & pan (viewBox: x y width height)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ beacon?: Beacon; x?: number; y?: number } | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedStore, setSelectedStore] = useState<Beacon | null>(null);

  // Keep floors available dynamically
  const floors = Array.from(new Set(beacons.map(b => b.floor ?? 1))).sort((a,b) => (a as number) - (b as number));

  // if highlightedBeaconId changes, center map to it and switch floor
  useEffect(() => {
    if (!highlightedBeaconId) return;
    const target = beacons.find(b => b.id === highlightedBeaconId);
    if (!target) return;
    if (typeof target.floor === 'number') setCurrentFloor(target.floor);

    // center viewBox around the beacon footprint center
    const centerX = (target.x ?? 10) + (target.w ?? 8) / 2;
    const centerY = (target.y ?? 10) + (target.h ?? 8) / 2;
    const newW = 40; // zoom in
    const newH = 40;
    let nx = Math.max(0, Math.min(centerX - newW / 2, 100 - newW));
    let ny = Math.max(0, Math.min(centerY - newH / 2, 100 - newH));
    setViewBox({ x: nx, y: ny, w: newW, h: newH });
    setTimeout(() => {
      // highlight briefly by setting selected store
      setSelectedStore(target);
    }, 50);
  }, [highlightedBeaconId, beacons]);

  const zoom = (factor: number) => {
    const { x, y, w, h } = viewBox;
    const newW = Math.max(20, Math.min(100, w * factor));
    const newH = Math.max(20, Math.min(100, h * factor));
    // keep center same
    const cx = x + w / 2;
    const cy = y + h / 2;
    let nx = Math.max(0, Math.min(cx - newW / 2, 100 - newW));
    let ny = Math.max(0, Math.min(cy - newH / 2, 100 - newH));
    setViewBox({ x: nx, y: ny, w: newW, h: newH });
  };

  const pan = (dx: number, dy: number) => {
    const { x, y, w, h } = viewBox;
    let nx = Math.max(0, Math.min(x + dx, 100 - w));
    let ny = Math.max(0, Math.min(y + dy, 100 - h));
    setViewBox({ x: nx, y: ny, w, h });
  };

  // click store rectangle => select/call parent onSelect
  const handleStoreClick = (b: Beacon) => {
    setSelectedStore(b);
    onSelect(b.id);
  };

  // tooltip positioning: convert beacon center to SVG screen coords
  const calcScreenPos = (evt: React.MouseEvent, b: Beacon) => {
    const svg = svgRef.current;
    if (!svg) return { sx: evt.clientX, sy: evt.clientY };
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return { sx: evt.clientX, sy: evt.clientY };
    const loc = pt.matrixTransform(screenCTM.inverse());
    return { sx: loc.x, sy: loc.y };
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Interactive Mall Map</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm mr-2">Floor</label>
          <select value={currentFloor} onChange={(e) => setCurrentFloor(Number(e.target.value))} className="p-1 border rounded">
            {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
          </select>

          <div className="ml-3 flex items-center space-x-1">
            <button onClick={() => zoom(0.7)} className="px-2 py-1 border rounded">Zoom In</button>
            <button onClick={() => zoom(1.4)} className="px-2 py-1 border rounded">Zoom Out</button>
          </div>

          <div className="ml-3 flex items-center space-x-1">
            <button onClick={() => pan(-8,0)} className="px-2 py-1 border rounded">◀</button>
            <button onClick={() => pan(8,0)} className="px-2 py-1 border rounded">▶</button>
            <button onClick={() => pan(0,-8)} className="px-2 py-1 border rounded">▲</button>
            <button onClick={() => pan(0,8)} className="px-2 py-1 border rounded">▼</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card p-3 rounded shadow">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          style={{ width: '100%', height: '560px', borderRadius: 8 }}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoverInfo(null)}
        >
          {/* background corridors */}
          <rect x="0" y="0" width="100" height="100" fill="transparent" />
          <rect x="0" y="0" width="100" height="100" fill="transparent" stroke="#e5e7eb" strokeWidth={0.2} />

          {/* draw stores for current floor */}
          {beacons.filter(b => (b.floor ?? 1) === currentFloor).map(b => {
            const x = b.x ?? 5;
            const y = b.y ?? 5;
            const w = b.w ?? 10;
            const h = b.h ?? 8;
            const isHighlighted = highlightedBeaconId === b.id || selectedStore?.id === b.id;
            return (
              <g key={b.id} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }}>
                <rect
                  x={0}
                  y={0}
                  width={w}
                  height={h}
                  rx={1}
                  ry={1}
                  fill={isHighlighted ? '#fff7ed' : '#f8fafc'}
                  stroke={isHighlighted ? '#f97316' : '#cbd5e1'}
                  strokeWidth={isHighlighted ? 0.8 : 0.5}
                  onMouseEnter={(e) => setHoverInfo({ beacon: b, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHoverInfo({ beacon: b, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoverInfo(null)}
                  onClick={() => handleStoreClick(b)}
                />
                <text x={2} y={4.5} fontSize={Math.max(2, Math.min(4, w / 6))} fill="#111" style={{ pointerEvents: 'none' }}>
                  {b.location.split(' - ')[0]}
                </text>

                {/* small badge with category */}
                <rect x={w - 8} y={0.8} width={7} height={2.8} rx={0.5} fill="#3b82f6" />
                <text x={w - 6.6} y={2.6} fontSize={1.5} fill="#fff" style={{ pointerEvents: 'none' }}>
                  {b.category[0]}
                </text>
              </g>
            );
          })}

          {/* highlight selected beacon boundary */}
          {selectedStore && (selectedStore.floor ?? 1) === currentFloor && (
            <g>
              <rect
                x={selectedStore.x! - 1}
                y={selectedStore.y! - 1}
                width={(selectedStore.w ?? 8) + 2}
                height={(selectedStore.h ?? 6) + 2}
                fill="none"
                stroke="#f97316"
                strokeWidth={0.6}
                strokeDasharray="1,0.6"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {hoverInfo && hoverInfo.beacon && (
        <div style={{ position: 'absolute', transform: `translate(${hoverInfo.x}px, ${hoverInfo.y}px)`, zIndex: 60, marginLeft: 12, marginTop: -24 }}>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow text-xs border">
            <div className="font-semibold">{hoverInfo.beacon.location}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">{hoverInfo.beacon.category} • Floor {hoverInfo.beacon.floor ?? 1}</div>
          </div>
        </div>
      )}

      {/* store info panel */}
      {selectedStore && (
        <div className="mt-3 bg-light-card dark:bg-dark-card p-3 rounded shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">{selectedStore.location}</h3>
              <p className="text-sm text-light-subtext dark:text-dark-subtext">{selectedStore.description}</p>
              <p className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Floor: {selectedStore.floor ?? 1}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { onSelect(selectedStore.id); }} className="px-3 py-1 bg-light-accent text-white rounded">Simulate Detection</button>
              <button onClick={() => setSelectedStore(null)} className="px-3 py-1 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-light-subtext dark:text-dark-subtext">Tip: Use floor selector, zoom, and pan to explore. Click a store to view details or "Simulate Detection".</div>
    </div>
  );
};
