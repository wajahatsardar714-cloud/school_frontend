/**
 * FeePaymentManagement Component
 * 
 * Handles fee payment history, recording payments, and payment analytics.
 * Uses robust hooks for race condition prevention and optimized performance.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch, useMutation, useDebounce } from '../hooks/useApi';
import { feeService } from '../services/feeService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { sortClassesBySequence } from '../utils/classSorting';
import { PrintReportHeader, ReportTable, ReportActions } from './PrintReport';
import '../fee.css';

// Note: Backend API does not support payment_method field

export default function FeePaymentManagement() {
  // URL search params for handling direct navigation with filters
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state — synced with URL ?tab=
  const [activeTab, setActiveTabInternal] = useState(() => searchParams.get('tab') || 'history');
  const setActiveTab = useCallback((tab) => {
    setActiveTabInternal(tab);
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', tab); return next; }, { replace: true });
  }, [setSearchParams]);

  // Payments page now shows history view only.
  useEffect(() => {
    if (activeTab !== 'history') {
      setActiveTab('history');
    }
  }, [activeTab, setActiveTab]);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  // Filters state - Initialize without calling function in initial state
  const [filters, setFilters] = useState({
    student_id: '',
    class_id: '',
    section_id: '',
    month: '',
    dateFrom: '',
    dateTo: '',
  });

  // Student search state for payment history filters
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySearchResults, setHistorySearchResults] = useState([]);
  const [historySearchLoading, setHistorySearchLoading] = useState(false);
  const [showHistoryResults, setShowHistoryResults] = useState(false);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null);
  const historySearchRef = useRef(null);
  
  // Set filters from URL params on component mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const today = getTodayDate();
    if (dateParam) {
      setFilters({
        student_id: '',
        class_id: '',
        section_id: '',
        month: '',
        dateFrom: dateParam,
        dateTo: dateParam
      });
    } else {
      // Set to today by default
      setFilters({
        student_id: '',
        class_id: '',
        section_id: '',
        month: '',
        dateFrom: today,
        dateTo: today
      });
    }
  }, [searchParams]);
  
  // Debounce search for performance
  const debouncedHistorySearch = useDebounce(historySearchTerm, 300);
  
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

  const [isTightStatsLayout, setIsTightStatsLayout] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1500;
  });

  // Student search state for record payment modal
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState(null);
  const [studentVouchers, setStudentVouchers] = useState([]);
  const [studentVouchersLoading, setStudentVouchersLoading] = useState(false);
  const studentSearchRef = useRef(null);
  
  // Build query params for API - using backend format
  const queryParams = useMemo(() => {
    const params = {};
    if (filters.student_id) params.student_id = filters.student_id;
    if (filters.class_id) params.class_id = filters.class_id;
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.month) params.month = filters.month;
    if (filters.dateFrom) params.from_date = filters.dateFrom;
    if (filters.dateTo) params.to_date = filters.dateTo;
    return params;
  }, [filters.student_id, filters.class_id, filters.section_id, filters.month, filters.dateFrom, filters.dateTo]);

  // Fetch classes and sections for filters
  const { data: classesData } = useFetch(
    () => classService.list(),
    [],
    { enabled: true }
  );

  const { data: sectionsData } = useFetch(
    () => classService.getSections(filters.class_id),
    [filters.class_id],
    { enabled: !!filters.class_id }
  );

  const sortedClasses = useMemo(
    () => sortClassesBySequence(classesData?.data || []),
    [classesData]
  );

  const filterSections = sectionsData?.data || [];
  
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
  
  // Close student search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(event.target)) {
        setShowStudentResults(false);
      }
      if (historySearchRef.current && !historySearchRef.current.contains(event.target)) {
        setShowHistoryResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsTightStatsLayout(window.innerWidth <= 1500);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounced student search for payment history filter
  useEffect(() => {
    const runSearch = async () => {
      if (debouncedHistorySearch.trim().length < 2) {
        setHistorySearchResults([]);
        setShowHistoryResults(false);
        return;
      }

      setHistorySearchLoading(true);
      try {
        const response = await studentService.search(debouncedHistorySearch.trim());
        const students = response.data?.data || response.data || [];
        setHistorySearchResults(students);
        setShowHistoryResults(true);
      } catch (err) {
        setHistorySearchResults([]);
      } finally {
        setHistorySearchLoading(false);
      }
    };

    runSearch();
  }, [debouncedHistorySearch]);

  // Debounced student search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (studentSearchTerm.trim().length >= 2) {
        setStudentSearchLoading(true);
        try {
          const response = await studentService.search(studentSearchTerm.trim());
          const students = response.data?.data || response.data || [];
          setStudentSearchResults(students);
          setShowStudentResults(true);
        } catch (err) {
          setStudentSearchResults([]);
        } finally {
          setStudentSearchLoading(false);
        }
      } else {
        setStudentSearchResults([]);
        setShowStudentResults(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [studentSearchTerm]);

  // Select a student for payment — fetch their unpaid vouchers
  const handleSelectPaymentStudent = useCallback(async (student) => {
    setSelectedPaymentStudent(student);
    setStudentSearchTerm('');
    setShowStudentResults(false);
    setStudentVouchers([]);
    setPaymentForm(prev => ({ ...prev, voucherId: '' }));
    setStudentVouchersLoading(true);
    try {
      const response = await feeService.getVouchers({ status: 'UNPAID', student_id: student.id });
      const vouchers = response.data?.vouchers || response.data || response.vouchers || [];
      setStudentVouchers(vouchers);
      if (vouchers.length === 1) {
        setPaymentForm(prev => ({ ...prev, voucherId: vouchers[0].voucher_id }));
      }
    } catch (err) {
      console.error('Failed to fetch student vouchers:', err);
    } finally {
      setStudentVouchersLoading(false);
    }
  }, []);

  
  // Fetch fee defaulters — eagerly loaded so data is ready when tab is clicked
  const {
    data: defaultersData,
    loading: defaultersLoading,
    error: defaultersError,
    refetch: refetchDefaulters,
  } = useFetch(
    () => feeService.getDefaulters(),
    [],
    { enabled: true }
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
    setSelectedPaymentStudent(null);
    setStudentSearchTerm('');
    setStudentVouchers([]);
    setShowStudentResults(false);
  }, []);
  
  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear filters - reset to today
  const clearFilters = useCallback(() => {
    const todayDate = getTodayDate();
    setSelectedHistoryStudent(null);
    setHistorySearchTerm('');
    setShowHistoryResults(false);
    setFilters({
      student_id: '',
      class_id: '',
      section_id: '',
      month: '',
      dateFrom: todayDate,
      dateTo: todayDate,
    });
  }, []);

  const handleSelectHistoryStudent = useCallback((student) => {
    setSelectedHistoryStudent(student);
    setHistorySearchTerm('');
    setShowHistoryResults(false);
    setFilters(prev => ({ ...prev, student_id: student.id }));
  }, []);

  const clearHistoryStudent = useCallback(() => {
    setSelectedHistoryStudent(null);
    setHistorySearchTerm('');
    setHistorySearchResults([]);
    setShowHistoryResults(false);
    setFilters(prev => ({ ...prev, student_id: '' }));
  }, []);

  const handleClassFilterChange = useCallback((classId) => {
    setFilters(prev => ({ ...prev, class_id: classId, section_id: '' }));
  }, []);
  
  // Handle payment form change
  const handlePaymentFormChange = useCallback((key, value) => {
    setPaymentForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Get selected voucher details from the student's fetched vouchers
  const selectedVoucher = studentVouchers.find(v => String(v.voucher_id) === String(paymentForm.voucherId));
  const dueAmount = selectedVoucher ? parseFloat(selectedVoucher.due_amount) : 0;
  const paymentAmount = parseFloat(paymentForm.amount) || 0;
  const isFullPayment = paymentAmount >= dueAmount && dueAmount > 0;
  const isPartialPayment = paymentAmount > 0 && paymentAmount < dueAmount;
  
  // Submit payment
  const handleSubmitPayment = useCallback(async (e) => {
    e.preventDefault();
    
    if (!paymentForm.voucherId || !paymentForm.amount) {
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount);
    const selectedVoucher = studentVouchers.find(v => String(v.voucher_id) === String(paymentForm.voucherId));
    const dueAmount = selectedVoucher ? parseFloat(selectedVoucher.due_amount) : 0;
    
    // Prevent overpayment
    if (paymentAmount > dueAmount) {
      alert(`Payment amount (Rs. ${paymentAmount.toLocaleString()}) cannot exceed due amount (Rs. ${dueAmount.toLocaleString()})`);
      return;
    }

    // Confirm partial payment
    if (paymentAmount < dueAmount) {
      const remainingAmount = dueAmount - paymentAmount;
      const confirmed = window.confirm(
        `This is a partial payment of Rs. ${paymentAmount.toLocaleString()}.\n` +
        `Remaining amount of Rs. ${remainingAmount.toLocaleString()} will stay in dues.\n\n` +
        `Do you want to continue?`
      );
      if (!confirmed) {
        return;
      }
    }
    
    await recordPayment(paymentForm);
  }, [paymentForm, recordPayment, studentVouchers]);
  
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

  // Adaptive stat value sizing based on digit count
  const getDigitCount = useCallback((value) => {
    return String(value ?? '').replace(/\D/g, '').length || 1;
  }, []);

  const getAdaptiveValueStyle = useCallback((value) => {
    return {
      '--digit-count': getDigitCount(value)
    };
  }, [getDigitCount]);

  const formatCompactAmount = useCallback((value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(num).replace(/\s+/g, '');
  }, []);

  const getMoneyDisplay = useCallback((value) => {
    const num = Number(value) || 0;
    const full = num.toLocaleString('en-US');
    const digitCount = getDigitCount(num);
    const useCompact = isTightStatsLayout && digitCount >= 5;

    return {
      display: useCompact ? formatCompactAmount(num) : full,
      full,
      useCompact,
    };
  }, [formatCompactAmount, getDigitCount, isTightStatsLayout]);

  const getCountDisplay = useCallback((value) => {
    const num = Number(value) || 0;
    const full = num.toLocaleString('en-US');
    const digitCount = getDigitCount(num);
    const useCompact = isTightStatsLayout && digitCount >= 5;

    return {
      display: useCompact ? formatCompactAmount(num) : full,
      full,
      useCompact,
    };
  }, [formatCompactAmount, getDigitCount, isTightStatsLayout]);
  
  // Computed values - backend wraps data in { success, data, ... }
  const payments = paymentsData?.data || paymentsData?.payments || [];
  
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

  const totalCollectedDisplay = useMemo(
    () => getMoneyDisplay(stats.totalAmount),
    [getMoneyDisplay, stats.totalAmount]
  );

  const totalPaymentsDisplay = useMemo(
    () => getCountDisplay(stats.totalPayments),
    [getCountDisplay, stats.totalPayments]
  );

  const todayCollectedDisplay = useMemo(
    () => getMoneyDisplay(stats.todayAmount),
    [getMoneyDisplay, stats.todayAmount]
  );

  const todayPaymentsDisplay = useMemo(
    () => getCountDisplay(stats.todayCount),
    [getCountDisplay, stats.todayCount]
  );
  
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
      const cls = payment.class_name || '-';
      const sec = payment.section_name || '-';
      const month = payment.month ? new Date(payment.month).toLocaleDateString('en-PK', { year:'numeric', month:'short' }) : '-';
      const date  = payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-PK', { year:'numeric', month:'short', day:'numeric' }) : '-';
      const bg = index % 2 === 0 ? '#ffffff' : '#f0f4ff';
      return `<tr style="background:${bg};">
        <td style="text-align:center;">${index + 1}</td>
        <td>${payment.student_name || 'N/A'}</td>
        <td>${cls}</td>
        <td>${sec}</td>
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
    col.class  { width:12%; }
    col.section{ width:10%; }
    col.month  { width:11%; }
    col.amount { width:13%; }
    col.status { width:15%; }
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
      <col class="section"/><col class="month"/><col class="amount"/><col class="status"/><col class="date"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center;">S.No</th>
        <th>Student</th>
        <th>Class</th>
        <th>Section</th>
        <th style="text-align:center;">Month</th>
        <th style="text-align:right;">Amount</th>
        <th style="text-align:center;">Payment Status</th>
        <th style="text-align:center;">Payment Date</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="8">Grand Total: Rs. ${stats.totalAmount.toLocaleString()}</td></tr>
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
    const headers = ['ID', 'Student', 'Class', 'Section', 'Month', 'Amount', 'Payment Date'];
    const csvData = payments.map(p => [
      p.id,
      p.student_name || 'N/A',
      p.class_name || '-',
      p.section_name || '-',
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
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="analytics-dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Payments</div>
            <div
              className={`stat-value stat-value--adaptive ${totalPaymentsDisplay.useCompact ? 'is-compact' : ''}`}
              style={getAdaptiveValueStyle(stats.totalPayments)}
              title={totalPaymentsDisplay.full}
            >
              {totalPaymentsDisplay.display}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value stat-value--money-block" title={`Rs. ${totalCollectedDisplay.full}`}>
              <span className="money-prefix">Rs.</span>
              <span className={`money-amount ${totalCollectedDisplay.useCompact ? 'is-compact' : ''}`}>
                {totalCollectedDisplay.display}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Payments</div>
            <div
              className={`stat-value stat-value--adaptive ${todayPaymentsDisplay.useCompact ? 'is-compact' : ''}`}
              style={getAdaptiveValueStyle(stats.todayCount)}
              title={todayPaymentsDisplay.full}
            >
              {todayPaymentsDisplay.display}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Collection</div>
            <div className="stat-value stat-value--money-block" title={`Rs. ${todayCollectedDisplay.full}`}>
              <span className="money-prefix">Rs.</span>
              <span className={`money-amount ${todayCollectedDisplay.useCompact ? 'is-compact' : ''}`}>
                {todayCollectedDisplay.display}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {activeTab === 'history' && (
        <>
          {/* Filters */}
          <div className="filters-section">
            <div ref={historySearchRef} style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              {!selectedHistoryStudent ? (
                <>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by student name..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    onFocus={() => historySearchResults.length > 0 && setShowHistoryResults(true)}
                    style={{ width: '100%' }}
                    autoComplete="off"
                  />
                  {historySearchLoading && (
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#6b7280' }}>⏳</span>
                  )}
                  {showHistoryResults && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', maxHeight: '240px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      {historySearchResults.length === 0 ? (
                        <div style={{ padding: '10px 14px', color: '#6c757d', fontSize: '13px' }}>No students found</div>
                      ) : historySearchResults.map((student) => {
                        const fatherName = student.father_name || student.father_guardian_name || 'N/A';
                        const className = student.current_class_name || student.current_enrollment?.class_name || student.class_name || 'N/A';
                        const sectionName = student.current_section_name || student.current_enrollment?.section_name || student.section_name || '';
                        return (
                          <div
                            key={student.id}
                            onClick={() => handleSelectHistoryStudent(student)}
                            style={{ padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{student.name}</div>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                {fatherName} · {className}{sectionName ? ` - ${sectionName}` : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e8f4fd', border: '1px solid #bee3f8', borderRadius: '4px', padding: '6px 10px', height: '38px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                    {selectedHistoryStudent.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedHistoryStudent.name}
                  </span>
                  <button
                    onClick={clearHistoryStudent}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '16px', lineHeight: 1, padding: 0, flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <select
              value={filters.class_id}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Classes</option>
              {sortedClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>

            <select
              value={filters.section_id}
              onChange={(e) => handleFilterChange('section_id', e.target.value)}
              className="filter-select"
              disabled={!filters.class_id}
            >
              <option value="">All Sections</option>
              {filterSections.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>

            <input
              type="month"
              className="filter-input"
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              placeholder="Voucher Month"
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
                { key: "class_",      label: "Class",          printWidth: "12%", printAlign: "left"   },
                { key: "section",     label: "Section",        printWidth: "10%", printAlign: "left"   },
                { key: "month",       label: "Month",          printWidth: "12%", printAlign: "center" },
                { key: "amount",      label: "Amount",         printWidth: "12%", printAlign: "right"  },
                { key: "status",      label: "Payment Status", printWidth: "14%", printAlign: "center" },
                { key: "paymentDate", label: "Payment Date",   printWidth: "12%", printAlign: "center" },
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
                  class_: payment.class_name || '-',
                  section: payment.section_name || '-',
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
                { colSpan: 8, content: `Grand Total: Rs. ${stats.totalAmount.toLocaleString()}`, align: "center" },
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
                {/* Student Search */}
                <div className="form-group" ref={studentSearchRef} style={{ position: 'relative' }}>
                  <label>Search Student *</label>
                  {!selectedPaymentStudent ? (
                    <>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Type student name to search..."
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                          onFocus={() => studentSearchResults.length > 0 && setShowStudentResults(true)}
                          autoComplete="off"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                        />
                        {studentSearchTerm && (
                          <button
                            type="button"
                            onClick={() => { setStudentSearchTerm(''); setShowStudentResults(false); }}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', fontSize: '16px' }}
                          >✕</button>
                        )}
                      </div>
                      {studentSearchLoading && <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>⏳ Searching...</div>}
                      {showStudentResults && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', maxHeight: '260px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                          {studentSearchResults.length === 0 ? (
                            <div style={{ padding: '12px', color: '#6c757d', fontSize: '13px' }}>No students found matching "{studentSearchTerm}"</div>
                          ) : studentSearchResults.map((student) => {
                            const fatherName = student.father_name || student.father_guardian_name || 'N/A';
                            const className = student.current_class_name || student.current_enrollment?.class_name || student.class_name || 'N/A';
                            const sectionName = student.current_section_name || student.current_enrollment?.section_name || student.section_name || '';
                            return (
                              <div
                                key={student.id}
                                onClick={() => handleSelectPaymentStudent(student)}
                                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f4ff'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                              >
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                                  {student.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{student.name}</div>
                                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                    <span style={{ marginRight: '10px' }}>Father: {fatherName}</span>
                                    <span style={{ marginRight: '10px' }}>Class: {className}</span>
                                    {sectionName && <span>Section: {sectionName}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8f4fd', border: '1px solid #bee3f8', borderRadius: '4px', padding: '8px 12px' }}>
                      <div>
                        <strong>{selectedPaymentStudent.name}</strong>
                        <span style={{ marginLeft: '10px', color: '#4a5568', fontSize: '13px' }}>
                          {selectedPaymentStudent.current_class_name || selectedPaymentStudent.current_enrollment?.class_name || selectedPaymentStudent.class_name || ''}
                          {(selectedPaymentStudent.current_section_name || selectedPaymentStudent.current_enrollment?.section_name || selectedPaymentStudent.section_name) && 
                            ` - ${selectedPaymentStudent.current_section_name || selectedPaymentStudent.current_enrollment?.section_name || selectedPaymentStudent.section_name}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedPaymentStudent(null); setStudentVouchers([]); setPaymentForm(prev => ({ ...prev, voucherId: '' })); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '18px', lineHeight: 1 }}
                      >✕</button>
                    </div>
                  )}
                </div>

                {/* Voucher selection for selected student */}
                {selectedPaymentStudent && (
                  <div className="form-group">
                    <label>Select Voucher *</label>
                    {studentVouchersLoading ? (
                      <div style={{ padding: '8px', color: '#6c757d' }}>⏳ Loading vouchers...</div>
                    ) : studentVouchers.length === 0 ? (
                      <div style={{ padding: '8px', color: '#dc3545', fontSize: '13px' }}>No unpaid vouchers found for this student.</div>
                    ) : studentVouchers.length === 1 ? (
                      <div style={{ background: '#f8f9fa', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dee2e6', fontSize: '14px' }}>
                        ✅ Auto-selected: <strong>#{studentVouchers[0].voucher_id}</strong> — 
                        {studentVouchers[0].month ? ` ${new Date(studentVouchers[0].month).toLocaleDateString('en-PK', { year: 'numeric', month: 'short' })}` : ''} — 
                        Due: Rs. {parseFloat(studentVouchers[0].due_amount).toLocaleString()}
                      </div>
                    ) : (
                      <select
                        value={paymentForm.voucherId}
                        onChange={(e) => handlePaymentFormChange('voucherId', e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                      >
                        <option value="">— Select a voucher —</option>
                        {studentVouchers.map(voucher => (
                          <option key={voucher.voucher_id} value={voucher.voucher_id}>
                            #{voucher.voucher_id} —
                            {voucher.month ? ` ${new Date(voucher.month).toLocaleDateString('en-PK', { year: 'numeric', month: 'short' })}` : ''} — 
                            Due: Rs. {parseFloat(voucher.due_amount).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedVoucher && (
                  <div className="voucher-info" style={{ 
                    background: '#f8f9fa', 
                    padding: '12px', 
                    borderRadius: '4px',
                    margin: '10px 0',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                      <strong>Selected Voucher:</strong> #{selectedVoucher.voucher_id}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                      <strong>Student:</strong> {selectedVoucher.student_name}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                      <strong>Due Amount: Rs. {dueAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Amount *</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      required
                      min="1"
                      max={selectedVoucher ? dueAmount : undefined}
                      placeholder={selectedVoucher ? `Enter amount (Max: Rs. ${dueAmount.toLocaleString()})` : "Enter amount"}
                    />
                    {selectedVoucher && paymentAmount > 0 && (
                      <div style={{ 
                        marginTop: '5px', 
                        fontSize: '13px', 
                        padding: '6px 8px',
                        borderRadius: '3px',
                        backgroundColor: isFullPayment ? '#d4edda' : isPartialPayment ? '#fff3cd' : '#f8d7da',
                        color: isFullPayment ? '#155724' : isPartialPayment ? '#856404' : '#721c24',
                        border: `1px solid ${isFullPayment ? '#c3e6cb' : isPartialPayment ? '#ffeaa7' : '#f5c6cb'}`
                      }}>
                        {isFullPayment && (
                          <>✓ <strong>Full Payment</strong> - This voucher will be marked as PAID</>
                        )}
                        {isPartialPayment && (
                          <>⚠ <strong>Partial Payment</strong> - Remaining Rs. {(dueAmount - paymentAmount).toLocaleString()} will stay in dues</>
                        )}
                        {paymentAmount > dueAmount && (
                          <>❌ <strong>Amount Exceeds Due</strong> - Maximum allowed: Rs. {dueAmount.toLocaleString()}</>
                        )}
                      </div>
                    )}
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
                    disabled={
                      recordingPayment || 
                      !selectedPaymentStudent ||
                      !paymentForm.voucherId || 
                      !paymentForm.amount || 
                      paymentAmount <= 0 ||
                      (selectedVoucher && paymentAmount > dueAmount)
                    }
                  >
                    {recordingPayment ? 'Recording...' : 
                     isFullPayment ? 'Record Full Payment' : 
                     isPartialPayment ? 'Record Partial Payment' : 
                     'Record Payment'}
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
