/**
 * AccountsOverview Component
 * 
 * Financial analytics subpage with date-filtered KPIs, charts, and collection matrix.
 * Uses Chart.js (Bar + Doughnut) for visualization consistent with existing analytics.
 * 
 * Backend endpoint:
 * - GET /api/analytics/financial-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../fee.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Quick filter presets
const QUICK_FILTERS = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'last_6_months', label: 'Last 6 Months' },
  { key: 'this_year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

// Pie chart color palette
const PIE_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

function getDateRange(filterKey) {
  const now = new Date();
  let start, end;

  switch (filterKey) {
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_3_months':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_6_months':
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function AccountsOverview({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize dates
  useEffect(() => {
    const range = getDateRange('this_month');
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }, []);

  // Fetch data when dates change
  const fetchData = useCallback(async (sd, ed) => {
    if (!sd || !ed) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ startDate: sd, endDate: ed });
      const response = await apiClient.get(
        `${API_ENDPOINTS.ANALYTICS_FINANCIAL_SUMMARY}?${params.toString()}`
      );
      setData(response?.data || response);
    } catch (err) {
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  // Quick filter handler
  const handleQuickFilter = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    if (filterKey !== 'custom') {
      const range = getDateRange(filterKey);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }, []);

  // Custom date apply
  const handleApplyCustom = useCallback(() => {
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  // Format currency (PKR)
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  }, []);

  const formatPercent = useCallback((value) => {
    return `${(parseFloat(value) || 0).toFixed(1)}%`;
  }, []);

  // Extract data
  const summary = data?.summary || {};
  const monthlyBreakdown = data?.monthly_breakdown || [];
  const expenseDistribution = data?.expense_distribution || [];
  const collectionMatrix = data?.collection_matrix || [];

  // Bar chart data
  const barChartData = useMemo(() => {
    if (!monthlyBreakdown.length) return null;
    return {
      labels: monthlyBreakdown.map((m) => m.label),
      datasets: [
        {
          label: 'Income',
          data: monthlyBreakdown.map((m) => parseFloat(m.income) || 0),
          backgroundColor: 'rgba(37, 99, 235, 0.85)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.6,
        },
        {
          label: 'Expenses',
          data: monthlyBreakdown.map((m) => parseFloat(m.expenses) || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, [monthlyBreakdown]);

  const barChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: { size: 12, family: 'Inter', weight: '500' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (v) => 'Rs. ' + (v / 1000).toFixed(0) + 'K',
          color: '#64748b',
          font: { size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  }), [formatCurrency]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    if (!expenseDistribution.length) return null;
    return {
      labels: expenseDistribution.map((e) => e.category),
      datasets: [
        {
          data: expenseDistribution.map((e) => parseFloat(e.total) || 0),
          backgroundColor: expenseDistribution.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
          borderColor: '#fff',
          borderWidth: 3,
        },
      ],
    };
  }, [expenseDistribution]);

  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, family: 'Inter' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
          },
        },
      },
    },
    cutout: '55%',
  }), [formatCurrency]);

  return (
    <div className="fee-management accounts-overview">
      {/* Header */}
      <div className="ao-header">
        <div className="ao-header-content">
          <div className="ao-header-left">
            <button className="ao-back-btn" onClick={onBack} title="Back to Analytics">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h2 className="ao-title">Accounts Overview</h2>
              <p className="ao-subtitle">Financial performance analytics & insights</p>
            </div>
          </div>
          <button className="ao-refresh-btn" onClick={() => fetchData(startDate, endDate)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="ao-filter-bar">
        <div className="ao-quick-filters">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`ao-filter-chip ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleQuickFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ao-date-pickers">
          <div className="ao-date-group">
            <label className="ao-date-label">From</label>
            <input
              type="date"
              className="ao-date-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveFilter('custom');
              }}
            />
          </div>
          <div className="ao-date-group">
            <label className="ao-date-label">To</label>
            <input
              type="date"
              className="ao-date-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveFilter('custom');
              }}
            />
          </div>
          {activeFilter === 'custom' && (
            <button className="ao-apply-btn" onClick={handleApplyCustom}>
              Apply Filter
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
          <button onClick={() => fetchData(startDate, endDate)} style={{ marginLeft: '1rem', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="ao-kpi-grid">
            {/* Total Collection */}
            <div className="ao-kpi-card ao-kpi-blue">
              <div className="ao-kpi-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="ao-kpi-content">
                <span className="ao-kpi-label">Total Collection</span>
                <span className="ao-kpi-value">{formatCurrency(summary.total_collection)}</span>
                <span className="ao-kpi-hint">Fee payments received</span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="ao-kpi-card ao-kpi-red">
              <div className="ao-kpi-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
              </div>
              <div className="ao-kpi-content">
                <span className="ao-kpi-label">Total Expenses</span>
                <span className="ao-kpi-value">{formatCurrency(summary.total_expenses)}</span>
                <span className="ao-kpi-hint">Salaries + other expenses</span>
              </div>
            </div>

            {/* Net Balance */}
            <div className={`ao-kpi-card ${(summary.net_balance || 0) >= 0 ? 'ao-kpi-green' : 'ao-kpi-loss'}`}>
              <div className="ao-kpi-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="ao-kpi-content">
                <span className="ao-kpi-label">Net Balance</span>
                <span className="ao-kpi-value">
                  {(summary.net_balance || 0) >= 0 ? '' : '-'}
                  {formatCurrency(Math.abs(summary.net_balance || 0))}
                </span>
                <span className="ao-kpi-hint">
                  {(summary.net_balance || 0) >= 0 ? 'Profit' : 'Loss'}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="ao-charts-grid">
            {/* Bar Chart - Income vs Expenses */}
            <div className="ao-chart-card ao-chart-bar">
              <h3 className="ao-chart-title">Income vs Expenses</h3>
              {barChartData ? (
                <div className="ao-chart-container">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              ) : (
                <div className="ao-no-data">No data available for this period</div>
              )}
            </div>

            {/* Pie Chart - Expense Distribution */}
            <div className="ao-chart-card ao-chart-pie">
              <h3 className="ao-chart-title">Expense Distribution</h3>
              {pieChartData ? (
                <div className="ao-chart-container ao-pie-container">
                  <Doughnut data={pieChartData} options={pieChartOptions} />
                </div>
              ) : (
                <div className="ao-no-data">No expense data for this period</div>
              )}
            </div>
          </div>

          {/* Collection Matrix Table */}
          <div className="ao-matrix-card">
            <h3 className="ao-chart-title">Collection Matrix</h3>
            <p className="ao-matrix-subtitle">Monthly expected fees vs actual collected</p>
            {collectionMatrix.length > 0 ? (
              <div className="ao-table-wrapper">
                <table className="ao-table">
                  <colgroup>
                    <col className="col-month" />
                    <col className="col-expected" />
                    <col className="col-actual" />
                    <col className="col-variance" />
                    <col className="col-rate" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Expected Fees</th>
                      <th>Actual Collected</th>
                      <th>Variance</th>
                      <th>Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionMatrix.map((row, idx) => {
                      const expected = parseFloat(row.expected) || 0;
                      const actual = parseFloat(row.actual) || 0;
                      const variance = actual - expected;
                      const rate = parseFloat(row.collection_rate) || 0;
                      return (
                        <tr key={idx}>
                          <td className="ao-cell-month">{row.label}</td>
                          <td className="ao-cell-amount">{formatCurrency(expected)}</td>
                          <td className="ao-cell-amount ao-text-success">{formatCurrency(actual)}</td>
                          <td className={`ao-cell-amount ${variance >= 0 ? 'ao-text-success' : 'ao-text-danger'}`}>
                            {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                          </td>
                          <td>
                            <div className="ao-rate-cell">
                              <div className="ao-rate-bar-bg">
                                <div
                                  className="ao-rate-bar-fill"
                                  style={{
                                    width: `${Math.min(rate, 100)}%`,
                                    background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444',
                                  }}
                                />
                              </div>
                              <span className={`ao-rate-text ${rate >= 80 ? 'ao-text-success' : rate >= 50 ? 'ao-text-warning' : 'ao-text-danger'}`}>
                                {formatPercent(rate)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {collectionMatrix.length > 1 && (
                    <tfoot>
                      <tr className="ao-totals-row">
                        <td className="ao-cell-month">Total</td>
                        <td className="ao-cell-amount">
                          {formatCurrency(collectionMatrix.reduce((s, r) => s + (parseFloat(r.expected) || 0), 0))}
                        </td>
                        <td className="ao-cell-amount ao-text-success">
                          {formatCurrency(collectionMatrix.reduce((s, r) => s + (parseFloat(r.actual) || 0), 0))}
                        </td>
                        <td className={`ao-cell-amount ${
                          collectionMatrix.reduce((s, r) => s + (parseFloat(r.actual) || 0), 0) -
                          collectionMatrix.reduce((s, r) => s + (parseFloat(r.expected) || 0), 0) >= 0
                            ? 'ao-text-success' : 'ao-text-danger'
                        }`}>
                          {(() => {
                            const totalActual = collectionMatrix.reduce((s, r) => s + (parseFloat(r.actual) || 0), 0);
                            const totalExpected = collectionMatrix.reduce((s, r) => s + (parseFloat(r.expected) || 0), 0);
                            const totalVar = totalActual - totalExpected;
                            return `${totalVar >= 0 ? '+' : ''}${formatCurrency(totalVar)}`;
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const totalActual = collectionMatrix.reduce((s, r) => s + (parseFloat(r.actual) || 0), 0);
                            const totalExpected = collectionMatrix.reduce((s, r) => s + (parseFloat(r.expected) || 0), 0);
                            const avgRate = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
                            return (
                              <span className={`ao-rate-badge ${avgRate >= 80 ? 'ao-badge-success' : avgRate >= 50 ? 'ao-badge-warning' : 'ao-badge-danger'}`}>
                                {formatPercent(avgRate)}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <div className="ao-no-data">No collection data for this period</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
