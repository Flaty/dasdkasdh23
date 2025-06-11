// YandexMap.tsx

import { useEffect, useRef, useState } from "react";
import { YMaps, Map, Placemark, Clusterer, type YMap } from "@pbe/react-yandex-maps";

interface Point {
  code: string;
  coords: [number, number];
  label: string;
}

// ✅ Убедимся, что пропс onSelect ожидает поле address
interface Props {
  initialCenter: [number, number];
  points: Point[];
  onSelect: (point: { code: string; address: string }) => void;
  onMapCenterChange?: (coords: [number, number]) => void;
  selectedCode: string | null;
}

export default function YandexMap({ initialCenter, points, onSelect, onMapCenterChange, selectedCode }: Props) {
  const mapRef = useRef<YMap | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(initialCenter, 13, { duration: 300 });
    }
  }, [initialCenter]);

  // ✅ Эта функция теперь не нужна, логика перенесена в onClick
  // const handlePlacemarkClick = ...

  return (
    <div className="relative aspect-[4/3] w-full">
      <YMaps query={{ apikey: "e72cd4cd-5a96-48f0-bf1c-20be54500cf7" }}>
        <Map instanceRef={(ref) => (mapRef.current = ref)} defaultState={{ center: initialCenter, zoom: 13 }}
          style={{ width: '100%', height: '100%' }}
          options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true, controls: [] }}>
          <Clusterer options={{ preset: "islands#invertedBlueClusterIcons", groupByCoordinates: false }}>
            {points.map((p) => (
              <Placemark
                key={p.code}
                geometry={p.coords}
                options={{
                  preset: selectedCode === p.code ? 'islands#redDotIcon' : 'islands#blueDotIcon',
                  iconColor: selectedCode === p.code ? '#0ea5e9' : '#3b82f6',
                }}
                onClick={() => {
                  // ✅ Упрощенная и исправленная логика
                  onSelect({ code: p.code, address: p.label }); // Отправляем address, а не label
                  onMapCenterChange?.(p.coords);
                  if (mapRef.current) {
                    mapRef.current.setCenter(p.coords, 15, { duration: 300 });
                  }
                }}
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
}