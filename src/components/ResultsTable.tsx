import { useMemo } from "react";
import { useCsvStore } from "@/lib/csv-store";
import { Badge } from "@/components/ui/badge";
import { getIndexColor } from "@/components/FieldPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function ResultsTable() {
  const { currentPage, pageSize, setCurrentPage, getSearchResults, indexes, searchQuery } =
    useCsvStore();

  const results = useMemo(() => getSearchResults(), [
    indexes,
    searchQuery,
    getSearchResults,
  ]);

  // Get only columns that exist in the current filtered results
  const columns = useMemo(() => {
    if (results.length === 0) return [];
    
    // If all results are from a single index, use only that index's columns
    const uniqueIndexNames = new Set(results.map((r) => r.index));
    
    if (uniqueIndexNames.size === 1) {
      // Single index - get columns only from this index's data
      const indexName = Array.from(uniqueIndexNames)[0];
      const indexData = indexes[indexName];
      
      if (indexData && indexData.rows.length > 0) {
        // Get all column names from the first row of this index
        const allColumns = Object.keys(indexData.rows[0]);
        
        // Filter to only columns with actual data in the current results
        return allColumns.filter((col) => {
          return results.some((r) => {
            const value = r.row[col];
            return value !== null && 
                   value !== undefined && 
                   String(value).trim() !== "";
          });
        });
      }
    }
    
    // Multiple indexes or fallback - show all columns from filtered results
    const allColumns = new Set<string>();
    results.forEach((r) => {
      Object.keys(r.row).forEach((k) => allColumns.add(k));
    });
    
    return Array.from(allColumns).filter((col) => {
      return results.some((r) => {
        const value = r.row[col];
        return value !== null && 
               value !== undefined && 
               String(value).trim() !== "";
      });
    });
  }, [results, indexes]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const paged = useMemo(
    () => results.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [results, currentPage, pageSize]
  );

  const uniqueIndexes = useMemo(
    () => new Set(results.map((r) => r.index)),
    [results]
  );

  if (Object.keys(indexes).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data loaded. Please upload a CSV file.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No results found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Stats bar - Splunk style */}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            <strong className="text-foreground font-semibold">{results.length.toLocaleString()}</strong>{" "}
            events
          </span>
          <span className="text-muted-foreground">
            from{" "}
            <strong className="text-foreground font-semibold">{uniqueIndexes.size}</strong>{" "}
            {uniqueIndexes.size === 1 ? "index" : "indexes"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Table - wrapped in ScrollArea to prevent duplication */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="sticky left-0 bg-muted/50 z-20 min-w-[120px] border-r font-semibold">
                  Index
                </TableHead>
                {columns.map((col) => (
                  <TableHead 
                    key={col} 
                    className="whitespace-nowrap px-4 min-w-[150px] font-semibold"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((result, i) => (
                <TableRow 
                  key={`${result.index}-${i}`}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="sticky left-0 bg-background z-10 border-r">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${getIndexColor(result.index)}`}
                    >
                      {result.index}
                    </Badge>
                  </TableCell>
                  {columns.map((col) => {
                    const value = result.row[col];
                    const displayValue = value ?? "";
                    const stringValue = String(displayValue);
                    
                    return (
                      <TableCell
                        key={col}
                        className="px-4 py-2.5 text-xs align-top font-mono"
                        title={stringValue}
                      >
                        <div className="max-w-[400px] break-words whitespace-pre-wrap">
                          {stringValue}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
}
