import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { CheckCircle2, Search } from 'lucide-react';
import { customersApi } from '../../api/customers.api';
import { productsApi } from '../../api/products.api';
import { salesApi } from '../../api/sales.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import NameBadge from '../../components/ui/NameBadge';

const SORT_KEYS: Record<string, string> = { saleDate: 'saleDate', customerName: 'customerName', totalAmount: 'totalAmount' };
const WEIGHT_PRESETS = [
  { label: '50g', kg: 0.05 },
  { label: '100g', kg: 0.1 },
  { label: '200g', kg: 0.2 },
  { label: '250g', kg: 0.25 },
  { label: '500g', kg: 0.5 },
  { label: '750g', kg: 0.75 },
  { label: '1kg', kg: 1 },
  { label: '1.5kg', kg: 1.5 },
  { label: '2kg', kg: 2 },
  { label: '5kg', kg: 5 },
  { label: '10kg', kg: 10 }
];

type Product = { id: string; name: string; unit: 'unit' | 'kg'; price: string; stockQuantity: string };
type Customer = { id: string; name: string };
type Sale = {
  id: string;
  saleDate: string;
  customerId: string | null;
  customerName: string | null;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: 'paid' | 'credit';
  paymentMethod: 'cash' | 'upi' | null;
};

export default function SalesPage() {
  const [items, setItems] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saleItems, setSaleItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; name: string; unit: 'unit' | 'kg' }>>([]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'credit'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState<'cash' | 'upi'>('cash');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch, statusFilter]);

  const requestId = useRef(0);

  const loadSales = () => {
    const id = ++requestId.current;
    setLoading(true);
    const sort = sorting[0];
    salesApi.list({
      page: pageIndex + 1,
      limit: pageSize,
      search: debouncedSearch || undefined,
      paymentStatus: statusFilter ? (statusFilter as 'paid' | 'credit') : undefined,
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
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize, debouncedSearch, statusFilter, sorting]);

  const openAddModal = () => {
    setCustomerId('');
    setProductId('');
    setQuantity('1');
    setSaleItems([]);
    setPaymentStatus('paid');
    setPaymentMethod('cash');
    setError(null);
    productsApi.list({ limit: 100 }).then((res) => setProducts(res.data)).catch(() => setProducts([]));
    customersApi.list({ limit: 100 }).then((res) => setCustomers(res.data)).catch(() => setCustomers([]));
    setShowAddModal(true);
  };

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const cartTotal = saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = () => {
    if (!selectedProduct) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return;

    setSaleItems((prev) => {
      const existing = prev.find((item) => item.productId === selectedProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProduct.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          quantity: qty,
          unitPrice: Number(selectedProduct.price),
          name: selectedProduct.name,
          unit: selectedProduct.unit
        }
      ];
    });
    setProductId('');
    setQuantity('1');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await salesApi.create({
        customerId: customerId || undefined,
        paymentStatus,
        paymentMethod: paymentStatus === 'paid' ? paymentMethod : undefined,
        items: saleItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      });
      setShowAddModal(false);
      loadSales();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create sale');
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (sale: Sale) => {
    const pending = Number(sale.totalAmount) - Number(sale.paidAmount);
    setPaymentSale(sale);
    setPaymentAmount(pending.toFixed(2));
    setRecordMethod('cash');
    setPaymentError(null);
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentSale) return;
    setRecordingPayment(true);
    setPaymentError(null);
    try {
      await salesApi.recordPayment(paymentSale.id, Number(paymentAmount), recordMethod);
      setPaymentSale(null);
      loadSales();
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message || 'Could not record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const columns = useMemo<ColumnDef<Sale, any>[]>(() => [
    { accessorKey: 'saleDate', header: 'Date', cell: (ctx) => formatDate(ctx.getValue()) },
    { accessorKey: 'customerName', header: 'Customer', cell: (ctx) => ctx.getValue() ? <NameBadge name={ctx.getValue()} /> : 'Walk-in' },
    { accessorKey: 'totalAmount', header: 'Total', cell: (ctx) => formatCurrency(Number(ctx.getValue())) },
    {
      id: 'payment',
      header: 'Payment',
      enableSorting: false,
      cell: (ctx) => {
        const sale = ctx.row.original;
        if (sale.paymentStatus === 'credit') {
          const paid = Number(sale.paidAmount);
          const pending = Number(sale.totalAmount) - paid;
          return (
            <div className="split-actions">
              <span className="badge badge-danger">
                {paid > 0 ? `${formatCurrency(pending)} pending` : 'Credit'}
              </span>
              <button type="button" className="button-secondary button-sm" onClick={() => openPaymentModal(sale)}>
                {paid > 0 ? 'Add Payment' : 'Record Payment'}
              </button>
            </div>
          );
        }
        return <span className="badge badge-soft">Paid · {sale.paymentMethod === 'upi' ? 'UPI' : 'Cash'}</span>;
      }
    }
  ], []);

  return (
    <div className="page stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-description">Track completed sales and walk-in purchases.</p>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={items}
        emptyMessage="No sales yet. Start by creating the first sale."
        toolbar={
          <>
            <div className="table-toolbar-filters">
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All payments</option>
                <option value="paid">Paid</option>
                <option value="credit">Credit (pay later)</option>
              </select>
              <label className="search-input">
                <Search size={16} />
                <input placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
            </div>
            <button className="button" onClick={openAddModal}>Add Sale</button>
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
        <Modal title="Add Sale" onClose={() => setShowAddModal(false)} wide>
          <form onSubmit={submit} className="stack">
            <label className="field">
              <span className="field-label">Customer</span>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </label>

            <div className="card-grid cols-3">
              <label className="field" style={{ gridColumn: '1 / span 2' }}>
                <span className="field-label">Product</span>
                <select
                  value={productId}
                  onChange={(e) => {
                    const next = products.find((p) => p.id === e.target.value);
                    setProductId(e.target.value);
                    setQuantity(next?.unit === 'kg' ? '' : '1');
                  }}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({Number(product.stockQuantity)}{product.unit === 'kg' ? ' kg' : ''} in stock)
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{selectedProduct?.unit === 'kg' ? 'Weight (kg)' : 'Quantity'}</span>
                <input
                  type="number"
                  min={selectedProduct?.unit === 'kg' ? '0.001' : '1'}
                  step={selectedProduct?.unit === 'kg' ? '0.001' : '1'}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
            </div>

            {selectedProduct?.unit === 'kg' && (
              <div className="split-actions">
                {WEIGHT_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    className={`button-secondary button-sm ${Number(quantity) === preset.kg ? 'button-secondary-active' : ''}`}
                    onClick={() => setQuantity(String(preset.kg))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            <div className="split-actions">
              <button type="button" className="button-secondary" onClick={addItem} disabled={!selectedProduct}>Add Item</button>
              {selectedProduct ? (
                <span className="helper-text">
                  Price: {formatCurrency(Number(selectedProduct.price))}{selectedProduct.unit === 'kg' ? ' /kg' : ''}
                </span>
              ) : null}
            </div>

            <div className="stack">
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Items</h2>
              {saleItems.length === 0 ? (
                <div className="empty-state">No items added yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th><th></th></tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, index) => (
                        <tr key={`${item.productId}-${index}`}>
                          <td>{item.name}</td>
                          <td>{item.quantity}{item.unit === 'kg' ? ' kg' : ''}</td>
                          <td>{formatCurrency(item.unitPrice)}{item.unit === 'kg' ? ' /kg' : ''}</td>
                          <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                          <td><button type="button" className="button-ghost button-sm" onClick={() => setSaleItems((prev) => prev.filter((_, i) => i !== index))}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <label className="field">
              <span className="field-label">Payment</span>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'credit')}>
                <option value="paid">Paid now</option>
                <option value="credit">Credit (pay later)</option>
              </select>
            </label>

            {paymentStatus === 'paid' && (
              <div className="split-actions">
                {(['cash', 'upi'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={`button-secondary button-sm ${paymentMethod === method ? 'button-secondary-active' : ''}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method === 'cash' ? 'Cash' : 'UPI'}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="field-error">{error}</p>}

            <div className="toolbar">
              <strong style={{ fontSize: '1.2rem' }}>Total: {formatCurrency(cartTotal)}</strong>
              <div className="split-actions">
                <button type="button" className="button-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={saleItems.length === 0 || saving}>{saving ? 'Saving...' : 'Save Sale'}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {paymentSale && (
        <Modal title="Record Payment" onClose={() => setPaymentSale(null)}>
          <form onSubmit={submitPayment} className="stack">
            <p className="helper-text">{paymentSale.customerName || 'Walk-in'}</p>
            <div className="card-grid cols-3">
              <div>
                <span className="stat-label">Total</span>
                <p style={{ margin: 0 }}>{formatCurrency(Number(paymentSale.totalAmount))}</p>
              </div>
              <div>
                <span className="stat-label">Already paid</span>
                <p style={{ margin: 0 }}>{formatCurrency(Number(paymentSale.paidAmount))}</p>
              </div>
              <div>
                <span className="stat-label">Pending</span>
                <p style={{ margin: 0 }}>{formatCurrency(Number(paymentSale.totalAmount) - Number(paymentSale.paidAmount))}</p>
              </div>
            </div>

            <label className="field">
              <span className="field-label">Amount received</span>
              <input
                autoFocus
                type="number"
                min="0.01"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Paid via</span>
              <div className="split-actions">
                {(['cash', 'upi'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={`button-secondary button-sm ${recordMethod === method ? 'button-secondary-active' : ''}`}
                    onClick={() => setRecordMethod(method)}
                  >
                    {method === 'cash' ? 'Cash' : 'UPI'}
                  </button>
                ))}
              </div>
            </label>

            {paymentError && <p className="field-error">{paymentError}</p>}

            <div className="split-actions">
              <button type="button" className="button-secondary" onClick={() => setPaymentSale(null)}>Cancel</button>
              <button type="submit" disabled={recordingPayment}>
                <CheckCircle2 size={16} /> {recordingPayment ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
