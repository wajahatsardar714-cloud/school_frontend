import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { expenseService } from '../services/expenseService'

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // URL search params for handling direct navigation with filters
  const [searchParams] = useSearchParams();
  
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
    if (dateParam) {
      const filters = {
        start_date: dateParam,
        end_date: dateParam
      };
      setDateFilter(filters);
      loadExpenses(filters);
    } else {
      loadExpenses();
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
    setDateFilter({ start_date: '', end_date: '' })
    loadExpenses()
  }

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
        {(dateFilter.start_date || dateFilter.end_date) && (
          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
        )}
      </div>

      <div className="summary-card">
        <div className="summary-item">
          <span className="summary-label">Total Expenses</span>
          <span className="summary-value">Rs. {totalExpenses.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Number of Entries</span>
          <span className="summary-value">{expenses.length}</span>
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
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Recorded On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td><strong>{expense.title}</strong></td>
                  <td className="amount-cell">Rs. {parseFloat(expense.amount).toFixed(2)}</td>
                  <td>{new Date(expense.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openModal(expense)} className="btn-secondary btn-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="btn-danger btn-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
