import { useCallback, useRef, useState } from "react";
import { Upload, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCsvStore } from "@/lib/csv-store";

export function FileUpload() {
  const addCsv = useCsvStore((s) => s.addCsv);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (!file.name.toLowerCase().endsWith(".csv")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) addCsv(file.name, text);
        };
        reader.readAsText(file);
      });
    },
    [addCsv]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm font-medium mb-1">
        Drag & drop CSV files or folders here
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Files will be auto-indexed by filename
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Select Files
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => folderRef.current?.click()}
        >
          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
          Select Folder
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
      <input
        ref={folderRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as any)}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
    </div>
  );
}
