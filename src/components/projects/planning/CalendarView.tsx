"use client";

export default function CalendarView() {
  return (
    <div className="grid grid-cols-7 gap-2 bg-black p-4 rounded-xl">

      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-24 bg-[#111] rounded p-1 text-xs">

          <div>{i + 1}</div>

          <div className="bg-gray-400 text-black rounded px-1 mt-1">
            งานตัวอย่าง
          </div>

        </div>
      ))}

    </div>
  );
}