"use client";

import { Settings, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

import PositionTable from "./position/PositionTable";
import PermissionTable from "./permission/PermissionTable";

import CreatePosition from "./position/forms/createPosition";
import CreatePermission from "./permission/forms/createPermission";

import {
  deletePosition,
  restorePosition,
} from "@/lib/actions/actionPosition";

import {
  deletePermission,
  restorePermission,
} from "@/lib/actions/actionPermission";

export default function MainPageSetting({
  positions,
  permissions,
}: {
  positions: any[];
  permissions: any[];
}) {

  const router = useRouter();
  const [positionOpen, setPositionOpen] = useState(false);
  const [editPosition, setEditPosition] = useState<any>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editPermission, setEditPermission] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleToggle = (type: "position" | "permission", data: any) => {
    setDeleteModal({
      type,
      data,
    });
  };

  const confirmToggle = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    const { type, data } = deleteModal;
    const res =
      type === "position"
        ? data.isActive
          ? await deletePosition(data.id)
          : await restorePosition(data.id)
        : data.isActive
          ? await deletePermission(data.id)
          : await restorePermission(data.id);
    setIsDeleting(false);
    if (res.success) {
      toast.success(
        data.isActive
          ? "ปิดการใช้งานเรียบร้อย"
          : "เปิดใช้งานเรียบร้อย"
      );
      router.refresh();
      setDeleteModal(null);
    } else {
      toast.error(res.message || "ไม่สำเร็จ");
    }
  };

  const isActive = deleteModal?.data?.isActive;

  return (

    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-orange-500/10">
          <Settings className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            System Setting
          </h1>
          <p className="text-default-400 text-sm">
            จัดการตำแหน่งและสิทธิ
          </p>
        </div>
      </div>

      {/* TABLE GRID */}
      <div className="grid xl:grid-cols-2 gap-8">

        <PositionTable
          positions={positions}
          onAdd={() => {
            setEditPosition(null);
            setPositionOpen(true);
          }}
          onEdit={(p) => {
            setEditPosition(p);
            setPositionOpen(true);
          }}
          onToggle={(p) => handleToggle("position", p)}
        />

        <PermissionTable
          permissions={permissions}
          onAdd={() => {
            setEditPermission(null);
            setPermissionOpen(true);
          }}
          onEdit={(p) => {
            setEditPermission(p);
            setPermissionOpen(true);
          }}
          onToggle={(p) => handleToggle("permission", p)}
        />

      </div>

      {/* POSITION FORM */}
      <CreatePosition
        key={`position-${editPosition?.id ?? "create"}`}
        isOpen={positionOpen}
        onOpenChange={setPositionOpen}
        editData={editPosition}
      />

      {/* PERMISSION FORM */}
      <CreatePermission
        key={`permission-${editPermission?.id ?? "create"}`}
        isOpen={permissionOpen}
        onOpenChange={setPermissionOpen}
        editData={editPermission}
      />
      
      {/* CONFIRM MODAL */}
      <Modal
        isOpen={!!deleteModal}
        onOpenChange={(open) => {
          if (!open) setDeleteModal(null);
        }}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                  <AlertTriangle className="text-danger" size={20} />
                </div>
                <div>
                  <div className="font-semibold">
                    {isActive
                      ? "ยืนยันการปิดการใช้งาน"
                      : "ยืนยันการเปิดใช้งาน"}
                  </div>
                  <div className="text-xs text-default-400">
                    {isActive
                      ? "สามารถเปิดใช้งานใหม่ได้ภายหลัง"
                      : "รายการนี้จะกลับมาใช้งานได้"}
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <p>
                  คุณต้องการ
                  <b
                    className={
                      isActive
                        ? "text-danger"
                        : "text-primary"
                    }
                  >
                    {isActive
                      ? " ปิดการใช้งาน "
                      : " เปิดใช้งาน "}
                  </b>
                  <b>
                    {deleteModal?.data?.permissionName ??
                      deleteModal?.data?.positionName}
                  </b>
                  ใช่หรือไม่?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                >
                  ยกเลิก
                </Button>
                <Button
                  color={
                    isActive ? "danger" : "primary"
                  }
                  onPress={confirmToggle}
                  isLoading={isDeleting}
                >
                  {isActive
                    ? "ปิดการใช้งาน"
                    : "เปิดใช้งาน"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}