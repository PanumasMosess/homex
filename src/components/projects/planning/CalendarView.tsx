"use client";

import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
} from "lucide-react";
import { Button } from "@heroui/react";

interface CalendarViewProps {
  data: any[];
  projectStart: Date | null;
}

// กำหนด Interface ให้ชัดเจนเพื่อแก้ปัญหา 'any'
interface CalendarDay {
  date: Date;
  currentMonth: boolean;
}

export default function CalendarView({ data, projectStart }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const allTasks = useMemo(() => data?.flatMap((p) => p.tasks || []) || [], [data]);

  // แก้ไขส่วนการสร้าง Grid และระบุ Type: CalendarDay[]
  const calendarGrid = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: CalendarDay[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // เดือนก่อนหน้า
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), currentMonth: false });
    }
    // เดือนปัจจุบัน
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }
    // เดือนถัดไป (แก้ Error nextDate)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });
    }
    return days;
  }, [currentMonth]);

  const renderWeekTasks = (weekStartIndex: number) => {
    const weekDays = calendarGrid.slice(weekStartIndex, weekStartIndex + 7);
    const weekStart = new Date(weekDays[0].date).setHours(0,0,0,0);
    const weekEnd = new Date(weekDays[6].date).setHours(23,59,59,999);

    const weekTasks = allTasks.filter(task => {
      const s = new Date(task.startDate).getTime();
      const e = new Date(s + (task.durationDay * 86400000)).getTime();
      return s <= weekEnd && e >= weekStart;
    });

    return (
      <div className="absolute inset-0 mt-9 flex flex-col gap-1.5 px-0.5">
        {weekTasks.map((task) => {
          const taskStart = new Date(task.startDate).getTime();
          const taskEnd = taskStart + (task.durationDay * 86400000);
          
          const startIdx = Math.max(0, Math.floor((taskStart - weekStart) / 86400000));
          const endIdx = Math.min(6, Math.floor((taskEnd - weekStart) / 86400000));
          
          const left = `${(startIdx * 100) / 7}%`;
          const width = `${((endIdx - startIdx + 1) * 100) / 7}%`;

          // ใช้สีตามสถานะที่ดูง่าย (เสร็จสิ้น=เขียว, ล่าช้า=แดง)
          let statusColor = "bg-rose-600 border-rose-700"; 
          if (task.progress === 100) statusColor = "bg-[#10b981] border-[#059669]";
          else if (task.progress > 0) statusColor = "bg-blue-600 border-blue-700";

          return (
            <div 
              key={`${task.id}-${weekStartIndex}`}
              className={`relative h-6 ${statusColor} border-l-4 text-white text-[10px] font-bold flex items-center px-2 shadow-md z-10`}
              style={{ marginLeft: left, width: width }}
            >
              {/* ชื่อโชว์แค่จุดที่สมควร (เริ่มงาน หรือ วันแรกของสัปดาห์) */}
              {(startIdx === 0 || taskStart === new Date(weekDays[startIdx].date).setHours(0,0,0,0)) && (
                <span className="truncate drop-shadow-sm">{task.name}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[#0b0e14] rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      <div className="p-5 flex justify-between items-center bg-[#11151c] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
            <CalendarIcon size={22} />
          </div>
          <h2 className="text-lg font-black text-white leading-none">PROJECT SCHEDULE</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#0b0e14] rounded-lg p-1 border border-slate-700 items-center">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-800 text-slate-400">
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-xs font-black text-slate-200 min-w-[140px] text-center uppercase">
              {currentMonth.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-800 text-slate-400">
              <ChevronRight size={18} />
            </button>
          </div>
          <Button size="sm" color="primary" className="font-bold text-xs" onClick={() => setCurrentMonth(new Date())}>วันนี้</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-[#11151c] border-b border-slate-800">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, i) => (
          <div key={day} className={`py-2 text-[10px] font-black text-center tracking-widest ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 relative border-collapse">
        {calendarGrid.map((day, idx) => (
          <div key={idx} className={`min-h-[130px] border-r border-b border-slate-800/40 p-3 ${!day.currentMonth ? 'bg-[#0d1117]/50' : ''}`}>
            <span className={`text-xs font-black ${day.currentMonth ? 'text-slate-400' : 'text-slate-700'}`}>
              {day.date.getDate()}
            </span>
          </div>
        ))}

        <div className="absolute inset-0 pointer-events-none">
          {[0, 7, 14, 21, 28, 35].map(weekIdx => (
            <div key={weekIdx} className="relative h-[130px]">
              {renderWeekTasks(weekIdx)}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-[#11151c] border-t border-slate-800 flex justify-center gap-8 text-[10px] font-black uppercase">
        <div className="flex items-center gap-2 text-[#10b981]"><div className="w-2 h-2 rounded-full bg-[#10b981]" /> เสร็จสิ้น</div>
        <div className="flex items-center gap-2 text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500" /> ดำเนินการ</div>
        <div className="flex items-center gap-2 text-rose-500"><div className="w-2 h-2 rounded-full bg-rose-500" /> ล่าช้า (Delayed)</div>
      </div>
    </div>
  );
}