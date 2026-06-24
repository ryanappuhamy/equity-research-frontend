import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  cell: (row: T) => React.ReactNode;
  className?: string;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

// Generic table used for positions, comps, alerts, insider filings — anything
// tabular. Pass a column config and rows; the component stays presentational.
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty = "No rows",
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  empty?: React.ReactNode;
  className?: string;
}) {
  if (!rows.length) {
    return <p className="px-1 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.key}
              className={cn(
                "text-xs font-medium text-muted-foreground",
                alignClass[c.align ?? "left"],
              )}
            >
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={getRowKey(row, i)} className="border-border/50">
            {columns.map((c) => (
              <TableCell
                key={c.key}
                className={cn("py-3", alignClass[c.align ?? "left"], c.className)}
              >
                {c.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
