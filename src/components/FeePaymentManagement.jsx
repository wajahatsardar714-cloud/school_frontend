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
import '../fee.css';

// Note: Backend API does not support payment_method field

export default function FeePaymentManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState('history');
  
  // URL search params for handling direct navigation with filters
  const [searchParams] = useSearchParams();
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Set filters from URL params on component mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setFilters(prev => ({
        ...prev,
        dateFrom: dateParam,
        dateTo: dateParam
      }));
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
  
  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
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
            <div className="stat-value">{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Payments</div>
            <div className="stat-value">{stats.todayCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Collection</div>
            <div className="stat-value">{formatCurrency(stats.todayAmount)}</div>
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
              className="btn-primary"
              onClick={() => setShowRecordModal(true)}
            >
              + Record Payment
            </button>
          </div>
          
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
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Payment Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>#{payment.id}</strong>
                      </td>
                      <td>
                        <div className="student-info">
                          <span className="student-name">
                            {payment.student_name || 'N/A'}
                          </span>
                          <span className="student-roll">
                            {payment.roll_no || ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        {payment.class_name}
                        {payment.section_name && ` - ${payment.section_name}`}
                      </td>
                      <td>{formatMonth(payment.month)}</td>
                      <td>
                        <strong style={{ color: '#28a745' }}>
                          {formatCurrency(parseFloat(payment.amount) || 0)}
                        </strong>
                      </td>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-download"
                            onClick={() => handleViewPayment(payment)}
                            title="View Details"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                {formatCurrency(defaultersSummary.total_due_amount || 0)}
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
                      <td>{formatCurrency(parseFloat(defaulter.total_fee) || 0)}</td>
                      <td style={{ color: '#28a745' }}>
                        {formatCurrency(parseFloat(defaulter.paid_amount) || 0)}
                      </td>
                      <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        {formatCurrency(parseFloat(defaulter.due_amount) || 0)}
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
                        Due: {formatCurrency(parseFloat(voucher.due_amount) || 0)}
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
                <p><strong>Amount Paid:</strong> {formatCurrency(parseFloat(selectedPayment.amount) || 0)}</p>
                <p><strong>Total Fee:</strong> {formatCurrency(parseFloat(selectedPayment.total_fee) || 0)}</p>
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
