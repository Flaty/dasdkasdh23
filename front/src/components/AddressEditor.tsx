// src/components/AddressEditor.tsx

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { MapPinIcon, TruckIcon, BuildingStorefrontIcon, PencilIcon } from "@heroicons/react/24/outline";

import BottomSheet, { type BottomSheetHandle } from "./BottomSheet";
import MapSelectorController from "./MapSelectorController";
import { useAddress, type UserAddress } from "../hook/useAddress";
import { useCitySuggestions, usePickupPoints, type SuggestedCity } from "../hook/useCdek";
import SpinnerIcon from "./SpinnerIcon";

type EditorMode = 'idle' | 'editing';

const motionProps = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.2, ease: "easeInOut" },
};

export default function AddressEditor({ userId, open, onClose }: Props) {
  const { addressData, saveAddress, isSavingAddress, isLoadingAddress } = useAddress(userId);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<EditorMode>('idle');
  const [formData, setFormData] = useState<UserAddress>(addressData);
  const [cityQuery, setCityQuery] = useState(addressData.city);
  const [selectedPointCode, setSelectedPointCode] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();

  useEffect(() => {
    if (open) {
      setFormData(addressData);
      setCityQuery(addressData.city);
      setSelectedPointCode(addressData.pickupCode || null);
      setMapCenter(undefined);
      
      if (!addressData.city || (addressData.deliveryType === 'address' && !addressData.street) || (addressData.deliveryType === 'pickup' && !addressData.pickupCode)) {
        setMode('editing');
      } else {
        setMode('idle');
      }
    }
  }, [open, addressData]);
  
  const { data: suggestedCities } = useCitySuggestions(cityQuery);
  const { data: pickupPoints } = usePickupPoints(formData.city_code);

  useEffect(() => {
    if (pickupPoints && pickupPoints.length > 0 && !mapCenter) {
      const firstPoint = pickupPoints[0].location;
      setMapCenter([firstPoint.latitude, firstPoint.longitude]);
    }
  }, [pickupPoints, mapCenter]);

  const handleSave = async () => {
    const ok = await saveAddress(formData);
    if (ok) {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setMode('idle');
      sheetRef.current?.dismiss();
    }
  };

  const isSaveDisabled = useMemo(() => {
    if (isSavingAddress) return true;
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.city_code) return true;
    if (formData.deliveryType === 'pickup' && !formData.pickupCode) return true;
    if (formData.deliveryType === 'address' && !formData.street?.trim()) return true;
    return false;
  }, [formData, isSavingAddress]);
  
  const deliveryType = formData.deliveryType;

  const handleCitySelect = (city: SuggestedCity) => {
    setCityQuery(`${city.city}, ${city.region}`);
    setFormData(prev => ({
      ...prev,
      city: `${city.city}, ${city.region}`,
      city_code: city.code,
      pickupCode: '',
      pickupAddress: '',
      street: ''
    }));
    setMapCenter(undefined); // Сбрасываем центр карты при смене города
  };
  
  const handleDeliveryTypeChange = (type: 'pickup' | 'address') => {
      setFormData(prev => ({...prev, deliveryType: type}));
      setMode('editing');
  }

  // ✅ ФИКС: Обновляем тип параметра `point`
  const handlePointSelect = (point: {code: string, address: string, coords: [number, number]}) => {
      setFormData(prev => ({...prev, pickupCode: point.code, pickupAddress: point.address}));
      setSelectedPointCode(point.code);
      setMapCenter(point.coords);
  }

  return (
    <BottomSheet ref={sheetRef} title="Адрес доставки" open={open} onClose={onClose}>
      {isLoadingAddress ? (
        <div className="flex justify-center items-center h-40"><SpinnerIcon className="text-white/50 w-8 h-8" /></div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'idle' ? (
              <motion.div key="idle-view" {...motionProps}>
                <div className="space-y-4">
                  <div className="relative p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                       <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                         {deliveryType === 'pickup' ? <BuildingStorefrontIcon className="w-4 h-4 text-sky-400" /> : <TruckIcon className="w-4 h-4 text-sky-400" />}
                       </div>
                       <div className="flex-1 min-w-0 pr-16">
                         <div className="text-xs text-white/40 mb-1">{deliveryType === 'pickup' ? 'Пункт выдачи' : 'Адрес доставки'}</div>
                         <div className="text-sm text-white leading-relaxed">{deliveryType === 'pickup' ? formData.pickupAddress : formData.street}</div>
                       </div>
                    </div>
                    <button onClick={() => setMode('editing')} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition group">
                      <PencilIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
                    </button>
                  </div>
                   <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-1">
                      <div className="text-xs text-white/40">Получатель</div>
                      <div className="text-sm text-white">{formData.name}, {formData.phone}</div>
                   </div>
                   <button onClick={handleSave} disabled={isSaveDisabled}
                    className={`w-full rounded-2xl text-white text-sm font-semibold py-4 transition-all duration-300 ${
                      !isSaveDisabled ? "bg-white/10 hover:bg-white/15 border border-white/20" : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                    }`}>
                    {isSavingAddress ? 'Сохраняем...' : 'Сохранить и закрыть'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="editing-view" {...motionProps}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Способ доставки</label>
                    <div className="grid grid-cols-2 gap-3">
                       {(['pickup', 'address'] as const).map((type) => (
                        <button key={type} onClick={() => handleDeliveryTypeChange(type)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                            deliveryType === type ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8"
                          }`}>
                          <div className="h-6 w-6">{type === "pickup" ? <BuildingStorefrontIcon/> : <TruckIcon/>}</div>
                          <span className="text-xs font-medium text-center leading-tight">{type === "pickup" ? "Пункт выдачи" : "Курьером"}</span>
                          {deliveryType === type && <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Город</label>
                    <input value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} placeholder="Начни вводить город..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition"/>
                    {cityQuery && (suggestedCities || []).length > 0 && formData.city !== cityQuery && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                        {suggestedCities!.map((item) => (
                          <button key={item.code} onClick={() => handleCitySelect(item)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition text-white flex items-center gap-3">
                            <MapPinIcon className="w-4 h-4 text-white/40 shrink-0" />
                            <span>{item.city}, {item.region}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {formData.city_code && (
                    deliveryType === 'pickup' && mapCenter ? (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Выбери пункт выдачи</label>
                        <MapSelectorController
                            cityCode={formData.city_code}
                            pickupPoints={pickupPoints || []}
                            selectedPoint={{code: selectedPointCode, label: ''}}
                            onPointSelect={handlePointSelect}
                            mapCenter={mapCenter}
                        />
                         {selectedPointCode && (
                            <div className="relative p-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-500/30 flex items-center justify-center shrink-0 mt-0.5"><BuildingStorefrontIcon className="w-4 h-4 text-sky-400" /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-sky-300/70 mb-1">Новый пункт выдачи</div>
                                        <div className="text-sm text-white leading-relaxed">{formData.pickupAddress}</div>
                                    </div>
                                </div>
                                <button onClick={() => setMode('idle')} className="absolute top-3 right-3 px-3 py-1 text-xs bg-sky-500/20 text-sky-300 rounded-full font-medium hover:bg-sky-500/30 transition">Подтвердить</button>
                            </div>
                        )}
                      </div>
                    ) : deliveryType === 'address' ? (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Улица, дом</label>
                        <input value={formData.street} onChange={(e) => setFormData(prev => ({...prev, street: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition" placeholder="Например, ул. Ленина, 15"/>
                      </div>
                    ) : null
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Имя получателя</label>
                    <input value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10" placeholder="Как к вам обращаться?"/>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Телефон</label>
                    <input value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10" placeholder="+7 (999) 123-45-67" type="tel"/>
                  </div>
                  
                   <button onClick={handleSave} disabled={isSaveDisabled}
                    className={`w-full rounded-2xl text-white text-sm font-semibold py-4 transition-all duration-300 ${
                      !isSaveDisabled ? "bg-white/10 hover:bg-white/15 border border-white/20" : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                    }`}>
                    {isSavingAddress ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Сохранить адрес доставки'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BottomSheet>
  );
}