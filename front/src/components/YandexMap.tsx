// src/components/YandexMap.tsx
import { useEffect, useRef } from "react";
import { YMaps, Map, Placemark, Clusterer, type YMap } from "@pbe/react-yandex-maps";

interface Point {
  code: string;
  coords: [number, number];
  label: string;
}

interface Props {
  points: Point[];
  onSelect: (point: { code: string; address: string; coords: [number, number] }) => void;
  selectedCode: string | null;
}

export default function YandexMap({ points, onSelect, selectedCode }: Props) {
  const mapRef = useRef<YMap | null>(null);

  useEffect(() => {
    if (mapRef.current && points.length > 0) {
      mapRef.current.setBounds(points.map(p => p.coords), {
        checkZoomRange: true,
        duration: 500,
        zoomMargin: 40,
      });
    }
  }, [points]); 

  useEffect(() => {
    if (!mapRef.current) return;
    const selectedPoint = points.find(p => p.code === selectedCode);
    if (selectedPoint) {
      mapRef.current.setCenter(selectedPoint.coords, 15, {
        duration: 500,
        checkZoomRange: true,
      });
    }
  }, [selectedCode]);

  return (
    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white/5">
      <YMaps query={{ apikey: "e72cd4cd-5a96-48f0-bf1c-20be54500cf7" }}>
        <Map
          instanceRef={ (ref) => { mapRef.current = ref } }
          defaultState={{ center: [55.75, 37.57], zoom: 10 }}
          style={{ width: '100%', height: '100%' }}
          options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true, controls: [] }}
          modules={["control.ZoomControl", "control.FullscreenControl", "geoObject.addon.balloon"]}
        >
          <Clusterer
            options={{ preset: "islands#invertedBlueClusterIcons", groupByCoordinates: false, gridSize: 128 }}
          >
            {points.map((p) => (
              <Placemark
                key={p.code}
                geometry={p.coords}
                options={{
                  preset: selectedCode === p.code ? 'islands#redDotIcon' : 'islands#blueDotIcon',
                  iconColor: selectedCode === p.code ? '#ef4444' : '#3b82f6',
                }}
                onClick={() => { onSelect({ code: p.code, address: p.label, coords: p.coords }); }}
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
}