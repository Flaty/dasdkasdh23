// src/layouts/TabBarLayout.tsx
import type { ReactNode } from "react"
import TabBar from "../components/TabBar"

interface Props {
  children: ReactNode
}

export default function TabBarLayout({ children }: Props) {
  return (
    <div className="relative h-screen flex flex-col bg-[#0a0a0a]">
      <main className="flex-1 overflow-auto no-scrollbar">{children}</main>
      <TabBar />
    </div>
  )
}