"use client";

import { Input } from "@heroui/react";
import { Settings, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
import { AlertTriangle } from "lucide-react";

import PositionTable from "./position/PositionTable";
import CreatePosition from "./position/forms/createPosition";

import {
  deletePosition,
  restorePosition,
} from "@/lib/actions/actionPosition";

export default function MainPageSetting({
  positions,
}: {
  positions: any[];
}) {

  const router = useRouter();

  const [positionOpen, setPositionOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    position: any;
  }>({
    isOpen: false,
    position: null,
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = (p: any) => {
    setDeleteModal({
      isOpen: true,
      position: p,
    });
  };

  const handleConfirmToggle = async () => {
    if (!deleteModal.position) return;

    setIsDeleting(true);

    const p = deleteModal.position;

    const res = p.isActive
      ? await deletePosition(p.id)
      : await restorePosition(p.id);

    setIsDeleting(false);

    if (res.success) {
      toast.success(
        p.isActive
          ? "ปิดการใช้งานเรียบร้อย"
          : "เปิดใช้งานเรียบร้อย"
      );

      setDeleteModal({ isOpen: false, position: null });
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สำเร็จ");
    }
  };

  const isActive = deleteModal.position?.isActive;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-orange-500/10">
          <Settings className="text-orange-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            Position Management
          </h1>
          <p className="text-default-400 text-sm">
            จัดการตำแหน่งในองค์กร
          </p>
        </div>
      </div>

      {/* 🔥 GRID แบบหน้า USER */}
      <div className="grid xl:grid-cols-2 gap-8">

        {/* ใส่แค่ฝั่งซ้าย */}
        <PositionTable
          positions={positions}
          onAdd={() => {
            setEditData(null);
            setPositionOpen(true);
          }}
          onEdit={(p) => {
            setEditData(p);
            setPositionOpen(true);
          }}
          onToggle={handleToggle}
        />

        {/* ฝั่งขวาปล่อยว่างไว้ให้ layout เท่ากัน */}
        <div className="hidden xl:block" />

      </div>

      <CreatePosition
        key={`position-${editData?.id ?? "create"}`}
        isOpen={positionOpen}
        onOpenChange={setPositionOpen}
        editData={editData}
      />

      {/* CONFIRM MODAL */}
      <Modal
        isOpen={deleteModal.isOpen}
        onOpenChange={(open) => {
          if (!open)
            setDeleteModal({ isOpen: false, position: null });
        }}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                  <AlertTriangle
                    className="text-danger"
                    size={20}
                  />
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
                      : "ตำแหน่งนี้จะกลับมาใช้งานได้"}
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
                    {deleteModal.position?.positionName}
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
                  onPress={handleConfirmToggle}
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