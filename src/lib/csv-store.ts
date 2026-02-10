import { create } from "zustand";

// Predefined index names with canonical casing
const KNOWN_INDEXES: Record<string, string> = {
  autorun: "AutoRun",
  connecteddevices: "ConnectedDevices",
  defenderexclusions: "DefenderExclusions",
  dnscache: "DNSCache",
  drivers: "Drivers",
  installedsoftware: "InstalledSoftware",
  ipconfiguration: "IPConfiguration",
  localusers: "LocalUsers",
  networkshare: "NetworkShare",
  officeconnection: "OfficeConnection",
  opentcpconnection: "OpenTCPConnection",
  powershellhistory: "PowerShellHistory",
  process: "Process",
  remotelyopenedfiles: "RemotelyOpenedFiles",
  runningservices: "RunningServices",
  scheduledtasks: "ScheduledTasks",
  scheduledtasksruninfo: "ScheduledTasksRunInfo",
  securityevents: "SecurityEvents",
  shadowcopy: "ShadowCopy",
  smbshares: "SMBShares",
  win32regrunkey: "Win32RegRunKey",
};

export interface CsvIndex {
  name: string;
  columns: string[];
  rows: Record<string, string>[];
  fileName: string;
}

export interface FieldValue {
  value: string;
  count: number;
}

export interface FieldInfo {
  name: string;
  topValues: FieldValue[];
}

export interface SearchResult {
  index: string;
  row: Record<string, string>;
}

interface CsvStore {
  indexes: Record<string, CsvIndex>;
  searchQuery: string;
  currentPage: number;
  pageSize: number;

  addCsv: (fileName: string, content: string) => void;
  removeIndex: (name: string) => void;
  clearAll: () => void;
  setSearchQuery: (q: string) => void;
  setCurrentPage: (p: number) => void;

  getSearchResults: () => SearchResult[];
  getFieldsForIndex: (indexName: string) => FieldInfo[];
  getActiveIndexes: () => string[];
}

function normalizeIndexName(fileName: string): string {
  const base = fileName.replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9]/g, "");
  const lower = base.toLowerCase();
  return KNOWN_INDEXES[lower] || base;
}

function parseCsv(content: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { columns: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const columns = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = values[i] ?? "";
    });
    return row;
  });

  return { columns, rows };
}

function extractFields(columns: string[], rows: Record<string, string>[]): FieldInfo[] {
  return columns.map((col) => {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      const val = row[col] ?? "";
      if (val !== "") {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    const topValues = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));
    return { name: col, topValues };
  });
}

export const useCsvStore = create<CsvStore>((set, get) => ({
  indexes: {},
  searchQuery: "",
  currentPage: 1,
  pageSize: 100,

  addCsv: (fileName, content) => {
    const indexName = normalizeIndexName(fileName);
    const { columns, rows } = parseCsv(content);
    set((state) => ({
      indexes: {
        ...state.indexes,
        [indexName]: { name: indexName, columns, rows, fileName },
      },
    }));
  },

  removeIndex: (name) => {
    set((state) => {
      const { [name]: _, ...rest } = state.indexes;
      return { indexes: rest };
    });
  },

  clearAll: () => set({ indexes: {}, searchQuery: "", currentPage: 1 }),

  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
  setCurrentPage: (p) => set({ currentPage: p }),

  getSearchResults: () => {
    const { indexes, searchQuery } = get();
    const query = searchQuery.trim();
    const allIndexes = Object.values(indexes);

    if (!query) {
      return allIndexes.flatMap((idx) =>
        idx.rows.map((row) => ({ index: idx.name, row }))
      );
    }

    // Check for index= filter
    const indexMatch = query.match(/^index=(\S+)\s*(.*)?$/i);
    if (indexMatch) {
      const targetIndex = indexMatch[1].toLowerCase();
      const remainder = (indexMatch[2] ?? "").trim().toLowerCase();
      const matchedIndexes = allIndexes.filter(
        (idx) => idx.name.toLowerCase() === targetIndex
      );
      if (!remainder) {
        return matchedIndexes.flatMap((idx) =>
          idx.rows.map((row) => ({ index: idx.name, row }))
        );
      }
      return matchedIndexes.flatMap((idx) =>
        idx.rows
          .filter((row) =>
            Object.values(row).some((v) => v.toLowerCase().includes(remainder)) ||
            idx.columns.some((c) => c.toLowerCase().includes(remainder))
          )
          .map((row) => ({ index: idx.name, row }))
      );
    }

    // Global search
    const lower = query.toLowerCase();
    return allIndexes.flatMap((idx) =>
      idx.rows
        .filter((row) =>
          Object.values(row).some((v) => v.toLowerCase().includes(lower)) ||
          idx.columns.some((c) => c.toLowerCase().includes(lower))
        )
        .map((row) => ({ index: idx.name, row }))
    );
  },

  getFieldsForIndex: (indexName) => {
    const idx = get().indexes[indexName];
    if (!idx) return [];
    return extractFields(idx.columns, idx.rows);
  },

  getActiveIndexes: () => Object.keys(get().indexes),
}));
