import { useCsvStore } from "@/lib/csv-store";
import { FileUpload } from "@/components/FileUpload";
import { SearchBar } from "@/components/SearchBar";
import { FieldPanel } from "@/components/FieldPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { Shield } from "lucide-react";

const Index = () => {
  const indexCount = useCsvStore((s) => Object.keys(s.indexes).length);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-2 flex items-center gap-3 shrink-0">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-sm font-bold tracking-tight">
          Forensic CSV Reader
        </h1>
        <span className="text-[10px] text-muted-foreground font-mono">
          OFFLINE
        </span>
      </header>

      {/* Search bar */}
      {indexCount > 0 && (
        <div className="border-b px-4 py-2 shrink-0">
          <SearchBar />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Field panel sidebar */}
        <FieldPanel />

        {/* Results / Upload */}
        <main className="flex-1 flex flex-col min-h-0">
          {indexCount === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md w-full">
                <FileUpload />
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 pt-3 pb-1 shrink-0">
                <FileUpload />
              </div>
              <div className="flex-1 min-h-0 px-4 pb-4">
                <ResultsTable />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
