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
  onMapCenterChange?: (coords: [number, number]) => void // ← вот это
}


export default function YandexMap({
  initialCenter,
  points,
  onSelect,
  onMapCenterChange, // ← ОБЯЗАТЕЛЬНО сюда
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

    // вызываем коллбек, если передан
    onMapCenterChange?.(coords)
  }
}


  return (
    <div className="relative">
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
      balloonContent: p.label,
      hintContent: p.label,
    }}
    options={{
      preset: selectedCode === p.code ? 'islands#blueDotIcon' : 'islands#blueCircleDotIcon',
      iconColor: selectedCode === p.code ? '#0ea5e9' : '#3b82f6',
      hideIconOnBalloonOpen: false,
      iconLayout: 'default#image',
      iconImageSize: selectedCode === p.code ? [40, 40] : [30, 30],
      iconImageOffset: selectedCode === p.code ? [-20, -20] : [-15, -15],
    }}
    onClick={() => {
      handlePlacemarkClick(p)
      onSelect?.({ code: p.code, label: p.label }) // ✅ передаём наружу выбранную точку
    }}
    modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
  />
))}

          </Clusterer>
        </Map>
      </YMaps>
      
      {/* Отображение выбранного адреса */}
      {selectedAddress && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white px-4 py-3 text-sm rounded-b-xl">
          <div className="text-xs text-white/60 mb-1">Выбранный пункт выдачи:</div>
          <div className="font-medium">{selectedAddress}</div>
        </div>
      )}
    </div>
  )
}