// src/components/YandexMap.tsx

import { useEffect, useRef } from "react";
import { YMaps, Map, Placemark, Clusterer, type YMap } from "@pbe/react-yandex-maps";

interface Point {
  code: string;
  coords: [number, number];
  label: string;
}

interface Props {
  initialCenter: [number, number];
  points: Point[];
  onSelect: (point: { code: string; address: string }) => void;
  selectedCode: string | null;
}

export default function YandexMap({ initialCenter, points, onSelect, selectedCode }: Props) {
  const mapRef = useRef<YMap | null>(null);

  // ✅ Этот useEffect будет плавно менять центр карты, когда initialCenter меняется
  useEffect(() => {
    if (mapRef.current) {
      // Увеличиваем zoom до 15 для более детального вида
      mapRef.current.setCenter(initialCenter, 15, { duration: 300 });
    }
  }, [initialCenter]);

  return (
    <div className="relative aspect-[4/3] w-full">
      <YMaps query={{ apikey: "e72cd4cd-5a96-48f0-bf1c-20be54500cf7" }}>
        {/* ✅ Увеличиваем начальный zoom */}
        <Map instanceRef={(ref) => (mapRef.current = ref)} defaultState={{ center: initialCenter, zoom: 14 }}
          style={{ width: '100%', height: '100%' }}
          options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true, controls: [] }}>
          <Clusterer options={{ preset: "islands#invertedBlueClusterIcons", groupByCoordinates: false }}>
            {points.map((p) => (
              <Placemark
                key={p.code}
                geometry={p.coords}
                options={{
                  preset: selectedCode === p.code ? 'islands#redDotIcon' : 'islands#blueDotIcon',
                  iconColor: selectedCode === p.code ? '#ef4444' : '#3b82f6', // Сделаем выбранный красным
                }}
                onClick={() => {
                  // ✅ Просто вызываем onSelect, логика центрирования уйдет в родитель
                  onSelect({ code: p.code, address: p.label });
                }}
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
}