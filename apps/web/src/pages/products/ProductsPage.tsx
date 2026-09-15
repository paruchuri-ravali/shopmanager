import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { PackagePlus, Search } from 'lucide-react';
import { productsApi } from '../../api/products.api';
import { formatCurrency } from '../../lib/utils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';

const emptyForm = { name: '', unit: 'unit' as 'unit' | 'kg', price: '', stockQuantity: '0', category: '' };
const SORT_KEYS: Record<string, string> = { name: 'name', category: 'category', price: 'price', stockQuantity: 'stockQuantity' };

type Product = { id: string; name: string; unit: 'unit' | 'kg'; category: string | null; price: string; stockQuantity: string };

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [category, setCategory] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  useEffect(() => {
    productsApi.listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const requestId = useRef(0);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch, category]);

  const loadProducts = () => {
    const id = ++requestId.current;
    setLoading(true);
    const sort = sorting[0];
    productsApi.list({
      page: pageIndex + 1,
      limit: pageSize,
      search: debouncedSearch || undefined,
      category: category || undefined,
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
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize, debouncedSearch, category, sorting]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name ?? '',
      unit: product.unit ?? 'unit',
      price: String(product.price ?? ''),
      stockQuantity: String(product.stockQuantity ?? 0),
      category: product.category ?? ''
    });
    setError(null);
    setShowModal(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        category: form.category.trim() || undefined
      };
      if (editingId) {
        await productsApi.update(editingId, payload);
      } else {
        await productsApi.create(payload);
      }
      setShowModal(false);
      loadProducts();
      productsApi.listCategories().then(setCategories).catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const openRestockModal = (product: Product) => {
    setRestockProduct(product);
    setRestockQty('');
    setRestockError(null);
  };

  const submitRestock = async (e: FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    setRestocking(true);
    setRestockError(null);
    try {
      await productsApi.restock(restockProduct.id, Number(restockQty));
      setRestockProduct(null);
      loadProducts();
    } catch (err: any) {
      setRestockError(err?.response?.data?.message || 'Could not update stock');
    } finally {
      setRestocking(false);
    }
  };

  const columns = useMemo<ColumnDef<Product, any>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'category', header: 'Category',
      cell: (ctx) => ctx.getValue() ? <span className="badge badge-soft">{ctx.getValue()}</span> : '-'
    },
    {
      accessorKey: 'price', header: 'Price',
      cell: (ctx) => `${formatCurrency(Number(ctx.getValue()))}${ctx.row.original.unit === 'kg' ? ' /kg' : ''}`
    },
    {
      accessorKey: 'stockQuantity', header: 'Stock',
      cell: (ctx) => {
        const qty = Number(ctx.getValue());
        const label = ctx.row.original.unit === 'kg' ? `${qty} kg` : String(qty);
        const lowStockThreshold = ctx.row.original.unit === 'kg' ? 5 : 10;
        return <span className={`badge ${qty < lowStockThreshold ? 'badge-danger' : 'badge-soft'}`}>{label}</span>;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: (ctx) => (
        <div className="split-actions">
          <button className="button-secondary button-sm" onClick={() => openEditModal(ctx.row.original)}>Edit</button>
          <button className="button-secondary button-sm" onClick={() => openRestockModal(ctx.row.original)} aria-label="Restock">
            <PackagePlus size={14} />
          </button>
        </div>
      )
    }
  ], []);

  return (
    <div className="page stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-description">Manage catalog items, stock, and pricing.</p>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={items}
        emptyMessage="No products yet. Create the first catalog item."
        toolbar={
          <>
            <div className="table-toolbar-filters">
              <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="search-input">
                <Search size={16} />
                <input placeholder="Search name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
            </div>
            <button className="button" onClick={openAddModal}>Add Product</button>
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

      {showModal && (
        <Modal title={editingId ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="stack">
            <label className="field">
              <span className="field-label">Name</span>
              <input
                autoFocus
                placeholder="Rice 5kg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Sold by</span>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as 'unit' | 'kg' })}>
                <option value="unit">Each (piece, pack, etc.)</option>
                <option value="kg">Weight (per kg)</option>
              </select>
            </label>
            <div className="card-grid cols-2">
              <label className="field">
                <span className="field-label">{form.unit === 'kg' ? 'Price per kg' : 'Price'}</span>
                <input placeholder="250" type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </label>
              <label className="field">
                <span className="field-label">{form.unit === 'kg' ? 'Stock (kg)' : 'Stock quantity'}</span>
                <input
                  placeholder={form.unit === 'kg' ? '12.5' : '45'}
                  type="number"
                  min="0"
                  step={form.unit === 'kg' ? '0.001' : '1'}
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  required
                />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Category</span>
              <input placeholder="Groceries" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            {error && <p className="field-error">{error}</p>}
            <div className="split-actions">
              <button type="button" className="button-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
            </div>
          </form>
        </Modal>
      )}

      {restockProduct && (
        <Modal title={`Restock "${restockProduct.name}"`} onClose={() => setRestockProduct(null)}>
          <form onSubmit={submitRestock} className="stack">
            <p className="helper-text">
              Current stock: {Number(restockProduct.stockQuantity)}{restockProduct.unit === 'kg' ? ' kg' : ''}
            </p>
            <label className="field">
              <span className="field-label">Quantity received{restockProduct.unit === 'kg' ? ' (kg)' : ''}</span>
              <input
                autoFocus
                type="number"
                min={restockProduct.unit === 'kg' ? '0.001' : '1'}
                step={restockProduct.unit === 'kg' ? '0.001' : '1'}
                placeholder={restockProduct.unit === 'kg' ? '5' : '50'}
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                required
              />
            </label>
            {restockQty && Number(restockQty) > 0 && (
              <p className="helper-text">
                New stock will be {Number(restockProduct.stockQuantity) + Number(restockQty)}{restockProduct.unit === 'kg' ? ' kg' : ''}.
              </p>
            )}
            {restockError && <p className="field-error">{restockError}</p>}
            <div className="split-actions">
              <button type="button" className="button-secondary" onClick={() => setRestockProduct(null)}>Cancel</button>
              <button type="submit" disabled={restocking}>{restocking ? 'Saving...' : 'Add Stock'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
