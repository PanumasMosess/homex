"use client";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import {
  Download,
  Eye,
  FilePlus,
  FileText,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import UploadDocumentForm from "./forms/uploadDocumentForm";
import { useEffect, useState } from "react";
import { DocumentSectionProps, ProjectFile } from "@/lib/type";
import { deleteDocFile, getAllDoc } from "@/lib/actions/actionProject";
import { toast } from "react-toastify";
import { PROJECT_DOC_TYPES } from "@/lib/setting_data";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import CategoryFilterDoc from "./CategoryFilterDoc";

const DocumentSection = ({
  organizationId,
  currentUserId,
  isSpadmin,
  projectId,
}: DocumentSectionProps) => {
  const [docs, setDocs] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  const uploadModal = useDisclosure();
  const previewModal = useDisclosure();

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePreview = (doc: ProjectFile) => {
    setSelectedFile(doc);
    previewModal.onOpen();
  };

  const fetchDocs = async () => {
    if (!projectId || !organizationId) return;

    const res = await getAllDoc(projectId, organizationId);
    if (res.success) {
      setDocs(res.data);
    } else {
      toast.error(res.error);
    }
  };

  const askDelete = (file: any) => {
    setSelectedFile(file);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFile?.id) return;

    setIsDeleting(true);
    try {
      const res = await deleteDocFile(selectedFile.id, organizationId);
      if (res.success) {
        toast.success("ลบไฟล์เรียบร้อยแล้ว", { theme: "dark" });
        setIsDeleteOpen(false);
        fetchDocs();
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [projectId, organizationId]);

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      (doc.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.note || "").toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (selectedCategory !== "ทั้งหมด") {
      const docTypeText =
        PROJECT_DOC_TYPES.find((t) => t.key === doc.fileType)?.textValue ||
        doc.fileType;
      matchesCategory = (docTypeText || "").includes(selectedCategory);
    }

    return matchesSearch && matchesCategory;
  });

  const isCustomer = isSpadmin === "Customer";

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex gap-2">
        <Input
          placeholder="ค้นหาเอกสาร..."
          startContent={<Search size={18} className="text-default-400" />}
          variant="bordered"
          className="flex-1"
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
        />
        {!isCustomer && (
          <Button color="primary" radius="lg" onPress={uploadModal.onOpen}>
            <Plus />
          </Button>
        )}
      </div>

      <CategoryFilterDoc
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="grid grid-cols-1 gap-3">
        {filteredDocs.map((doc) => (
          <Card
            key={doc.id}
            as="div"
            className="bg-default-50 dark:bg-zinc-900 border-none"
          >
            <CardBody className="flex flex-row items-center gap-3 p-4">
              <div
                className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handlePreview(doc)}
              >
                <FileText size={24} />
              </div>

              <div
                className="flex-1 min-w-0 text-left cursor-pointer"
                onClick={() => handlePreview(doc)}
              >
                <p className="text-sm font-bold truncate">{doc.fileName}</p>
                <p className="text-[10px] text-default-400 truncate">
                  <span className="text-primary font-medium">
                    {PROJECT_DOC_TYPES.find((t) => t.key === doc.fileType)
                      ?.textValue || doc.fileType}
                  </span>
                  {" • "}
                  {doc.createdAt
                    ? new Date(doc.createdAt).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                  {doc.note && ` • ${doc.note}`}
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => handlePreview(doc)}
                >
                  <Eye size={18} className="text-default-500" />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => window.open(doc.fileUrl, "_blank")}
                >
                  <Download size={18} />
                </Button>
                {!isCustomer && (
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => askDelete(doc)}
                  >
                    <Trash2 size={18} className="text-danger" />
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={previewModal.isOpen}
        onOpenChange={previewModal.onOpenChange}
        size="2xl"
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
        className="dark text-foreground mx-4 my-auto sm:my-8"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row items-center gap-3 pr-12">
                <div className="p-2.5 bg-default-100 rounded-lg text-default-500">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold truncate">
                    {selectedFile?.fileName}
                  </h2>
                  <p className="text-[10px] font-medium text-default-400 uppercase tracking-wider">
                    {selectedFile?.fileType}
                  </p>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  radius="full"
                  size="sm"
                  className="text-default-500 hover:text-primary active:scale-95"
                  onPress={() => {
                    if (selectedFile?.fileUrl) {
                      navigator.clipboard.writeText(selectedFile.fileUrl);
                      toast.success("คัดลอกลิงก์ไฟล์เรียบร้อยแล้ว", {
                        position: "bottom-right",
                        autoClose: 2000,
                        theme: "dark",
                        style: {
                          backgroundColor: "#27272a",
                          color: "#ffffff",
                          fontSize: "12px",
                          borderRadius: "12px",
                        },
                      });
                    }
                  }}
                >
                  <Share2 size={18} />
                </Button>
              </ModalHeader>

              <ModalBody className="pb-8 flex justify-center items-center min-h-[50vh] max-h-[85vh] p-4 bg-default-50/50">
                {(() => {
                  const url = selectedFile?.fileUrl || "";
                  const extension =
                    url.split(".").pop()?.split(/\#|\?/)[0]?.toUpperCase() ||
                    "";
                  if (
                    ["JPG", "PNG", "JPEG", "WEBP", "GIF"].includes(extension)
                  ) {
                    return (
                      <Image
                        src={url}
                        alt="preview"
                        className="w-full max-h-[75vh] object-contain rounded-xl shadow-xl border border-default-200"
                        fallbackSrc="/images/placeholder-image.png"
                      />
                    );
                  }

                  if (extension === "PDF") {
                    return (
                      <div className="w-full h-[70vh] rounded-xl overflow-hidden border border-default-200 shadow-inner bg-white">
                        <iframe
                          src={`${url}#toolbar=0&navpanes=0`}
                          className="w-full h-full border-none"
                          title="PDF Preview"
                        />
                      </div>
                    );
                  }
                  if (["DOC", "DOCX", "XLS", "XLSX"].includes(extension)) {
                    return (
                      <div className="w-full h-[70vh] rounded-xl overflow-hidden border border-default-200 shadow-inner bg-white">
                        <iframe
                          src={`https://docs.google.com/gview?url=${url}&embedded=true`}
                          className="w-full h-full border-none"
                          title="Office Preview"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col items-center gap-5 py-14 px-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-default-100">
                      <div className="p-7 bg-primary/10 rounded-full text-primary shadow-inner">
                        <FileText size={72} strokeWidth={1.5} />
                      </div>
                      <div className="text-center space-y-2 max-w-[300px]">
                        <p className="text-sm font-bold text-default-800 break-words">
                          {selectedFile?.fileName}
                        </p>
                        <p className="text-xs text-default-500 px-4">
                          ไฟล์นามสกุล .{extension}{" "}
                          ไม่รองรับการแสดงตัวอย่างอัตโนมัติ
                        </p>
                      </div>
                      <Button
                        color="primary"
                        variant="shadow"
                        size="lg"
                        className="mt-3 font-bold px-10 shadow-lg shadow-primary/20 bg-blue-600"
                        startContent={<Download size={20} />}
                        onPress={() => window.open(url, "_blank")}
                      >
                        ดาวน์โหลดเพื่อเปิดดู
                      </Button>
                    </div>
                  );
                })()}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <UploadDocumentForm
        isOpen={uploadModal.isOpen}
        onOpenChange={uploadModal.onOpenChange}
        projectId={projectId}
        organizationId={organizationId}
        currentUserId={currentUserId}
        onSuccess={fetchDocs}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="ลบเอกสารก่อสร้าง"
        description={`คุณต้องการลบไฟล์ "${selectedFile?.fileName}" ใช่หรือไม่? ข้อมูลจะถูกลบออกจากระบบถาวร`}
      />

      {filteredDocs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-default-400 border-2 border-dashed rounded-3xl">
          <FilePlus size={48} className="mb-2 opacity-20" />
          <p>
            {docs.length === 0
              ? "ยังไม่มีการอัปโหลดเอกสาร"
              : "ไม่พบเอกสารที่ค้นหา"}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentSection;
