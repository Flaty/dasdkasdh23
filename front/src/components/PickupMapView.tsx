import { useEffect, Suspense, useMemo, useRef } from "react"
import MapSkeleton from "./MapSkeleton"
import { lazy } from "react"
import { motion } from "framer-motion"

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

type Props = {
  cityCode: string
  pickupPoints: PickupPoint[]
  selectedPoint: Point | null
  setSelectedPoint: (point: Point | null) => void
  setMapCenter: (center: [number, number]) => void
  mapCenter: [number, number] | undefined
  editing: boolean
}

export default function PickupMapView({
  editing,
  cityCode,
  pickupPoints,
  selectedPoint,
  setSelectedPoint,
  setMapCenter,
  mapCenter,
}: Props) {
  const hasCentered = useRef(false)

  const pickupMapPoints = useMemo(() => {
    return pickupPoints.map((p) => ({
      coords: [p.location.latitude, p.location.longitude] as [number, number],
      label: p.location.address,
      code: p.code,
    }))
  }, [pickupPoints])

  useEffect(() => {
    if (pickupPoints.length > 0 && !hasCentered.current) {
      const first = pickupPoints[0].location
      setMapCenter([first.latitude, first.longitude])
      hasCentered.current = true
    }
  }, [pickupPoints, setMapCenter])

  if (!editing || !cityCode || !pickupPoints.length || !mapCenter) return null

  return (
    <Suspense fallback={<MapSkeleton />}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <LazyYandexMap
          initialCenter={mapCenter}
          points={pickupMapPoints}
          onSelect={(point) => {
            setSelectedPoint(point)
            const selected = pickupPoints.find((p) => p.code === point.code)
            if (selected) {
              setMapCenter([
                selected.location.latitude,
                selected.location.longitude,
              ])
            }
          }}
        />
      </motion.div>
    </Suspense>
  )
}
