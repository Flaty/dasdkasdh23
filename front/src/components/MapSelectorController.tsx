// src/components/MapSelectorController.tsx
import { Suspense, lazy, useMemo } from "react";
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
  // ✅ ФИКС: Принимаем cityCode как число
  cityCode: number;
  pickupPoints: PickupPoint[];
  selectedPoint: Point | null;
  onPointSelect: (point: { code: string, address: string, coords: [number, number] }) => void;
}

export default function MapSelectorController({
  cityCode, pickupPoints, selectedPoint, onPointSelect
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
        onSelect={onPointSelect}
        selectedCode={selectedPoint?.code || null}
      />
    </Suspense>
  );
}