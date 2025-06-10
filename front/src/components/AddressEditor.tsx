import { useEffect, useState, useRef } from "react"
import MapSelectorController from "../components/MapSelectorController"
import BottomSheet from "../components/BottomSheet"
import { useAddress } from "../hook/useAddress"

interface Point {
  code: string
  label: string
}

interface SuggestedCity {
  city: string
  region: string
  code: string
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
  userId: string
  open: boolean
  onClose: () => void
}

export default function AddressEditor({ userId, open, onClose }: Props) {
  const {
    address: formData,
    setAddress: setFormData,
    saveAddress,
    loading,
  } = useAddress(userId)

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>()
  const [editingPickup, setEditingPickup] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [suggestedCities, setSuggestedCities] = useState<SuggestedCity[]>([])
  const [cityTouched, setCityTouched] = useState(false)
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([])
  const [citySelected, setCitySelected] = useState(false) // ✅ новое
  const mapShouldRender = useRef(false)
  const initialMapCentered = useRef(false)

  useEffect(() => {
    if (formData.city) {
      setCityQuery(formData.city)
    }
  }, [formData.city])

  useEffect(() => {
    if (!cityQuery || formData.city_code) return

    const timeout = setTimeout(() => {
      fetch(`/api/cdek/cities?city=${encodeURIComponent(cityQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestedCities(data || [])
        })
        .catch(() => setSuggestedCities([]))
    }, 300)

    return () => clearTimeout(timeout)
  }, [cityQuery])

  useEffect(() => {
    if (!formData.city || formData.city_code) return

    const timeout = setTimeout(() => {
      fetch(`/api/cdek/cities?city=${encodeURIComponent(formData.city.split(",")[0])}`)
        .then((res) => res.json())
        .then((data) => {
          const match = data.find(
            (item: SuggestedCity) =>
              `${item.city}, ${item.region}`.toLowerCase() === formData.city.toLowerCase()
          )
          if (match) {
            setFormData((prev) => ({
              ...prev,
              city_code: match.code.toString(),
            }))
          }
        })
    }, 300)

    return () => clearTimeout(timeout)
  }, [formData.city, formData.city_code])

  useEffect(() => {
    if (!formData.city_code || formData.deliveryType !== "pickup") return

    fetch(`/api/cdek/pvz?city_code=${formData.city_code}`)
      .then((res) => res.json())
      .then((data) => setPickupPoints(data || []))
      .catch(() => setPickupPoints([]))
  }, [formData.city_code, formData.deliveryType])

  useEffect(() => {
    if (pickupPoints.length > 0 && !initialMapCentered.current) {
      const first = pickupPoints[0].location
      setMapCenter([first.latitude, first.longitude])
      initialMapCentered.current = true
    }
  }, [pickupPoints])

  useEffect(() => {
    if (selectedPoint) {
      const full = pickupPoints.find((p) => p.code === selectedPoint.code)
      if (full) {
        setMapCenter([full.location.latitude, full.location.longitude])
        setFormData((prev) => ({
          ...prev,
          pickupCode: full.code,
          pickupAddress: full.location.address,
        }))
      }
    }
  }, [selectedPoint])

  useEffect(() => {
    const street = formData.street.trim()
    if (formData.deliveryType !== "address" || !formData.city_code || street.length < 2) {
      setStreetSuggestions([])
      return
    }

    const timeout = setTimeout(() => {
      fetch(`/api/cdek/streets?city_code=${formData.city_code}&street=${encodeURIComponent(street)}`)
        .then((res) => res.json())
        .then((data) => {
          setStreetSuggestions(data || [])
        })
        .catch(() => setStreetSuggestions([]))
    }, 300)

    return () => clearTimeout(timeout)
  }, [formData.street, formData.city_code, formData.deliveryType])

  const handleAddressSave = async () => {
    await saveAddress()
    setSelectedPoint(null)
    onClose()
    setEditingPickup(false)
    setCitySelected(false)
  }

  if (!open) return null

 const showMap =
  formData.deliveryType === "pickup" &&
  editingPickup &&
  formData.city_code &&
  citySelected


  return (
    <BottomSheet
      title="Адрес доставки"
      open={open}
      onClose={() => {
        onClose()
        setEditingPickup(false)
        setCitySelected(false)
      }}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["pickup", "address"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFormData({ ...formData, deliveryType: type })}
              className={`flex-1 py-2 rounded-full text-sm font-medium border transition ${
                formData.deliveryType === type
                  ? "bg-sky-500/20 border-sky-400/30 text-white"
                  : "bg-white/5 border-white/10 text-white/50"
              }`}
            >
              {type === "pickup" ? "Пункт выдачи (ПВЗ)" : "Курьером на адрес"}
            </button>
          ))}
        </div>

        {/* Город */}
        <div>
          <label className="text-sm text-white/70 block mb-1">Город</label>
          <input
            value={cityQuery}
            onChange={(e) => {
  const val = e.target.value
  setCityQuery(val)

  // Только если реально ввели новый текст, а не дописали лишнее
  if (!val.startsWith(formData.city || "")) {
    setFormData((prev) => ({ ...prev, city_code: "", pickupCode: "", pickupAddress: "" }))
    setCitySelected(false)
  }
}}
            onBlur={() => setCityTouched(true)}
            placeholder="Начни вводить город..."
            className={`w-full bg-white/5 text-white p-2 rounded-xl outline-none ${
              cityTouched && !formData.city_code ? "border border-red-500" : ""
            }`}
          />
          {cityTouched && !formData.city_code && (
            <div className="text-sm text-red-400 mt-1">
              Пожалуйста, выбери город из выпадающего списка
            </div>
          )}
          {suggestedCities.length > 0 && (
            <div className="mt-2 bg-white/10 border border-white/10 rounded-xl overflow-hidden">
              {suggestedCities.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      city: `${item.city}, ${item.region}`,
                      city_code: item.code.toString(),
                      pickupCode: "",
                      pickupAddress: "",
                    }))
                    initialMapCentered.current = false
                    setCityQuery(`${item.city}, ${item.region}`)
                    setSuggestedCities([])
                    setEditingPickup(true)
                    setCitySelected(true)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 transition text-white"
                >
                  {item.city}, {item.region}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Показ текущего ПВЗ */}
        {formData.pickupAddress && !selectedPoint && formData.deliveryType === "pickup" && !editingPickup && (
          <div className="flex justify-between items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <div>
              <div className="text-xs text-white/40 mb-0.5">Выбранный пункт выдачи</div>
              <div>{formData.pickupAddress}</div>
            </div>
            <button
              onClick={() => {
                if (!formData.city_code) {
                  alert("Пожалуйста, выбери город из списка")
                  return
                }
                setEditingPickup(true)
                setCitySelected(true) 
                setSelectedPoint(null)
              }}
              className="ml-4 text-xs text-sky-400 hover:underline"
            >
              Изменить
            </button>
          </div>
        )}

        {/* ПВЗ карта */}
        {showMap && (
        <MapSelectorController
        cityCode={formData.city_code}
        pickupPoints={pickupPoints} // 👈 ОБЯЗАТЕЛЬНО!
        selectedPoint={selectedPoint}
        setSelectedPoint={setSelectedPoint}
        setMapCenter={setMapCenter}
        mapCenter={mapCenter}
        editing={editingPickup}
        />

        )}

        {/* Улица */}
        {formData.deliveryType === "address" && (
          <div>
            <label className="text-sm text-white/70 block mb-1">Улица, дом</label>
            <input
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full bg-white/5 text-white p-2 rounded-xl outline-none"
              placeholder="Например, ул. Ленина, 15"
            />
            {streetSuggestions.length > 0 && (
              <div className="mt-1 bg-white/10 border border-white/10 rounded-xl overflow-hidden">
                {streetSuggestions.map((street, i) => (
                  <button
                    key={i}
                    onClick={() => setFormData((prev) => ({ ...prev, street }))}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 transition text-white"
                  >
                    {street}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Имя */}
        <div>
          <label className="text-sm text-white/70 block mb-1">Имя</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/5 text-white p-2 rounded-xl outline-none"
          />
        </div>

        {/* Телефон */}
        <div>
          <label className="text-sm text-white/70 block mb-1">Телефон</label>
          <input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-white/5 text-white p-2 rounded-xl outline-none"
          />
        </div>

        <button
          onClick={handleAddressSave}
          disabled={
            !formData.city_code ||
            (formData.deliveryType === "pickup" && !formData.pickupCode) ||
            (formData.deliveryType === "address" && !formData.street.trim())
          }
          className={`w-full rounded-full text-white text-sm font-medium py-2 transition border ${
            formData.city_code &&
            (formData.deliveryType !== "pickup" || formData.pickupCode)
              ? "bg-sky-500/20 hover:bg-sky-500/30 border-sky-400/30"
              : "bg-white/10 border-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          📎 Сохранить выбранный адрес
        </button>
      </div>
    </BottomSheet>
  )
}
