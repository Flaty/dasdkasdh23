// uno.config.ts
import { defineConfig, presetWind } from 'unocss'

export default defineConfig({
  presets: [presetWind()],
theme: {
    fontFamily: {
      sans: ['Satoshi', 'Inter', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'monospace'],
    },
    colors: {
      'bg': {
        primary: '#0a0a0a',
        card: '#1a1a1a',
        input: '#1f1f1f',
      },
      'border': {
        subtle: 'rgba(255, 255, 255, 0.1)',
      },
      'text': {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        muted: 'rgba(255, 255, 255, 0.4)',
      }
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0', transform: 'translateY(12px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      'pulse-slow': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.8' },
      }
    },
    animation: {
      fadeIn: 'fadeIn 0.35s ease-out',
      shimmer: 'shimmer 1.5s infinite ease-in-out',
      'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  } as Record<string, any>,
  shortcuts: [
    // Layout
    ['page-container', 'min-h-screen bg-gradient-to-b from-[#111214] to-[#0a0a0a] text-white px-4 pb-28 pt-10 flex justify-center'],
    ['page-content', 'w-full max-w-[430px] flex flex-col gap-6'],

    // Scene
    ['scene-bg', 'relative min-h-screen text-white px-4 pt-20 pb-32 flex justify-center items-start overflow-hidden bg-gradient-to-b from-[#20232a] via-[#121419] to-[#0a0a0a]'],
    ['aura-left', 'absolute top-[15%] left-[20%] w-[420px] h-[420px] bg-indigo-500/25 rounded-full blur-[120px]'],
    ['aura-right', 'absolute bottom-[5%] right-[15%] w-[320px] h-[320px] bg-violet-600/20 rounded-full blur-[150px]'],
    ['floor-fog', 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%] h-[200px] rounded-full bg-gradient-radial from-indigo-400/25 via-purple-500/15 to-transparent blur-[100px] opacity-40'],

    // Avatar
    ['avatar-clean', 'w-24 h-24 rounded-full overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.06)]'],

    // Glass Button & Card
    ['glass-btn', 'flex flex-col items-center gap-2 py-6 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.025)] hover:bg-white/5 backdrop-blur-md transition-all duration-200 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05),_0_0_12px_rgba(255,255,255,0.03)]'],
    ['glass-tile', 'rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-md px-5 py-4 shadow-md'],
    ['glass-card', 'rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] backdrop-blur-xl px-6 py-6 shadow-[0_0_50px_rgba(255,255,255,0.05),_inset_0_0_1px_rgba(255,255,255,0.09)] overflow-hidden'],
    ['glass-button', 'relative overflow-hidden rounded-xl px-6 py-3 border border-white/10 text-white/90 text-sm font-semibold bg-white/5 backdrop-blur-md transition duration-300 hover:shadow-[0_0_38px_rgba(255,255,255,0.13)]'],

    // Badge
    ['badge-neutral', 'text-xs px-3 py-[2px] rounded-full bg-white/5 text-white/70 border border-white/10'],
    ['badge-elo', 'text-xs px-3 py-[2px] rounded-full bg-white/5 text-cyan-300 border border-cyan-500/20'],

    // Tabbar
    ['tab-btn', 'flex flex-col items-center text-xs text-white/50'],
    ['tab-btn-active', 'flex flex-col items-center text-xs text-white'],
    ['tabbar-blur', 'backdrop-blur-lg bg-black/60 border-t border-white/5'],
    
['btn-glow', 'rounded-full bg-white text-black font-semibold py-3 text-sm hover:bg-neutral-200 transition-all'],
['btn-glass-border', 'rounded-full border border-white/10 bg-white/5 text-white/90 text-sm font-medium px-4 py-2 hover:bg-white/10 transition-all'],
['calc-input-wrapper', 'flex flex-col gap-1'],
['calc-label', 'text-sm font-medium text-white/70'],
    // Motion
    ['fade-in', 'animate-fadeIn'],
    ['shimmer-anim', 'bg-[length:200%_100%] animate-shimmer'],
    ['title-glow', 'text-center text-2xl font-semibold text-white drop-shadow-md'],
    // Custom Profile Elements
['card-glass', 'bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4'],
['btn-cta', 'rounded-full px-4 py-2 text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all'],
['input-clean', 'bg-white/5 border border-white/10 px-4 py-3 rounded-full text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'],
['capsule-badge', 'px-3 py-1 rounded-full text-xs font-medium border border-white/20 bg-white/5 text-white'],
    // Typography System
    ['text-ui-h1', 'text-[28px] leading-tight font-semibold tracking-tight text-white'],
    ['text-ui-h2', 'text-[20px] leading-snug font-semibold tracking-tight text-white'],
    ['text-ui-base', 'text-[15px] leading-[1.5] text-white/90'],
    ['text-ui-muted', 'text-[14px] leading-[1.6] text-white/50'],
    ['text-ui-label', 'text-[12px] tracking-wider text-white/40 uppercase'],
    ['text-ui-em', 'text-[13px] font-medium text-white/70'],
    ['text-ui-danger', 'text-[14px] text-red-400 font-medium'],
    ['text-ui-caps', 'text-[13px] font-semibold tracking-[0.15em] uppercase text-white/50'],
    ['text-caption', 'text-[12px] text-white/50'],
    ['text-caption-glow', 'text-[12px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]'],
    ['text-glow', 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]'],
    ['text-glow-subtle', 'text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]'],
    ['text-mono-digit', 'font-mono text-[15px] text-white'],
    ['text-ui-h3-small', 'text-[16px] font-semibold text-white/90'],
    
  ],
  safelist: [
    'scene-bg', 'aura-left', 'aura-right', 'floor-fog', 'glass-card', 'glass-button',
    'page-container', 'page-content', 'avatar-clean', 'glass-btn', 'glass-tile',
    'badge-neutral', 'badge-elo', 'tab-btn', 'tab-btn-active', 'tabbar-blur',
    'fade-in', 'shimmer-anim', 'title-glow',
    'text-ui-h1', 'text-ui-h2', 'text-ui-base', 'text-ui-muted', 'text-ui-label', 'text-ui-em',
    'text-ui-danger', 'text-ui-caps', 'text-caption', 'text-caption-glow',
    'text-glow', 'text-glow-subtle', 'text-mono-digit', 'text-ui-h3-small'
  ],

})
