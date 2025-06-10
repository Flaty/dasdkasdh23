import { useEffect, useState, useRef } from "react"
import MapSelectorController from "../components/MapSelectorController"
import BottomSheet from "../components/BottomSheet"
import { useAddress } from "../hook/useAddress"
import { motion, AnimatePresence } from "framer-motion"

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
  userId: number
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

  // 🔁 1. Независимые состояния для city_code и pickupCode
  const [tempCityCode, setTempCityCode] = useState("")
  const [tempPickupCode, setTempPickupCode] = useState("")
  const [tempPickupAddress, setTempPickupAddress] = useState("")

  // 🧠 2. Режим предпросмотра
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<PickupPoint | null>(null)

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>()
  const [editingPickup, setEditingPickup] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [suggestedCities, setSuggestedCities] = useState<SuggestedCity[]>([])
  const [cityTouched, setCityTouched] = useState(false)
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([])
  const [citySelected, setCitySelected] = useState(false)

  // Инициализация временных значений из formData
  useEffect(() => {
    if (formData.city && formData.city_code) {
      setCityQuery(formData.city)
      setTempCityCode(formData.city_code)
      setCitySelected(true)
    }
    if (formData.pickupCode) {
      setTempPickupCode(formData.pickupCode)
      setTempPickupAddress(formData.pickupAddress || "")
    }
  }, [formData])

  // Поиск городов
  useEffect(() => {
    if (!cityQuery || tempCityCode) return

    const timeout = setTimeout(() => {
      fetch(`/api/cdek/cities?city=${encodeURIComponent(cityQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestedCities(data || [])
        })
        .catch(() => setSuggestedCities([]))
    }, 300)

    return () => clearTimeout(timeout)
  }, [cityQuery, tempCityCode])

  // Загрузка ПВЗ при изменении города
  useEffect(() => {
    if (!tempCityCode || formData.deliveryType !== "pickup") return

    fetch(`/api/cdek/pvz?city_code=${tempCityCode}`)
      .then((res) => res.json())
      .then((data) => {
        setPickupPoints(data || [])
        // Центрируем карту на первом ПВЗ
        if (data && data.length > 0) {
          const first = data[0].location
          setMapCenter([first.latitude, first.longitude])
        }
      })
      .catch(() => setPickupPoints([]))
  }, [tempCityCode, formData.deliveryType])

  const handleCitySelect = (suggested: SuggestedCity) => {
    const name = `${suggested.city}, ${suggested.region}`
    setFormData((prev) => ({ ...prev, city: name }))
    setCityQuery(name)
    setTempCityCode(suggested.code)
    setCitySelected(true)
    setEditingPickup(true)
    setPreviewMode(true)
    
    // Сбрасываем выбранный ПВЗ при смене города
    setSelectedPickup(null)
    setTempPickupCode("")
    setTempPickupAddress("")
    setSuggestedCities([])
  }

  const handlePickupSelect = (point: Point) => {
    const pickup = pickupPoints.find(p => p.code === point.code)
    if (pickup) {
      setSelectedPickup(pickup)
      setTempPickupCode(pickup.code)
      setTempPickupAddress(pickup.location.address)
      setMapCenter([pickup.location.latitude, pickup.location.longitude])
      
      // Вибрация при выборе (для мобильных)
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
    }
  }

  const handleAddressSave = async () => {
    // Сохраняем временные значения в formData
    const updatedData = {
      ...formData,
      city_code: tempCityCode,
      pickupCode: tempPickupCode,
      pickupAddress: tempPickupAddress
    }
    
    setFormData(updatedData)
    
    const success = await saveAddress()
    if (success) {
      onClose()
      setEditingPickup(false)
      setCitySelected(false)
      setPreviewMode(false)
    }
  }

  const isFormValid = () => {
    return tempCityCode && (
      formData.deliveryType !== "pickup" || tempPickupCode
    ) && (
      formData.deliveryType !== "address" || formData.street.trim()
    )
  }

  return (
    <BottomSheet
      title="Адрес доставки"
      open={open}
      onClose={() => {
        onClose()
        setEditingPickup(false)
        setCitySelected(false)
        setPreviewMode(false)
      }}
    >
      <div className="space-y-4">
        {/* Тип доставки */}
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
              
              if (!val.startsWith(formData.city || "")) {
                setTempCityCode("")
                setTempPickupCode("")
                setTempPickupAddress("")
                setCitySelected(false)
                setPreviewMode(false)
              }
            }}
            onBlur={() => setCityTouched(true)}
            placeholder="Начни вводить город..."
            className={`w-full bg-white/5 text-white p-2 rounded-xl outline-none ${
              cityTouched && !tempCityCode ? "border border-red-500" : ""
            }`}
          />
          {cityTouched && !tempCityCode && (
            <div className="text-sm text-red-400 mt-1">
              Пожалуйста, выбери город из выпадающего списка
            </div>
          )}
          
          {/* Подсказки городов */}
          <AnimatePresence>
            {suggestedCities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-white/10 border border-white/10 rounded-xl overflow-hidden"
              >
                {suggestedCities.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleCitySelect(item)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 transition text-white"
                  >
                    {item.city}, {item.region}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Превью выбранного ПВЗ */}
        <AnimatePresence>
          {tempPickupAddress && !editingPickup && formData.deliveryType === "pickup" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-between items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
            >
              <div>
                <div className="text-xs text-white/40 mb-0.5">Выбранный пункт выдачи</div>
                <div>{tempPickupAddress}</div>
              </div>
              <button
                onClick={() => {
                  if (!tempCityCode) {
                    alert("Пожалуйста, выбери город из списка")
                    return
                  }
                  setEditingPickup(true)
                  setPreviewMode(true)
                }}
                className="ml-4 text-xs text-sky-400 hover:underline"
              >
                Изменить
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Карта ПВЗ с анимацией */}
        <AnimatePresence>
          {editingPickup && citySelected && tempCityCode && formData.deliveryType === "pickup" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <MapSelectorController
                cityCode={tempCityCode}
                pickupPoints={pickupPoints}
                selectedPoint={selectedPickup ? { 
                  code: selectedPickup.code, 
                  label: selectedPickup.location.address 
                } : null}
                onPointSelect={handlePickupSelect}
                mapCenter={mapCenter}
              />
              
              {/* Показываем выбранный адрес под картой */}
              {tempPickupAddress && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-sky-500/10 border border-sky-400/20 rounded-xl px-4 py-3"
                >
                  <div className="text-xs text-sky-300/70 mb-1">Выбрано:</div>
                  <div className="text-sm text-white font-medium">{tempPickupAddress}</div>
                  <div className="text-xs text-white/50 mt-1">Нажмите "Сохранить" для подтверждения</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Улица для курьерской доставки */}
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

        {/* Кнопка сохранения */}
        <button
          onClick={handleAddressSave}
          disabled={!isFormValid()}
          className={`w-full rounded-full text-white text-sm font-medium py-2 transition border ${
            isFormValid()
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