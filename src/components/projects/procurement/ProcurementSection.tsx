"use client";

import { useState, useEffect, useTransition, useMemo, useCallback, Fragment, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Button,
  Input,
  Chip,
  Spinner,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  Plus,
  Search,
  Trash2,
  Save,
  X,
  Pencil,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Link2,
  Check,
  CheckCircle2,
  ImageIcon,
  Calendar,
  Store,
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  ProcurementSectionProps,
  ProcurementItemData,
  ProcurementStatus,
} from "@/lib/type";
import {
  getProcurementItems,
  createProcurementItem,
  createManyProcurementItems,
  updateProcurementItem,
  updateProcurementStatus,
  deleteProcurementItem,
} from "@/lib/actions/actionProcurement";
import {
  PROCUREMENT_STATUSES,
  PART_TYPES,
  MATERIAL_GROUPS,
} from "@/lib/formValidationSchemas";
import { generateMaterialPriceEstimate } from "@/lib/ai/geminiAI";
import {
  updateAiEstimates,
  addProcurementItemImage,
  deleteProcurementItemImage,
  createSupplierQuote,
  deleteSupplierQuote,
  selectSupplierQuote,
  linkProcurementTask,
  unlinkProcurementTask,
} from "@/lib/actions/actionProcurement";
import { uploadImageFormData } from "@/lib/actions/actionIndex";
import QuotePanel from "./QuotePanel";
import AiMaterialExtractor from "./AiMaterialExtractor";
import PurchaseOrderPanel from "./PurchaseOrderPanel";

const STATUS_LABELS: Record<string, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" }> = {
  PENDING: { label: "รอจัดซื้อ", color: "default" },
  PURCHASING: { label: "อยู่ระหว่างจัดซื้อ", color: "primary" },
  DELIVERING: { label: "อยู่ระหว่างนำส่ง", color: "secondary" },
  ARRIVED: { label: "ของถึงแล้ว", color: "success" },
  LOW_STOCK: { label: "ใกล้หมด", color: "warning" },
  OUT_OF_STOCK: { label: "ขาดสต๊อก", color: "danger" },
};

const PART_LABELS: Record<string, string> = {
  EXT: "ภายนอก",
  INT: "ภายใน",
  OTHER: "อื่นๆ",
};

const GROUP_LABELS: Record<string, string> = {
  MAIN: "วัสดุหลัก",
  GENERAL: "ทั่วไป",
  MACHINERY: "เครื่องจักร",
  OTHER: "อื่นๆ",
};

interface TempQuoteData {
  id: number; // local temp id for key
  supplierId: number;
  supplierName: string;
  unitPrice: string;
  totalPrice: string;
  quoteDate: string;
  validUntil: string;
  note: string;
  isSelected: boolean;
}

interface NewRowData {
  materialName: string;
  specification: string;
  partType: string;
  materialGroup: string;
  unit: string;
  quantity: string;
  expectedDate: string;
  leadTimeDays: string;
  note: string;
  pendingFiles: File[];
  previewUrls: string[];
  quotes: TempQuoteData[];
  taskIds: number[];
}

const EMPTY_NEW_ROW: NewRowData = {
  materialName: "",
  specification: "",
  partType: "OTHER",
  materialGroup: "GENERAL",
  unit: "",
  quantity: "",
  expectedDate: "",
  leadTimeDays: "",
  note: "",
  pendingFiles: [],
  previewUrls: [],
  quotes: [],
  taskIds: [],
};

const ProcurementSection = ({
  projectId,
  organizationId,
  currentUserId,
  suppliers,
  tasks,
}: ProcurementSectionProps) => {
  const [items, setItems] = useState<ProcurementItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Inline edit state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Record<string, any>>({});

  // New rows state (multi-row inline add)
  const [newRows, setNewRows] = useState<NewRowData[]>([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  // Expanded row (for QuotePanel)
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [estimatingItemId, setEstimatingItemId] = useState<number | null>(null);

  // Inline image upload
  const [uploadingImageItemId, setUploadingImageItemId] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageTargetItemId = useRef<number | null>(null);

  // Task link dialog for new rows
  const [taskDialogRowIdx, setTaskDialogRowIdx] = useState<number | null>(null);
  const [tempTaskIds, setTempTaskIds] = useState<Set<number>>(new Set());
  const [taskDialogSearch, setTaskDialogSearch] = useState("");

  const openTaskDialog = (rowIdx: number) => {
    setTempTaskIds(new Set(newRows[rowIdx].taskIds));
    setTaskDialogSearch("");
    setTaskDialogRowIdx(rowIdx);
  };

  const confirmTaskDialog = () => {
    if (taskDialogRowIdx === null) return;
    setNewRows((prev) =>
      prev.map((r, i) =>
        i === taskDialogRowIdx ? { ...r, taskIds: Array.from(tempTaskIds) } : r,
      ),
    );
    setTaskDialogRowIdx(null);
  };

  const filteredDialogTasks = useMemo(() => {
    if (taskDialogRowIdx === null) return [];
    const q = taskDialogSearch.toLowerCase();
    return tasks.filter(
      (t) =>
        !q || t.taskName?.toLowerCase().includes(q) || String(t.id).includes(q),
    );
  }, [tasks, taskDialogSearch, taskDialogRowIdx]);

  // Quote dialog for new rows (QuotePanel-like)
  const [quoteDialogRowIdx, setQuoteDialogRowIdx] = useState<number | null>(null);
  const [tempQuotes, setTempQuotes] = useState<TempQuoteData[]>([]);
  const [quoteNextId, setQuoteNextId] = useState(1);
  const [newQuoteForm, setNewQuoteForm] = useState({
    supplierId: "",
    unitPrice: "",
    totalPrice: "",
    quoteDate: "",
    validUntil: "",
    note: "",
  });
  const [isAddingQuote, setIsAddingQuote] = useState(false);

  const openQuoteDialog = (rowIdx: number) => {
    setTempQuotes([...newRows[rowIdx].quotes]);
    setIsAddingQuote(false);
    setNewQuoteForm({ supplierId: "", unitPrice: "", totalPrice: "", quoteDate: "", validUntil: "", note: "" });
    setQuoteDialogRowIdx(rowIdx);
  };

  const addTempQuote = () => {
    if (!newQuoteForm.supplierId) {
      toast.warning("กรุณาเลือก Supplier");
      return;
    }
    const supplier = suppliers.find((s) => s.id === Number(newQuoteForm.supplierId));
    if (!supplier) return;
    const isFirst = tempQuotes.length === 0;
    setTempQuotes((prev) => [
      ...prev,
      {
        id: quoteNextId,
        supplierId: supplier.id,
        supplierName: supplier.supplierName,
        unitPrice: newQuoteForm.unitPrice,
        totalPrice: newQuoteForm.totalPrice,
        quoteDate: newQuoteForm.quoteDate,
        validUntil: newQuoteForm.validUntil,
        note: newQuoteForm.note,
        isSelected: isFirst,
      },
    ]);
    setQuoteNextId((n) => n + 1);
    setNewQuoteForm({ supplierId: "", unitPrice: "", totalPrice: "", quoteDate: "", validUntil: "", note: "" });
    setIsAddingQuote(false);
  };

  const selectTempQuote = (id: number) => {
    setTempQuotes((prev) =>
      prev.map((q) => ({ ...q, isSelected: q.id === id })),
    );
  };

  const deleteTempQuote = (id: number) => {
    setTempQuotes((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      if (filtered.length > 0 && !filtered.some((q) => q.isSelected)) {
        filtered[0].isSelected = true;
      }
      return filtered;
    });
  };

  // AI estimate for quote dialog (temp, not saved to DB)
  const [dialogAiEstimate, setDialogAiEstimate] = useState<{ min: number; mid: number; max: number } | null>(null);
  const [isDialogEstimating, setIsDialogEstimating] = useState(false);

  const handleDialogAiEstimate = async () => {
    if (quoteDialogRowIdx === null) return;
    const row = newRows[quoteDialogRowIdx];
    if (!row.materialName.trim()) {
      toast.warning("กรุณากรอกชื่อวัสดุก่อน");
      return;
    }
    setIsDialogEstimating(true);
    setDialogAiEstimate(null);
    try {
      const estimate = await generateMaterialPriceEstimate(
        row.materialName,
        row.specification || "",
        row.unit || "",
        row.quantity ? Number(row.quantity) : null,
      );
      if (estimate) {
        setDialogAiEstimate({ min: estimate.priceMin, mid: estimate.priceMid, max: estimate.priceMax });
        toast.success(`AI ประเมินราคา: ฿${estimate.priceMid.toLocaleString()}/หน่วย`);
      } else {
        toast.error("AI ไม่สามารถประเมินราคาได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการประเมินราคา");
    } finally {
      setIsDialogEstimating(false);
    }
  };

  const confirmQuoteDialog = () => {
    if (quoteDialogRowIdx === null) return;
    setNewRows((prev) =>
      prev.map((r, i) =>
        i === quoteDialogRowIdx ? { ...r, quotes: [...tempQuotes] } : r,
      ),
    );
    setQuoteDialogRowIdx(null);
    setDialogAiEstimate(null);
  };

  // --- Edit-mode Task dialog (existing items, server actions) ---
  const [editTaskItem, setEditTaskItem] = useState<ProcurementItemData | null>(null);
  const [editTaskIds, setEditTaskIds] = useState<Set<number>>(new Set());
  const [editTaskSearch, setEditTaskSearch] = useState("");
  const [isEditTaskPending, setIsEditTaskPending] = useState(false);

  const openEditTaskDialog = (item: ProcurementItemData) => {
    setEditTaskIds(new Set(item.taskLinks.map((tl) => tl.taskId)));
    setEditTaskSearch("");
    setEditTaskItem(item);
  };

  const confirmEditTaskDialog = async () => {
    if (!editTaskItem) return;
    setIsEditTaskPending(true);
    try {
      const oldIds = new Set(editTaskItem.taskLinks.map((tl) => tl.taskId));
      const newIds = editTaskIds;

      // Unlink removed tasks
      for (const tl of editTaskItem.taskLinks) {
        if (!newIds.has(tl.taskId)) {
          await unlinkProcurementTask(tl.id);
        }
      }
      // Link added tasks
      for (const tid of newIds) {
        if (!oldIds.has(tid)) {
          await linkProcurementTask(editTaskItem.id, tid, "MANUAL");
        }
      }

      toast.success("อัปเดต Task สำเร็จ");
      setEditTaskItem(null);
      await loadItems();
    } catch {
      toast.error("อัปเดต Task ไม่สำเร็จ");
    } finally {
      setIsEditTaskPending(false);
    }
  };

  const filteredEditTasks = useMemo(() => {
    if (!editTaskItem) return [];
    const q = editTaskSearch.toLowerCase();
    return tasks.filter(
      (t) => !q || t.taskName?.toLowerCase().includes(q) || String(t.id).includes(q),
    );
  }, [tasks, editTaskSearch, editTaskItem]);

  // --- Edit-mode Quote dialog (existing items, server actions) ---
  const [editQuoteItem, setEditQuoteItem] = useState<ProcurementItemData | null>(null);
  const [isEditQuotePending, setIsEditQuotePending] = useState(false);
  const [editQuoteForm, setEditQuoteForm] = useState({
    supplierId: "",
    unitPrice: "",
    totalPrice: "",
    quoteDate: "",
    validUntil: "",
    note: "",
  });
  const [isEditAddingQuote, setIsEditAddingQuote] = useState(false);
  const [editAiEstimate, setEditAiEstimate] = useState<{ min: number; mid: number; max: number } | null>(null);
  const [isEditEstimating, setIsEditEstimating] = useState(false);

  const openEditQuoteDialog = (item: ProcurementItemData) => {
    setEditQuoteForm({ supplierId: "", unitPrice: "", totalPrice: "", quoteDate: "", validUntil: "", note: "" });
    setIsEditAddingQuote(false);
    setEditAiEstimate(null);
    setEditQuoteItem(item);
  };

  const handleEditAddQuote = async () => {
    if (!editQuoteItem || !editQuoteForm.supplierId) {
      toast.warning("กรุณาเลือก Supplier");
      return;
    }
    setIsEditQuotePending(true);
    try {
      const res = await createSupplierQuote({
        procurementItemId: editQuoteItem.id,
        supplierId: Number(editQuoteForm.supplierId),
        unitPrice: editQuoteForm.unitPrice ? Number(editQuoteForm.unitPrice) : undefined,
        totalPrice: editQuoteForm.totalPrice ? Number(editQuoteForm.totalPrice) : undefined,
        quoteDate: editQuoteForm.quoteDate || undefined,
        validUntil: editQuoteForm.validUntil || undefined,
        note: editQuoteForm.note || undefined,
      });
      if (res.success) {
        toast.success("เพิ่มใบเสนอราคาสำเร็จ");
        setEditQuoteForm({ supplierId: "", unitPrice: "", totalPrice: "", quoteDate: "", validUntil: "", note: "" });
        setIsEditAddingQuote(false);
        await loadItems();
        // Refresh editQuoteItem with updated data
        const refreshed = items.find((i) => i.id === editQuoteItem.id);
        // items state may not be updated yet, so we'll use loadItems callback
      } else {
        toast.error(res.message || "เพิ่มไม่สำเร็จ");
      }
    } finally {
      setIsEditQuotePending(false);
    }
  };

  const handleEditSelectQuote = async (quoteId: number) => {
    if (!editQuoteItem) return;
    setIsEditQuotePending(true);
    try {
      const res = await selectSupplierQuote(editQuoteItem.id, quoteId);
      if (res.success) {
        toast.success("เลือก Supplier สำเร็จ");
        await loadItems();
      } else {
        toast.error(res.message || "เลือกไม่สำเร็จ");
      }
    } finally {
      setIsEditQuotePending(false);
    }
  };

  const handleEditDeleteQuote = async (quoteId: number) => {
    if (!confirm("ต้องการลบใบเสนอราคานี้ใช่หรือไม่?")) return;
    setIsEditQuotePending(true);
    try {
      const res = await deleteSupplierQuote(quoteId);
      if (res.success) {
        toast.success("ลบใบเสนอราคาสำเร็จ");
        await loadItems();
      } else {
        toast.error(res.message || "ลบไม่สำเร็จ");
      }
    } finally {
      setIsEditQuotePending(false);
    }
  };

  const handleEditAiEstimate = async () => {
    if (!editQuoteItem) return;
    setIsEditEstimating(true);
    setEditAiEstimate(null);
    try {
      const estimate = await generateMaterialPriceEstimate(
        editQuoteItem.materialName,
        editQuoteItem.specification || "",
        editQuoteItem.unit || "",
        editQuoteItem.quantity,
      );
      if (estimate) {
        setEditAiEstimate({ min: estimate.priceMin, mid: estimate.priceMid, max: estimate.priceMax });
        // Also save to DB for existing item
        await updateAiEstimates(editQuoteItem.id, estimate.priceMin, estimate.priceMid, estimate.priceMax);
        toast.success(`AI ประเมินราคา: ฿${estimate.priceMid.toLocaleString()}/หน่วย`);
        await loadItems();
      } else {
        toast.error("AI ไม่สามารถประเมินราคาได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการประเมินราคา");
    } finally {
      setIsEditEstimating(false);
    }
  };

  const formatDate = (d: string | Date | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
  };

  // Keep editQuoteItem in sync with items after loadItems refreshes
  useEffect(() => {
    if (editQuoteItem) {
      const refreshed = items.find((i) => i.id === editQuoteItem.id);
      if (refreshed) setEditQuoteItem(refreshed);
    }
  }, [items]);

  const triggerImageUpload = (itemId: number) => {
    imageTargetItemId.current = itemId;
    imageInputRef.current?.click();
  };

  const uploadFileToS3 = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("path", folder);
      const res = await uploadImageFormData(fd);
      if (!res.success) {
        console.error("uploadImageFormData failed:", res.error);
        return null;
      }
      return res.url ?? null;
    } catch (err) {
      console.error("uploadFileToS3 error:", err);
      return null;
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const itemId = imageTargetItemId.current;
    if (!files || files.length === 0 || !itemId) return;

    setUploadingImageItemId(itemId);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      try {
        const publicUrl = await uploadFileToS3(file, `procurement/${itemId}`);
        if (publicUrl) {
          const save = await addProcurementItemImage(itemId, publicUrl);
          if (save.success) count++;
          else console.error("addProcurementItemImage failed:", save.message);
        } else {
          toast.error(`อัปโหลด ${file.name} ไม่สำเร็จ`);
        }
      } catch (err) {
        console.error("handleInlineImageUpload file error:", err);
        toast.error(`อัปโหลด ${file.name} ไม่สำเร็จ`);
      }
    }

    if (count > 0) {
      toast.success(`อัปโหลด ${count} รูปสำเร็จ`);
      await loadItems();
    } else if (files.length > 0) {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
    }
    setUploadingImageItemId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleInlineImageDelete = async (imageId: number) => {
    const res = await deleteProcurementItemImage(imageId);
    if (res.success) {
      toast.success("ลบรูปสำเร็จ");
      await loadItems();
    } else {
      toast.error("ลบรูปไม่สำเร็จ");
    }
  };

  // Load data
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProcurementItems(projectId);
      setItems(data as ProcurementItemData[]);
    } catch {
      toast.error("โหลดข้อมูลวัสดุไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) loadItems();
  }, [projectId, loadItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter !== "ALL") {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (groupFilter !== "ALL") {
      result = result.filter((i) => i.materialGroup === groupFilter);
    }
    return result;
  }, [items, statusFilter, groupFilter]);

  // --- Inline Edit ---
  const startEdit = (row: ProcurementItemData) => {
    setEditingRowId(row.id);
    setEditingData({
      materialName: row.materialName,
      specification: row.specification || "",
      partType: row.partType || "OTHER",
      materialGroup: row.materialGroup || "GENERAL",
      unit: row.unit || "",
      quantity: row.quantity ?? "",
      status: row.status,
      expectedDate: row.expectedDate ? row.expectedDate.split("T")[0] : "",
      leadTimeDays: row.leadTimeDays ?? "",
      note: row.note || "",
    });
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const saveEdit = async () => {
    if (!editingRowId) return;
    startTransition(async () => {
      const res = await updateProcurementItem(editingRowId, {
        materialName: editingData.materialName,
        specification: editingData.specification || undefined,
        partType: editingData.partType,
        materialGroup: editingData.materialGroup,
        unit: editingData.unit || undefined,
        quantity: editingData.quantity ? Number(editingData.quantity) : undefined,
        status: editingData.status,
        expectedDate: editingData.expectedDate || undefined,
        leadTimeDays: editingData.leadTimeDays ? Number(editingData.leadTimeDays) : undefined,
        note: editingData.note || undefined,
      });

      if (res.success) {
        toast.success("บันทึกสำเร็จ");
        setEditingRowId(null);
        await loadItems();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    });
  };

  // --- Add New (multi-row inline) ---
  const addNewRows = (count: number) => {
    setNewRows((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => ({ ...EMPTY_NEW_ROW })),
    ]);
  };

  const removeNewRow = (idx: number) => {
    setNewRows((prev) => {
      const row = prev[idx];
      // revoke preview URLs to free memory
      row?.previewUrls.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addFilesToNewRow = (idx: number, files: FileList) => {
    const accepted: File[] = [];
    const previews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) continue;
      if (f.size > 5 * 1024 * 1024) continue;
      accepted.push(f);
      previews.push(URL.createObjectURL(f));
    }
    if (accepted.length === 0) return;
    setNewRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              pendingFiles: [...r.pendingFiles, ...accepted],
              previewUrls: [...r.previewUrls, ...previews],
            }
          : r,
      ),
    );
  };

  const removeFileFromNewRow = (rowIdx: number, fileIdx: number) => {
    setNewRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        URL.revokeObjectURL(r.previewUrls[fileIdx]);
        return {
          ...r,
          pendingFiles: r.pendingFiles.filter((_, fi) => fi !== fileIdx),
          previewUrls: r.previewUrls.filter((_, fi) => fi !== fileIdx),
        };
      }),
    );
  };

  const updateNewRow = (idx: number, field: keyof NewRowData, value: string) => {
    setNewRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  };

  const handlePasteNewRow = (
    e: React.ClipboardEvent<HTMLInputElement>,
    rowIdx: number,
    colField: keyof NewRowData,
  ) => {
    const pasteData = e.clipboardData.getData("text");
    if (!pasteData.includes("\t") && !pasteData.includes("\n")) return;
    e.preventDefault();

    const pasteRows = pasteData
      .split("\n")
      .map((line) => line.split("\t"))
      .filter((cols) => cols.some((c) => c.trim()));
    if (pasteRows.length === 0) return;

    const fields: (keyof NewRowData)[] = [
      "materialName", "specification", "unit", "quantity", "note",
    ];
    const startCol = fields.indexOf(colField);
    if (startCol === -1) return;

    setNewRows((prev) => {
      const updated = [...prev];
      while (updated.length < rowIdx + pasteRows.length) {
        updated.push({ ...EMPTY_NEW_ROW });
      }
      pasteRows.forEach((cols, ri) => {
        cols.forEach((val, ci) => {
          const tf = fields[startCol + ci];
          if (tf && updated[rowIdx + ri]) {
            updated[rowIdx + ri] = { ...updated[rowIdx + ri], [tf]: val.trim() };
          }
        });
      });
      return updated;
    });

    toast.info(`วางข้อมูล ${pasteRows.length} แถวจาก Excel`);
  };

  const uploadPendingFiles = async (itemId: number, files: File[]) => {
    for (const file of files) {
      try {
        const publicUrl = await uploadFileToS3(file, `procurement/${itemId}`);
        if (publicUrl) {
          await addProcurementItemImage(itemId, publicUrl);
        }
      } catch { /* skip failed uploads */ }
    }
  };

  const handleSaveNewRows = async () => {
    const validRows = newRows.filter((r) => r.materialName.trim());
    if (validRows.length === 0) {
      toast.warning("กรุณากรอกชื่อวัสดุอย่างน้อย 1 รายการ");
      return;
    }

    startTransition(async () => {
      let savedCount = 0;
      let imageCount = 0;

      for (const row of validRows) {
        const res = await createProcurementItem({
          materialName: row.materialName.trim(),
          specification: row.specification || undefined,
          partType: row.partType,
          materialGroup: row.materialGroup,
          unit: row.unit || undefined,
          quantity: row.quantity ? Number(row.quantity) : undefined,
          expectedDate: row.expectedDate || undefined,
          leadTimeDays: row.leadTimeDays ? Number(row.leadTimeDays) : undefined,
          note: row.note || undefined,
          projectId,
          organizationId,
        });

        if (res.success && res.data?.id) {
          savedCount++;
          const newItemId = res.data.id;

          // Upload pending images if any
          if (row.pendingFiles.length > 0) {
            await uploadPendingFiles(newItemId, row.pendingFiles);
            imageCount += row.pendingFiles.length;
          }

          // Create supplier quotes
          for (const tq of row.quotes) {
            await createSupplierQuote({
              procurementItemId: newItemId,
              supplierId: tq.supplierId,
              unitPrice: tq.unitPrice ? Number(tq.unitPrice) : undefined,
              totalPrice: tq.totalPrice ? Number(tq.totalPrice) : undefined,
              quoteDate: tq.quoteDate || undefined,
              validUntil: tq.validUntil || undefined,
              note: tq.note || undefined,
              isSelected: tq.isSelected,
            });
          }

          // Link tasks if selected
          for (const tid of row.taskIds) {
            await linkProcurementTask(newItemId, tid, "MANUAL");
          }
        }
      }

      if (savedCount > 0) {
        const imgMsg = imageCount > 0 ? ` + ${imageCount} รูป` : "";
        toast.success(`เพิ่ม ${savedCount} รายการสำเร็จ${imgMsg}`);
        // Revoke all preview URLs
        newRows.forEach((r) => r.previewUrls.forEach((u) => URL.revokeObjectURL(u)));
        setNewRows([]);
        await loadItems();
      } else {
        toast.error("เพิ่มรายการไม่สำเร็จ");
      }
    });
  };

  // --- Delete ---
  const handleDelete = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!confirm(`ต้องการลบ "${item?.materialName || "รายการนี้"}" ใช่หรือไม่?`)) return;
    startTransition(async () => {
      const res = await deleteProcurementItem(id);
      if (res.success) {
        toast.success("ลบรายการสำเร็จ");
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error(res.message || "ลบไม่สำเร็จ");
      }
    });
  };

  // --- Status Change ---
  const handleStatusChange = async (id: number, newStatus: string) => {
    startTransition(async () => {
      const res = await updateProcurementStatus(id, newStatus);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: newStatus as ProcurementStatus } : i,
          ),
        );
        toast.success("เปลี่ยนสถานะสำเร็จ");
      } else {
        toast.error(res.message || "เปลี่ยนสถานะไม่สำเร็จ");
      }
    });
  };

  // --- AI Price Estimate ---
  const handleAiEstimate = async (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setEstimatingItemId(itemId);
    try {
      const estimate = await generateMaterialPriceEstimate(
        item.materialName,
        item.specification || "",
        item.unit || "",
        item.quantity,
      );

      if (estimate) {
        const res = await updateAiEstimates(
          itemId,
          estimate.priceMin,
          estimate.priceMid,
          estimate.priceMax,
        );

        if (res.success) {
          toast.success(`AI ประเมินราคา: ฿${estimate.priceMid.toLocaleString()}/หน่วย`);
          await loadItems();
        } else {
          toast.error(res.message || "บันทึกราคาประเมินไม่สำเร็จ");
        }
      } else {
        toast.error("AI ไม่สามารถประเมินราคาได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการประเมินราคา");
    } finally {
      setEstimatingItemId(null);
    }
  };

  // --- Editable Cell ---
  const EditableCell = ({
    value,
    field,
    type = "text",
  }: {
    value: any;
    field: string;
    type?: string;
  }) => {
    if (editingRowId === null) return <span className="truncate">{value ?? "-"}</span>;
    return (
      <input
        type={type}
        value={editingData[field] ?? ""}
        onChange={(e) =>
          setEditingData((prev: Record<string, any>) => ({ ...prev, [field]: e.target.value }))
        }
        className="w-full px-1.5 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  };

  // --- Columns ---
  const columns = useMemo<ColumnDef<ProcurementItemData, any>[]>(
    () => [
      {
        id: "index",
        header: "#",
        size: 40,
        cell: ({ row }) => (
          <span className="text-default-400 text-xs">{row.index + 1}</span>
        ),
      },
      {
        id: "images",
        header: "รูป",
        size: 80,
        cell: ({ row }) => {
          const imgs = row.original.images;
          const isEditing = editingRowId === row.original.id;
          const isUploading = uploadingImageItemId === row.original.id;

          if (imgs.length === 0 && !isEditing) {
            return <span className="text-[10px] text-default-300">—</span>;
          }

          return (
            <div className="flex items-center gap-1">
              {imgs.slice(0, 2).map((img) => (
                <div key={img.id} className="group/img relative w-7 h-7 rounded overflow-hidden border border-default-200 shrink-0">
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  {isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleInlineImageDelete(img.id); }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} className="text-white" />
                    </button>
                  )}
                </div>
              ))}
              {imgs.length > 2 && (
                <span className="text-[10px] text-default-400">+{imgs.length - 2}</span>
              )}
              {isEditing && (
                <Tooltip content="เพิ่มรูป">
                  <button
                    onClick={(e) => { e.stopPropagation(); triggerImageUpload(row.original.id); }}
                    className="w-7 h-7 rounded border border-dashed border-default-300 flex items-center justify-center hover:border-primary hover:bg-primary-50 transition-colors shrink-0"
                  >
                    {isUploading ? (
                      <Spinner size="sm" className="w-3 h-3" />
                    ) : (
                      <ImagePlus size={12} className="text-default-400" />
                    )}
                  </button>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "materialName",
        header: "ชื่อวัสดุ",
        size: 200,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <input
                type="text"
                value={editingData.materialName ?? ""}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    materialName: e.target.value,
                  }))
                }
                className="w-full px-1.5 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            );
          }
          return (
            <span
              className="font-medium cursor-pointer hover:text-primary truncate block"
              onDoubleClick={() => startEdit(row.original)}
            >
              {row.original.materialName}
            </span>
          );
        },
      },
      {
        accessorKey: "specification",
        header: "Spec",
        size: 180,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <input
                type="text"
                value={editingData.specification ?? ""}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    specification: e.target.value,
                  }))
                }
                className="w-full px-1.5 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            );
          }
          return (
            <span className="text-default-500 text-xs truncate block">
              {row.original.specification || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "partType",
        header: "ประเภท",
        size: 90,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <select
                value={editingData.partType ?? "OTHER"}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    partType: e.target.value,
                  }))
                }
                className="w-full px-1 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md"
              >
                {PART_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {PART_LABELS[pt]}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <span className="text-xs">
              {PART_LABELS[row.original.partType || "OTHER"] || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "materialGroup",
        header: "กลุ่ม",
        size: 100,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <select
                value={editingData.materialGroup ?? "GENERAL"}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    materialGroup: e.target.value,
                  }))
                }
                className="w-full px-1 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md"
              >
                {MATERIAL_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>
                    {GROUP_LABELS[mg]}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <Chip size="sm" variant="flat" className="text-[10px]">
              {GROUP_LABELS[row.original.materialGroup || "GENERAL"] || "-"}
            </Chip>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "จำนวน",
        size: 80,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <input
                type="number"
                value={editingData.quantity ?? ""}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                className="w-full px-1.5 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            );
          }
          return (
            <span className="text-xs">
              {row.original.quantity != null ? Number(row.original.quantity).toLocaleString() : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "unit",
        header: "หน่วย",
        size: 70,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <input
                type="text"
                value={editingData.unit ?? ""}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
                className="w-full px-1.5 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md"
              />
            );
          }
          return <span className="text-xs text-default-500">{row.original.unit || "-"}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        size: 130,
        cell: ({ row }) => {
          const st = row.original.status;
          const info = STATUS_LABELS[st] || STATUS_LABELS.PENDING;
          return (
            <select
              value={st}
              onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full border-0 cursor-pointer
                ${st === "ARRIVED" ? "bg-success-100 text-success-700" : ""}
                ${st === "PENDING" ? "bg-default-100 text-default-600" : ""}
                ${st === "PURCHASING" ? "bg-primary-100 text-primary-700" : ""}
                ${st === "DELIVERING" ? "bg-secondary-100 text-secondary-700" : ""}
                ${st === "LOW_STOCK" ? "bg-warning-100 text-warning-700" : ""}
                ${st === "OUT_OF_STOCK" ? "bg-danger-100 text-danger-700" : ""}
              `}
            >
              {PROCUREMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]?.label}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        accessorKey: "expectedDate",
        header: "วันที่ของเข้า",
        size: 120,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <input
                type="date"
                value={editingData.expectedDate ?? ""}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    expectedDate: e.target.value,
                  }))
                }
                className="w-full px-1 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md"
              />
            );
          }
          const d = row.original.expectedDate;
          return (
            <span className="text-xs">
              {d ? new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "leadTimeDays",
        header: "Lead Time",
        size: 80,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <input
                type="number"
                value={editingData.leadTimeDays ?? ""}
                onChange={(e) =>
                  setEditingData((prev: Record<string, any>) => ({
                    ...prev,
                    leadTimeDays: e.target.value,
                  }))
                }
                className="w-full px-1.5 py-1 text-xs bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-md"
              />
            );
          }
          const lt = row.original.leadTimeDays;
          return <span className="text-xs">{lt != null ? `${lt} วัน` : "-"}</span>;
        },
      },
      {
        accessorKey: "taskLinks",
        header: "Task ที่ผูก",
        size: 140,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          const links = row.original.taskLinks || [];
          if (isEditing) {
            return (
              <Button
                size="sm"
                variant="flat"
                color={links.length > 0 ? "primary" : "default"}
                startContent={<Link2 size={12} />}
                onPress={() => openEditTaskDialog(row.original)}
                className="text-[11px] w-full justify-start"
              >
                {links.length > 0 ? `${links.length} Task` : "ผูก Task"}
              </Button>
            );
          }
          if (links.length === 0) {
            return <span className="text-default-300 text-xs">-</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {links.map((tl) => (
                <Chip key={tl.id} size="sm" variant="flat" color="primary" className="text-[10px]">
                  {tl.task.taskName || `Task #${tl.taskId}`}
                </Chip>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "quotes",
        header: "Supplier",
        size: 120,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          const quotes = row.original.quotes || [];
          if (isEditing) {
            const selected = quotes.find((q) => q.isSelected);
            return (
              <Button
                size="sm"
                variant="flat"
                color={quotes.length > 0 ? "success" : "default"}
                startContent={<Store size={12} />}
                onPress={() => openEditQuoteDialog(row.original)}
                className="text-[11px] w-full justify-start truncate"
              >
                {selected
                  ? selected.supplier.supplierName
                  : quotes.length > 0
                    ? `${quotes.length} ราคา`
                    : "จัดการ Supplier"}
              </Button>
            );
          }
          if (quotes.length === 0) {
            return <span className="text-default-300 text-xs">-</span>;
          }
          const selected = quotes.find((q) => q.isSelected);
          if (selected) {
            return (
              <div className="text-xs">
                <span className="font-medium">{selected.supplier.supplierName}</span>
                {selected.unitPrice && (
                  <span className="text-success-600 ml-1">
                    ฿{Number(selected.unitPrice).toLocaleString()}
                  </span>
                )}
              </div>
            );
          }
          return (
            <span className="text-xs text-warning-500">
              {quotes.length} ราคา (ยังไม่เลือก)
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 100,
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;
          if (isEditing) {
            return (
              <div className="flex gap-1">
                <Tooltip content="บันทึก">
                  <Button
                    isIconOnly
                    size="sm"
                    color="success"
                    variant="flat"
                    onPress={saveEdit}
                    isLoading={isPending}
                  >
                    <Save size={14} />
                  </Button>
                </Tooltip>
                <Tooltip content="ยกเลิก">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={cancelEdit}
                  >
                    <X size={14} />
                  </Button>
                </Tooltip>
              </div>
            );
          }
          return (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip content="แก้ไข">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => startEdit(row.original)}
                >
                  <Pencil size={14} />
                </Button>
              </Tooltip>
              <Tooltip content="ลบ" color="danger">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => handleDelete(row.original.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [editingRowId, editingData, isPending, uploadingImageItemId],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // --- Summary ---
  const summary = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.status === "PENDING").length;
    const purchasing = items.filter((i) => i.status === "PURCHASING").length;
    const delivering = items.filter((i) => i.status === "DELIVERING").length;
    const arrived = items.filter((i) => i.status === "ARRIVED").length;
    return { total, pending, purchasing, delivering, arrived };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for inline image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleInlineImageUpload}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">จัดซื้อวัสดุ</h2>
          <p className="text-default-500 text-xs sm:text-sm">
            จัดการรายการวัสดุและเปรียบเทียบราคา
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <AiMaterialExtractor
            projectId={projectId}
            organizationId={organizationId}
            onSuccess={loadItems}
          />
          <Button
            color="primary"
            radius="full"
            className="font-bold"
            startContent={<Plus size={16} />}
            onPress={() => addNewRows(1)}
          >
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "ทั้งหมด", value: summary.total, color: "bg-default-100" },
          { label: "รอจัดซื้อ", value: summary.pending, color: "bg-default-100" },
          { label: "กำลังจัดซื้อ", value: summary.purchasing, color: "bg-primary-50" },
          { label: "กำลังนำส่ง", value: summary.delivering, color: "bg-secondary-50" },
          { label: "ถึงแล้ว", value: summary.arrived, color: "bg-success-50" },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.color} rounded-xl p-3 text-center`}
          >
            <p className="text-[10px] uppercase text-default-400 font-bold">
              {s.label}
            </p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="ค้นหาวัสดุ..."
          value={globalFilter}
          onValueChange={setGlobalFilter}
          isClearable
          size="sm"
          startContent={<Search size={16} />}
          className="w-full sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-xl bg-default-100 dark:bg-zinc-800 border-0"
        >
          <option value="ALL">สถานะทั้งหมด</option>
          {PROCUREMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]?.label}
            </option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-xl bg-default-100 dark:bg-zinc-800 border-0"
        >
          <option value="ALL">กลุ่มทั้งหมด</option>
          {MATERIAL_GROUPS.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-default-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-default-50 dark:bg-zinc-800/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-[11px] uppercase font-bold text-default-500 whitespace-nowrap cursor-pointer select-none"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ChevronUp size={12} />}
                      {header.column.getIsSorted() === "desc" && <ChevronDown size={12} />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* New Rows (inline multi-row add) */}
            {newRows.length > 0 && (
              <>
                {newRows.map((row, idx) => (
                  <tr
                    key={`new-${idx}`}
                    className="bg-primary-50/30 dark:bg-primary-900/10 border-b border-default-200"
                  >
                    <td className="px-3 py-1.5 text-xs text-default-400 font-mono text-center">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {row.previewUrls.slice(0, 2).map((url, fi) => (
                          <div key={fi} className="group/img relative w-7 h-7 rounded overflow-hidden border border-default-200 shrink-0">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeFileFromNewRow(idx, fi)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <X size={10} className="text-white" />
                            </button>
                          </div>
                        ))}
                        {row.previewUrls.length > 2 && (
                          <span className="text-[10px] text-default-400">+{row.previewUrls.length - 2}</span>
                        )}
                        <label className="w-7 h-7 rounded border border-dashed border-default-300 flex items-center justify-center hover:border-primary hover:bg-primary-50 transition-colors shrink-0 cursor-pointer">
                          <ImagePlus size={12} className="text-default-400" />
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) addFilesToNewRow(idx, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="ชื่อวัสดุ *"
                        value={row.materialName}
                        onChange={(e) => updateNewRow(idx, "materialName", e.target.value)}
                        onPaste={(e) => handlePasteNewRow(e, idx, "materialName")}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus={idx === newRows.length - 1}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="Spec"
                        value={row.specification}
                        onChange={(e) => updateNewRow(idx, "specification", e.target.value)}
                        onPaste={(e) => handlePasteNewRow(e, idx, "specification")}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={row.partType}
                        onChange={(e) => updateNewRow(idx, "partType", e.target.value)}
                        className="w-full px-1 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      >
                        {PART_TYPES.map((pt) => (
                          <option key={pt} value={pt}>{PART_LABELS[pt]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={row.materialGroup}
                        onChange={(e) => updateNewRow(idx, "materialGroup", e.target.value)}
                        className="w-full px-1 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      >
                        {MATERIAL_GROUPS.map((mg) => (
                          <option key={mg} value={mg}>{GROUP_LABELS[mg]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        placeholder="จำนวน"
                        value={row.quantity}
                        onChange={(e) => updateNewRow(idx, "quantity", e.target.value)}
                        onPaste={(e) => handlePasteNewRow(e, idx, "quantity")}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="หน่วย"
                        value={row.unit}
                        onChange={(e) => updateNewRow(idx, "unit", e.target.value)}
                        onPaste={(e) => handlePasteNewRow(e, idx, "unit")}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-xs text-default-400">รอจัดซื้อ</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={row.expectedDate}
                        onChange={(e) => updateNewRow(idx, "expectedDate", e.target.value)}
                        className="w-full px-1 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        placeholder="วัน"
                        value={row.leadTimeDays}
                        onChange={(e) => updateNewRow(idx, "leadTimeDays", e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-default-300 rounded-md"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        size="sm"
                        variant="flat"
                        color={row.taskIds.length > 0 ? "primary" : "default"}
                        startContent={<Link2 size={12} />}
                        onPress={() => openTaskDialog(idx)}
                        className="text-[11px] w-full justify-start"
                      >
                        {row.taskIds.length > 0
                          ? `${row.taskIds.length} Task`
                          : "ผูก Task"}
                      </Button>
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        size="sm"
                        variant="flat"
                        color={row.quotes.length > 0 ? "success" : "default"}
                        startContent={<Store size={12} />}
                        onPress={() => openQuoteDialog(idx)}
                        className="text-[11px] w-full justify-start truncate"
                      >
                        {row.quotes.length > 0
                          ? `${row.quotes.length} ใบเสนอราคา`
                          : "จัดการ Supplier"}
                      </Button>
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => removeNewRow(idx)}
                      >
                        <X size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Action bar for new rows */}
                <tr className="bg-primary-50/20 dark:bg-primary-900/5 border-b-2 border-primary-200">
                  <td colSpan={columns.length} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="flat" onPress={() => addNewRows(1)} startContent={<Plus size={12} />}>
                          +1 แถว
                        </Button>
                        <Button size="sm" variant="flat" onPress={() => addNewRows(5)}>
                          +5
                        </Button>
                        <Button size="sm" variant="flat" onPress={() => addNewRows(10)}>
                          +10
                        </Button>
                        <span className="text-[10px] text-default-400 ml-2">
                          วาง Ctrl+V จาก Excel ได้ · {newRows.filter((r) => r.materialName.trim()).length}/{newRows.length} รายการ
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => setNewRows([])}
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          size="sm"
                          color="success"
                          startContent={<Save size={14} />}
                          onPress={handleSaveNewRows}
                          isLoading={isPending}
                          isDisabled={newRows.filter((r) => r.materialName.trim()).length === 0}
                        >
                          บันทึก {newRows.filter((r) => r.materialName.trim()).length} รายการ
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            )}

            {/* Data rows */}
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-16 text-default-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-medium">ยังไม่มีรายการวัสดุ</p>
                    <p className="text-xs">กด "เพิ่มรายการ" เพื่อเริ่มเพิ่มวัสดุ</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedRowId === row.original.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`group border-b border-default-100 dark:border-zinc-800 hover:bg-default-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                        editingRowId === row.original.id ? "bg-warning-50/30 dark:bg-warning-900/10" : ""
                      } ${isExpanded ? "bg-primary-50/20 dark:bg-primary-900/5" : ""}`}
                      onDoubleClick={() => {
                        if (editingRowId === null) startEdit(row.original);
                      }}
                      onClick={() => {
                        if (editingRowId === null) {
                          setExpandedRowId(isExpanded ? null : row.original.id);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2 whitespace-nowrap"
                          style={{ maxWidth: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          <QuotePanel
                            item={row.original}
                            suppliers={suppliers}
                            onRefresh={loadItems}
                            onAiEstimate={handleAiEstimate}
                            isEstimating={estimatingItemId === row.original.id}
                            tasks={tasks}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-default-400 px-1">
        <span>
          แสดง {table.getRowModel().rows.length} จาก {items.length} รายการ
        </span>
        <span>Double-click เพื่อแก้ไข</span>
      </div>

      {/* Purchase Orders */}
      <PurchaseOrderPanel
        projectId={projectId}
        items={items}
        suppliers={suppliers}
      />

      {/* Task Link Dialog for New Rows */}
      <Modal
        isOpen={taskDialogRowIdx !== null}
        onOpenChange={(open) => {
          if (!open) setTaskDialogRowIdx(null);
        }}
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 pb-2">
                <Link2 size={18} />
                <span>เลือก Task ที่ต้องการผูก</span>
                <Chip size="sm" variant="flat" color="primary" className="ml-2">
                  เลือก {tempTaskIds.size}
                </Chip>
              </ModalHeader>
              <ModalBody className="pt-0">
                <Input
                  placeholder="ค้นหา Task..."
                  value={taskDialogSearch}
                  onValueChange={setTaskDialogSearch}
                  isClearable
                  size="sm"
                  startContent={<Search size={14} />}
                />

                {filteredDialogTasks.length === 0 ? (
                  <p className="text-xs text-default-400 text-center py-8">
                    {taskDialogSearch ? "ไม่พบ Task ที่ตรงกัน" : "ไม่มี Task"}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
                    {filteredDialogTasks.map((task) => {
                      const isSelected = tempTaskIds.has(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setTempTaskIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(task.id)) next.delete(task.id);
                              else next.add(task.id);
                              return next;
                            });
                          }}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-2.5 transition-all
                            hover:shadow-sm
                            ${isSelected
                              ? "border-primary bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                              : "border-default-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-primary-300"
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-10">
                              <CheckCircle2 size={16} className="text-primary" />
                            </div>
                          )}
                          <div className="flex items-start gap-2 pr-5">
                            {task.coverImageUrl ? (
                              <img
                                src={task.coverImageUrl}
                                alt=""
                                className="w-10 h-10 rounded object-cover border border-default-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-default-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                <ImageIcon size={14} className="text-default-300" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate leading-tight">
                                {task.taskName || `Task #${task.id}`}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Chip size="sm" variant="flat" className="text-[10px] h-4">
                                  {task.status === "IN_PROGRESS" ? "กำลังทำ" : task.status === "COMPLETED" ? "เสร็จ" : "ยังไม่เริ่ม"}
                                </Chip>
                                {task.startPlanned && (
                                  <span className="text-[10px] text-default-400 flex items-center gap-0.5">
                                    <Calendar size={10} />
                                    {formatDate(task.startPlanned)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="justify-center">
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="primary"
                  startContent={<Link2 size={14} />}
                  onPress={() => {
                    confirmTaskDialog();
                    onClose();
                  }}
                >
                  ยืนยัน {tempTaskIds.size > 0 ? `(${tempTaskIds.size} Task)` : ""}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Quote Dialog for New Rows (QuotePanel-like) */}
      <Modal
        isOpen={quoteDialogRowIdx !== null}
        onOpenChange={(open) => {
          if (!open) setQuoteDialogRowIdx(null);
        }}
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-2">
                <div className="flex items-center gap-2">
                  <Store size={18} />
                  <span>จัดการใบเสนอราคา</span>
                  {tempQuotes.length > 0 && (
                    <Chip size="sm" variant="flat" color="success" className="ml-2">
                      {tempQuotes.length} รายการ
                    </Chip>
                  )}
                </div>
                {quoteDialogRowIdx !== null && (
                  <p className="text-xs text-default-400 font-normal">
                    {newRows[quoteDialogRowIdx]?.materialName}
                    {newRows[quoteDialogRowIdx]?.specification ? ` | ${newRows[quoteDialogRowIdx].specification}` : ""}
                    {newRows[quoteDialogRowIdx]?.quantity ? ` | ${newRows[quoteDialogRowIdx].quantity} ${newRows[quoteDialogRowIdx]?.unit || ""}` : ""}
                  </p>
                )}
              </ModalHeader>
              <ModalBody className="pt-0 space-y-3">
                {/* AI Estimate */}
                <div className="flex items-center justify-end gap-2">
                  <Tooltip content="AI ประเมินราคากลาง">
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<Sparkles size={14} />}
                      onPress={handleDialogAiEstimate}
                      isLoading={isDialogEstimating}
                    >
                      AI ราคากลาง
                    </Button>
                  </Tooltip>
                </div>

                {dialogAiEstimate && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] uppercase text-success-600 font-bold">ประหยัด</p>
                      <p className="text-sm font-bold text-success-700">
                        ฿{dialogAiEstimate.min.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] uppercase text-primary-600 font-bold">กลาง</p>
                      <p className="text-sm font-bold text-primary-700">
                        ฿{dialogAiEstimate.mid.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] uppercase text-warning-600 font-bold">Premium</p>
                      <p className="text-sm font-bold text-warning-700">
                        ฿{dialogAiEstimate.max.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quote Table */}
                {tempQuotes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-default-200 text-default-500">
                          <th className="text-left py-2 px-2 font-bold">Supplier</th>
                          <th className="text-right py-2 px-2 font-bold">ราคา/หน่วย</th>
                          <th className="text-right py-2 px-2 font-bold">ราคารวม</th>
                          <th className="text-center py-2 px-2 font-bold">วันเสนอราคา</th>
                          <th className="text-center py-2 px-2 font-bold">หมดอายุ</th>
                          <th className="text-left py-2 px-2 font-bold">โน้ต</th>
                          <th className="text-center py-2 px-2 font-bold">เลือก</th>
                          <th className="py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tempQuotes.map((q) => (
                          <tr
                            key={q.id}
                            className={`border-b border-default-100 hover:bg-default-100/50 ${
                              q.isSelected ? "bg-success-50/50 dark:bg-success-900/10" : ""
                            }`}
                          >
                            <td className="py-2 px-2 font-medium">{q.supplierName}</td>
                            <td className="py-2 px-2 text-right">
                              {q.unitPrice ? `฿${Number(q.unitPrice).toLocaleString()}` : "-"}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {q.totalPrice ? `฿${Number(q.totalPrice).toLocaleString()}` : "-"}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {q.quoteDate ? formatDate(q.quoteDate) : "-"}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {q.validUntil ? formatDate(q.validUntil) : "-"}
                            </td>
                            <td className="py-2 px-2 text-default-400 max-w-[120px] truncate">
                              {q.note || "-"}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {q.isSelected ? (
                                <Chip size="sm" color="success" variant="flat" className="text-[10px]">
                                  เลือกแล้ว
                                </Chip>
                              ) : (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="success"
                                  onPress={() => selectTempQuote(q.id)}
                                >
                                  <Check size={14} />
                                </Button>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => deleteTempQuote(q.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-default-400 text-center py-4">
                    ยังไม่มีใบเสนอราคา
                  </p>
                )}

                {/* Add New Quote Form */}
                {isAddingQuote ? (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-default-200 space-y-2">
                    <p className="text-xs font-bold text-default-500 uppercase">เพิ่มใบเสนอราคาใหม่</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <select
                        value={newQuoteForm.supplierId}
                        onChange={(e) => setNewQuoteForm((p) => ({ ...p, supplierId: e.target.value }))}
                        className="col-span-2 sm:col-span-1 px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      >
                        <option value="">-- เลือก Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.supplierName}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="ราคา/หน่วย"
                        value={newQuoteForm.unitPrice}
                        onChange={(e) => setNewQuoteForm((p) => ({ ...p, unitPrice: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      />
                      <input
                        type="number"
                        placeholder="ราคารวม"
                        value={newQuoteForm.totalPrice}
                        onChange={(e) => setNewQuoteForm((p) => ({ ...p, totalPrice: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      />
                      <input
                        type="date"
                        value={newQuoteForm.quoteDate}
                        onChange={(e) => setNewQuoteForm((p) => ({ ...p, quoteDate: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                        title="วันเสนอราคา"
                      />
                      <input
                        type="date"
                        value={newQuoteForm.validUntil}
                        onChange={(e) => setNewQuoteForm((p) => ({ ...p, validUntil: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                        title="หมดอายุ"
                      />
                      <input
                        type="text"
                        placeholder="โน้ต"
                        value={newQuoteForm.note}
                        onChange={(e) => setNewQuoteForm((p) => ({ ...p, note: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setIsAddingQuote(false)}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<Save size={14} />}
                        onPress={addTempQuote}
                      >
                        เพิ่ม
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Plus size={14} />}
                      onPress={() => setIsAddingQuote(true)}
                    >
                      เพิ่ม Supplier
                    </Button>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="justify-center">
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="success"
                  startContent={<Store size={14} />}
                  onPress={() => {
                    confirmQuoteDialog();
                    onClose();
                  }}
                >
                  ยืนยัน
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit-mode Task Dialog (existing items) */}
      <Modal
        isOpen={editTaskItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditTaskItem(null);
        }}
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-2">
                <div className="flex items-center gap-2">
                  <Link2 size={18} />
                  <span>ผูก Task</span>
                  <Chip size="sm" variant="flat" color="primary" className="ml-2">
                    เลือก {editTaskIds.size}
                  </Chip>
                </div>
                {editTaskItem && (
                  <p className="text-xs text-default-400 font-normal">
                    {editTaskItem.materialName}
                    {editTaskItem.specification ? ` | ${editTaskItem.specification}` : ""}
                  </p>
                )}
              </ModalHeader>
              <ModalBody className="pt-0">
                <Input
                  placeholder="ค้นหา Task..."
                  value={editTaskSearch}
                  onValueChange={setEditTaskSearch}
                  isClearable
                  size="sm"
                  startContent={<Search size={14} />}
                />

                {filteredEditTasks.length === 0 ? (
                  <p className="text-xs text-default-400 text-center py-8">
                    {editTaskSearch ? "ไม่พบ Task ที่ตรงกัน" : "ไม่มี Task"}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
                    {filteredEditTasks.map((task) => {
                      const isSelected = editTaskIds.has(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setEditTaskIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(task.id)) next.delete(task.id);
                              else next.add(task.id);
                              return next;
                            });
                          }}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-2.5 transition-all
                            hover:shadow-sm
                            ${isSelected
                              ? "border-primary bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                              : "border-default-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-primary-300"
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-10">
                              <CheckCircle2 size={16} className="text-primary" />
                            </div>
                          )}
                          <div className="flex items-start gap-2 pr-5">
                            {task.coverImageUrl ? (
                              <img
                                src={task.coverImageUrl}
                                alt=""
                                className="w-10 h-10 rounded object-cover border border-default-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-default-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                <ImageIcon size={14} className="text-default-300" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate leading-tight">
                                {task.taskName || `Task #${task.id}`}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Chip size="sm" variant="flat" className="text-[10px] h-4">
                                  {task.status === "IN_PROGRESS" ? "กำลังทำ" : task.status === "COMPLETED" ? "เสร็จ" : "ยังไม่เริ่ม"}
                                </Chip>
                                {task.startPlanned && (
                                  <span className="text-[10px] text-default-400 flex items-center gap-0.5">
                                    <Calendar size={10} />
                                    {formatDate(task.startPlanned)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="justify-center">
                <Button variant="flat" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="primary"
                  startContent={<Link2 size={14} />}
                  isLoading={isEditTaskPending}
                  onPress={async () => {
                    await confirmEditTaskDialog();
                    onClose();
                  }}
                >
                  ยืนยัน {editTaskIds.size > 0 ? `(${editTaskIds.size} Task)` : ""}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit-mode Quote Dialog (existing items) */}
      <Modal
        isOpen={editQuoteItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditQuoteItem(null);
        }}
        size="3xl"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-2">
                <div className="flex items-center gap-2">
                  <Store size={18} />
                  <span>จัดการใบเสนอราคา</span>
                  {editQuoteItem && editQuoteItem.quotes.length > 0 && (
                    <Chip size="sm" variant="flat" color="success" className="ml-2">
                      {editQuoteItem.quotes.length} รายการ
                    </Chip>
                  )}
                </div>
                {editQuoteItem && (
                  <p className="text-xs text-default-400 font-normal">
                    {editQuoteItem.materialName}
                    {editQuoteItem.specification ? ` | ${editQuoteItem.specification}` : ""}
                    {editQuoteItem.quantity ? ` | ${editQuoteItem.quantity} ${editQuoteItem.unit || ""}` : ""}
                  </p>
                )}
              </ModalHeader>
              <ModalBody className="pt-0 space-y-3">
                {/* AI Estimate */}
                <div className="flex items-center justify-end gap-2">
                  <Tooltip content="AI ประเมินราคากลาง">
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<Sparkles size={14} />}
                      onPress={handleEditAiEstimate}
                      isLoading={isEditEstimating}
                    >
                      AI ราคากลาง
                    </Button>
                  </Tooltip>
                </div>

                {/* Show AI or existing estimates */}
                {(editAiEstimate || editQuoteItem?.aiEstimateMin || editQuoteItem?.aiEstimateMid || editQuoteItem?.aiEstimateMax) && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] uppercase text-success-600 font-bold">ประหยัด</p>
                      <p className="text-sm font-bold text-success-700">
                        ฿{(editAiEstimate?.min ?? editQuoteItem?.aiEstimateMin)?.toLocaleString() || "-"}
                      </p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] uppercase text-primary-600 font-bold">กลาง</p>
                      <p className="text-sm font-bold text-primary-700">
                        ฿{(editAiEstimate?.mid ?? editQuoteItem?.aiEstimateMid)?.toLocaleString() || "-"}
                      </p>
                    </div>
                    <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] uppercase text-warning-600 font-bold">Premium</p>
                      <p className="text-sm font-bold text-warning-700">
                        ฿{(editAiEstimate?.max ?? editQuoteItem?.aiEstimateMax)?.toLocaleString() || "-"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quote Table */}
                {editQuoteItem && editQuoteItem.quotes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-default-200 text-default-500">
                          <th className="text-left py-2 px-2 font-bold">Supplier</th>
                          <th className="text-right py-2 px-2 font-bold">ราคา/หน่วย</th>
                          <th className="text-right py-2 px-2 font-bold">ราคารวม</th>
                          <th className="text-center py-2 px-2 font-bold">วันเสนอราคา</th>
                          <th className="text-center py-2 px-2 font-bold">หมดอายุ</th>
                          <th className="text-left py-2 px-2 font-bold">โน้ต</th>
                          <th className="text-center py-2 px-2 font-bold">เลือก</th>
                          <th className="py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editQuoteItem.quotes.map((q) => (
                          <tr
                            key={q.id}
                            className={`border-b border-default-100 hover:bg-default-100/50 ${
                              q.isSelected ? "bg-success-50/50 dark:bg-success-900/10" : ""
                            }`}
                          >
                            <td className="py-2 px-2 font-medium">{q.supplier.supplierName}</td>
                            <td className="py-2 px-2 text-right">
                              {q.unitPrice != null ? `฿${Number(q.unitPrice).toLocaleString()}` : "-"}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {q.totalPrice != null ? `฿${Number(q.totalPrice).toLocaleString()}` : "-"}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {q.quoteDate ? formatDate(q.quoteDate) : "-"}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {q.validUntil ? formatDate(q.validUntil) : "-"}
                            </td>
                            <td className="py-2 px-2 text-default-400 max-w-[120px] truncate">
                              {q.note || "-"}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {q.isSelected ? (
                                <Chip size="sm" color="success" variant="flat" className="text-[10px]">
                                  เลือกแล้ว
                                </Chip>
                              ) : (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="success"
                                  onPress={() => handleEditSelectQuote(q.id)}
                                  isLoading={isEditQuotePending}
                                >
                                  <Check size={14} />
                                </Button>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleEditDeleteQuote(q.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-default-400 text-center py-4">
                    ยังไม่มีใบเสนอราคา
                  </p>
                )}

                {/* Add New Quote Form */}
                {isEditAddingQuote ? (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-default-200 space-y-2">
                    <p className="text-xs font-bold text-default-500 uppercase">เพิ่มใบเสนอราคาใหม่</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <select
                        value={editQuoteForm.supplierId}
                        onChange={(e) => setEditQuoteForm((p) => ({ ...p, supplierId: e.target.value }))}
                        className="col-span-2 sm:col-span-1 px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      >
                        <option value="">-- เลือก Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.supplierName}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="ราคา/หน่วย"
                        value={editQuoteForm.unitPrice}
                        onChange={(e) => setEditQuoteForm((p) => ({ ...p, unitPrice: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      />
                      <input
                        type="number"
                        placeholder="ราคารวม"
                        value={editQuoteForm.totalPrice}
                        onChange={(e) => setEditQuoteForm((p) => ({ ...p, totalPrice: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      />
                      <input
                        type="date"
                        value={editQuoteForm.quoteDate}
                        onChange={(e) => setEditQuoteForm((p) => ({ ...p, quoteDate: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                        title="วันเสนอราคา"
                      />
                      <input
                        type="date"
                        value={editQuoteForm.validUntil}
                        onChange={(e) => setEditQuoteForm((p) => ({ ...p, validUntil: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                        title="หมดอายุ"
                      />
                      <input
                        type="text"
                        placeholder="โน้ต"
                        value={editQuoteForm.note}
                        onChange={(e) => setEditQuoteForm((p) => ({ ...p, note: e.target.value }))}
                        className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setIsEditAddingQuote(false)}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<Save size={14} />}
                        onPress={handleEditAddQuote}
                        isLoading={isEditQuotePending}
                      >
                        เพิ่ม
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Plus size={14} />}
                      onPress={() => setIsEditAddingQuote(true)}
                    >
                      เพิ่ม Supplier
                    </Button>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="justify-center">
                <Button variant="flat" onPress={onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProcurementSection;
