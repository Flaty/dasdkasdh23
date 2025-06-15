// src/components/MapSelectorController.tsx - ОКОНЧАТЕЛЬНО ИСПРАВЛЕННАЯ ВЕРСИЯ

import { Suspense, lazy, useMemo } from "react";
import MapSkeleton from "./MapSkeleton";

const LazyYandexMap = lazy(() => import("./YandexMap"));

interface PickupPoint {
  code: string;
  location: { latitude: number; longitude: number; address: string; };
}

// ✅ ВОЗВРАЩАЕМ ПРАВИЛЬНЫЙ ИНТЕРФЕЙС
interface Props {
  cityCode: number;
  pickupPoints: PickupPoint[];
  selectedCode: string | null;
  // ✅ ВОТ ОН, ВЕРНУЛСЯ НА МЕСТО
  onSelect: (point: { code: string; address: string; coords: [number, number] }) => void;
}

export default function MapSelectorController({
  cityCode, pickupPoints, selectedCode, onSelect
}: Props) {

  // Проверяем, что cityCode - это валидное число больше нуля
  if (!cityCode || !pickupPoints?.length) {
    return <MapSkeleton />;
  }

  const mapPoints = useMemo(() => {
    return pickupPoints.map((p) => ({
      coords: [p.location.latitude, p.location.longitude] as [number, number],
      label: p.location.address,
      code: p.code,
    }));
  }, [pickupPoints]);

  return (
    <Suspense fallback={<MapSkeleton />}>
      <LazyYandexMap
        points={mapPoints}
        // ✅ Передаем onSelect дальше в YandexMap
        onSelect={onSelect}
        selectedCode={selectedCode}
      />
    </Suspense>
  );
}