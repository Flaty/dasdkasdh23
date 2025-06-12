// src/components/MapSelectorController.tsx
import { Suspense, lazy } from "react";
import MapSkeleton from "./MapSkeleton";

const LazyYandexMap = lazy(() => import("./YandexMap"));

interface Point {
  code: string;
  label: string;
}

interface PickupPoint {
  code: string;
  location: { latitude: number; longitude: number; address: string; };
}

interface Props {
  cityCode: string;
  pickupPoints: PickupPoint[];
  selectedPoint: Point | null;
  onPointSelect: (point: { code: string, address: string, coords: [number, number] }) => void; // ✅ Добавляем coords
  mapCenter: [number, number]; // ✅ Теперь это обязательный проп
}

export default function MapSelectorController({
  cityCode, pickupPoints, selectedPoint, onPointSelect, mapCenter
}: Props) {

  if (!cityCode || !pickupPoints.length) {
    return <MapSkeleton />;
  }

  const mapPoints = pickupPoints.map((p) => ({
    coords: [p.location.latitude, p.location.longitude] as [number, number],
    label: p.location.address,
    code: p.code,
  }));

  return (
    <Suspense fallback={<MapSkeleton />}>
      <LazyYandexMap
        initialCenter={mapCenter} // ✅ Передаем управляемый центр
        points={mapPoints}
        onSelect={(point) => {
          const selectedFullPoint = pickupPoints.find(p => p.code === point.code);
          if (selectedFullPoint) {
            // ✅ Прокидываем наверх не только код и адрес, но и координаты
            onPointSelect({
              ...point,
              coords: [selectedFullPoint.location.latitude, selectedFullPoint.location.longitude]
            });
          }
        }}
        selectedCode={selectedPoint?.code || null}
      />
    </Suspense>
  );
}