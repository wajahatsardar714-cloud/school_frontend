import { useState, useEffect } from 'react'
import { facultyService } from '../services/facultyService'
import { salaryService } from '../services/salaryService'

const SalaryVoucherManagement = () => {
  const [facultyList, setFacultyList] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [filters, setFilters] = useState({
    faculty_id: '',
    month: '',
    year: new Date().getFullYear().toString(),
    is_paid: ''
  })

  const [generateForm, setGenerateForm] = useState({
    faculty_id: '',
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  })

  const [bulkGenerateForm, setBulkGenerateForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    faculty_ids: [] // Empty means all active faculty
  })

  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'BONUS',
    amount: '',
    calc_type: 'FLAT'
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadFaculty()
    loadVouchers()
    loadStats()
  }, [])

  const loadFaculty = async () => {
    try {
      const response = await facultyService.list({ is_active: true })
      setFacultyList(response.data || [])
    } catch (err) {
      console.error('Failed to load faculty:', err)
    }
  }

  const loadVouchers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await salaryService.listVouchers(filters)
      setVouchers(response.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load vouchers')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await salaryService.getStats()
      setStats(response.data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const loadUnpaidVouchers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await salaryService.getUnpaidVouchers()
      setVouchers(response.data || [])
      setFilters({ ...filters, is_paid: 'false' })
    } catch (err) {
      setError(err.message || 'Failed to load unpaid vouchers')
    } finally {
      setLoading(false)
    }
  }

  const loadVoucherDetails = async (voucherId) => {
    try {
      setLoading(true)
      const response = await salaryService.getVoucher(voucherId)
      setSelectedVoucher(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load voucher details')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleApplyFilters = () => {
    loadVouchers()
  }

  const handleGenerateVoucher = async (e) => {
    e.preventDefault()

    if (!generateForm.faculty_id || !generateForm.month) {
      setError('All fields are required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await salaryService.generateVoucher({
        faculty_id: parseInt(generateForm.faculty_id),
        month: generateForm.month + '-01' // Convert YYYY-MM to YYYY-MM-DD
      })

      setSuccess('Salary voucher generated successfully')
      setShowGenerateModal(false)
      setGenerateForm({ faculty_id: '', month: new Date().toISOString().slice(0, 7) })
      await loadVouchers()
    } catch (err) {
      setError(err.message || 'Failed to generate voucher')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddAdjustment = async (e) => {
    e.preventDefault()

    if (!adjustmentForm.amount || parseFloat(adjustmentForm.amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await salaryService.addAdjustment(selectedVoucher.id, {
        type: adjustmentForm.type,
        amount: parseFloat(adjustmentForm.amount),
        calc_type: adjustmentForm.calc_type
      })

      setSuccess(`${adjustmentForm.type.toLowerCase()} added successfully`)
      setShowAdjustmentModal(false)
      setAdjustmentForm({ type: 'BONUS', amount: '', calc_type: 'FLAT' })
      await loadVoucherDetails(selectedVoucher.id)
    } catch (err) {
      setError(err.message || 'Failed to add adjustment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await salaryService.recordPayment({
        voucher_id: selectedVoucher.id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date
      })

      setSuccess('Payment recorded successfully')
      setShowPaymentModal(false)
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0] })
      await loadVoucherDetails(selectedVoucher.id)
      await loadVouchers()
    } catch (err) {
      setError(err.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVoucher = async (voucherId) => {
    if (!confirm('Are you sure you want to delete this voucher? This action cannot be undone.')) return

    try {
      await salaryService.deleteVoucher(voucherId)
      setSuccess('Voucher deleted successfully')
      if (selectedVoucher?.id === voucherId) {
        setSelectedVoucher(null)
      }
      await loadVouchers()
      await loadStats()
    } catch (err) {
      setError(err.message || 'Failed to delete voucher')
    }
  }

  const handleBulkGenerate = async (e) => {
    e.preventDefault()

    if (!bulkGenerateForm.month) {
      setError('Month is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await salaryService.generateBulkVouchers({
        month: bulkGenerateForm.month + '-01',
        faculty_ids: bulkGenerateForm.faculty_ids.length > 0 ? bulkGenerateForm.faculty_ids : undefined
      })

      // API returns { summary: { total, generated, skipped, failed }, details: { generated, skipped, failed } }
      const summary = response.data?.summary || {}
      const details = response.data?.details || {}
      
      let message = `Generated ${summary.generated || 0} voucher(s).`
      if (summary.skipped > 0) message += ` Skipped: ${summary.skipped}`
      if (summary.failed > 0) {
        message += ` Failed: ${summary.failed}`
        // Show failed faculty names
        if (details.failed?.length > 0) {
          const failedNames = details.failed.map(f => `${f.faculty_name}: ${f.error}`).join(', ')
          setError(`Some vouchers failed: ${failedNames}`)
        }
      }
      
      setSuccess(message)
      setShowBulkGenerateModal(false)
      setBulkGenerateForm({ month: new Date().toISOString().slice(0, 7), faculty_ids: [] })
      await loadVouchers()
      await loadStats()
    } catch (err) {
      setError(err.message || 'Failed to generate vouchers')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPDF = async (voucherId) => {
    try {
      setSubmitting(true)
      setError(null)
      
      const blob = await salaryService.downloadPDF(voucherId)
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `salary-voucher-${voucherId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccess('PDF downloaded successfully')
    } catch (err) {
      setError(err.message || 'Failed to download PDF')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatMonth = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="salary-voucher-management">
      <div className="page-header">
        <div>
          <h1>Salary Voucher Management</h1>
          <p>Generate and manage monthly salary vouchers</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowBulkGenerateModal(true)}
          >
            📋 Bulk Generate
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowGenerateModal(true)}
          >
            + Generate Voucher
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_vouchers || 0}</div>
            <div className="stat-label">Total Vouchers</div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-value">{stats.total_paid || 0}</div>
            <div className="stat-label">Paid</div>
            <div className="stat-amount">{formatCurrency(stats.paid_amount || 0)}</div>
          </div>
          <div className="stat-card stat-warning" onClick={loadUnpaidVouchers} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{stats.total_unpaid || 0}</div>
            <div className="stat-label">Unpaid (Click to view)</div>
            <div className="stat-amount">{formatCurrency(stats.unpaid_amount || 0)}</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{formatCurrency(stats.total_amount || 0)}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-card">
        <h3>Filter Vouchers</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Faculty</label>
            <select
              value={filters.faculty_id}
              onChange={(e) => handleFilterChange('faculty_id', e.target.value)}
            >
              <option value="">All Faculty</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Payment Status</label>
            <select
              value={filters.is_paid}
              onChange={(e) => handleFilterChange('is_paid', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
          </div>

          <div className="form-group">
            <button className="btn btn-primary" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Voucher List */}
        <div className="voucher-list-panel">
          <h2>Salary Vouchers</h2>

          {loading && vouchers.length === 0 ? (
            <div className="loading">Loading vouchers...</div>
          ) : vouchers.length === 0 ? (
            <div className="empty-state">
              <p>No vouchers found</p>
              <small>Generate a new voucher to get started</small>
            </div>
          ) : (
            <div className="voucher-cards">
              {vouchers.map((voucher) => {
                return (
                  <div
                    key={voucher.id}
                    className={`voucher-card ${selectedVoucher?.id === voucher.id ? 'selected' : ''}`}
                    onClick={() => loadVoucherDetails(voucher.id)}
                  >
                    <div className="voucher-card-header">
                      <h3>{voucher.faculty_name}</h3>
                      <span className="badge badge-primary">{voucher.role || 'Staff'}</span>
                    </div>
                    <div className="voucher-card-body">
                      <p><strong>Month:</strong> {formatMonth(voucher.month)}</p>
                      <p><strong>Role:</strong> {voucher.role || 'N/A'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Voucher Details */}
        <div className="voucher-details-panel">
          {selectedVoucher ? (
            <>
              <div className="panel-header">
                <h2>Voucher Details</h2>
                <div className="panel-actions">
                  <button
                    className="btn btn-info"
                    onClick={() => handleDownloadPDF(selectedVoucher.id)}
                    disabled={submitting}
                  >
                    📄 Download PDF
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowAdjustmentModal(true)}
                    disabled={selectedVoucher.status === 'PAID'}
                  >
                    Add Adjustment
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setPaymentForm({ ...paymentForm, amount: (selectedVoucher.due_amount || 0).toString() })
                      setShowPaymentModal(true)
                    }}
                    disabled={selectedVoucher.status === 'PAID'}
                  >
                    Record Payment
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteVoucher(selectedVoucher.id)}
                    disabled={parseFloat(selectedVoucher.paid_amount || 0) > 0}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="details-card">
                <h3>Faculty Information</h3>
                <div className="details-grid">
                  <div><strong>Name:</strong> {selectedVoucher.faculty_name}</div>
                  <div><strong>Month:</strong> {formatMonth(selectedVoucher.month)}</div>
                  <div><strong>Base Salary:</strong> {formatCurrency(selectedVoucher.base_salary)}</div>
                  <div><strong>Generated On:</strong> {formatDate(selectedVoucher.created_at)}</div>
                </div>
              </div>

              {/* Adjustments */}
              <div className="adjustments-section">
                <h3>Adjustments</h3>
                {!selectedVoucher.adjustments || selectedVoucher.adjustments.length === 0 ? (
                  <p className="empty-text">No adjustments</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Calculation</th>
                        <th>Effective Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVoucher.adjustments.map((adj) => {
                        const effectiveAmount = adj.calc_type === 'PERCENTAGE'
                          ? (parseFloat(selectedVoucher.base_salary) * parseFloat(adj.amount)) / 100
                          : parseFloat(adj.amount)
                        
                        return (
                          <tr key={adj.id}>
                            <td>
                              <span className={`badge ${adj.type === 'BONUS' ? 'badge-success' : 'badge-warning'}`}>
                                {adj.type}
                              </span>
                            </td>
                            <td>{adj.calc_type === 'PERCENTAGE' ? `${adj.amount}%` : formatCurrency(adj.amount)}</td>
                            <td>{adj.calc_type}</td>
                            <td className={adj.type === 'BONUS' ? 'text-success' : 'text-warning'}>
                              {adj.type === 'BONUS' ? '+' : '-'}{formatCurrency(effectiveAmount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Payment Summary */}
              <div className="payment-summary-card">
                <h3>Payment Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Gross Salary:</span>
                    <span className="amount">{formatCurrency(selectedVoucher.gross_salary || selectedVoucher.base_salary || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Net Salary:</span>
                    <span className="amount">{formatCurrency(selectedVoucher.net_salary || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Paid:</span>
                    <span className="amount paid">{formatCurrency(selectedVoucher.paid_amount || 0)}</span>
                  </div>
                  <div className="summary-item total">
                    <span>Balance Due:</span>
                    <span className="amount">{formatCurrency(selectedVoucher.due_amount || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Status:</span>
                    <span className={`badge ${selectedVoucher.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedVoucher.status || 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedVoucher.payments && selectedVoucher.payments.length > 0 && (
                <div className="payment-history-section">
                  <h3>Payment History</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Recorded On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVoucher.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.payment_date)}</td>
                          <td className="amount">{formatCurrency(payment.amount)}</td>
                          <td>{formatDate(payment.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a voucher to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Voucher Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate Salary Voucher</h2>
              <button className="close-btn" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>

            <form onSubmit={handleGenerateVoucher}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Faculty Member <span className="required">*</span></label>
                  <select
                    value={generateForm.faculty_id}
                    onChange={(e) => setGenerateForm({ ...generateForm, faculty_id: e.target.value })}
                    disabled={submitting}
                    required
                  >
                    <option value="">Select Faculty</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.current_salary_structure?.base_salary ? `- ${formatCurrency(f.current_salary_structure.base_salary)}` : '(No salary set)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Month <span className="required">*</span></label>
                  <input
                    type="month"
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Generating...' : 'Generate Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Adjustment</h2>
              <button className="close-btn" onClick={() => setShowAdjustmentModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddAdjustment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type <span className="required">*</span></label>
                  <select
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                    disabled={submitting}
                    required
                  >
                    <option value="BONUS">Bonus (Add)</option>
                    <option value="ADVANCE">Advance (Deduct)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Calculation Type <span className="required">*</span></label>
                  <select
                    value={adjustmentForm.calc_type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, calc_type: e.target.value })}
                    disabled={submitting}
                    required
                  >
                    <option value="FLAT">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Amount <span className="required">*</span>
                    {adjustmentForm.calc_type === 'PERCENTAGE' && ' (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={adjustmentForm.calc_type === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 5000'}
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdjustmentModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="info-box">
                  <p><strong>Net Salary:</strong> {formatCurrency(selectedVoucher?.net_salary || 0)}</p>
                  <p><strong>Already Paid:</strong> {formatCurrency(selectedVoucher?.paid_amount || 0)}</p>
                  <p><strong>Balance Due:</strong> {formatCurrency(selectedVoucher?.due_amount || 0)}</p>
                </div>

                <div className="form-group">
                  <label>Payment Amount (PKR) <span className="required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter payment amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowBulkGenerateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bulk Generate Vouchers</h2>
              <button className="close-btn" onClick={() => setShowBulkGenerateModal(false)}>×</button>
            </div>

            <form onSubmit={handleBulkGenerate}>
              <div className="modal-body">
                <div className="info-box">
                  <p>Generate salary vouchers for multiple faculty members at once.</p>
                  <p><strong>Leave faculty selection empty to generate for ALL active faculty.</strong></p>
                </div>

                <div className="form-group">
                  <label>Month <span className="required">*</span></label>
                  <input
                    type="month"
                    value={bulkGenerateForm.month}
                    onChange={(e) => setBulkGenerateForm({ ...bulkGenerateForm, month: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Select Faculty (Optional - leave empty for all)</label>
                  <div className="checkbox-list">
                    {facultyList.map((f) => (
                      <label key={f.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={bulkGenerateForm.faculty_ids.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkGenerateForm({
                                ...bulkGenerateForm,
                                faculty_ids: [...bulkGenerateForm.faculty_ids, f.id]
                              })
                            } else {
                              setBulkGenerateForm({
                                ...bulkGenerateForm,
                                faculty_ids: bulkGenerateForm.faculty_ids.filter(id => id !== f.id)
                              })
                            }
                          }}
                          disabled={submitting}
                        />
                        <span>{f.name}</span>
                        {f.current_salary_structure?.base_salary && (
                          <span className="salary-tag">{formatCurrency(f.current_salary_structure.base_salary)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBulkGenerateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Generating...' : `Generate Vouchers${bulkGenerateForm.faculty_ids.length > 0 ? ` (${bulkGenerateForm.faculty_ids.length})` : ' (All)'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryVoucherManagement
