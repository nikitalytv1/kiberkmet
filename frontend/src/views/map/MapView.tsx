import { useState, useEffect, useCallback } from 'react';
import { Polygon, Polyline, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import styles from './map.module.css';
import { Point, DrawnPolygon, MARIBOR_CENTER, COLORS } from './types';
import { saveParcela, getParcele, updateParcela, deleteParcela } from '../../api/parcele';
import { CoordinatesDisplay }   from './components/CoordinatesDisplay';
import { ColorPickerPanel }     from './components/ColorPickerPanel';
import { MapToolbar }           from './components/MapToolbar';
import { MapInteraction }       from './components/MapInteraction';
import { DrawHandler }          from './components/DrawHandler';
import { NamePolygonModal }     from './components/NamePolygonModal';
import { DeleteConfirmModal }   from './components/DeleteConfirmModal';
import { ParcelsSidebar }       from './components/ParcelsSidebar';
import { MapFlyTo }             from './components/MapFlyTo';

function MapView() {
  const [activeTool, setActiveTool]       = useState('move');
  const [choosingColor, setChoosingColor] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [drawing, setDrawing]             = useState<Point[]>([]);
  const [mousePos, setMousePos]           = useState<Point | null>(null);
  const [polygons, setPolygons]           = useState<DrawnPolygon[]>([]);
  const [snapPoint, setSnapPoint]         = useState<Point | null>(null);
  const [pendingPolygon, setPendingPolygon] = useState<{ pts: Point[]; color: string } | null>(null);
  const [hoveredIdx, setHoveredIdx]       = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<number | null>(null);
  const [selectedId, setSelectedId]       = useState<string | null>(null);

  const handleColorChange = useCallback((id: string, color: string) => {
    const previous = polygons.find(p => p.id === id)?.color;
    setPolygons(prev => prev.map(p => p.id === id ? { ...p, color } : p));

    updateParcela(id, { color }).catch(err => {
      console.error('Napaka pri posodabljanju barve:', err);

      if (previous) {
        setPolygons(prev => prev.map(p => p.id === id ? { ...p, color: previous } : p));
      }
    });
  }, [polygons]);

  useEffect(() => {
    getParcele().then(parcele => {
      setPolygons(parcele.map(p => ({ id: p.id, pts: p.pts, color: p.color ?? COLORS[0], name: p.name })));
    }).catch(err => console.error('Napaka pri nalaganju parcel:', err));
  }, []);

  const drawingEnabled = activeTool === 'draw' && !choosingColor && !pendingPolygon;

  const handleToolClick = useCallback((id: string) => {
    if (id === 'draw') {
      setChoosingColor(true);
      setDrawing([]);
      setMousePos(null);
    } else {
      setActiveTool(id);
      setChoosingColor(false);
      setDrawing([]);
      setMousePos(null);
    }
  }, []);

  const handleColorPick = useCallback((c: string) => {
    setSelectedColor(c);
    setChoosingColor(false);
    setActiveTool('draw');
  }, []);

  const handleCancel = useCallback(() => {
    setChoosingColor(false);
    setDrawing([]);
    setMousePos(null);
    setActiveTool('move');
  }, []);

  const handleFinish = useCallback((pts: Point[]) => {
    if (pts.length >= 3) {
      setDrawing([]);
      setMousePos(null);
      setPendingPolygon({ pts, color: selectedColor });
    } else {
      setDrawing([]);
      setMousePos(null);
      setActiveTool('move');
    }
  }, [selectedColor]);

  const handleNameConfirm = useCallback((name: string) => {
    if (!pendingPolygon) return;
    const { pts, color } = pendingPolygon;
    const tempId = crypto.randomUUID();
    setPolygons(prev => [...prev, { id: tempId, pts, color, name }]);
    setPendingPolygon(null);
    setActiveTool('move');
    saveParcela(name, color, pts)
      .then(saved => {
        setPolygons(prev => prev.map(p => p.id === tempId ? { ...p, id: saved.id } : p));
      })
      .catch(err => {
        console.error('Napaka pri shranjevanju parcele:', err);
        setPolygons(prev => prev.filter(p => p.id !== tempId));
      });
  }, [pendingPolygon]);

  const handleNameCancel = useCallback(() => {
    setPendingPolygon(null);
    setActiveTool('move');
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget === null) return;
    const pg = polygons[deleteTarget];
    setPolygons(prev => prev.filter((_, i) => i !== deleteTarget));
    setDeleteTarget(null);
    if (pg.id) {
      deleteParcela(pg.id).catch(err => {
        console.error('Napaka pri brisanju:', err);
        setPolygons(prev => {
          const next = [...prev];
          next.splice(deleteTarget, 0, pg);
          return next;
        });
      });
    }
  }, [deleteTarget, polygons]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
    setHoveredIdx(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter' && drawingEnabled && drawing.length >= 3) handleFinish(drawing);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCancel, handleFinish, drawing, drawingEnabled]);

  const previewLine: Point[] = drawing.length > 0 && mousePos ? [...drawing, mousePos] : [];
  const closingLine: Point[] = drawing.length >= 2 && mousePos ? [mousePos, drawing[0]] : [];

  return (
    <div className={styles.wrapper}>
      <ParcelsSidebar
        parcels={polygons}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onColorChange={handleColorChange}
      />

      <MapContainer
        center={MARIBOR_CENTER}
        zoom={15}
        zoomControl={false}
        doubleClickZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        <CoordinatesDisplay />
        <MapInteraction active={activeTool === 'move'} />
        <MapFlyTo selectedId={selectedId} polygons={polygons} />

        <div className={styles.toolbarGroup}>
          {choosingColor && (
            <ColorPickerPanel
              selectedColor={selectedColor}
              onPick={handleColorPick}
              onCancel={handleCancel}
            />
          )}
          <MapToolbar
            activeTool={activeTool}
            choosingColor={choosingColor}
            selectedColor={selectedColor}
            onToolClick={handleToolClick}
          />
        </div>

        <DrawHandler
          enabled={drawingEnabled}
          drawing={drawing}
          polygons={polygons}
          onAddPoint={p => setDrawing(prev => [...prev, p])}
          onFinish={handleFinish}
          onMouseMove={setMousePos}
          onSnapChange={setSnapPoint}
        />

        {polygons.map((pg, i) => {
          const hovered = activeTool === 'delete' && hoveredIdx === i;
          return (
            <Polygon
              key={i}
              positions={pg.pts}
              pathOptions={{
                color:       hovered ? '#dc2626' : pg.color,
                fillColor:   hovered ? '#dc2626' : pg.color,
                fillOpacity: hovered ? 0.4 : 0.15,
                weight:      hovered ? 3 : 2,
              }}
              eventHandlers={activeTool === 'delete' ? {
                mouseover: () => setHoveredIdx(i),
                mouseout:  () => setHoveredIdx(null),
                click:     () => setDeleteTarget(i),
              } : {}}
            >
              <Tooltip permanent direction="center" className="polygon-label">
                {pg.name}
              </Tooltip>
            </Polygon>
          );
        })}

        {drawing.length >= 3 && (
          <Polygon positions={drawing}
            pathOptions={{ color: selectedColor, fillColor: selectedColor, fillOpacity: 0.1, weight: 2, dashArray: '6 4' }} />
        )}

        {previewLine.length >= 2 && (
          <Polyline positions={previewLine}
            pathOptions={{ color: selectedColor, weight: 2, dashArray: '6 4', opacity: 0.7 }} />
        )}

        {closingLine.length === 2 && (
          <Polyline positions={closingLine}
            pathOptions={{ color: selectedColor, weight: 1.5, dashArray: '4 6', opacity: 0.4 }} />
        )}

        {drawing.map((pt, i) => {
          const isSnapped = snapPoint !== null && snapPoint[0] === pt[0] && snapPoint[1] === pt[1];
          return (
            <CircleMarker key={i} center={pt}
              radius={isSnapped ? 10 : (i === 0 ? 6 : 4)}
              pathOptions={{
                color: isSnapped ? '#ffffff' : selectedColor,
                fillColor: selectedColor,
                fillOpacity: 1,
                weight: isSnapped ? 3 : 2,
              }} />
          );
        })}

        {snapPoint && !drawing.some(pt => pt[0] === snapPoint[0] && pt[1] === snapPoint[1]) && (
          <CircleMarker center={snapPoint} radius={10}
            pathOptions={{ color: '#ffffff', fillColor: selectedColor, fillOpacity: 1, weight: 3 }} />
        )}
      </MapContainer>

      {pendingPolygon && (
        <NamePolygonModal
          color={pendingPolygon.color}
          onConfirm={handleNameConfirm}
          onCancel={handleNameCancel}
        />
      )}

      {deleteTarget !== null && (
        <DeleteConfirmModal
          name={polygons[deleteTarget]?.name ?? ''}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {drawingEnabled && (
        <div className={styles.drawHint}>
          {drawing.length === 0 && 'Klikni na karto za začetek risanja'}
          {drawing.length === 1 && 'Dodaj še vsaj 2 točki'}
          {drawing.length === 2 && 'Dodaj še vsaj 1 točko'}
          {drawing.length >= 3 && (
            <>
              <span>Dvoklik · Enter · klik na 1. točko za zaključek</span>
              <span className={styles.drawHintSep}>·</span>
              <span>Esc za preklic</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MapView;
