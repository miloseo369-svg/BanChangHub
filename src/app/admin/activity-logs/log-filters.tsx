"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

const ACTION_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "user.role_changed", label: "เปลี่ยน Role" },
  { value: "user.verified", label: "ยืนยันตัวตน" },
  { value: "listing.approved", label: "อนุมัติประกาศ" },
  { value: "listing.rejected", label: "ปฏิเสธประกาศ" },
  { value: "listing.status_changed", label: "เปลี่ยนสถานะประกาศ" },
  { value: "payment.confirmed", label: "ยืนยันชำระเงิน" },
  { value: "payment.rejected", label: "ปฏิเสธชำระเงิน" },
  { value: "topup.confirmed", label: "ยืนยันเติมเครดิต" },
  { value: "topup.rejected", label: "ปฏิเสธเติมเครดิต" },
];

export default function LogFilters({
  currentAction,
}: {
  currentAction?: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const action = e.target.value;
    const url = action
      ? `/admin/activity-logs?action=${action}`
      : "/admin/activity-logs";
    router.push(url);
  }

  return (
    <div className="mb-6 flex items-center gap-2">
      <Filter size={14} className="text-slate-400" />
      <select
        value={currentAction ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
      >
        {ACTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
