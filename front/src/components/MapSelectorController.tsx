// src/components/MapSelectorController.tsx
import { Suspense, lazy, useMemo } from "react"; // ✅ Импортируем useMemo
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
  onPointSelect: (point: { code: string, address: string, coords: [number, number] }) => void;
}

export default function MapSelectorController({
  cityCode, pickupPoints, selectedPoint, onPointSelect
}: Props) {

  if (!cityCode || !pickupPoints?.length) {
    return <MapSkeleton />;
  }

  // 🔥🔥🔥 ГЛАВНЫЙ ФИКС ВСЕЙ НАШЕЙ ЭПОПЕИ 🔥🔥🔥
  // Мы мемоизируем массив `mapPoints`.
  // Он будет пересоздаваться ТОЛЬКО тогда, когда изменится `pickupPoints` (т.е. при смене города).
  // При всех остальных ре-рендерах (клик на метку) `useMemo` вернет старую версию массива.
  const mapPoints = useMemo(() => {
    return pickupPoints.map((p) => ({
      coords: [p.location.latitude, p.location.longitude] as [number, number],
      label: p.location.address,
      code: p.code,
    }));
  }, [pickupPoints]); // ✅ Зависимость - только исходные данные.

  return (
    <Suspense fallback={<MapSkeleton />}>
      <LazyYandexMap
        points={mapPoints} // Теперь сюда всегда приходит стабильный проп
        onSelect={onPointSelect}
        selectedCode={selectedPoint?.code || null}
      />
    </Suspense>
  );
}