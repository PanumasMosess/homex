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
  name: string;
  done: boolean;
}

export interface Task {
  id: number;
  name: string;
  image: string;
  status: Status;
  startAt?: string;
  subtasks: Subtask[];
}

export interface ProjectDetailProps {
  organizationId: number;
  currentUserId: number;
}