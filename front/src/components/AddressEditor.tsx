import { useEffect, useState, useRef } from "react"
import MapSelectorController from "../components/MapSelectorController"
import BottomSheet from "../components/BottomSheet"
import { useAddress } from "../hook/useAddress"
import { MapPinIcon, TruckIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"

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
  const [citySelected, setCitySelected] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const resetEditorState = () => {
    setEditingPickup(false)
    setCitySelected(false)
    setPreviewMode(false)
  }

  const handleAddressSave = async () => {
    const ok = await saveAddress()
    if (ok) {
      onClose()
      resetEditorState()
    }
  }

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

  const handleCitySelect = (suggested: SuggestedCity) => {
    const name = `${suggested.city}, ${suggested.region}`
    setFormData((prev) => ({
      ...prev,
      city: name,
      city_code: suggested.code,
    }))
    setCityQuery(name)
    setCitySelected(true)
    setPickupPoints([])
    setSelectedPoint(null)
    setMapCenter(undefined)
    setEditingPickup(true) 
  }

  const deliveryType = formData.deliveryType ?? "pickup"

  return (
    <BottomSheet
      title="Адрес доставки"
      open={open}
      onClose={() => {
        onClose()
        resetEditorState()
      }}
    >
      <div className="space-y-6">
        {/* Способ доставки - стилизованные кнопки */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Способ доставки
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["pickup", "address"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  if (type === "address") {
                    setFormData((prev) => ({
                      ...prev,
                      pickupCode: "",
                      pickupAddress: "",
                    }))
                    setSelectedPoint(null)
                  }
                  setFormData({ ...formData, deliveryType: type })
                }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                  deliveryType === type
                    ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8"
                }`}
              >
                {type === "pickup" ? (
                  <BuildingStorefrontIcon className="w-6 h-6" />
                ) : (
                  <TruckIcon className="w-6 h-6" />
                )}
                <span className="text-xs font-medium text-center leading-tight">
                  {type === "pickup" ? "Пункт выдачи" : "Курьером"}
                </span>
                {deliveryType === type && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Город */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Город
          </label>
          <div className="relative">
            <input
              value={cityQuery}
              onChange={(e) => {
                const val = e.target.value
                setCityQuery(val)
                if (!val.startsWith(formData.city || "")) {
                  setFormData((prev) => ({ ...prev, city_code: "", pickupCode: "", pickupAddress: "" }))
                  setCitySelected(false)
                }
              }}
              onBlur={() => setCityTouched(true)}
              placeholder="Начни вводить город..."
              className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none transition-all duration-200 ${
                cityTouched && !formData.city_code 
                  ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" 
                  : "border-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/10"
              }`}
            />
            <MapPinIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          </div>
          
          {cityTouched && !formData.city_code && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <span>⚠️</span>
              Пожалуйста, выбери город из выпадающего списка
            </div>
          )}
          
          {suggestedCities.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              {suggestedCities.map((item, idx) => (
                <button
                  key={item.code}
                  onClick={() => {
                    handleCitySelect(item)
                    setSuggestedCities([])
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition text-white flex items-center gap-3 ${
                    idx !== suggestedCities.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <MapPinIcon className="w-4 h-4 text-white/40 shrink-0" />
                  <span>{item.city}, {item.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Показ текущего ПВЗ */}
        {formData.pickupAddress && !selectedPoint && deliveryType === "pickup" && !editingPickup && (
          <div className="relative p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <BuildingStorefrontIcon className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/40 mb-1">Выбранный пункт выдачи</div>
                <div className="text-sm text-white leading-relaxed">{formData.pickupAddress}</div>
              </div>
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
              className="absolute top-3 right-3 text-xs text-sky-400 hover:text-sky-300 transition font-medium"
            >
              Изменить
            </button>
          </div>
        )}

        {/* Карта */}
        {editingPickup && citySelected && formData.city_code && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Выбери пункт выдачи на карте
            </label>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <MapSelectorController
                cityCode={formData.city_code}
                pickupPoints={pickupPoints}
                selectedPoint={selectedPoint}
                onPointSelect={(point) => {
                  setSelectedPoint(point)
                  const found = pickupPoints.find(p => p.code === point.code)
                  if (found) {
                    setFormData(prev => ({
                      ...prev,
                      pickupCode: found.code,
                      pickupAddress: found.location.address
                    }))
                    setPreviewMode(true)
                  }
                }}
                setMapCenter={setMapCenter}
                mapCenter={mapCenter}
                editing={editingPickup}
              />
            </div>
          </div>
        )}

        {/* Превью выбранного ПВЗ */}
        {previewMode && selectedPoint && deliveryType === "pickup" && (
          <div className="relative p-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <BuildingStorefrontIcon className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-sky-300/70 mb-1">Выбранный пункт выдачи</div>
                <div className="text-sm text-white leading-relaxed">{formData.pickupAddress}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingPickup(false)
                setPreviewMode(false)
              }}
              className="absolute top-3 right-3 px-3 py-1 text-xs bg-sky-500/20 text-sky-300 rounded-full font-medium hover:bg-sky-500/30 transition"
            >
              Подтвердить
            </button>
          </div>
        )}

        {/* Адрес для курьерской доставки */}
        {deliveryType === "address" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Улица, дом
            </label>
            <div className="relative">
              <input
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
                placeholder="Например, ул. Ленина, 15"
              />
              <TruckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            </div>
            
            {streetSuggestions.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                {streetSuggestions.map((street, i) => (
                  <button
                    key={i}
                    onClick={() => setFormData((prev) => ({ ...prev, street }))}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition text-white ${
                      i !== streetSuggestions.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    {street}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Имя */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Имя получателя
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
            placeholder="Как к вам обращаться?"
          />
        </div>

        {/* Телефон */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Телефон
          </label>
          <input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
            placeholder="+7 (999) 123-45-67"
            type="tel"
          />
        </div>

        {/* Кнопка сохранения */}
        <button
          onClick={handleAddressSave}
          disabled={
            loading ||
            !formData.city_code ||
            (deliveryType === "pickup" && !formData.pickupCode) ||
            (deliveryType === "address" && !formData.street.trim()) ||
            !formData.name.trim() ||
            !formData.phone.trim()
          }
          className={`w-full rounded-2xl text-white text-sm font-semibold py-4 transition-all duration-300 ${
            formData.city_code &&
            (deliveryType !== "pickup" || formData.pickupCode) &&
            formData.name.trim() &&
            formData.phone.trim()
              ? "bg-white/10 hover:bg-white/15 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сохраняем...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>💾</span>
              Сохранить адрес доставки
            </div>
          )}
        </button>
      </div>
    </BottomSheet>
  )
}