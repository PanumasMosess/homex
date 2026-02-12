import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
  Progress,
} from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  MapPin,
  MoreVertical,
  ExternalLink,
  Clock,
  Wallet,
} from "lucide-react";
import Link from "next/link";

const getStatusProjectColor = (status: string) => {
  switch ((status ?? "").toUpperCase()) {
    case "DONE": return "success";
    case "IN_PROGRESS": return "primary";
    case "ON_HOLD": return "danger";
    case "PLANNING": return "warning";
    default: return "default";
  }
};

const fmtDate = (d?: any) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const diffDaysInclusive = (from?: any, to?: any) => {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const ms = b0.getTime() - a0.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return days + 1; // ✅ รวมวันเริ่มด้วย
};

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const daysDiff = (from: Date, to: Date) => {
  // from -> to (จำนวนวันต่างแบบ exclusive)
  const ms = dayStart(to).getTime() - dayStart(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const getDueInfo = (finishPlanned?: any, status?: string, progress?: number) => {
  // Completed condition
  if (status === "DONE" || (progress ?? 0) >= 100) {
    return { label: "Completed", tone: "success" as const };
  }

  if (!finishPlanned) {
    return { label: "No deadline", tone: "default" as const };
  }

  const today = new Date();
  const finish = new Date(finishPlanned);
  if (Number.isNaN(finish.getTime())) {
    return { label: "Invalid deadline", tone: "default" as const };
  }

  const diff = daysDiff(today, finish); // วันนี้ -> วันกำหนดเสร็จ

  if (diff > 0) return { label: `Due in ${diff} days`, tone: "primary" as const };
  if (diff === 0) return { label: "Due today", tone: "warning" as const };
  return { label: `Overdue ${Math.abs(diff)} days`, tone: "danger" as const };
};


const fmtMoney = (v?: any) => {
  if (v == null || v === "" || v === "-") return "-";
  const n = typeof v === "string" ? Number(v) : Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);
};

const ProjectCard = ({ project }: { project: any }) => {
  const startPlanned = project.startPlanned ?? null;
  const finishPlanned = project.finishPlanned ?? null;
  const dueInfo = getDueInfo(finishPlanned, project.status, project.progress);

  const plannedDays =
    project.durationDays != null
      ? Number(project.durationDays)        
      : diffDaysInclusive(startPlanned, finishPlanned); 


  const startForElapsed = project.startActual ?? startPlanned;
  const elapsedDays = startForElapsed ? diffDaysInclusive(startForElapsed, new Date()) : null;

  return (
    <Card
      radius="lg"
      shadow="sm"
      className="w-full h-full overflow-hidden border border-default-200/50 dark:border-white/10 bg-content1/80 dark:bg-content1/60 backdrop-blur-md
                 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Cover */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
        <img
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          src={project.image}
        />

        {/* nicer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {/* top actions */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Chip
              color={getStatusProjectColor(project.status) as any}
              variant="shadow"
              size="sm"
              classNames={{ base: "border border-white/15 h-6 text-xs" }}
            >
              {project.status}
            </Chip>
          </div>

          <div className="flex items-center gap-1">
            {project.mapUrl ? (
              <Button
                as="a"
                href={project.mapUrl}
                target="_blank"
                rel="noreferrer"
                size="sm"
                variant="flat"
                className="bg-black/35 text-white border border-white/10 h-8 px-2"
                isIconOnly
              >
                <ExternalLink size={16} />
              </Button>
            ) : null}

            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="bg-black/35 text-white border border-white/10 h-8"
            >
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        {/* title on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white text-base sm:text-lg font-bold line-clamp-1">
            {project.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-white/80 text-xs sm:text-sm">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{project.address}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <CardBody className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Client + Budget (โปร่งขึ้น) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {project.client?.charAt?.(0) ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-default-400 uppercase tracking-wider font-semibold">
                Client
              </div>
              <div className="text-sm font-semibold truncate">{project.client}</div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] text-default-400 font-semibold flex items-center justify-end gap-1">
              <Wallet size={12} className="text-default-400" /> Budget
            </div>
            <div className="text-sm font-bold">{fmtMoney(project.budget)}</div>
          </div>
        </div>

        {/* Timeline pills (เริ่ม/จบ/กี่วัน/ทำไปกี่วัน) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-default-400" /> Start
            </div>
            <div className="text-sm font-semibold mt-1">{fmtDate(startPlanned)}</div>
          </div>

          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-default-400" /> Finish
            </div>
            <div className="text-sm font-semibold mt-1">{fmtDate(finishPlanned)}</div>
          </div>

          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Clock size={12} className="text-default-400" /> Planned
            </div>
            <div className="text-sm font-semibold mt-1">
              {plannedDays != null ? `${plannedDays} days` : "-"}
            </div>
          </div>

          <div className="rounded-xl border border-default-200/60 dark:border-white/10 bg-default-50/60 dark:bg-default-100/5 p-3">
            <div className="text-[11px] text-default-500 font-semibold flex items-center gap-1">
              <Clock size={12} className="text-default-400" /> Elapsed
            </div>
            <div className="text-sm font-semibold mt-1">
              {elapsedDays != null ? `${Math.max(elapsedDays, 0)} days` : "-"}
            </div>
          </div>
        </div>

        {/* Progress (ชัดขึ้น แต่ไม่หนา) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-default-500">Progress</span>
            <span className="text-primary">{project.progress ?? 0}%</span>
          </div>
          <Progress
            value={project.progress ?? 0}
            color={getStatusProjectColor(project.status) as any}
            size="sm"
            radius="full"
            classNames={{ track: "h-2", indicator: "h-2" }}
          />
        </div>
      </CardBody>

      <Divider className="opacity-60" />

      {/* Footer */}
      <CardFooter className="px-4 py-3 sm:px-5 sm:py-4 flex justify-between items-center bg-default-50/40 dark:bg-zinc-900/20">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Calendar size={14} className="text-default-400" />

          <span
            className={
              dueInfo.tone === "danger"
                ? "text-danger font-semibold"
                : dueInfo.tone === "warning"
                  ? "text-warning font-semibold"
                  : dueInfo.tone === "success"
                    ? "text-success font-semibold"
                    : dueInfo.tone === "primary"
                      ? "text-primary font-semibold"
                      : "text-default-500"
            }
          >
            {dueInfo.label}
          </span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="group/link flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-600 transition-colors"
        >
          View Details
          <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;