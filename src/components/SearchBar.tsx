import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCsvStore } from "@/lib/csv-store";
import { useCallback } from "react";

export function SearchBar() {
  const { searchQuery, setSearchQuery, getSearchResults } = useCsvStore();

  const exportResults = useCallback(() => {
    const results = getSearchResults();
    if (results.length === 0) return;

    // Collect all unique columns
    const allCols = new Set<string>();
    results.forEach((r) => Object.keys(r.row).forEach((k) => allCols.add(k)));
    const columns = ["_index", ...Array.from(allCols)];

    // Escape CSV values properly
    const escape = (v: string) => {
      const str = String(v ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csv = [
      columns.map(escape).join(","),
      ...results.map((r) =>
        columns
          .map((c) => (c === "_index" ? escape(r.index) : escape(r.row[c] ?? "")))
          .join(",")
      ),
    ].join("\n");

    // Download the file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forensic-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getSearchResults]);

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search... (e.g. "index=localusers" or "administrator")'
          className="pl-9 font-mono text-sm h-10"
        />
      </div>
      <Button variant="outline" size="sm" onClick={exportResults}>
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Export
      </Button>
    </div>
  );
}
