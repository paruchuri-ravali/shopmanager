import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function DataTable<T>({
  columns,
  data,
  emptyMessage,
  toolbar,
  pageIndex,
  pageSize,
  pageCount,
  totalCount,
  onPageChange,
  onPageSizeChange,
  sorting,
  onSortingChange,
  loading
}: {
  columns: ColumnDef<T, any>[];
  data: T[];
  emptyMessage: string;
  toolbar?: ReactNode;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  loading?: boolean;
}) {
  const table = useReactTable({
    data,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
    },
    getCoreRowModel: getCoreRowModel()
  });

  const isEmpty = !loading && totalCount === 0;

  return (
    <div className="card table-card">
      {toolbar && <div className="table-toolbar">{toolbar}</div>}

      {isEmpty ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <>
          <div className={`table-wrap ${loading ? 'table-loading' : ''}`}>
            <table>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortable = header.column.getCanSort();
                      const sortState = header.column.getIsSorted();
                      return (
                        <th key={header.id}>
                          {header.isPlaceholder ? null : sortable ? (
                            <button type="button" className="th-sort" onClick={header.column.getToggleSortingHandler()}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sortState === 'asc' ? <ArrowUp size={13} /> : sortState === 'desc' ? <ArrowDown size={13} /> : <ChevronsUpDown size={13} />}
                            </button>
                          ) : (
                            <span className="th-label">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <span className="helper-text">
              Page {pageIndex + 1} of {pageCount || 1} — {totalCount} total
            </span>
            <div className="table-pagination-controls">
              <label className="table-page-size">
                Show:
                <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="button-secondary button-sm" onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex <= 0}>
                Prev
              </button>
              <button type="button" className="button-secondary button-sm" onClick={() => onPageChange(pageIndex + 1)} disabled={pageIndex + 1 >= pageCount}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
