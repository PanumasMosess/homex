export interface NavbarProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (v: boolean) => void;
}

export interface CreateProjectProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organizationId: number;
  currentUserId: number;
}

