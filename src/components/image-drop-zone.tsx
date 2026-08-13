import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

/** Drag-and-drop (or click-to-browse) image input — shared by every scan
 * mode that accepts a still photo (barcode, cover text, eventually cover
 * image matching). */
export function ImageDropZone({
  onFile,
  label,
  disabled,
}: {
  onFile: (file: File) => void;
  label: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDragOver ? "border-primary bg-primary/5" : "border-border/60 text-muted-foreground hover:border-primary/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <ImageUp className="h-6 w-6" />
      <div>
        <span className="font-medium text-foreground">{t.imageDropZone.dropAPhoto}</span> {label}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
