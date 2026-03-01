import { useState, useMemo, useCallback } from 'react'
import { feePaymentService } from '../services/feeService'
import { classService } from '../services/classService'
import { useFetch } from '../hooks/useApi'
import { sortClassesBySequence, getClassSortOrder } from '../utils/classSorting'
import '../fee.css'

const FeeDefaulters = () => {
  const [filters, setFilters] = useState({
    class_id: '',
    section_id: '',
    min_due_amount: '',
    overdue_only: false,
  })

  const [sortConfig, setSortConfig] = useState({
    key: 'due_amount',
    direction: 'desc',
  })

  // Fetch classes
  const { data: classesData } = useFetch(
    () => classService.list(),
    [],
    { enabled: true }
  )
  
  // Sort classes by sequence
  const sortedClasses = useMemo(() => {
    return sortClassesBySequence(classesData?.data || [])
  }, [classesData])

  // Fetch sections for selected class
  const { data: sectionsData } = useFetch(
    () => classService.getSections(filters.class_id),
    [filters.class_id],
    { enabled: !!filters.class_id }
  )

  // Fetch defaulters
  const {
    data: defaultersData,
    loading: defaultersLoading,
    refetch: refreshDefaulters
  } = useFetch(
    () => feePaymentService.getDefaulters(filters),
    [filters.class_id, filters.section_id, filters.min_due_amount, filters.overdue_only],
    { enabled: true }
  )

  // Group and sort defaulters by School/College, then by class/section sequence
  const groupedDefaulters = useMemo(() => {
    const defaulters = defaultersData?.data?.defaulters || defaultersData?.defaulters || []
    
    // Sort defaulters by class sequence, section, then student name
    const sorted = [...defaulters].sort((a, b) => {
      // First sort by class sequence
      const classOrderA = getClassSortOrder(a.class_name)
      const classOrderB = getClassSortOrder(b.class_name)
      
      if (classOrderA !== classOrderB) {
        return classOrderA - classOrderB
      }
      
      // Then by section
      const sectionA = (a.section_name || '').toLowerCase()
      const sectionB = (b.section_name || '').toLowerCase()
      if (sectionA !== sectionB) {
        return sectionA.localeCompare(sectionB)
      }
      
      // Finally by student name
      return (a.student_name || '').localeCompare(b.student_name || '')
    })
    
    // Group into School (1-13) and College (14-15)
    const schoolDefaulters = sorted.filter(d => {
      const order = getClassSortOrder(d.class_name)
      return order >= 1 && order <= 13
    })
    
    const collegeDefaulters = sorted.filter(d => {
      const order = getClassSortOrder(d.class_name)
      return order >= 14 && order <= 15
    })
    
    return { schoolDefaulters, collegeDefaulters, allDefaulters: sorted }
  }, [defaultersData])
  
  // Sort by user selection (for backward compatibility)
  const sortedDefaulters = useMemo(() => {
    const defaulters = groupedDefaulters.allDefaulters
    if (!sortConfig.key) return defaulters

    const sorted = [...defaulters].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      // Handle numeric sorting for strings that are numbers
      if (['due_amount', 'total_fee', 'paid_amount', 'total_vouchers'].includes(sortConfig.key)) {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }, [groupedDefaulters, sortConfig])

  // Summary
  const summary = useMemo(() => {
    return defaultersData?.data?.summary || defaultersData?.summary || {
      total_defaulters: 0,
      total_due_amount: 0,
    }
  }, [defaultersData])

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'Section', 'S.No', 'Student Name', 'Roll No', 'Class', 'Section',
      'Father/Guardian', 'Contact', 'Total Vouchers',
      'Total Fee', 'Paid Amount', 'Due Amount'
    ]
    
    const schoolRows = groupedDefaulters.schoolDefaulters.map((d, index) => {
      const guardian = d.guardians?.[0] || {}
      const fatherGuardian = d.guardians?.find(g => g.relation === 'Father') || guardian
      const fatherName = d.father_name || fatherGuardian.name || guardian.name || d.guardian_name || '-'
      const contact = fatherGuardian.phone || d.guardian_contact || d.phone || '-'
      
      return [
        'SCHOOL',
        index + 1,
        d.student_name,
        d.roll_no,
        d.class_name,
        d.section_name || '-',
        fatherName,
        contact,
        d.total_vouchers,
        d.total_fee || 0,
        d.paid_amount || 0,
        d.due_amount,
      ]
    })
    
    const collegeRows = groupedDefaulters.collegeDefaulters.map((d, index) => {
      const guardian = d.guardians?.[0] || {}
      const fatherGuardian = d.guardians?.find(g => g.relation === 'Father') || guardian
      const fatherName = d.father_name || fatherGuardian.name || guardian.name || d.guardian_name || '-'
      const contact = fatherGuardian.phone || d.guardian_contact || d.phone || '-'
      
      return [
        'COLLEGE',
        groupedDefaulters.schoolDefaulters.length + index + 1,
        d.student_name,
        d.roll_no,
        d.class_name,
        d.section_name || '-',
        fatherName,
        contact,
        d.total_vouchers,
        d.total_fee || 0,
        d.paid_amount || 0,
        d.due_amount,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...schoolRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...collegeRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `defaulters-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [groupedDefaulters])

  // Print function (popup approach with School/College sections)
  const handlePrint = useCallback(() => {
    const printedOn = new Date().toLocaleDateString('en-GB');
    const { schoolDefaulters, collegeDefaulters } = groupedDefaulters;
    
    // Helper to generate rows for a section
    const generateRows = (defaulters, startIndex = 0) => {
      return defaulters.map((d, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f0f4ff';
        const guardian = d.guardians?.[0] || {};
        const fatherGuardian = d.guardians?.find(g => g.relation === 'Father') || guardian;
        const contact = fatherGuardian.phone || d.guardian_contact || d.phone || '-';
        const fatherName = d.father_name || fatherGuardian.name || guardian.name || d.guardian_name || '-';
        
        return `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <td style="text-align:center;">${startIndex + index + 1}</td>
          <td><strong>${d.student_name}</strong></td>
          <td>${d.roll_no || '-'}</td>
          <td>${d.class_name}</td>
          <td>${d.section_name || '-'}</td>
          <td>${fatherName}</td>
          <td>${contact}</td>
          <td style="text-align:center;">${d.total_vouchers || 0}</td>
          <td style="text-align:right;">Rs. ${parseFloat(d.total_fee || 0).toLocaleString()}</td>
          <td style="text-align:right;">Rs. ${parseFloat(d.paid_amount || 0).toLocaleString()}</td>
          <td style="text-align:right;font-weight:bold;color:#dc2626;">Rs. ${parseFloat(d.due_amount || 0).toLocaleString()}</td>
        </tr>`;
      }).join('');
    }
    
    const schoolRows = generateRows(schoolDefaulters, 0);
    const collegeRows = generateRows(collegeDefaulters, schoolDefaulters.length);
    
    const schoolDueTotal = schoolDefaulters.reduce((sum, d) => sum + parseFloat(d.due_amount || 0), 0);
    const collegeDueTotal = collegeDefaulters.reduce((sum, d) => sum + parseFloat(d.due_amount || 0), 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Fee Defaulters Report</title>
  <style>
    @page { size: A4 landscape; margin: 1cm 0.6cm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #000; background: #fff; }
    .school-name { text-align:center; font-size:11pt; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.15rem; }
    .report-title { text-align:center; font-size:14pt; font-weight:700; color:#dc2626; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem; }
    .divider { border:none; border-top:2.5px solid #dc2626; margin-bottom:0; }
    .meta-bar { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; align-items:center; font-size:8pt; padding:.3rem .6rem; background:#fef2f2; border:1px solid #fecaca; border-top:none; margin-bottom:.5rem; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .meta-bar strong { color:#dc2626; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    col.sno { width:4%; }
    col.student { width:14%; }
    col.roll { width:6%; }
    col.class { width:9%; }
    col.section { width:7%; }
    col.guardian { width:12%; }
    col.contact { width:10%; }
    col.vouchers { width:6%; }
    col.total { width:10%; }
    col.paid { width:10%; }
    col.due { width:12%; }
    th { background:#dc2626; color:#fff; font-size:6.5pt; font-weight:700; text-transform:uppercase; letter-spacing:.02em; padding:.2rem .3rem; border:1px solid #dc2626; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    td { padding:.15rem .3rem; border:.5px solid #c0c0c0; font-size:7.5pt; vertical-align:middle; line-height:1.2; }
    thead { display:table-header-group; }
    tr { page-break-inside:avoid; }
    tfoot td { background:#dc2626; color:#fff; font-weight:700; font-size:8pt; text-align:right; padding:.25rem .3rem; border:1.5px solid #dc2626; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .section-header { background:#1e3a8a; color:#fff; font-size:10pt; font-weight:700; text-align:center; padding:.4rem; margin-top:.8rem; margin-bottom:.3rem; text-transform:uppercase; letter-spacing:.04em; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .section-header.college { background:#059669; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-data { text-align:center; color:#64748b; padding:1rem; font-style:italic; }
  </style>
</head>
<body>
  <div class="school-name">Muslim Public Higher Secondary School Lar</div>
  <div class="report-title">Fee Defaulters Report</div>
  <hr class="divider"/>
  <div class="meta-bar">
    <span><strong>Total Defaulters:</strong> ${summary.total_defaulters}</span>
    <span><strong>Total Due Amount:</strong> Rs. ${summary.total_due_amount?.toLocaleString() || 0}</span>
    <span><strong>Printed On:</strong> ${printedOn}</span>
  </div>
  
  ${schoolDefaulters.length > 0 ? `
  <div class="section-header">🏫 SCHOOL SECTION (PG to 10th)</div>
  <table>
    <colgroup>
      <col class="sno"/><col class="student"/><col class="roll"/><col class="class"/>
      <col class="section"/><col class="guardian"/><col class="contact"/>
      <col class="vouchers"/><col class="total"/><col class="paid"/><col class="due"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center;">S.No</th>
        <th>Student</th>
        <th>Roll</th>
        <th>Class</th>
        <th>Section</th>
        <th>Father/Guardian</th>
        <th>Contact</th>
        <th style="text-align:center;">Vouchers</th>
        <th style="text-align:right;">Total Fee</th>
        <th style="text-align:right;">Paid</th>
        <th style="text-align:right;">Due</th>
      </tr>
    </thead>
    <tbody>${schoolRows}</tbody>
    <tfoot>
      <tr><td colspan="10" style="text-align:right;"><strong>School Section Total:</strong></td><td style="text-align:right;">Rs. ${schoolDueTotal.toLocaleString()}</td></tr>
    </tfoot>
  </table>` : '<div class="no-data">No school defaulters found</div>'}
  
  ${collegeDefaulters.length > 0 ? `
  <div class="section-header college" style="page-break-before: ${schoolDefaulters.length > 15 ? 'always' : 'auto'};">🎓 COLLEGE SECTION (1st Year & 2nd Year)</div>
  <table>
    <colgroup>
      group class="sno"/><col class="student"/><col class="roll"/><col class="class"/>
      <col class="section"/><col class="guardian"/><col class="contact"/>
      <col class="vouchers"/><col class="total"/><col class="paid"/><col class="due"/>
    </colgroup>
    <thead>
      <tr>
        <th style="text-align:center;">S.No</th>
        <th>Student</th>
        <th>Roll</th>
        <th>Class</th>
        <th>Section</th>
        <th>Father/Guardian</th>
        <th>Contact</th>
        <th style="text-align:center;">Vouchers</th>
        <th style="text-align:right;">Total Fee</th>
        <th style="text-align:right;">Paid</th>
        <th style="text-align:right;">Due</th>
      </tr>
    </thead>
    <tbody>${collegeRows}</tbody>
    <tfoot>
      <tr><td colspan="10" style="text-align:right;"><strong>College Section Total:</strong></td><td style="text-align:right;">Rs. ${collegeDueTotal.toLocaleString()}</td></tr>
    </tfoot>
  </table>` : '<div class="no-data">No college defaulters found</div>'}
  
  ${(schoolDefaulters.length > 0 || collegeDefaulters.length > 0) ? `
  <table style="margin-top:.5rem;margin-bottom:.5rem;">
    <tfoot>
      <tr><td colspan="11" style="text-align:center;font-size:9pt;"><strong>GRAND TOTAL DUE:</strong> Rs. ${summary.total_due_amount?.toLocaleString() || 0}</td></tr>
    </tfoot>
  </table>` : ''}
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=1000,height=700');
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 400);
  }, [sortedDefaulters, summary])

  return (
    <div className="fee-management">
      <div className="fee-header">
        <h1>⚠️ Fee Defaulters</h1>
        <div className="header-actions">
          <button
            onClick={handlePrint}
            className="btn-secondary"
            disabled={groupedDefaulters.schoolDefaulters.length === 0 && groupedDefaulters.collegeDefaulters.length === 0}
          >
            🖨️ Print Report
          </button>
          <button
            onClick={exportToCSV}
            className="btn-secondary"
            disabled={groupedDefaulters.schoolDefaulters.length === 0 && groupedDefaulters.collegeDefaulters.length === 0}
          >
            📥 Export CSV
          </button>
          <button
            onClick={refreshDefaulters}
            className="btn-primary"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-danger">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Total Defaulters</div>
            <div className="stat-value">{summary.total_defaulters}</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Due Amount</div>
            <div className="stat-value">
              Rs. {summary.total_due_amount?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Class</label>
          <select
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value, section_id: '' })}
          >
            <option value="">All Classes</option>
            {sortedClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Section</label>
          <select
            value={filters.section_id}
            onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
            disabled={!filters.class_id}
          >
            <option value="">All Sections</option>
            {(sectionsData?.data || []).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Min Due Amount</label>
          <input
            type="number"
            value={filters.min_due_amount}
            onChange={(e) => setFilters({ ...filters, min_due_amount: e.target.value })}
            placeholder="e.g., 1000"
            min="0"
          />
        </div>

        <div className="filter-group">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={filters.overdue_only}
              onChange={(e) => setFilters({ ...filters, overdue_only: e.target.checked })}
            />
            {' '}Overdue Only
          </label>
        </div>
      </div>

      {/* Defaulters Tables - School and College Sections */}
      <div className="table-container">
        {defaultersLoading ? (
          <div className="loading">Loading defaulters...</div>
        ) : (
          <>
            {/* School Section */}
            {groupedDefaulters.schoolDefaulters.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', 
                  color: '#fff', 
                  padding: '12px 20px', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  🏫 SCHOOL SECTION (PG to 10th) - {groupedDefaulters.schoolDefaulters.length} Defaulters
                </h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>S.No</th>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Father/Guardian</th>
                      <th>Vouchers</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedDefaulters.schoolDefaulters.map((defaulter, index) => {
                      const guardian = defaulter.guardians?.[0] || {}
                      const fatherGuardian = defaulter.guardians?.find(g => g.relation === 'Father') || guardian
                      const contact = fatherGuardian.phone || defaulter.guardian_contact || defaulter.phone
                      const fatherName = defaulter.father_name || fatherGuardian.name || guardian.name || defaulter.guardian_name || '-'

                      return (
                        <tr key={`school-${defaulter.student_id}-${index}`}>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>{index + 1}</td>
                          <td>
                            <strong>{defaulter.student_name}</strong>
                          </td>
                          <td>{defaulter.roll_no || '-'}</td>
                          <td><strong>{defaulter.class_name}</strong></td>
                          <td>{defaulter.section_name || '-'}</td>
                          <td>
                            <div className="guardian-info">
                              <span className="guardian-name">{fatherName}</span>
                              {contact && (
                                <a href={`tel:${contact}`} className="contact-link small">
                                  📞 {contact}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info">
                              {defaulter.total_vouchers}
                            </span>
                          </td>
                          <td>Rs. {parseFloat(defaulter.total_fee || 0).toLocaleString()}</td>
                          <td className="amount-paid">
                            Rs. {parseFloat(defaulter.paid_amount || 0).toLocaleString()}
                          </td>
                          <td className="amount-due">
                            <strong>Rs. {parseFloat(defaulter.due_amount || 0).toLocaleString()}</strong>
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: '#f0f9ff', fontWeight: '700' }}>
                      <td colSpan="9" style={{ textAlign: 'right', padding: '12px' }}>
                        <strong>School Section Total Due:</strong>
                      </td>
                      <td className="amount-due" style={{ fontSize: '16px' }}>
                        Rs. {groupedDefaulters.schoolDefaulters.reduce((sum, d) => sum + parseFloat(d.due_amount || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* College Section */}
            {groupedDefaulters.collegeDefaulters.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  background: 'linear-gradient(135deg, #059669, #10b981)', 
                  color: '#fff', 
                  padding: '12px 20px', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  🎓 COLLEGE SECTION (1st Year & 2nd Year) - {groupedDefaulters.collegeDefaulters.length} Defaulters
                </h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>S.No</th>
                      <th>Student</th>
                      <th>Roll No</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Father/Guardian</th>
                      <th>Vouchers</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedDefaulters.collegeDefaulters.map((defaulter, index) => {
                      const guardian = defaulter.guardians?.[0] || {}
                      const fatherGuardian = defaulter.guardians?.find(g => g.relation === 'Father') || guardian
                      const contact = fatherGuardian.phone || defaulter.guardian_contact || defaulter.phone
                      const fatherName = defaulter.father_name || fatherGuardian.name || guardian.name || defaulter.guardian_name || '-'

                      return (
                        <tr key={`college-${defaulter.student_id}-${index}`}>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>{groupedDefaulters.schoolDefaulters.length + index + 1}</td>
                          <td>
                            <strong>{defaulter.student_name}</strong>
                          </td>
                          <td>{defaulter.roll_no || '-'}</td>
                          <td><strong>{defaulter.class_name}</strong></td>
                          <td>{defaulter.section_name || '-'}</td>
                          <td>
                            <div className="guardian-info">
                              <span className="guardian-name">{fatherName}</span>
                              {contact && (
                                <a href={`tel:${contact}`} className="contact-link small">
                                  📞 {contact}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info">
                              {defaulter.total_vouchers}
                            </span>
                          </td>
                          <td>Rs. {parseFloat(defaulter.total_fee || 0).toLocaleString()}</td>
                          <td className="amount-paid">
                            Rs. {parseFloat(defaulter.paid_amount || 0).toLocaleString()}
                          </td>
                          <td className="amount-due">
                            <strong>Rs. {parseFloat(defaulter.due_amount || 0).toLocaleString()}</strong>
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: '#ecfdf5', fontWeight: '700' }}>
                      <td colSpan="9" style={{ textAlign: 'right', padding: '12px' }}>
                        <strong>College Section Total Due:</strong>
                      </td>
                      <td className="amount-due" style={{ fontSize: '16px' }}>
                        Rs. {groupedDefaulters.collegeDefaulters.reduce((sum, d) => sum + parseFloat(d.due_amount || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* No Data Message */}
            {groupedDefaulters.schoolDefaulters.length === 0 && groupedDefaulters.collegeDefaulters.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3>{filters.overdue_only ? 'No overdue defaulters found!' : 'No defaulters found!'}</h3>
                <p style={{ marginTop: '8px' }}>All students are up to date with their fee payments.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Help Text */}
      {(groupedDefaulters.schoolDefaulters.length > 0 || groupedDefaulters.collegeDefaulters.length > 0) && (
        <div className="help-text">
          <p>💡 <strong>Tip:</strong> Defaulters are organized by School (PG-10th) and College (1st-2nd Year) sections, sorted by class and section sequence.</p>
        </div>
      )}
    </div>
  )
}

export default FeeDefaulters
