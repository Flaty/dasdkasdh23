// AddressEditor.tsx

import { useEffect, useReducer, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinIcon, TruckIcon, BuildingStorefrontIcon, PencilIcon } from "@heroicons/react/24/outline";

import BottomSheet, { type BottomSheetHandle } from "./BottomSheet";
import MapSelectorController from "./MapSelectorController";
import { useAddress, type UserAddress } from "../hook/useAddress";
import { useCitySuggestions, usePickupPoints, type SuggestedCity } from "../hook/useCdek";
import SpinnerIcon from "./SpinnerIcon";

// --- Типы и Редьюсер ---
type EditorStatus = 'idle' | 'editing_city' | 'editing_pickup' | 'editing_courier' | 'saving';

type EditorAction =
  | { type: 'RESET_TO_INITIAL'; payload: UserAddress }
  | { type: 'SET_DELIVERY_TYPE'; payload: 'pickup' | 'address' }
  | { type: 'UPDATE_FORM_FIELD'; payload: Partial<UserAddress> }
  | { type: 'CITY_INPUT_CHANGE'; payload: string }
  | { type: 'CITY_SELECTED'; payload: SuggestedCity }
  | { type: 'START_EDITING_PICKUP' }
  | { type: 'PVZ_SELECTED'; payload: { code: string; address: string } }
  | { type: 'CONFIRM_PVZ_SELECTION' }
  | { type: 'ATTEMPT_SAVE' }
  | { type: 'FINISH_SAVE' };

interface EditorState {
  status: EditorStatus;
  formData: UserAddress;
  cityQuery: string;
  cityTouched: boolean;
  selectedPointOnMap: { code: string; label: string } | null;
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'RESET_TO_INITIAL':
      return {
        ...state,
        status: 'idle',
        formData: action.payload,
        cityQuery: action.payload.city,
        cityTouched: !!action.payload.city,
        selectedPointOnMap: null,
      };

    case 'SET_DELIVERY_TYPE': {
      const isPickup = action.payload === 'pickup';
      return {
        ...state,
        status: 'editing_city',
        formData: { ...state.formData, deliveryType: action.payload, street: isPickup ? "" : state.formData.street },
      };
    }
    
    case 'UPDATE_FORM_FIELD':
        return {...state, formData: {...state.formData, ...action.payload}};

    case 'CITY_INPUT_CHANGE':
      return { ...state, status: 'editing_city', cityQuery: action.payload, formData: {...state.formData, city_code: ''}};

    case 'CITY_SELECTED':
      return {
        ...state,
        status: 'editing_pickup',
        cityQuery: `${action.payload.city}, ${action.payload.region}`,
        selectedPointOnMap: null,
        formData: {
          ...state.formData,
          city: `${action.payload.city}, ${action.payload.region}`,
          city_code: action.payload.code,
          pickupCode: '',
          pickupAddress: '',
        },
      };

    case 'START_EDITING_PICKUP':
      return { ...state, status: 'editing_pickup', selectedPointOnMap: null };

    case 'PVZ_SELECTED':
      return {
        ...state,
        formData: { ...state.formData, pickupCode: action.payload.code, pickupAddress: action.payload.address },
        selectedPointOnMap: { code: action.payload.code, label: action.payload.address }
      };

    case 'CONFIRM_PVZ_SELECTION':
      return { ...state, status: 'idle' };
    
    case 'ATTEMPT_SAVE':
      return { ...state, status: 'saving' };

    case 'FINISH_SAVE':
      return { ...state, status: 'idle' };

    default:
      return state;
  }
}

// --- Сам Компонент ---
interface Props {
  userId: number;
  open: boolean;
  onClose: () => void;
}

export default function AddressEditor({ userId, open, onClose }: Props) {
  const { addressData, saveAddress, isSavingAddress, isLoadingAddress } = useAddress(userId);
  const sheetRef = useRef<BottomSheetHandle>(null);
  
  const [state, dispatch] = useReducer(editorReducer, {
    status: 'idle',
    formData: addressData,
    cityQuery: addressData.city,
    cityTouched: false,
    selectedPointOnMap: null
  });

  useEffect(() => {
    dispatch({ type: 'RESET_TO_INITIAL', payload: addressData });
  }, [addressData]);
  
  const { data: suggestedCities } = useCitySuggestions(state.cityQuery);
  const { data: pickupPoints } = usePickupPoints(state.formData.city_code);

  const handleSave = async () => {
    dispatch({ type: 'ATTEMPT_SAVE' });
    try {
      const ok = await saveAddress(state.formData);
      if (ok) {
        // Просим шторку закрыться, чтобы сработала анимация
        sheetRef.current?.dismiss(); 
      }
    } finally {
      // Завершаем состояние сохранения независимо от результата
      dispatch({ type: 'FINISH_SAVE' });
    }
  };

  const isSaveDisabled = useMemo(() => {
    const { formData } = state;
    if (isSavingAddress) return true;
    if (!formData.name.trim() || !formData.phone.trim() || !formData.city_code) return true;
    if (formData.deliveryType === 'pickup' && !formData.pickupCode) return true;
    if (formData.deliveryType === 'address' && !formData.street.trim()) return true;
    return false;
  }, [state.formData, isSavingAddress]);

  const deliveryType = state.formData.deliveryType ?? "pickup";

  return (
    <BottomSheet ref={sheetRef} title="Адрес доставки" open={open} onClose={onClose}>
      {isLoadingAddress ? (
        <div className="flex justify-center items-center h-40">
          <SpinnerIcon className="text-white/50 w-8 h-8" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Способ доставки</label>
            <div className="grid grid-cols-2 gap-3">
              {(['pickup', 'address'] as const).map((type) => (
                <button key={type} onClick={() => dispatch({ type: 'SET_DELIVERY_TYPE', payload: type })}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                    deliveryType === type ? "bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8"
                  }`}>
                  {type === "pickup" ? <BuildingStorefrontIcon className="w-6 h-6" /> : <TruckIcon className="w-6 h-6" />}
                  <span className="text-xs font-medium text-center leading-tight">{type === "pickup" ? "Пункт выдачи" : "Курьером"}</span>
                  {deliveryType === type && <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Город</label>
            <div className="relative">
              <input value={state.cityQuery} onChange={(e) => dispatch({ type: 'CITY_INPUT_CHANGE', payload: e.target.value })}
                onBlur={() => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { ...state.formData, cityTouched: true } as any })} placeholder="Начни вводить город..."
                className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none transition-all duration-200 ${
                  state.cityTouched && !state.formData.city_code ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : "border-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/10"
                }`} />
              <MapPinIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            </div>
            {state.cityTouched && !state.formData.city_code && <div className="flex items-center gap-2 text-xs text-red-400"><span>⚠️</span>Пожалуйста, выбери город из выпадающего списка</div>}
            {(suggestedCities || []).length > 0 && state.status === 'editing_city' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                {suggestedCities!.map((item, idx) => (
                  <button key={item.code} onClick={() => dispatch({ type: 'CITY_SELECTED', payload: item })}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition text-white flex items-center gap-3 ${idx !== suggestedCities!.length - 1 ? "border-b border-white/5" : ""}`}>
                    <MapPinIcon className="w-4 h-4 text-white/40 shrink-0" />
                    <span>{item.city}, {item.region}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            {state.status === 'idle' && deliveryType === "pickup" && state.formData.pickupAddress && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeOut" }} className="relative">
                <div className="relative p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0 mt-0.5"><BuildingStorefrontIcon className="w-4 h-4 text-sky-400" /></div>
                    <div className="flex-1 min-w-0 pr-16">
                      <div className="text-xs text-white/40 mb-1">Выбранный пункт выдачи</div>
                      <div className="text-sm text-white leading-relaxed">{state.formData.pickupAddress}</div>
                    </div>
                  </div>
                  <button onClick={() => dispatch({ type: 'START_EDITING_PICKUP' })} className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 group">
                    <PencilIcon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </motion.div>
            )}

            {state.status === 'editing_pickup' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeOut" }} className="space-y-3">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Выбери пункт выдачи на карте</label>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <MapSelectorController cityCode={state.formData.city_code} pickupPoints={pickupPoints || []} selectedPoint={state.selectedPointOnMap}
                    onPointSelect={(point) => dispatch({ type: 'PVZ_SELECTED', payload: point })} />
                </div>
                 {state.selectedPointOnMap && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative p-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-500/30 flex items-center justify-center shrink-0 mt-0.5"><BuildingStorefrontIcon className="w-4 h-4 text-sky-400" /></div>
                          <div className="flex-1 min-w-0">
                              <div className="text-xs text-sky-300/70 mb-1">Новый пункт выдачи</div>
                              <div className="text-sm text-white leading-relaxed">{state.formData.pickupAddress}</div>
                          </div>
                      </div>
                      <button onClick={() => dispatch({ type: 'CONFIRM_PVZ_SELECTION' })} className="absolute top-3 right-3 px-3 py-1 text-xs bg-sky-500/20 text-sky-300 rounded-full font-medium hover:bg-sky-500/30 transition">Подтвердить</button>
                   </motion.div>
                )}
              </motion.div>
            )}

            {deliveryType === "address" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Улица, дом</label>
                <div className="relative">
                  <input value={state.formData.street} onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { street: e.target.value }})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
                    placeholder="Например, ул. Ленина, 15" />
                  <TruckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Имя получателя</label>
            <input value={state.formData.name} onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { name: e.target.value }})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
              placeholder="Как к вам обращаться?" />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Телефон</label>
            <input value={state.formData.phone} onChange={(e) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { phone: e.target.value }})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all duration-200"
              placeholder="+7 (999) 123-45-67" type="tel" />
          </div>

          <button onClick={handleSave} disabled={isSaveDisabled}
            className={`w-full rounded-2xl text-white text-sm font-semibold py-4 transition-all duration-300 ${
              !isSaveDisabled ? "bg-white/10 hover:bg-white/15 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]" : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
            }`}>
            {isSavingAddress ? (
              <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Сохраняем...</div>
            ) : (
              <div className="flex items-center justify-center gap-2"><span>💾</span>Сохранить адрес доставки</div>
            )}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}