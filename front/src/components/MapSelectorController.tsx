// components/MapSelectorController.tsx
import PickupMapView from "./PickupMapView"

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

type Props = {
  cityCode: string
  pickupPoints: PickupPoint[]
  selectedPoint: Point | null
  setSelectedPoint: (point: Point | null) => void
  setMapCenter: (center: [number, number]) => void
  mapCenter: [number, number] | undefined
  editing: boolean
}

export default function MapSelectorController({
  cityCode,
  pickupPoints,
  selectedPoint,
  setSelectedPoint,
  setMapCenter,
  mapCenter,
  editing,
}: Props) {
  return (
    <PickupMapView
      editing={editing}
      cityCode={cityCode}
      pickupPoints={pickupPoints}
      selectedPoint={selectedPoint}
      setSelectedPoint={setSelectedPoint}
      setMapCenter={setMapCenter}
      mapCenter={mapCenter}
    />
  )
}
