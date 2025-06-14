// src/pages/Profile.tsx

import { getUserData } from "../utils/user";
import { useCustomNavigate } from "../utils/useCustomNavigate";
import { useRef, useState, useMemo, type ReactNode } from "react";
import BottomSheet, { type BottomSheetHandle } from "../components/BottomSheet";
import AddressEditor from "../components/AddressEditor";
import OrderDetails from "../components/OrderDetails";
import { ProfileCard } from "../components/ui/Card";
import { useProfile, type ProfileData } from "../hook/useProfile";
import ProfileSkeleton from "../components/ProfileSkeleton";
import { formatDistanceToNowStrict } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Achievement } from '../utils/types'; 
import { haptic } from "../utils/haptic";
import { MessageSquareQuote, Gem, MapPin, Handshake, ChevronRightIcon, Package, Gift, Trophy, Award, Flame, ReceiptText } from 'lucide-react';
import { ProfileHeader } from '../components/ProfileHeader'; 

// --- Хелперы ---

function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    'accessories': 'Аксессуары',
    'shoes': 'Обувь',
    'clothes': 'Одежда',
    'other': 'Другое',
    // Добавьте другие категории если нужно
  };
  
  return categoryLabels[category] || category;
}

function formatAddressPreview(address?: { deliveryType?: string; street?: string; pickupAddress?: string }): string {
  if (!address || (!address.street && !address.pickupAddress)) return "Нажмите, чтобы настроить";
  if (address.deliveryType === 'pickup' && address.pickupAddress) return `ПВЗ: ${address.pickupAddress}`;
  if (address.deliveryType === 'address' && address.street) return `По адресу: ${address.street}`;
  if (address.pickupAddress) return `ПВЗ: ${address.pickupAddress}`;
  if (address.street) return `По адресу: ${address.street}`;
  return "Адрес не указан";
}

function formatDays(days: number): string {
  if (days === 0) return "сегодня";
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${days} дней`;
  if (lastDigit === 1) return `${days} день`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${days} дня`;
  return `${days} дней`;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true, locale: ru });
  } catch (e) {
    console.error("Date formatting error:", e);
    return '';
  }
}

const achievementIcons: Record<string, ReactNode> = {
  first_purchase: <Award className="w-3.5 h-3.5" />,
  five_orders: <Flame className="w-3.5 h-3.5" />,
  spent_30k: <ReceiptText className="w-3.5 h-3.5" />,
};

// --- Компонент ---

export default function Profile() {
  const navigate = useCustomNavigate();
  const baseUser = getUserData();
  const { data: rawProfile, isLoading, isError, error } = useProfile();

  const profile = useMemo(() => {
    if (!rawProfile) return null;
    return {
      ...rawProfile,
      address: rawProfile.address || { deliveryType: 'pickup', street: '', pickupAddress: '' }
    };
  }, [rawProfile]);

  const supportRef = useRef<BottomSheetHandle>(null);
  const orderDetailsRef = useRef<BottomSheetHandle>(null);
  
  const [supportOpen, setSupportOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProfileData['last_order']>(null);

  const handleOrderClick = (order: ProfileData['last_order']) => {
    if (order) {
      setSelectedOrder(order);
      setOrderDetailsOpen(true);
    }
  };
  
  const handleCopyReferral = () => {
    if (navigator.clipboard && profile?.referral_info.link) {
      navigator.clipboard.writeText(profile.referral_info.link);
      // ✅ Haptic Feedback: Успешное действие
      haptic.success();
      ('Ссылка для друга скопирована!');
    }
  }

  if (!baseUser) return null;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400 p-4 text-center">
        Ошибка загрузки профиля: {error instanceof Error ? error.message : 'Произошла неизвестная ошибка'}
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] overflow-hidden max-w-screen-sm mx-auto no-scrollbar">
      <div id="glow-wrapper" className="absolute top-0 left-0 right-0 bottom-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[25%] w-[360px] h-[360px] rounded-full" style={{ backgroundColor: "transparent", boxShadow: "0 0 160px 80px rgba(147, 51, 234, 0.2)" }} />
        <div className="absolute bottom-[8%] right-[15%] w-[280px] h-[280px] rounded-full" style={{ backgroundColor: "transparent", boxShadow: "0 0 120px 60px rgba(59, 130, 246, 0.2)" }} />
      </div>

      <div className="flex flex-col items-center gap-2 text-center mb-4 relative">
        <img src={baseUser.photo_url || "https://placehold.co/96x96"} alt="avatar" className="w-24 h-24 rounded-full border border-white/10 shadow-lg" />
        <button onClick={() => setSupportOpen(true)} className="absolute top-0 right-0 p-2 rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors" aria-label="Поддержка">
          <MessageSquareQuote className="w-5 h-5" />
        </button>
        <div className="text-xl font-semibold drop-shadow-md">{baseUser.first_name || "Имя"}</div>
        <div className="text-sm text-white/50">@{baseUser.username || "user"}</div>
        <div className="text-xs text-white/30">В экосистеме {formatDays(profile.days_in_ecosystem)}</div>
      </div>

      <div className="flex flex-col gap-3 pb-20">
{profile.last_order && (
  <ProfileCard 
    title="Последний заказ" 
    subtitle={formatRelativeTime(profile.last_order.createdAt)}
    icon={<Package className="w-4 h-4 text-neutral-400" />}
    onClick={() => handleOrderClick(profile.last_order)}
  >
    {/* ✅ Возвращаем простую и понятную структуру */}
    <div className="text-sm font-medium">
      {/* Используем getCategoryLabel для человеко-читаемого названия */}
      {getCategoryLabel(profile.last_order.category)} — {profile.last_order.price.toLocaleString('ru-RU')} ₽
    </div>
  </ProfileCard>
)}

        <ProfileCard title="Награда за активность" subtitle="Ваши достижения в нашем сервисе" icon={<Gift className="w-4 h-4 text-neutral-400" />}>
          <button onClick={() => navigate("/calc")} className="w-full rounded-full bg-white/10 hover:bg-white/20 transition text-sm text-white py-2.5 px-4 font-medium">
            Сделать новый заказ
          </button>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.achievements.map((ach: Achievement) => (
              <span key={ach.id} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium transition-all ${ach.is_completed ? 'border-green-400/30 bg-green-500/20 text-green-300' : 'border-white/20 bg-white/10 text-white/60'}`}>
                {achievementIcons[ach.id]}
                {ach.name}
              </span>
            ))}
          </div>
        </ProfileCard>

        <ProfileCard title={`Статус: ${profile.loyalty_status.name}`}
          subtitle={profile.loyalty_status.orders_to_next_status > 0 ? `До ${profile.loyalty_status.next_status_name} осталось ${profile.loyalty_status.orders_to_next_status} заказа(ов)` : "Вы достигли максимального статуса!"}
          icon={<Trophy className="w-4 h-4 text-neutral-400" />}>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-2">
            <div className="h-full bg-indigo-400" style={{ width: `${profile.loyalty_status.progress_percentage}%` }} />
          </div>
        </ProfileCard>

        <ProfileCard title="Лояльность" subtitle={profile.loyalty_status.perks.join(', ')} icon={<Gem className="w-4 h-4 text-neutral-400" />} />

        <ProfileCard title="Адрес доставки (СДЭК)" 
          subtitle={formatAddressPreview(profile.address)} 
          onClick={() => {
            haptic.light(); // ✅ Haptic Feedback: легкий клик
            setAddressOpen(true);
          }} 
          icon={<MapPin className="w-4 h-4 text-neutral-400" />} />

        <ProfileCard title="Пригласи друга" subtitle={`Получи ${profile.referral_info.bonus_per_friend} ₽ за заказ друга`}
          onClick={handleCopyReferral}
          icon={<Handshake className="w-4 h-4 text-neutral-400" />}>
           <p className="text-xs text-white/50 mt-1 flex items-center">Нажми, чтобы скопировать ссылку <ChevronRightIcon className="w-3 h-3 ml-1" /></p>
        </ProfileCard>
      </div>

      <BottomSheet ref={supportRef} title="Поддержка" open={supportOpen} onClose={() => setSupportOpen(false)}>
        <div className="text-left space-y-5">
            <p className="text-sm text-white/70 leading-snug">
              Свяжись с менеджером в Telegram, если у тебя возникли вопросы по расчёту, заказу или доставке.
            </p>
            <a href="https://t.me/Littleton59" target="_blank" rel="noopener noreferrer" className="block w-full text-center text-sm font-medium text-white rounded-full py-2.5 bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30 transition-colors">
              Написать в Telegram
            </a>
            <p className="text-xs text-white/30 text-center mt-6">Отвечаем в течение пары минут</p>
          </div>
      </BottomSheet>

      <AddressEditor userId={baseUser.id} open={addressOpen} onClose={() => setAddressOpen(false)} />

      {selectedOrder && (
        <BottomSheet
          ref={orderDetailsRef}
          title="Детали заказа"
          open={orderDetailsOpen}
          onClose={() => setOrderDetailsOpen(false)}
        >
          <OrderDetails order={selectedOrder} />
        </BottomSheet>
      )}
    </div>
  );
}