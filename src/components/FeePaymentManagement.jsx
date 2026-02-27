/**
 * FeePaymentManagement Component
 * 
 * Handles fee payment history, recording payments, and payment analytics.
 * Uses robust hooks for race condition prevention and optimized performance.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch, useMutation, useDebounce } from '../hooks/useApi';
import { feeService } from '../services/feeService';
import { PrintReportHeader, ReportTable, ReportActions } from './PrintReport';
import '../fee.css';

// Note: Backend API does not support payment_method field

export default function FeePaymentManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState('history');
  
  // URL search params for handling direct navigation with filters
  const [searchParams] = useSearchParams();
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  // Filters state - Initialize without calling function in initial state
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Set filters from URL params on component mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const today = getTodayDate();
    if (dateParam) {
      setFilters({
        search: '',
        dateFrom: dateParam,
        dateTo: dateParam
      });
    } else {
      // Set to today by default
      setFilters({
        search: '',
        dateFrom: today,
        dateTo: today
      });
    }
  }, [searchParams]);
  
  // Debounce search for performance
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Payment detail modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Record payment modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    voucherId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  
  // Build query params for API - using backend format
  const queryParams = useMemo(() => {
    const params = {};
    if (filters.dateFrom) params.from_date = filters.dateFrom;
    if (filters.dateTo) params.to_date = filters.dateTo;
    return params;
  }, [filters.dateFrom, filters.dateTo]);
  
  // Fetch payment history
  const {
    data: paymentsData,
    loading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = useFetch(
    () => feeService.getAllPayments(queryParams),
    [queryParams]
  );
  
  // Fetch unpaid vouchers for recording payments
  const {
    data: unpaidVouchersData,
    loading: vouchersLoading,
  } = useFetch(
    () => feeService.getVouchers({ status: 'UNPAID' }),
    [],
    { enabled: showRecordModal }
  );
  
  // Fetch fee defaulters
  const {
    data: defaultersData,
    loading: defaultersLoading,
    error: defaultersError,
    refetch: refetchDefaulters,
  } = useFetch(
    () => feeService.getDefaulters(),
    [],
    { enabled: activeTab === 'defaulters' }
  );
  
  // Record payment mutation
  const {
    execute: recordPayment,
    loading: recordingPayment,
    error: recordError,
  } = useMutation(
    async (data) => {
      const result = await feeService.recordPayment(data.voucherId, data);
      return result;
    },
    {
      onSuccess: () => {
        setShowRecordModal(false);
        resetPaymentForm();
        refetchPayments();
      },
    }
  );
  
  // Reset payment form
  const resetPaymentForm = useCallback(() => {
    setPaymentForm({
      voucherId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
    });
  }, []);
  
  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear filters - reset to today
  const clearFilters = useCallback(() => {
    const todayDate = getTodayDate();
    setFilters({
      search: '',
      dateFrom: todayDate,
      dateTo: todayDate,
    });
  }, []);
  
  // Handle payment form change
  const handlePaymentFormChange = useCallback((key, value) => {
    setPaymentForm(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Submit payment
  const handleSubmitPayment = useCallback(async (e) => {
    e.preventDefault();
    
    if (!paymentForm.voucherId || !paymentForm.amount) {
      return;
    }
    
    await recordPayment(paymentForm);
  }, [paymentForm, recordPayment]);
  
  // View payment details
  const handleViewPayment = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  }, []);
  
  // Format month from date
  const formatMonth = useCallback((date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
    });
  }, []);
  
  // Format date
  const formatDate = useCallback((date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);
  
  // Computed values - backend wraps data in { success, data, ... }
  const payments = paymentsData?.data || paymentsData?.payments || [];
  const unpaidVouchers = unpaidVouchersData?.data || unpaidVouchersData?.vouchers || [];
  
  // Extract defaulters data - backend wraps in { success, data: { summary, defaulters } }
  const defaultersRaw = defaultersData?.data || defaultersData || {};
  const defaultersSummary = defaultersRaw.summary || {};
  const defaultersList = defaultersRaw.defaulters || [];
  
  // Calculate statistics
  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => 
      p.payment_date?.startsWith(today) || p.created_at?.startsWith(today)
    );
    const todayTotal = todayPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    return {
      totalPayments: payments.length,
      totalAmount: total,
      todayCount: todayPayments.length,
      todayAmount: todayTotal,
    };
  }, [payments]);
  
  // Print report — isolated popup so app CSS never interferes
  const handlePrint = useCallback(() => {
    const dateRangeLabel = `${filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString('en-GB') : 'N/A'} — ${filters.dateTo ? new Date(filters.dateTo).toLocaleDateString('en-GB') : 'N/A'}`;
    const printedOn     = new Date().toLocaleDateString('en-GB');

    const rows = payments.map((payment, index) => {
      const totalFee   = parseFloat(payment.total_fee) || 0;
      const paidAmount = parseFloat(payment.amount)    || 0;
      const remaining  = totalFee - paidAmount;
      const isFullPaid = totalFee === 0 || remaining <= 0;
      const statusHtml = isFullPaid
        ? `<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:999px;font-size:7.5pt;font-weight:700;">Full Paid</span>`
        : `<span style="background:#fff7ed;color:#9a3412;padding:2px 6px;border-radius:4px;font-size:7.5pt;font-weight:600;display:inline-block;text-align:center;">Partial<br/><span style="font-size:6.5pt;">Rs. ${remaining.toLocaleString()} left</span></span>`;
      const cls = `${payment.class_name}${payment.section_name ? ' - ' + payment.section_name : ''}`;
      const month = payment.month ? new Date(payment.month).toLocaleDateString('en-PK', { year:'numeric', month:'short' }) : '-';
      const date  = payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-PK', { year:'numeric', month:'short', day:'numeric' }) : '-';
      const bg = index % 2 === 0 ? '#ffffff' : '#f0f4ff';
      return `<tr style="background:${bg};">
        <td style="text-align:center;">${index + 1}</td>
        <td>${payment.student_name || 'N/A'}</td>
        <td>${cls}</td>
        <td style="text-align:center;">${month}</td>
        <td style="text-align:right;font-weight:700;">Rs. ${paidAmount.toLocaleString()}</td>
        <td style="text-align:center;">${statusHtml}</td>
        <td style="text-align:center;">${date}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Fee Collection Report</title>
  <style>
    @page { size: A4 landscape; margin: 1.2cm 0.8cm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
    .school-name { text-align:center; font-size:11pt; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.15rem; }
    .report-title { text-align:center; font-size:14pt; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem; }
    .divider { border:none; border-top:2.5px solid #1e3a8a; margin-bottom:0; }
    .meta-bar { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; align-items:center; font-size:8pt; padding:.3rem .6rem; background:#e8edf8; border:1px solid #b5c3e8; border-top:none; margin-bottom:.5rem; }
    .meta-bar strong { color:#1e3a8a; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    col.sno    { width:5%; }
    col.student{ width:24%; }
    col.class  { width:13%; }
    col.month  { width:12%; }
    col.amount { width:13%; }
    col.status { width:18%; }
    col.date   { width:15%; }
    th { background:#1e3a8a; color:#fff; font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.03em; padding:.25rem .4rem; border:1px solid #1e3a8a; white-space:nowrap; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    td { padding:.18rem .4rem; border:.5px solid #c0c0c0; font-size:8.5pt; vertical-align:middle; line-height:1.2; white-space:nowrap; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    tfoot td { background:#1e3a8a; color:#fff; font-weight:700; font-size:8.5pt; text-align:center; padding:.25rem .4rem; border:1.5px solid #1e3a8a; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    tr { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  </style>
</head>
<body>
  <div class="school-name">Muslim Public Higher Secondary School Lar</div>
  <div class="report-title">Fee Collection Report</div>
  <hr class="divider"/>
  <div class="meta-bar">
    <span><strong>Date Range:</strong> ${dateRangeLabel}</span>
    <span><strong>Total Payments:</strong> ${stats.totalPayments}</span>
    <span><strong>Total Amount:</strong> Rs. ${stats.totalAmount.toLocaleString()}</span>
    <span><strong>Printed On:</strong> ${printedOn}</span>
  </div>
  <table>
    <colgroup>
      <col class="sno"/><col class="student"/><col class="class"/>
      <col class="month"/><col class="amount"/><col class="status"/><col class="date"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center;">S.No</th>
        <th>Student</th>
        <th>Class</th>
        <th style="text-align:center;">Month</th>
        <th style="text-align:right;">Amount</th>
        <th style="text-align:center;">Payment Status</th>
        <th style="text-align:center;">Payment Date</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="7">Grand Total: Rs. ${stats.totalAmount.toLocaleString()}</td></tr>
    </tfoot>
  </table>
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=1100,height=750');
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 400);
  }, [payments, filters, stats, formatMonth, formatDate]);

  // Save report as CSV
  const handleSave = useCallback(() => {
    const headers = ['ID', 'Student', 'Class', 'Month', 'Amount', 'Payment Date'];
    const csvData = payments.map(p => [
      p.id,
      p.student_name || 'N/A',
      `${p.class_name}${p.section_name ? ' - ' + p.section_name : ''}`,
      formatMonth(p.month),
      parseFloat(p.amount || 0).toFixed(2),
      formatDate(p.payment_date)
    ]);
    
    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    csvContent += `\nTotal Payments,,,,,Rs. ${stats.totalAmount.toFixed(2)}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_payments_${filters.dateFrom}_to_${filters.dateTo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [payments, filters, stats, formatMonth, formatDate]);
  
  return (
    <div className="fee-management">
      <div className="page-header">
        <h2>💳 Fee Payments</h2>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Payment History
          </button>
          <button
            className={`tab-btn ${activeTab === 'defaulters' ? 'active' : ''}`}
            onClick={() => setActiveTab('defaulters')}
          >
            Defaulters
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="analytics-dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Payments</div>
            <div className="stat-value">{stats.totalPayments}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value">Rs. {stats.totalAmount.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Payments</div>
            <div className="stat-value">{stats.todayCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Collection</div>
            <div className="stat-value">Rs. {stats.todayAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      {activeTab === 'history' && (
        <>
          {/* Filters */}
          <div className="filters-section">
            <input
              type="text"
              className="search-input"
              placeholder="Search by student name, roll number, or reference..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <input
              type="date"
              className="filter-input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="From Date"
            />
            <input
              type="date"
              className="filter-input"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="To Date"
            />
            <button
              className="btn-secondary"
              onClick={clearFilters}
            >
              Reset to Today
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowRecordModal(true)}
            >
              + Record Payment
            </button>
          </div>

          <ReportActions
            onSave={handleSave}
            onPrint={handlePrint}
          />

          <PrintReportHeader
            title="Fee Collection Report"
            meta={[
              {
                label: "Date Range",
                value: `${filters.dateFrom
                  ? new Date(filters.dateFrom).toLocaleDateString("en-GB")
                  : "N/A"} — ${filters.dateTo
                  ? new Date(filters.dateTo).toLocaleDateString("en-GB")
                  : "N/A"}`,
              },
              { label: "Total Payments", value: stats.totalPayments },
              { label: "Total Amount",   value: `Rs. ${stats.totalAmount.toLocaleString()}` },
              { label: "Printed On",     value: new Date().toLocaleDateString("en-GB") },
            ]}
          />
          
          {/* Error Display */}
          {paymentsError && (
            <div className="alert alert-error">
              {paymentsError}
            </div>
          )}
          
          {/* Payments Table */}
          {paymentsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <p>No payments found</p>
              <p>Try adjusting your filters or record a new payment</p>
            </div>
          ) : (
            <ReportTable
              columns={[
                { key: "id",          label: "S.No",           printWidth: "6%",  printAlign: "center" },
                { key: "student",     label: "Student",        printWidth: "25%", printAlign: "left"   },
                { key: "class_",      label: "Class",          printWidth: "14%", printAlign: "left"   },
                { key: "month",       label: "Month",          printWidth: "13%", printAlign: "center" },
                { key: "amount",      label: "Amount",         printWidth: "13%", printAlign: "right"  },
                { key: "status",      label: "Payment Status", printWidth: "16%", printAlign: "center" },
                { key: "paymentDate", label: "Payment Date",   printWidth: "13%", printAlign: "center" },
                { key: "actions",     label: "Actions",        printHide: true },
              ]}
              rows={payments.map((payment, index) => {
                const totalFee   = parseFloat(payment.total_fee) || 0;
                const paidAmount = parseFloat(payment.amount)    || 0;
                const remaining  = totalFee - paidAmount;
                const isFullPaid = totalFee === 0 || remaining <= 0;
                return {
                  id: index + 1,
                  student: (
                    <span className="student-name">{payment.student_name || 'N/A'}</span>
                  ),
                  class_: `${payment.class_name}${payment.section_name ? ' - ' + payment.section_name : ''}`,
                  month: formatMonth(payment.month),
                  amount: <strong>Rs. {paidAmount.toLocaleString()}</strong>,
                  status: isFullPaid ? (
                    <span className="pay-status pay-status--full">Full Paid</span>
                  ) : (
                    <span className="pay-status pay-status--partial">
                      Partial<br />
                      <span className="pay-status__remaining">Rs. {remaining.toLocaleString()} left</span>
                    </span>
                  ),
                  paymentDate: formatDate(payment.payment_date),
                  actions: (
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewPayment(payment)}
                      >
                        View
                      </button>
                    </div>
                  ),
                };
              })}
              footerCells={[
                { colSpan: 7, content: `Grand Total: Rs. ${stats.totalAmount.toLocaleString()}`, align: "center" },
              ]}
            />
          )}
        </>
      )}
      
      {activeTab === 'stats' && (
        <div className="generate-section">
          <h3>Payment Statistics</h3>
          
          {/* Monthly Collection Summary */}
          <div style={{ marginTop: '1.5rem' }}>
            <h4>Collection Summary</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{payments.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Collected</div>
                <div className="stat-value">{formatCurrency(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Average Payment</div>
                <div className="stat-value">
                  {formatCurrency(payments.length > 0 ? payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / payments.length : 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Defaulters Tab */}
      {activeTab === 'defaulters' && (
        <>
          {/* Defaulters Summary */}
          <div className="stats-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <div className="stat-label">Total Defaulters</div>
              <div className="stat-value" style={{ color: '#dc3545' }}>
                {defaultersSummary.total_defaulters || 0}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Due Amount</div>
              <div className="stat-value" style={{ color: '#dc3545' }}>
                Rs. {(defaultersSummary.total_due_amount || 0).toLocaleString()}
              </div>
            </div>
          </div>
          
          {defaultersError && (
            <div className="alert alert-error">{defaultersError}</div>
          )}
          
          {defaultersLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading defaulters...</p>
            </div>
          ) : defaultersList.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No defaulters found!</p>
              <p>All students have paid their dues</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Class</th>
                    <th>Vouchers</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Guardian</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultersList.map((defaulter) => (
                    <tr key={defaulter.student_id}>
                      <td>
                        <strong>{defaulter.student_name}</strong>
                        {defaulter.phone && (
                          <div className="student-roll">📞 {defaulter.phone}</div>
                        )}
                      </td>
                      <td>{defaulter.roll_no || '-'}</td>
                      <td>
                        {defaulter.class_name}
                        {defaulter.section_name && ` - ${defaulter.section_name}`}
                      </td>
                      <td>{defaulter.total_vouchers}</td>
                      <td>Rs. {parseFloat(defaulter.total_fee).toLocaleString()}</td>
                      <td style={{ color: '#28a745' }}>
                        Rs. {parseFloat(defaulter.paid_amount).toLocaleString()}
                      </td>
                      <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        Rs. {parseFloat(defaulter.due_amount).toLocaleString()}
                      </td>
                      <td>
                        {defaulter.guardians?.length > 0 ? (
                          <div>
                            <div>{defaulter.guardians[0].name}</div>
                            <div className="student-roll">📞 {defaulter.guardians[0].phone}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Fee Payment</h3>
              <button
                className="modal-close"
                onClick={() => setShowRecordModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {recordError && (
                <div className="alert alert-error">{recordError}</div>
              )}
              
              <form onSubmit={handleSubmitPayment}>
                <div className="form-group">
                  <label>Select Voucher *</label>
                  <select
                    value={paymentForm.voucherId}
                    onChange={(e) => handlePaymentFormChange('voucherId', e.target.value)}
                    required
                    disabled={vouchersLoading}
                  >
                    <option value="">
                      {vouchersLoading ? 'Loading vouchers...' : 'Select a voucher'}
                    </option>
                    {unpaidVouchers.map(voucher => (
                      <option key={voucher.voucher_id} value={voucher.voucher_id}>
                        #{voucher.voucher_id} - {voucher.student_name} ({voucher.class_name}) - 
                        Due: Rs. {parseFloat(voucher.due_amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount *</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                      required
                      min="1"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => handlePaymentFormChange('paymentDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowRecordModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={recordingPayment || !paymentForm.voucherId || !paymentForm.amount}
                  >
                    {recordingPayment ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Details</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="voucher-summary">
                <p><strong>Payment ID:</strong> #{selectedPayment.id}</p>
                <p><strong>Voucher ID:</strong> #{selectedPayment.voucher_id}</p>
                <p><strong>Student:</strong> {selectedPayment.student_name || 'N/A'}</p>
                <p><strong>Roll Number:</strong> {selectedPayment.roll_no || 'N/A'}</p>
                <p><strong>Class:</strong> {selectedPayment.class_name}{selectedPayment.section_name && ` - ${selectedPayment.section_name}`}</p>
                <p><strong>Month:</strong> {formatMonth(selectedPayment.month)}</p>
                <p><strong>Amount Paid:</strong> Rs. {parseFloat(selectedPayment.amount).toLocaleString()}</p>
                <p><strong>Total Fee:</strong> Rs. {parseFloat(selectedPayment.total_fee).toLocaleString()}</p>
                <p><strong>Payment Date:</strong> {formatDate(selectedPayment.payment_date)}</p>
                <p><strong>Recorded At:</strong> {formatDate(selectedPayment.created_at)}</p>
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
