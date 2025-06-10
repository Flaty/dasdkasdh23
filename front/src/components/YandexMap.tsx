import { useEffect, useRef } from "react"
import {
  YMaps,
  Map,
  Placemark,
  Clusterer,
  type YMap
} from "@pbe/react-yandex-maps"

interface Point {
  code: string
  coords: [number, number]
  label: string
}

interface Props {
  initialCenter: [number, number]
  points: Point[]
  onSelect: (point: Point) => void
}

export default function YandexMap({ initialCenter, points, onSelect }: Props) {
  const mapRef = useRef<YMap | null>(null)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(initialCenter, 13, {
        duration: 300,
      })
    }
  }, [initialCenter])

  return (
    <YMaps query={{ apikey: "e72cd4cd-5a96-48f0-bf1c-20be54500cf7" }}>
      <Map
        instanceRef={(ref) => (mapRef.current = ref)}
        defaultState={{
          center: initialCenter,
          zoom: 13,
        }}
        width="100%"
        height="300px"
        options={{
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true,
        }}
      >
        <Clusterer
          options={{
            preset: "islands#invertedBlueClusterIcons",
            groupByCoordinates: false,
            clusterDisableClickZoom: true,
          }}
        >
          {points.map((p) => (
            <Placemark
              key={p.code}
              geometry={p.coords}
              properties={{ balloonContent: p.label }}
              onClick={() => onSelect(p)}
            />
          ))}
        </Clusterer>
      </Map>
    </YMaps>
  )
}
