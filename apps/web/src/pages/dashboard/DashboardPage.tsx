import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, IndianRupee, ShoppingCart, Users } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency } from '../../lib/utils';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    dashboardApi.summary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const today = summary?.today ?? { sales: 0, revenue: 0 };
  const lowStockAlerts = summary?.lowStockAlerts ?? [];
  const topCustomers = summary?.topCustomers ?? [];

  return (
    <div className="page stack">
      <section className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Live summary of today's activity and low-stock alerts.</p>
        </div>
        <Link to="/sales" className="button">New Sale</Link>
      </section>

      <section className="card-grid cols-2 cols-4">
        <article className="card card-pad stat-card">
          <span className="stat-icon"><ShoppingCart size={18} /></span>
          <span className="stat-label">Today's Sales</span>
          <p className="stat-value">{today.sales}</p>
        </article>
        <article className="card card-pad stat-card">
          <span className="stat-icon"><IndianRupee size={18} /></span>
          <span className="stat-label">Today's Revenue</span>
          <p className="stat-value">{formatCurrency(Number(today.revenue ?? 0))}</p>
        </article>
        <article className="card card-pad stat-card">
          <span className="stat-icon"><AlertTriangle size={18} /></span>
          <span className="stat-label">Low Stock Items</span>
          <p className="stat-value">{lowStockAlerts.length}</p>
        </article>
        <article className="card card-pad stat-card">
          <span className="stat-icon"><Users size={18} /></span>
          <span className="stat-label">Top Customers</span>
          <p className="stat-value">{topCustomers.length}</p>
        </article>
      </section>

      <section className="card card-pad stack">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>Low Stock Alerts</h2>
          <span className="badge badge-soft">Threshold: below 10</span>
        </div>
        {lowStockAlerts.length === 0 ? (
          <div className="empty-state">No low stock alerts right now.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Stock</th></tr></thead>
              <tbody>
                {lowStockAlerts.map((item: any) => (
                  <tr key={item.id}><td>{item.name}</td><td><span className="badge badge-danger">{item.stockQuantity}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card card-pad stack">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>Top Customers</h2>
        </div>
        {topCustomers.length === 0 ? (
          <div className="empty-state">No customer activity yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Total Purchases</th></tr></thead>
              <tbody>
                {topCustomers.map((customer: any) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.phone ?? '-'}</td>
                    <td>{formatCurrency(Number(customer.totalPurchases ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
