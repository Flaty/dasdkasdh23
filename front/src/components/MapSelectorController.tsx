// MapSelectorController.tsx
import { Suspense, lazy } from "react";
import MapSkeleton from "./MapSkeleton";
import { motion } from "framer-motion";

const LazyYandexMap = lazy(() => import("./YandexMap"));

interface Point {
  code: string;
  label: string; // В AddressEditor это address
}

interface PickupPoint {
  code: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface Props {
  cityCode: string;
  pickupPoints: PickupPoint[];
  selectedPoint: Point | null;
  onPointSelect: (point: { code: string, address: string }) => void; // ✅ Уточняем тип
  mapCenter?: [number, number];
  onMapCenterChange?: (coords: [number, number]) => void;
}

export default function MapSelectorController({
  cityCode, pickupPoints, selectedPoint, onPointSelect, mapCenter, onMapCenterChange
}: Props) {
  if (!cityCode || !pickupPoints.length) {
    // Показываем скелетон, пока ПВЗ грузятся
    return <MapSkeleton />;
  }

  const center = mapCenter || [pickupPoints[0].location.latitude, pickupPoints[0].location.longitude];

  const mapPoints = pickupPoints.map((p) => ({
    coords: [p.location.latitude, p.location.longitude] as [number, number],
    label: p.location.address,
    code: p.code,
  }));

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}>
      <Suspense fallback={<MapSkeleton />}>
        <LazyYandexMap
          initialCenter={center}
          points={mapPoints}
          onSelect={onPointSelect} // Просто прокидываем дальше
          onMapCenterChange={onMapCenterChange}
          selectedCode={selectedPoint?.code || null} // ✅ Передаем код выбранной точки
        />
      </Suspense>
    </motion.div>
  );
}