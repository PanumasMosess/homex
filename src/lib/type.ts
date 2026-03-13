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
  userType: any;
  users: {
    id: number;
    displayName: string | null;
    position?: {
      positionName: string;
    } | null;
  }[];
}

export type Status = "todo" | "progress" | "done";

export type TabTask = "all" | "progress" | "done" | "todo" | "user";

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

  durationDays?: number | null;
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
  budget: number | null;
  details?: Subtask[];
}

export interface ProjectDetailProps {
  organizationId: number;
  currentUserId: number;
  dataDetail: Task[];
  isSpadmin: any;
}

export interface CreateMainTaskProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  organizationId: number;
  currentUserId: number;
  projectCode: string;
  members: any[];
}

export interface CreateEmployeeProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  positions?: {
    id: number;
    positionName: string;
  }[];
  editData?: any;
}

export interface CreateCustomerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

export interface MainPageUserProps {
  users: any[];
  positions: any[];
}

export type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
  taskId?: number;
};

export interface CreateEmployeeData {
  username: string;
  password?: string;
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
  password?: string;
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

export interface TaskFilterTabsProps {
  activeTab: TabTask;
  setActiveTab: (tab: TabTask) => void;
}

export interface SubtaskItemProps {
  subtask: any;
  updatingSubtaskId: number | null;
  editingSubtaskId: number | null;
  editingSubtaskData: any;
  isSavingSubtaskEdit: boolean;
  setEditingSubtaskData: (data: any) => void;
  startEditSubtask: (subtask: any) => void;
  setEditingSubtaskId: (id: number | null) => void;
  handleSaveSubtaskEdit: () => void;
  handleToggleSubtask: (id: number, status: boolean) => void;
  handleDeleteSubtask: (id: number) => void;
  canManage?: boolean;
}

export interface CreateSubtaskFormProps {
  isAddingSubtask: boolean;
  setIsAddingSubtask: (val: boolean) => void;
  newSubtask: any;
  setNewSubtask: (val: any) => void;
  handleSaveSubtask: () => void;
  isSavingSubtask: boolean;
  taskName?: string;
  onAISuccess?: (subtasks: any[]) => void;
}

export interface UpdateMainTaskProps {
  isEditMode: boolean;
  selected: any;
  editFormData: any;
  setEditFormData: (data: any) => void;
  isUpdatingStatusMainTask: boolean;
  handleUpdateStatusMainTask: (status: string) => void;
  members: any[];
  isOwner: any;
}

export interface DeleteTaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  taskName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export interface TaskActionButtonsProps {
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  isSaving: boolean;
  handleSaveTaskEdit: () => void;
  setIsDeleteModalOpen: (val: boolean) => void;
}

export interface CreatePositionProps {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  editData?: any;
}

export interface CreatePositionData {
  positionName: string;
  positionDesc?: string;
}

export interface DeleteSubtaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
}

export type CreatePermissionProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
};

export interface CreatePermissionData {
  permissionKey: string;
  permissionName: string;
  permissionDesc?: string;
}

export type SectionType =
  | "tasks"
  | "purchasing"
  | "documents"
  | "camera"
  | (string & {});

export type CreateSupplierProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
};

export interface CreateSupplierData {
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  supplierDesc?: string;
}
