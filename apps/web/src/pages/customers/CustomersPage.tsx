import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { customersApi } from '../../api/customers.api';
import { formatCurrency } from '../../lib/utils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import NameBadge from '../../components/ui/NameBadge';

const emptyForm = { name: '', phone: '' };
const SORT_KEYS: Record<string, string> = { name: 'name', phone: 'phone', totalPurchases: 'totalPurchases' };

type Customer = { id: string; name: string; phone: string | null; totalPurchases: string };

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch]);

  const requestId = useRef(0);

  const loadCustomers = () => {
    const id = ++requestId.current;
    setLoading(true);
    const sort = sorting[0];
    customersApi.list({
      page: pageIndex + 1,
      limit: pageSize,
      search: debouncedSearch || undefined,
      sortBy: sort ? SORT_KEYS[sort.id] : undefined,
      sortDir: sort ? (sort.desc ? 'desc' : 'asc') : undefined
    })
      .then((res) => {
        if (id !== requestId.current) return;
        setItems(res.data);
        setTotal(res.total);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize, debouncedSearch, sorting]);

  const openAddModal = () => {
    setForm(emptyForm);
    setError(null);
    setShowAddModal(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await customersApi.create({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined
      });
      setShowAddModal(false);
      loadCustomers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create customer');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<Customer, any>[]>(() => [
    { accessorKey: 'name', header: 'Name', cell: (ctx) => <NameBadge name={ctx.getValue()} /> },
    { accessorKey: 'phone', header: 'Phone', cell: (ctx) => ctx.getValue() ?? '-' },
    { accessorKey: 'totalPurchases', header: 'Total Purchases', cell: (ctx) => formatCurrency(Number(ctx.getValue())) }
  ], []);

  return (
    <div className="page stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-description">Review customer history and total spend.</p>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={items}
        emptyMessage="No customers yet."
        toolbar={
          <>
            <label className="search-input">
              <Search size={16} />
              <input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <button className="button" onClick={openAddModal}>Add Customer</button>
          </>
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={Math.max(1, Math.ceil(total / pageSize))}
        totalCount={total}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
        sorting={sorting}
        onSortingChange={setSorting}
        loading={loading}
      />

      {showAddModal && (
        <Modal title="Add Customer" onClose={() => setShowAddModal(false)}>
          <form onSubmit={submit} className="stack">
            <label className="field">
              <span className="field-label">Name</span>
              <input
                autoFocus
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Phone</span>
              <input
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            {error && <p className="field-error">{error}</p>}
            <div className="split-actions">
              <button type="button" className="button-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
