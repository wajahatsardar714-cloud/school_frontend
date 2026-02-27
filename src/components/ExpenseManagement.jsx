import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { expenseService } from '../services/expenseService'
import { PrintReportHeader, ReportTable, ReportActions } from './PrintReport'

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // URL search params for handling direct navigation with filters
  const [searchParams] = useSearchParams();
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  const [dateFilter, setDateFilter] = useState({
    start_date: '',
    end_date: ''
  })
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    // Check for date parameter from URL for "Today's Expenses"
    const dateParam = searchParams.get('date');
    const today = getTodayDate();
    if (dateParam) {
      const filters = {
        start_date: dateParam,
        end_date: dateParam
      };
      setDateFilter(filters);
      loadExpenses(filters);
    } else {
      // Load today's expenses by default
      const todayFilter = {
        start_date: today,
        end_date: today
      };
      setDateFilter(todayFilter);
      loadExpenses(todayFilter);
    }
  }, [searchParams])

  const loadExpenses = async (filters = {}) => {
    try {
      setLoading(true)
      const response = await expenseService.list(filters)
      setExpenses(response.data || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense)
      setFormData({
        title: expense.title,
        amount: expense.amount,
        expense_date: expense.expense_date.split('T')[0]
      })
    } else {
      setEditingExpense(null)
      setFormData({
        title: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0]
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingExpense(null)
    setFormData({
      title: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      if (editingExpense) {
        await expenseService.update(editingExpense.id, formData)
      } else {
        await expenseService.create(formData)
      }
      await loadExpenses(dateFilter.start_date || dateFilter.end_date ? dateFilter : {})
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      await expenseService.delete(id)
      await loadExpenses(dateFilter.start_date || dateFilter.end_date ? dateFilter : {})
    } catch (err) {
      setError(err.message || 'Failed to delete expense')
    }
  }

  const handleFilterChange = (field, value) => {
    const newFilter = { ...dateFilter, [field]: value }
    setDateFilter(newFilter)
    if (newFilter.start_date || newFilter.end_date) {
      loadExpenses(newFilter)
    }
  }

  const clearFilters = () => {
    const todayDate = getTodayDate();
    setDateFilter({ start_date: todayDate, end_date: todayDate })
    loadExpenses({ start_date: todayDate, end_date: todayDate })
  }

  const handlePrint = () => {
    const dateRangeLabel = `${dateFilter.start_date ? new Date(dateFilter.start_date).toLocaleDateString('en-GB') : 'N/A'} — ${dateFilter.end_date ? new Date(dateFilter.end_date).toLocaleDateString('en-GB') : 'N/A'}`;
    const printedOn = new Date().toLocaleDateString('en-GB');

    const rows = expenses.map((expense, index) => {
      const bg = index % 2 === 0 ? '#ffffff' : '#f0f4ff';
      const date       = new Date(expense.expense_date).toLocaleDateString('en-GB');
      const recordedOn = new Date(expense.created_at).toLocaleDateString('en-GB');
      const amount     = parseFloat(expense.amount).toLocaleString();
      return `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <td style="text-align:center;">${index + 1}</td>
        <td style="text-align:center;">${date}</td>
        <td><strong>${expense.title}</strong></td>
        <td style="text-align:right;">Rs. ${amount}</td>
        <td style="text-align:center;">${recordedOn}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Expense Report</title>
  <style>
    @page { size: A4 portrait; margin: 1.2cm 0.8cm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
    .school-name  { text-align:center; font-size:11pt; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.15rem; }
    .report-title { text-align:center; font-size:14pt; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem; }
    .divider { border:none; border-top:2.5px solid #1e3a8a; margin-bottom:0; }
    .meta-bar { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; align-items:center; font-size:8pt; padding:.3rem .6rem; background:#e8edf8; border:1px solid #b5c3e8; border-top:none; margin-bottom:.5rem; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .meta-bar strong { color:#1e3a8a; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    col.sno        { width:7%; }
    col.date       { width:14%; }
    col.title      { width:46%; }
    col.amount     { width:18%; }
    col.recordedon { width:15%; }
    th { background:#1e3a8a; color:#fff; font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.03em; padding:.25rem .4rem; border:1px solid #1e3a8a; white-space:nowrap; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    td { padding:.18rem .4rem; border:.5px solid #c0c0c0; font-size:8.5pt; vertical-align:middle; line-height:1.2; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    tfoot td { background:#1e3a8a; color:#fff; font-weight:700; font-size:8.5pt; text-align:center; padding:.25rem .4rem; border:1.5px solid #1e3a8a; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  </style>
</head>
<body>
  <div class="school-name">Muslim Public Higher Secondary School Lar</div>
  <div class="report-title">Expense Report</div>
  <hr class="divider"/>
  <div class="meta-bar">
    <span><strong>Date Range:</strong> ${dateRangeLabel}</span>
    <span><strong>Total Entries:</strong> ${expenses.length}</span>
    <span><strong>Total Amount:</strong> Rs. ${totalExpenses.toLocaleString()}</span>
    <span><strong>Printed On:</strong> ${printedOn}</span>
  </div>
  <table>
    <colgroup>
      <col class="sno"/><col class="date"/><col class="title"/>
      <col class="amount"/><col class="recordedon"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center;">S.No</th>
        <th style="text-align:center;">Date</th>
        <th>Title</th>
        <th style="text-align:right;">Amount</th>
        <th style="text-align:center;">Recorded On</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="5">Grand Total: Rs. ${totalExpenses.toLocaleString()}</td></tr>
    </tfoot>
  </table>
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=900,height=700');
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 400);
  };

  const handleSave = () => {
    // Convert table data to CSV
    const headers = ['Date', 'Title', 'Amount', 'Recorded On'];
    const csvData = expenses.map(exp => [
      new Date(exp.expense_date).toLocaleDateString(),
      exp.title,
      parseFloat(exp.amount).toFixed(2),
      new Date(exp.created_at).toLocaleDateString()
    ]);
    
    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    csvContent += `\nTotal Expense,,,Rs. ${totalExpenses.toFixed(2)}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${dateFilter.start_date}_to_${dateFilter.end_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Expense Management</h2>
          <p className="text-muted">Track school expenses and expenditures</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          + Add Expense
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-section">
        <div className="filter-group">
          <label>From Date:</label>
          <input
            type="date"
            value={dateFilter.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>To Date:</label>
          <input
            type="date"
            value={dateFilter.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
        </div>
        <button onClick={clearFilters} className="btn-secondary">
          Reset to Today
        </button>
      </div>

      <ReportActions
        onSave={handleSave}
        onPrint={handlePrint}
      />

      <PrintReportHeader
        title="Expense Report"
        meta={[
          {
            label: "Date Range",
            value: `${dateFilter.start_date
              ? new Date(dateFilter.start_date).toLocaleDateString("en-GB")
              : "N/A"} — ${dateFilter.end_date
              ? new Date(dateFilter.end_date).toLocaleDateString("en-GB")
              : "N/A"}`,
          },
          { label: "Total Entries", value: expenses.length },
          { label: "Total Amount",  value: `Rs. ${totalExpenses.toLocaleString()}` },
          { label: "Printed On",    value: new Date().toLocaleDateString("en-GB") },
        ]}
      />

      <div className="summary-card">
        <div className="summary-item">
          <span className="summary-label">Total Expenses:</span>
          <span className="summary-value">Rs. {totalExpenses.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Number of Entries:</span>
          <span className="summary-value">{expenses.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Period:</span>
          <span className="summary-value">{dateFilter.start_date === dateFilter.end_date ? 'Today' : 'Custom'}</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state">
          <p>No expenses recorded</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add First Expense
          </button>
        </div>
      ) : (
        <ReportTable
          columns={[
            { key: "sno",        label: "S.No",        printWidth: "8%",  printAlign: "center" },
            { key: "date",       label: "Date",        printWidth: "16%", printAlign: "center" },
            { key: "title",      label: "Title",       printWidth: "44%", printAlign: "left"   },
            { key: "amount",     label: "Amount",      printWidth: "17%", printAlign: "right"  },
            { key: "recordedOn", label: "Recorded On", printWidth: "15%", printAlign: "center" },
            { key: "actions",    label: "Actions",     printHide: true },
          ]}
          rows={expenses.map((expense, index) => ({
            id: expense.id,
            sno: index + 1,
            date: new Date(expense.expense_date).toLocaleDateString("en-GB"),
            title: <strong>{expense.title}</strong>,
            amount: `Rs. ${parseFloat(expense.amount).toLocaleString()}`,
            recordedOn: new Date(expense.created_at).toLocaleDateString("en-GB"),
            actions: (
              <div className="action-buttons">
                <button onClick={() => openModal(expense)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(expense.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            ),
          }))}
          footerCells={[
            { colSpan: 5, content: `Grand Total: Rs. ${totalExpenses.toLocaleString()}`, align: "center" },
          ]}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Expense Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Electricity Bill, Office Supplies"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount (Rs.) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expense Date *</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingExpense ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseManagement
