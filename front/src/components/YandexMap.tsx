import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps"

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
  return (
    <YMaps query={{ apikey: "e72cd4cd-5a96-48f0-bf1c-20be54500cf7" }}>
      <Map
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
        {points.map((p) => (
          <Placemark
            key={p.code}
            geometry={p.coords}
            properties={{ balloonContent: p.label }}
            onClick={() => onSelect(p)}
          />
        ))}
      </Map>
    </YMaps>
  )
}
