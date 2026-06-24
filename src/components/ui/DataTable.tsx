"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { ScrollArea } from "./ScrollArea";

interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "Ara...",
  searchKey,
  pagination = false,
  pageSize = 10,
  emptyMessage = "Veri bulunamadı",
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [search, setSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const filteredData = React.useMemo(() => {
    let result = data;

    if (search && searchKey) {
      result = result.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sortColumn) {
      const column = columns.find((c) => c.id === sortColumn);
      if (column?.accessorKey) {
        result = [...result].sort((a, b) => {
          const aVal = a[column.accessorKey!];
          const bVal = b[column.accessorKey!];
          const cmp = String(aVal).localeCompare(String(bVal), "tr");
          return sortDirection === "asc" ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [data, search, searchKey, sortColumn, sortDirection, columns]);

  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pagination, currentPage, pageSize]);

  const totalPages = pagination ? Math.ceil(filteredData.length / pageSize) : 1;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className={cn("w-full", className)}>
      {searchable && (
        <div className="mb-4">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-lg border">
        <ScrollArea>
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "h-10 px-4 text-left align-middle font-medium text-muted-foreground",
                      column.sortable && "cursor-pointer select-none hover:text-foreground",
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortColumn === column.id && (
                        <svg
                          className={cn(
                            "h-4 w-4 transition-transform",
                            sortDirection === "desc" && "rotate-180"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <td key={column.id} className={cn("p-4 align-middle", column.className)}>
                        {column.accessorFn
                          ? column.accessorFn(row)
                          : column.accessorKey
                          ? String(row[column.accessorKey] ?? "")
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-muted-foreground">
            Toplam {filteredData.length} kayıt | Sayfa {currentPage}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Önceki
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
