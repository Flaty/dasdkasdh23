// components/MapSelectorController.tsx
import { Suspense, lazy } from "react"
import MapSkeleton from "./MapSkeleton"

const LazyYandexMap = lazy(() => import("./YandexMap"))

interface Point {
  code: string
  label: string
}

interface PickupPoint {
  code: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
}

interface Props {
  cityCode: string
  pickupPoints: PickupPoint[]
  selectedPoint: Point | null
  onPointSelect: (point: Point) => void
  mapCenter?: [number, number]
  onMapCenterChange?: (coords: [number, number]) => void // ✅ Добавлено
}

export default function MapSelectorController({
  cityCode,
  pickupPoints,
  selectedPoint,
  onPointSelect,
  mapCenter,
  onMapCenterChange, // ✅ Добавлено
}: Props) {
  if (!cityCode || !pickupPoints.length) return null

  const center = mapCenter || (pickupPoints[0] ? [
    pickupPoints[0].location.latitude,
    pickupPoints[0].location.longitude
  ] as [number, number] : [55.7558, 37.6173])

  const mapPoints = pickupPoints.map((p) => ({
    coords: [p.location.latitude, p.location.longitude] as [number, number],
    label: p.location.address,
    code: p.code,
  }))

  return (
    <Suspense fallback={<MapSkeleton />}>
      <LazyYandexMap
        initialCenter={center}
        points={mapPoints}
        onSelect={onPointSelect}
        onMapCenterChange={onMapCenterChange} // ✅ Проброс вниз
      />
    </Suspense>
  )
}
