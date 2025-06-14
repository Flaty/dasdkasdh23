// src/components/AddressEditor.tsx

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinIcon, TruckIcon, BuildingStorefrontIcon, PencilIcon } from "@heroicons/react/24/outline";

import BottomSheet, { type BottomSheetHandle } from "./BottomSheet";
import MapSelectorController from "./MapSelectorController";
import { useAddress, type UserAddress } from "../hook/useAddress"; // Импортируем наш новый хук и тип
import { useCitySuggestions, usePickupPoints, type SuggestedCity } from "../hook/useCdek";
import SpinnerIcon from "./SpinnerIcon";
import MapSkeleton from "./MapSkeleton";

type EditorMode = 'idle' | 'editing'; // Убираем 'form', он больше не нужен
type ViewState = 'form' | 'map'; // Новое состояние для управления видом

// Типы для пропсов, если они не заданы глобально
interface Props {
  userId: number;
  open: boolean;
  onClose: () => void;
}

const motionProps = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.2, ease: "easeInOut" },
};

const EMPTY_ADDRESS: UserAddress = {
  userId: 0, name: '', phone: '', city: '', city_code: 0, street: '',
  deliveryType: 'pickup', pickupCode: '', pickupAddress: ''
};

export default function AddressEditor({ userId, open, onClose }: Props) {
  const { addressData, saveAddress, isSavingAddress, isLoadingAddress } = useAddress(userId);
  const sheetRef = useRef<BottomSheetHandle>(null);

  const [mode, setMode] = useState<EditorMode>('idle');
  const [view, setView] = useState<ViewState>('form');
  
  // ✅ ГЛАВНЫЙ ФИКС: formData - это наше ЛОКАЛЬНОЕ состояние формы.
  const [formData, setFormData] = useState<UserAddress>(EMPTY_ADDRESS);
  const [cityQuery, setCityQuery] = useState('');
  const [selectedPointCode, setSelectedPointCode] = useState<string | null>(null);

  useEffect(() => {
    // Этот эффект СИНХРОНИЗИРУЕТ форму с данными с сервера ТОЛЬКО ОДИН РАЗ, когда данные загрузились.
    if (addressData) {
      setFormData(addressData);
      setCityQuery(addressData.city);
      setSelectedPointCode(addressData.pickupCode || null);
      // Определяем начальный режим
      if (!addressData.city) {
        setMode('editing');
      } else {
        setMode('idle');
      }
    } else if (open) {
      // Если данных нет, но шторка открыта, начинаем с пустого редактирования
      setFormData({ ...EMPTY_ADDRESS, userId });
      setMode('editing');
    }
  }, [addressData, open, userId]);
  
  const { data: suggestedCities } = useCitySuggestions(cityQuery);
  const { data: pickupPoints, isLoading: isLoadingPoints } = usePickupPoints(formData.city_code);

   const handleSave = async () => {
    // Передаем в post-запрос userId из пропсов
    const ok = await saveAddress({ ...formData, userId });
    if (ok) {
      setMode('idle');
      onClose(); // Просто вызываем onClose, шторка закроется сама
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
    // После выбора города сразу показываем карту
    if (deliveryType === 'pickup') {
      setView('map');
    }
  };
  
  const handleDeliveryTypeChange = (type: 'pickup' | 'address') => {
      setFormData(prev => ({...prev, deliveryType: type}));
      setView(type === 'pickup' ? 'map' : 'form'); // Показываем карту, если выбран ПВЗ
  }

  const handlePointSelect = (point: {code: string, address: string, coords: [number, number]}) => {
      setFormData(prev => ({...prev, pickupCode: point.code, pickupAddress: point.address}));
      setSelectedPointCode(point.code);
  }

  // ✅ НОВЫЕ ФУНКЦИИ УПРАВЛЕНИЯ ВИДОМ
  const handleConfirmSelection = () => {
    setView('form'); // Просто меняем вид на форму
  };
  
  const handleBackToMap = () => {
    setView('map'); // Возвращаемся к карте
  };
  
  const handleStartEditing = () => {
    setMode('editing');
    // Если доставка - ПВЗ, сразу открываем карту
    if (deliveryType === 'pickup') {
      setView('map');
    } else {
      setView('form');
    }
  };

  return (
    <BottomSheet ref={sheetRef} title="Адрес доставки" open={open} onClose={onClose}>
      {isLoadingAddress ? (
        <div className="flex justify-center items-center h-40"><SpinnerIcon className="text-white/50 w-8 h-8" /></div>
      ) : (
        <div className="space-y-6">
            {mode === 'idle' && (
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
                    <button onClick={handleStartEditing} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition group">
                      <PencilIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
                    </button>
                  </div>
                   <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-1">
                      <div className="text-xs text-white/40">Получатель</div>
                      <div className="text-sm text-white">{formData.name}, {formData.phone}</div>
                   </div>
                   <button 
                     onClick={() => sheetRef.current?.dismiss()} // Используем dismiss() для правильного закрытия
                     className="w-full rounded-2xl text-white text-sm font-semibold py-4 transition-all duration-300 bg-white/10 hover:bg-white/15 border border-white/20">
                    Закрыть
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'editing' && (
              <motion.div key="editing-view" {...motionProps}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Способ доставки</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['pickup', 'address'] as const).map((type) => (
                        <button key={type} onClick={() => handleDeliveryTypeChange(type)} className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${deliveryType === type ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8"}`}>
                          <div className="h-6 w-6">{type === "pickup" ? <BuildingStorefrontIcon/> : <TruckIcon/>}</div>
                          <span className="text-xs font-medium text-center leading-tight">{type === "pickup" ? "Пункт выдачи" : "Курьером"}</span>
                          {deliveryType === type && <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 🔥🔥🔥 БЛОК С АНИМАЦИЯМИ 🔥🔥🔥 */}
                  <div className="relative">
                    <AnimatePresence initial={false}>
                      {view === 'map' && deliveryType === 'pickup' && (
                        <motion.div
                          key="map-view"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="space-y-3"
                        >
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
                            <div className="space-y-3">
                              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Выбери пункт выдачи</label>
                              {isLoadingPoints ? ( <MapSkeleton /> ) : (
                                <>
                                  <MapSelectorController 
                                    key="map-selector"
                                    cityCode={formData.city_code} pickupPoints={pickupPoints || []} 
                                   selectedPoint={{ code: selectedPointCode || '', label: '' }} onPointSelect={handlePointSelect} 
                                  />
                                  {selectedPointCode && (
                                    <div className="relative p-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 backdrop-blur-sm">
                                      <div className="flex items-start gap-3">
                                        <BuildingStorefrontIcon className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs text-sky-300/70 mb-1">Выбран новый пункт</div>
                                          <div className="text-sm text-white leading-relaxed">{formData.pickupAddress}</div>
                                        </div>
                                      </div>
                                      <button onClick={handleConfirmSelection} className="absolute top-3 right-3 px-3 py-1 text-xs bg-sky-500/20 text-sky-300 rounded-full font-medium hover:bg-sky-500/30 transition">Подтвердить</button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {view === 'form' && (
                         <motion.div
                            key="form-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="space-y-4"
                         >
                            {deliveryType === 'pickup' ? (
                              <div className="relative p-4 rounded-2xl border border-white/10 bg-white/5">
                                 <div className="flex items-start gap-3">
                                   <BuildingStorefrontIcon className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                                   <div className="flex-1 min-w-0 pr-10">
                                     <div className="text-xs text-white/40 mb-1">Пункт выдачи</div>
                                     <div className="text-sm text-white">{formData.pickupAddress || 'Не выбран'}</div>
                                   </div>
                                 </div>
                                 <button onClick={handleBackToMap} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition group">
                                   <PencilIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
                                 </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Улица, дом</label>
                                <input value={formData.street} onChange={(e) => setFormData(prev => ({...prev, street: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition" placeholder="Например, ул. Ленина, 15"/>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Имя получателя</label>
                              <input value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10" placeholder="Как к вам обращаться?"/>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Телефон</label>
                              <input value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10" placeholder="+7 (999) 123-45-67" type="tel"/>
                            </div>
                         </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={handleSave} disabled={isSaveDisabled} className={`w-full rounded-2xl text-white text-sm font-semibold py-4 transition-all duration-300 ${!isSaveDisabled ? "bg-white/10 hover:bg-white/15 border border-white/20" : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"}`}>
                    {isSavingAddress ? <SpinnerIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Сохранить адрес доставки'}
                  </button>
                </div>
              </motion.div>
            )}
        </div>
      )}
    </BottomSheet>
  );
}