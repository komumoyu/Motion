"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date?: Date) => void
  initialFocus?: boolean
}

export const Calendar = ({ selected, onSelect }: CalendarProps) => {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  const today = new Date()
  const todayString = today.toDateString()
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const days = []
  
  // 空のセルを追加（月の最初の日まで）
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
  }
  
  // 月の日付を追加
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const isSelected = selected && date.toDateString() === selected.toDateString()
    const isToday = date.toDateString() === todayString
    
    days.push(
      <Button
        key={day}
        variant={isSelected ? "default" : "ghost"}
        size="sm"
        className={`w-8 h-8 p-0 ${isToday ? "bg-blue-100" : ""}`}
        onClick={() => onSelect?.(date)}
      >
        {day}
      </Button>
    )
  }
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={goToPrevMonth}>
          ←
        </Button>
        <div className="font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          →
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
          <div key={day} className="w-8 h-8 text-center text-sm font-medium text-gray-500 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  )
}