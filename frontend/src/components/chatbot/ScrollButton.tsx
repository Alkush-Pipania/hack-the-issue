"use client"

import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"

type ScrollButtonProps = {
  onClick: () => void
  show: boolean
}

export default function ScrollButton({ onClick, show }: ScrollButtonProps) {
  if (!show) return null
  
  return (
    <Button
      onClick={onClick}
      className="fixed sm:bottom-36 lg:right-2/4 bottom-32 right-8 sm:right-24 rounded-full p-3 bg-gradient-to-r from-[#FF9800] to-[#FF5722] hover:from-[#FF8800] hover:to-[#FF4500] shadow-lg shadow-[#FF9800]/20 z-10 transition-colors"
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="w-5 h-5" />
    </Button>
  )
} 