"use client";

export default function WorkloadView() {
  const resources = ["ทีมงาน", "วิศวกร", "เครื่องจักร"];

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl">

      <div className="text-red-400 mb-4 text-sm">
        ⚠️ พบ Overload
      </div>

      {resources.map((r) => (
        <div key={r} className="mb-4">

          <div className="text-sm mb-1">{r}</div>

          <div className="relative h-6 bg-gray-800 rounded">

            <div className="absolute bg-blue-500 h-full w-[30%]" />
            <div className="absolute bg-red-500 h-full left-[20%] w-[50%]" />

          </div>

        </div>
      ))}
    </div>
  );
}