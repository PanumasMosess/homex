export interface NavbarProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export interface SidebarProps {
  isOpenSideBar: boolean;
  isCollapsed: boolean;
  setIsOpen: (v: boolean) => void;
}

export interface CreateProjectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organizationId: number;
  currentUserId: number;
}

export type ProjectUI = {
  id: number;
  name: string | null;
  client: string;
  address: string;
  status: string;
  progress: number;
  // dueDate: string;
  image: string;
  budget: number | null;

  startPlanned: Date | string | null;
  finishPlanned: Date | string | null;
  durationDays: number | null;
  startActual: Date | string | null;
  mapUrl: string | null;
};

export interface MainPageProjectProps {
  organizationId: number;
  currentUserId: number;
  projects: ProjectUI[];
}

export type Status = "todo" | "progress" | "done";

export type Tab = "all" | "progress" | "done" | "todo";

export interface Subtask {
  id: number;
  taskId: number;
  detailName: string;
  detailDesc?: string | null;
  status: boolean;
  weightPercent?: number;
  progressPercent?: number;
  startPlanned?: string | Date | null;
  finishPlanned?: string | Date | null;
  startActual?: string | Date | null;
  finishActual?: string | Date | null;

  durationDays?: number;
  sortOrder?: number;
}

export interface Task {
  id: number;
  taskName?: string | null;
  taskDesc?: string | null;
  coverImageUrl?: string | null;
  status: string;

  progressPercent: number;
  startPlanned?: Date | string | null;
  finishPlanned?: Date | string | null;
  startActual?: Date | string | null;
  finishActual?: Date | string | null;

  durationDays?: number | null;
  subtasks?: Subtask[];
}

export interface ProjectDetailProps {
  organizationId: number;
  currentUserId: number;
  dataDetail: Task[];
}

export interface CreateMainTaskProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  currentUserId: number;
  projectCode: string;
}

export interface CreateEmployeeProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  positions?: {
    id: number;
    positionName: string;
  }[];
}

export interface CreateCustomerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface MainPageUserProps {
  users: any[];
  positions: any[];
}

export interface ActionState {
  success: boolean;
  error: boolean;
  message?: string;
}

export interface CreateEmployeeData {
  username: string;
  password: string;
  displayName?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  positionId: number; // employee เลือกเอง
  avatarUrl?: string;
}

export interface CreateCustomerData {
  username: string;
  password: string;
  displayName?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  avatarUrl?: string;
}

export interface MainTaskCardProps {
  task: Task;
  onSelect: (id: number) => void;
}

export interface DropColumnProps {
  status: string;
  tasks: Task[];
  onTaskClick: (id: number) => void;
}
