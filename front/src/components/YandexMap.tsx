import { useEffect, useRef, useState } from "react"
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
  points: {
    coords: [number, number]
    label: string
    code: string
  }[]
  onSelect: (point: { label: string; code: string }) => void
  onMapCenterChange?: (coords: [number, number]) => void
}

export default function YandexMap({
  initialCenter,
  points,
  onSelect,
  onMapCenterChange,
}: Props) {
  const mapRef = useRef<YMap | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [selectedCode, setSelectedCode] = useState<string>("")

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(initialCenter, 13, {
        duration: 300,
      })
    }
  }, [initialCenter])

  const handlePlacemarkClick = (point: Point) => {
    setSelectedAddress(point.label)
    setSelectedCode(point.code)
    onSelect(point)

    if (mapRef.current) {
      const coords = point.coords
      mapRef.current.setCenter(coords, 15, { duration: 300 })
      onMapCenterChange?.(coords)
    }
  }

  return (
    <div className="relative aspect-[4/3] w-full">
      <YMaps query={{ apikey: "e72cd4cd-5a96-48f0-bf1c-20be54500cf7" }}>
        <Map
          instanceRef={(ref) => (mapRef.current = ref)}
          defaultState={{
            center: initialCenter,
            zoom: 13,
          }}
          style={{ width: '100%', height: '100%' }}
          options={{
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true,
            // Отключаем контролы карты для чистого вида
            controls: [],
          }}
        >
          <Clusterer
            options={{
              preset: "islands#invertedBlueClusterIcons",
              groupByCoordinates: false,
              clusterDisableClickZoom: false,
              clusterOpenBalloonOnClick: false,
              clusterBalloonPanelMaxMapArea: 0,
              clusterBalloonContentLayoutWidth: 300,
              clusterBalloonContentLayoutHeight: 200,
              clusterBalloonPagerSize: 5,
            }}
          >
            {points.map((p) => (
              <Placemark
                key={p.code}
                geometry={p.coords}
                properties={{
                  // Полностью пустые свойства - никакой информации на карте
                }}
                options={{
                  preset: selectedCode === p.code ? 'islands#redDotIcon' : 'islands#blueDotIcon',
                  iconColor: selectedCode === p.code ? '#0ea5e9' : '#3b82f6',
                  hideIconOnBalloonOpen: true,
                  // Отключаем все всплывающие элементы
                  openBalloonOnClick: false,
                  openHintOnHover: false,
                  hasBalloon: false,
                  hasHint: false,
                }}
                onClick={() => {
                  handlePlacemarkClick(p)
                  onSelect?.({ code: p.code, label: p.label })
                }}
                modules={[]} // Убираем модули балуна и хинта
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
      
      {/* Убираем панель снизу - информация будет только в AddressEditor */}
    </div>
  )
}