import { useCsvStore } from "@/lib/csv-store";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Database, X, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

const INDEX_COLORS: Record<string, string> = {
  AutoRun: "bg-red-100 text-red-800 border-red-200",
  ConnectedDevices: "bg-blue-100 text-blue-800 border-blue-200",
  DefenderExclusions: "bg-orange-100 text-orange-800 border-orange-200",
  DNSCache: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Drivers: "bg-purple-100 text-purple-800 border-purple-200",
  InstalledSoftware: "bg-green-100 text-green-800 border-green-200",
  IPConfiguration: "bg-teal-100 text-teal-800 border-teal-200",
  LocalUsers: "bg-amber-100 text-amber-800 border-amber-200",
  NetworkShare: "bg-indigo-100 text-indigo-800 border-indigo-200",
  OfficeConnection: "bg-pink-100 text-pink-800 border-pink-200",
  OpenTCPConnection: "bg-rose-100 text-rose-800 border-rose-200",
  PowerShellHistory: "bg-violet-100 text-violet-800 border-violet-200",
  Process: "bg-sky-100 text-sky-800 border-sky-200",
  RemotelyOpenedFiles: "bg-lime-100 text-lime-800 border-lime-200",
  RunningServices: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ScheduledTasks: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  ScheduledTasksRunInfo: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SecurityEvents: "bg-red-100 text-red-700 border-red-200",
  ShadowCopy: "bg-slate-100 text-slate-800 border-slate-200",
  SMBShares: "bg-stone-100 text-stone-800 border-stone-200",
  Win32RegRunKey: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

export function getIndexColor(name: string) {
  return INDEX_COLORS[name] ?? "bg-secondary text-secondary-foreground border-border";
}

export function FieldPanel() {
  const { indexes, setSearchQuery, searchQuery, removeIndex, clearAll } = useCsvStore();
  const getFieldsForIndex = useCsvStore((s) => s.getFieldsForIndex);
  const indexNames = Object.keys(indexes);

  const addFilter = useCallback(
    (field: string, value: string) => {
      const filter = `${field}="${value}"`;
      setSearchQuery(searchQuery ? `${searchQuery} ${filter}` : filter);
    },
    [searchQuery, setSearchQuery]
  );

  if (indexNames.length === 0) return null;

  return (
    <div className="w-72 border-r bg-card flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            Indexes ({indexNames.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={clearAll}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {indexNames.map((name) => (
            <IndexGroup
              key={name}
              name={name}
              index={indexes[name]}
              getFields={() => getFieldsForIndex(name)}
              onFilter={addFilter}
              onRemove={() => removeIndex(name)}
              onSelect={() => setSearchQuery(`index=${name.toLowerCase()}`)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function IndexGroup({
  name,
  index,
  getFields,
  onFilter,
  onRemove,
  onSelect,
}: {
  name: string;
  index: { rows: Record<string, string>[] };
  getFields: () => { name: string; topValues: { value: string; count: number }[] }[];
  onFilter: (field: string, value: string) => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const fields = open ? getFields() : [];
  const colorClass = getIndexColor(name);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove();
    },
    [onRemove]
  );

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    },
    [onSelect]
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left w-full group">
          <ChevronRight
            className={`h-3 w-3 text-muted-foreground transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          <Badge
            variant="outline"
            className={`text-[10px] cursor-pointer ${colorClass}`}
            onClick={handleSelect}
          >
            {name}
          </Badge>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {index.rows.length} rows
          </span>
          <button
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-7 pr-2 pb-2 space-y-2">
          {fields.map((field) => (
            <div key={field.name}>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                {field.name}
              </p>
              {field.topValues.slice(0, 5).map((tv) => (
                <button
                  key={tv.value}
                  onClick={() => onFilter(field.name, tv.value)}
                  className="flex items-center justify-between w-full text-[10px] px-1.5 py-0.5 rounded hover:bg-accent font-mono truncate"
                >
                  <span className="truncate mr-2">{tv.value}</span>
                  <span className="text-muted-foreground shrink-0">
                    ({tv.count})
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
