import { useState, useEffect, useRef } from 'react'
import { feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportTable } from './PrintReport'
import schoolLogo from '../assets/logo.png'
import '../fee.css'
import './StudentFeeHistory.css'

const MAX_SELECTED_STUDENTS = 5
const SCHOOL_NAME = 'Muslim Public Higher Secondary School Lar'
const SCHOOL_ADDRESS = 'Bahawalpur Road, Adda Laar'
const SCHOOL_PHONE = '0300-6246297'
const SCHOOL_EMAIL = 'muslimpublichighersecondarysch@gmail.com'

const normalizeStudent = (student) => {
  const className = student.current_enrollment?.class_name ||
    student.current_class_name ||
    student.current_class?.name ||
    student.class_name ||
    'Not Enrolled'

  const sectionName = student.current_enrollment?.section_name ||
    student.current_section_name ||
    student.current_section?.name ||
    student.section_name ||
    'N/A'

  const fatherName = student.father_name ||
    student.guardians?.find(g => g.relation === 'Father')?.name ||
    'N/A'

  return {
    ...student,
    class_name: className,
    section_name: sectionName,
    father_name: fatherName,
    roll_no: student.current_enrollment?.roll_no || student.roll_no || student.student_roll_no || '',
    serial_number: student.serial_number || student.serial_no || student.admission_no || student.admission_number || '',
    admission_no: student.admission_no || student.admission_number || student.serial_number || '',
  }
}

const extractHistoryRows = (response) => {
  const root = response?.data ?? response
  let rows = root?.data ?? root

  if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
    rows = rows.history || rows.payments || rows.vouchers || []
  }

  return Array.isArray(rows) ? rows : []
}

const toVoucherNo = (record, fallbackIndex) => {
  const voucherNo = record?.voucher_no || record?.voucherNo
  if (voucherNo) return String(voucherNo)

  const voucherId = record?.voucher_id || record?.voucherId || record?.id || fallbackIndex
  if (!voucherId) return 'N/A'

  return `V-${voucherId}`
}

const isCollegeHistoryRecord = (record) => {
  const items = Array.isArray(record?.items) ? record.items : []
  const hasYearlyPackageItem = items.some((item) => {
    const itemType = String(item?.item_type || '').toUpperCase().replace(/[\s-]+/g, '_')
    const description = String(item?.description || '').toLowerCase()
    return itemType === 'YEARLY_PACKAGE' || (description.includes('annual') && description.includes('package'))
  })

  const voucherType = String(record?.voucher_type || record?.voucherType || '').toUpperCase()
  const classType = String(record?.class_type || record?.classType || '').toUpperCase()
  return voucherType === 'YEARLY_COLLEGE' || classType === 'COLLEGE' || hasYearlyPackageItem
}

const parseRecordAmounts = (record) => {
  const isCollegeRecord = isCollegeHistoryRecord(record)
  const items = Array.isArray(record.items) ? record.items : []
  const hasItemBreakdown = items.length > 0

  if (isCollegeRecord) {
    const annualFeeFromItems = items.reduce((sum, item) => {
      const itemType = String(item?.item_type || '').toUpperCase().replace(/[\s-]+/g, '_')
      const description = String(item?.description || '').toLowerCase()
      const amount = parseFloat(item?.amount)
      if (Number.isNaN(amount) || amount <= 0) return sum
      const isAnnualPackage = itemType === 'YEARLY_PACKAGE' || (description.includes('annual') && description.includes('package'))
      return isAnnualPackage ? sum + amount : sum
    }, 0)

    const parsedTotalFee = parseFloat(record.total_fee)
    const totalFee = annualFeeFromItems > 0
      ? annualFeeFromItems
      : (Number.isNaN(parsedTotalFee) ? 0 : parsedTotalFee)

    const paidAmount = parseFloat(record.paid_amount) || 0
    const dueAmount = Math.max(totalFee - paidAmount, 0)

    const statusFromRecord = String(record.status || '').toUpperCase()
    const status = ['PAID', 'PARTIAL', 'UNPAID'].includes(statusFromRecord)
      ? statusFromRecord
      : (dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID')

    return {
      monthlyFee: totalFee,
      dues: 0,
      totalFee,
      paidAmount,
      dueAmount,
      status,
    }
  }

  const monthlyFee = items.reduce((sum, item) => {
    const itemType = String(item?.item_type || '').toUpperCase()
    const amount = parseFloat(item?.amount)
    if (Number.isNaN(amount) || amount <= 0) return sum
    return itemType === 'MONTHLY' || itemType === 'MONTHLY_FEE' ? sum + amount : sum
  }, 0)

  const billableFeeFromItems = items.reduce((sum, item) => {
    const itemType = String(item?.item_type || '').toUpperCase()
    const amount = parseFloat(item?.amount)
    if (Number.isNaN(amount)) return sum

    // Keep arrears/dues separate from base billable fee in this report.
    if (itemType === 'ARREARS') return sum

    return sum + amount
  }, 0)

  const duesFromItems = items.reduce((sum, item) => {
    const itemType = String(item?.item_type || '').toUpperCase()
    const description = String(item?.description || '').toLowerCase()
    const amount = parseFloat(item?.amount)
    if (Number.isNaN(amount) || amount <= 0) return sum

    // Only treat outstanding/carry-forward dues as "Dues" in this report.
    const isOutstandingDuesItem = (
      itemType === 'ARREARS' ||
      ((itemType === 'CUSTOM' || itemType === 'DUES') &&
        (description.includes('dues') || description.includes('outstanding') || description.includes('arrear')))
    )

    return isOutstandingDuesItem ? sum + amount : sum
  }, 0)

  const parsedOutstanding = parseFloat(
    record.student_outstanding ??
    record.studentOutstanding ??
    record.outstanding ??
    record.outstanding_due ??
    record.outstandingDue ??
    record.outstanding_dues ??
    record.outstandingDues ??
    record.previous_due ??
    record.previousDue ??
    record.dues
  )

  const hasOutstandingInRecord = Number.isFinite(parsedOutstanding)
  const duesFromRecord = hasOutstandingInRecord ? Math.max(parsedOutstanding, 0) : 0
  const dues = hasOutstandingInRecord
    ? duesFromRecord
    : (hasItemBreakdown ? duesFromItems : 0)

  const parsedTotalFee = parseFloat(record.total_fee)
  const baseBillableFee = hasItemBreakdown
    ? billableFeeFromItems
    : (Number.isNaN(parsedTotalFee) ? 0 : parsedTotalFee)
  const totalFee = baseBillableFee + dues

  const paidAmount = parseFloat(record.paid_amount) || 0
  const dueAmount = Math.max(totalFee - paidAmount, 0)
  const status = dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'

  return {
    monthlyFee,
    dues,
    totalFee,
    paidAmount,
    dueAmount,
    status,
  }
}

const getMonthLabel = (monthValue) => {
  const monthDate = monthValue ? new Date(monthValue) : null
  if (!monthDate || Number.isNaN(monthDate.getTime())) return 'N/A'

  return monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`

const getStudentSerialNo = (student) => {
  return student.roll_no || student.current_enrollment?.roll_no || student.student_roll_no || student.serial_number || student.serial_no || 'N/A'
}

const buildStudentSummary = (history, student) => {
  const totals = history.reduce((acc, record, index) => {
    const amounts = parseRecordAmounts(record)
    const voucherNo = toVoucherNo(record, index + 1)

    acc.totalPaid += amounts.paidAmount
    acc.totalDues += amounts.dues
    if (!acc.latestVoucherNo || acc.latestVoucherNo === 'N/A') {
      acc.latestVoucherNo = voucherNo
    }

    const monthDate = record.month ? new Date(record.month) : null
    if (monthDate && !Number.isNaN(monthDate.getTime())) {
      acc.monthDates.push(monthDate)
    }

    return acc
  }, {
    totalPaid: 0,
    totalDues: 0,
    latestVoucherNo: 'N/A',
    monthDates: [],
  })

  let dateRange = 'N/A'
  if (totals.monthDates.length > 0) {
    const sortedMonths = [...totals.monthDates].sort((a, b) => a.getTime() - b.getTime())
    const fromDate = sortedMonths[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const toDate = sortedMonths[sortedMonths.length - 1].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    dateRange = `${fromDate} - ${toDate}`
  }

  return {
    studentName: student.name || 'N/A',
    fatherName: student.father_name || 'N/A',
    className: student.class_name || 'N/A',
    sectionName: student.section_name || 'N/A',
    serialNo: getStudentSerialNo(student),
    latestVoucherNo: totals.latestVoucherNo,
    dateRange,
    printedOn: new Date().toLocaleDateString('en-GB'),
    totalPaid: formatCurrency(totals.totalPaid),
    totalDues: formatCurrency(totals.totalDues),
  }
}

const buildReportRows = (history) => {
  return history.map((record, index) => {
    const amounts = parseRecordAmounts(record)

    return {
      id: record.voucher_id || index,
      voucherNo: <strong>{toVoucherNo(record, index + 1)}</strong>,
      monthYear: getMonthLabel(record.month),
      monthlyFee: <strong>{formatCurrency(amounts.monthlyFee)}</strong>,
      dues: <span style={{ color: amounts.dues > 0 ? '#dc3545' : '#6c757d' }}>{formatCurrency(amounts.dues)}</span>,
      totalFee: <strong>{formatCurrency(amounts.totalFee)}</strong>,
      paidAmount: <span style={{ color: '#166534' }}>{formatCurrency(amounts.paidAmount)}</span>,
      dueAmount: <span style={{ color: amounts.dueAmount > 0 ? '#dc3545' : '#6c757d' }}>{formatCurrency(amounts.dueAmount)}</span>,
      status: (
        <span className={`status-badge status-${String(amounts.status).toLowerCase()}`}>
          {amounts.status}
        </span>
      ),
    }
  })
}

const reportColumns = [
  { key: 'voucherNo', label: 'Voucher No', printWidth: '11%', printAlign: 'left' },
  { key: 'monthYear', label: 'Month', printWidth: '13%', printAlign: 'center' },
  { key: 'monthlyFee', label: 'Monthly Fee', printWidth: '12%', printAlign: 'right' },
  { key: 'dues', label: 'Dues', printWidth: '11%', printAlign: 'right' },
  { key: 'totalFee', label: 'Total Fee', printWidth: '12%', printAlign: 'right' },
  { key: 'paidAmount', label: 'Paid Amount', printWidth: '12%', printAlign: 'right' },
  { key: 'dueAmount', label: 'Due Amount', printWidth: '12%', printAlign: 'right' },
  { key: 'status', label: 'Status', printWidth: '17%', printAlign: 'center' },
]

const getReportColumns = (history) => {
  const isCollegeOnlyHistory = Array.isArray(history) && history.length > 0 && history.every(isCollegeHistoryRecord)
  if (!isCollegeOnlyHistory) return reportColumns

  return reportColumns.map((column) => {
    if (column.key === 'monthYear') {
      return { ...column, label: 'Session' }
    }
    if (column.key === 'monthlyFee') {
      return { ...column, label: 'Annual Fee' }
    }
    return column
  })
}

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const loadWatermarkLogoForPdf = () => {
  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => {
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height

      if (!width || !height) {
        resolve(null)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        resolve(null)
        return
      }

      context.clearRect(0, 0, width, height)
      context.globalAlpha = 0.08
      context.drawImage(image, 0, 0, width, height)

      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width,
        height,
      })
    }

    image.onerror = () => resolve(null)
    image.src = schoolLogo
  })
}

const buildPrintableRows = (history) => {
  return history.map((record, index) => {
    const amounts = parseRecordAmounts(record)

    return {
      voucherNo: toVoucherNo(record, index + 1),
      monthYear: getMonthLabel(record.month),
      monthlyFee: formatCurrency(amounts.monthlyFee),
      dues: formatCurrency(amounts.dues),
      totalFee: formatCurrency(amounts.totalFee),
      paidAmount: formatCurrency(amounts.paidAmount),
      dueAmount: formatCurrency(amounts.dueAmount),
      status: String(amounts.status || 'UNPAID').toUpperCase(),
      hasDues: amounts.dues > 0,
      hasDueAmount: amounts.dueAmount > 0,
    }
  })
}

const buildPrintableStudentBlock = (student, studentState) => {
  const reportSummary = buildStudentSummary(studentState.history, student)
  const printableRows = buildPrintableRows(studentState.history)
  const feeLabel = getReportColumns(studentState.history).find((column) => column.key === 'monthlyFee')?.label || 'Monthly Fee'

  const summaryItems = [
    ['Student', reportSummary.studentName],
    ['Father', reportSummary.fatherName],
    ['Class', reportSummary.className],
    ['Section', reportSummary.sectionName],
    ['Serial No', reportSummary.serialNo],
    ['Voucher No', reportSummary.latestVoucherNo],
    ['Date Range', reportSummary.dateRange],
    ['Printed On', reportSummary.printedOn],
    ['Total Paid', reportSummary.totalPaid],
    ['Total Dues', reportSummary.totalDues],
  ]

  const summaryHtml = summaryItems
    .map(([label, value]) => `<span><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span>`)
    .join('')

  let tableRowsHtml = ''

  if (studentState.error) {
    tableRowsHtml = `<tr><td colspan="8" class="state-cell state-error">Unable to load history: ${escapeHtml(studentState.error)}</td></tr>`
  } else if (!Array.isArray(studentState.history) || studentState.history.length === 0) {
    tableRowsHtml = '<tr><td colspan="8" class="state-cell">No fee history found for this student</td></tr>'
  } else {
    tableRowsHtml = printableRows.map((row) => {
      const statusClass = row.status === 'PAID'
        ? 'status-paid'
        : row.status === 'PARTIAL'
          ? 'status-partial'
          : 'status-unpaid'

      return `
        <tr>
          <td><strong>${escapeHtml(row.voucherNo)}</strong></td>
          <td>${escapeHtml(row.monthYear)}</td>
          <td class="text-right"><strong>${escapeHtml(row.monthlyFee)}</strong></td>
          <td class="text-right ${row.hasDues ? 'text-danger' : ''}">${escapeHtml(row.dues)}</td>
          <td class="text-right"><strong>${escapeHtml(row.totalFee)}</strong></td>
          <td class="text-right text-success">${escapeHtml(row.paidAmount)}</td>
          <td class="text-right ${row.hasDueAmount ? 'text-danger' : ''}">${escapeHtml(row.dueAmount)}</td>
          <td class="text-center"><span class="status-badge ${statusClass}">${escapeHtml(row.status)}</span></td>
        </tr>
      `
    }).join('')
  }

  return `
    <section class="student-block">
      <div class="student-summary">${summaryHtml}</div>
      <table>
        <colgroup>
          <col style="width:14%;" />
          <col style="width:14%;" />
          <col style="width:13%;" />
          <col style="width:11%;" />
          <col style="width:13%;" />
          <col style="width:13%;" />
          <col style="width:13%;" />
          <col style="width:9%;" />
        </colgroup>
        <thead>
          <tr>
            <th>Voucher No</th>
            <th>Month</th>
            <th>${escapeHtml(feeLabel)}</th>
            <th>Dues</th>
            <th>Total Fee</th>
            <th>Paid Amount</th>
            <th>Due Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${tableRowsHtml}</tbody>
      </table>
    </section>
  `
}

const buildPrintableDocumentHtml = ({ selectedStudents, historiesByStudent }) => {
  const printedOn = new Date().toLocaleDateString('en-GB')
  const blocksHtml = selectedStudents
    .map((student) => {
      const studentState = historiesByStudent[String(student.id)] || {
        history: [],
        loading: false,
        error: '',
      }

      return buildPrintableStudentBlock(student, studentState)
    })
    .join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student Fee History Report</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #fff;
      font-size: 9pt;
    }
    .report-header {
      text-align: center;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    .school-name {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .04em;
      margin-bottom: 3px;
    }
    .report-title {
      font-size: 11.5pt;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .report-meta {
      font-size: 9pt;
      color: #334155;
      margin-bottom: 8px;
    }
    .report-divider {
      border: none;
      border-top: 2px solid #1e3a8a;
      margin: 0 0 8px;
    }
    .report-content {
      padding-bottom: 22mm;
      position: relative;
      z-index: 1;
    }
    .report-watermark {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .report-watermark img {
      width: 42%;
      max-width: 320px;
      height: auto;
      opacity: 0.08;
    }
    .student-block {
      margin: 0 0 4px;
    }
    .student-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 3px 8px;
      border: 1px solid #b5c3e8;
      background: #eef3ff;
      padding: 3px 6px;
      margin-bottom: 3px;
      font-size: 6.9pt;
    }
    .student-summary strong {
      color: #1e3a8a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 6.8pt;
    }
    th {
      border: 1px solid #1e3a8a;
      padding: 2px 3px;
      background: #1e3a8a;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: .02em;
      font-size: 6.1pt;
      white-space: nowrap;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 2px 3px;
      white-space: nowrap;
      vertical-align: middle;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-danger { color: #b91c1c; }
    .text-success { color: #166534; }
    .state-cell {
      text-align: center;
      padding: 12px;
      color: #475569;
      white-space: normal;
    }
    .state-error {
      color: #b91c1c;
      font-weight: 700;
    }
    .status-badge {
      display: inline-block;
      border-radius: 999px;
      border: 1px solid transparent;
      padding: 1px 4px;
      font-size: 6pt;
      font-weight: 700;
    }
    .status-paid {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }
    .status-partial {
      background: #e0f2fe;
      color: #0c4a6e;
      border-color: #bae6fd;
    }
    .status-unpaid {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
    }
    .report-footer {
      margin-top: 8px;
      text-align: center;
      font-size: 9pt;
      color: #0f172a;
      line-height: 1.4;
      border-top: 1px solid #cbd5e1;
      padding-top: 5px;
      position: relative;
      z-index: 1;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .report-content {
        padding-bottom: 22mm;
      }
      .report-footer {
        position: fixed;
        left: 8mm;
        right: 8mm;
        bottom: 7mm;
        margin-top: 0;
        background: #fff;
      }
    }
  </style>
</head>
<body>
  <div class="report-watermark" aria-hidden="true">
    <img src="${escapeHtml(schoolLogo)}" alt="" />
  </div>
  <header class="report-header">
    <div class="school-name">${escapeHtml(SCHOOL_NAME)}</div>
    <div class="report-title">Student Fee History Report</div>
    <div class="report-meta"><strong>Printed On:</strong> ${escapeHtml(printedOn)} | <strong>Students:</strong> ${selectedStudents.length}</div>
  </header>
  <hr class="report-divider" />
  <main class="report-content">${blocksHtml}</main>
  <footer class="report-footer">
    <div>${escapeHtml(SCHOOL_ADDRESS)}</div>
    <div>Phone: ${escapeHtml(SCHOOL_PHONE)} | Email: ${escapeHtml(SCHOOL_EMAIL)}</div>
  </footer>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.print();
      }, 250);
    });
    window.addEventListener('afterprint', function () {
      window.close();
    });
  </script>
</body>
</html>`
}

const validateHistoryReadyForExport = (selectedStudents, historiesByStudent) => {
  if (selectedStudents.length === 0) {
    return {
      ok: false,
      message: 'Please select at least one student to continue.',
    }
  }

  const hasLoadingHistory = selectedStudents.some((student) => {
    const state = historiesByStudent[String(student.id)]
    return !state || state.loading
  })

  if (hasLoadingHistory) {
    return {
      ok: false,
      message: 'Please wait. Student fee history is still loading.',
    }
  }

  return { ok: true }
}

const saveStudentHistoryAsPdf = async ({ selectedStudents, historiesByStudent }) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  })

  const printedOn = new Date().toLocaleDateString('en-GB')
  const createdOn = new Date().toISOString().slice(0, 10)
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const watermarkLogo = await loadWatermarkLogoForPdf()

  const drawWatermark = () => {
    if (!watermarkLogo?.dataUrl || !watermarkLogo?.width || !watermarkLogo?.height) {
      return
    }

    const logoRatio = watermarkLogo.height / watermarkLogo.width
    const logoWidth = Math.min(pageWidth * 0.42, 85)
    const logoHeight = logoWidth * logoRatio
    const x = (pageWidth - logoWidth) / 2
    const y = (pageHeight - logoHeight) / 2

    try {
      pdf.addImage(watermarkLogo.dataUrl, 'PNG', x, y, logoWidth, logoHeight, undefined, 'FAST')
    } catch (error) {
      console.error('Unable to draw watermark on PDF page:', error)
    }
  }

  const drawFooter = () => {
    pdf.setDrawColor(203, 213, 225)
    pdf.line(10, pageHeight - 16, pageWidth - 10, pageHeight - 16)

    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(SCHOOL_ADDRESS, pageWidth / 2, pageHeight - 11, { align: 'center' })
    pdf.text(`Phone: ${SCHOOL_PHONE} | Email: ${SCHOOL_EMAIL}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
  }

  drawWatermark()

  pdf.setTextColor(15, 23, 42)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text(SCHOOL_NAME, pageWidth / 2, 11, { align: 'center' })

  pdf.setTextColor(30, 58, 138)
  pdf.setFontSize(10.5)
  pdf.text('Student Fee History Report', pageWidth / 2, 16.5, { align: 'center' })

  pdf.setTextColor(51, 65, 85)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Printed On: ${printedOn} | Students: ${selectedStudents.length}`, pageWidth / 2, 21, { align: 'center' })

  pdf.setDrawColor(30, 58, 138)
  pdf.line(8, 23, pageWidth - 8, 23)

  let currentY = 27

  selectedStudents.forEach((student, studentIndex) => {
    const studentState = historiesByStudent[String(student.id)] || {
      history: [],
      error: '',
    }

    const reportSummary = buildStudentSummary(studentState.history, student)
    const feeLabel = getReportColumns(studentState.history).find((column) => column.key === 'monthlyFee')?.label || 'Monthly Fee'

    const sectionTitle = `Student ${studentIndex + 1}: ${reportSummary.studentName} | Father: ${reportSummary.fatherName} | Class: ${reportSummary.className} | Section: ${reportSummary.sectionName}`
    const sectionSummary = [
      `Serial No: ${reportSummary.serialNo}`,
      `Voucher No: ${reportSummary.latestVoucherNo}`,
      `Date Range: ${reportSummary.dateRange}`,
      `Total Paid: ${reportSummary.totalPaid}`,
      `Total Dues: ${reportSummary.totalDues}`,
    ].join('   |   ')

    const titleLines = pdf.splitTextToSize(sectionTitle, pageWidth - 16)
    const summaryLines = pdf.splitTextToSize(sectionSummary, pageWidth - 16)
    const sectionHeaderHeight = (titleLines.length * 3.4) + (summaryLines.length * 3.2) + 4

    if (currentY + sectionHeaderHeight > pageHeight - 34) {
      pdf.addPage()
      drawWatermark()
      currentY = 10
    }

    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.6)
    pdf.text(titleLines, 8, currentY)

    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.text(summaryLines, 8, currentY + (titleLines.length * 3.4))

    const startY = currentY + (titleLines.length * 3.4) + (summaryLines.length * 3.2) + 2

    const tableBody = studentState.error
      ? [[`Unable to load history: ${studentState.error}`, '', '', '', '', '', '', '']]
      : studentState.history.length === 0
        ? [['No fee history found for this student', '', '', '', '', '', '', '']]
        : buildPrintableRows(studentState.history).map((row) => ([
            row.voucherNo,
            row.monthYear,
            row.monthlyFee,
            row.dues,
            row.totalFee,
            row.paidAmount,
            row.dueAmount,
            row.status,
          ]))

    autoTable(pdf, {
      startY,
      margin: { top: 8, right: 8, bottom: 20, left: 8 },
      head: [['Voucher No', 'Month', feeLabel, 'Dues', 'Total Fee', 'Paid Amount', 'Due Amount', 'Status']],
      body: tableBody,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 6.6,
        cellPadding: 1.2,
        overflow: 'linebreak',
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 6,
      },
      columnStyles: {
        0: { cellWidth: 24, halign: 'left' },
        1: { cellWidth: 23, halign: 'center' },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 24, halign: 'right' },
        7: { cellWidth: 16, halign: 'center' },
      },
      didParseCell: (hookData) => {
        if (hookData.section !== 'body') return

        const cellText = String(hookData.cell.raw || '')
        if (hookData.column.index === 3 && /^Rs\.\s*[1-9]/.test(cellText)) {
          hookData.cell.styles.textColor = [185, 28, 28]
        }
        if (hookData.column.index === 6 && /^Rs\.\s*[1-9]/.test(cellText)) {
          hookData.cell.styles.textColor = [185, 28, 28]
        }
        if (hookData.column.index === 5) {
          hookData.cell.styles.textColor = [22, 101, 52]
        }
      },
      didDrawPage: () => {
        drawWatermark()
        drawFooter()
      },
    })

    currentY = (pdf.lastAutoTable?.finalY || startY) + 4

    if (currentY > pageHeight - 28) {
      pdf.addPage()
      drawWatermark()
      currentY = 10
    }
  })

  pdf.save(`student-fee-history-${createdOn}.pdf`)
}

const StudentFeeHistory = () => {
  const [selectedStudents, setSelectedStudents] = useState([])
  const [historiesByStudent, setHistoriesByStudent] = useState({})
  const [reloadTick, setReloadTick] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState('')
  const searchRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search students with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setSearchLoading(true)
        try {
          const response = await studentService.search(searchTerm.trim())
          const students = response?.data?.data || response?.data || []
          setSearchResults(students)
          setShowResults(true)
        } catch (err) {
          console.error('Search error:', err)
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false

    if (selectedStudents.length === 0) {
      setHistoriesByStudent({})
      return () => {
        cancelled = true
      }
    }

    const loadHistories = async () => {
      setHistoriesByStudent((prev) => {
        const next = {}
        selectedStudents.forEach((student) => {
          const key = String(student.id)
          next[key] = {
            history: prev[key]?.history || [],
            loading: true,
            error: '',
          }
        })
        return next
      })

      const results = await Promise.all(
        selectedStudents.map(async (student) => {
          try {
            const response = await feePaymentService.getStudentHistory(student.id)
            return {
              id: String(student.id),
              history: extractHistoryRows(response),
              error: '',
            }
          } catch (err) {
            return {
              id: String(student.id),
              history: [],
              error: err?.response?.data?.message || err?.message || 'Failed to load history',
            }
          }
        })
      )

      if (cancelled) return

      setHistoriesByStudent((prev) => {
        const next = { ...prev }

        results.forEach((result) => {
          next[result.id] = {
            history: result.history,
            loading: false,
            error: result.error,
          }
        })

        Object.keys(next).forEach((key) => {
          if (!selectedStudents.some(student => String(student.id) === key)) {
            delete next[key]
          }
        })

        return next
      })
    }

    loadHistories()

    return () => {
      cancelled = true
    }
  }, [selectedStudents, reloadTick])

  // Handle selecting a student from search results
  const handleSelectStudent = (student) => {
    const normalized = normalizeStudent(student)

    if (selectedStudents.some(s => String(s.id) === String(normalized.id))) {
      setSelectionMessage('Student is already selected.')
      setSearchTerm('')
      setShowResults(false)
      return
    }

    if (selectedStudents.length >= MAX_SELECTED_STUDENTS) {
      setSelectionMessage(`You can select up to ${MAX_SELECTED_STUDENTS} students only.`)
      setSearchTerm('')
      setShowResults(false)
      return
    }

    setSelectedStudents((prev) => [...prev, normalized])
    setSelectionMessage('')
    setSearchTerm('')
    setShowResults(false)
  }

  const handleRemoveStudent = (studentId) => {
    setSelectedStudents((prev) => prev.filter(student => String(student.id) !== String(studentId)))
    setHistoriesByStudent((prev) => {
      const next = { ...prev }
      delete next[String(studentId)]
      return next
    })
  }

  const handleClearSelection = () => {
    setSelectedStudents([])
    setHistoriesByStudent({})
    setSelectionMessage('')
    setSearchTerm('')
    setShowResults(false)
  }

  const handleOpenPrintableReport = () => {
    const validation = validateHistoryReadyForExport(selectedStudents, historiesByStudent)
    if (!validation.ok) {
      alert(validation.message)
      return
    }

    const popup = window.open('', '_blank', 'width=1200,height=820')
    if (!popup) {
      alert('Popup was blocked. Please allow popups for this site to print or save PDF.')
      return
    }

    const html = buildPrintableDocumentHtml({ selectedStudents, historiesByStudent })

    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
  }

  const handlePrintReport = () => {
    handleOpenPrintableReport()
  }

  const handleSavePdf = async () => {
    const validation = validateHistoryReadyForExport(selectedStudents, historiesByStudent)
    if (!validation.ok) {
      alert(validation.message)
      return
    }

    await saveStudentHistoryAsPdf({ selectedStudents, historiesByStudent })
  }

  const handleRefreshAll = () => {
    setReloadTick(value => value + 1)
  }

  return (
    <div className="fee-management">
      <div className="fee-report-watermark print-only" aria-hidden="true">
        <img src={schoolLogo} alt="" />
      </div>

      <div className="fee-header">
        <h1>Student Fee History</h1>
      </div>

      {/* Student Search Section */}
      <div className="student-search-section">
        <div className="search-container" ref={searchRef}>
          <div className="search-header">
            <h3>🔍 Search Student</h3>
            <p>Find a student to view their complete fee history</p>
          </div>
          
          <div className="search-input-container">
            <input
              type="text"
              className="student-search-input"
              placeholder="Type student name to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => { setSearchTerm(''); setShowResults(false); }}
              >✕</button>
            )}
            {searchLoading && <span className="search-loading">⏳</span>}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="search-results-dropdown">
              {searchResults.length === 0 ? (
                <div className="no-results">
                  <p>No students found matching "{searchTerm}"</p>
                </div>
              ) : (
                <>
                  <div className="search-results-header">
                    <p>Found {searchResults.length} student{searchResults.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="search-results-list">
                    {searchResults.map((student) => {
                        const normalized = normalizeStudent(student)
                        const fatherName = normalized.father_name || 'N/A'
                        const className = normalized.class_name || 'Not Enrolled'
                        const sectionName = normalized.section_name || ''
                        const isAlreadySelected = selectedStudents.some(s => String(s.id) === String(student.id))
                        const isMaxReached = selectedStudents.length >= MAX_SELECTED_STUDENTS
                        const isDisabled = isAlreadySelected || isMaxReached
                      
                      return (
                        <div 
                          key={student.id}
                            className={`search-result-item${isDisabled ? ' search-result-item-disabled' : ''}`}
                            onClick={() => !isDisabled && handleSelectStudent(student)}
                        >
                          <div className="student-card-left">
                            <div className="student-avatar">
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="student-card-info">
                              <div className="student-name-highlight">{student.name}</div>
                              <div className="student-meta-grid">
                                <div className="meta-item">
                                  <span className="meta-label">FATHER</span>
                                  <span className="meta-value">{fatherName}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label">CLASS</span>
                                  <span className="meta-value">{className}</span>
                                </div>
                                {sectionName && (
                                  <div className="meta-item">
                                    <span className="meta-label">SECTION</span>
                                    <span className="meta-value">{sectionName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="btn-view-details">
                            {isAlreadySelected ? 'Added' : isMaxReached ? 'Limit Reached' : 'Add Student →'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {selectionMessage && (
          <div className="alert alert-warning" style={{ marginTop: '12px' }}>
            {selectionMessage}
          </div>
        )}

        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <div className="selected-student-badge">
            <div className="selected-students-list">
              {selectedStudents.map((student) => (
                <div key={student.id} className="selected-student-chip">
                  <span>
                    <strong>{student.name}</strong> ({student.class_name}{student.section_name ? ` - ${student.section_name}` : ''})
                  </span>
                  <button
                    className="selected-chip-remove"
                    onClick={() => handleRemoveStudent(student.id)}
                    title="Remove student"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="selected-actions">
              <span className="selected-text">{selectedStudents.length}/{MAX_SELECTED_STUDENTS} selected</span>
              <button
                className="clear-selection-btn"
                onClick={handleClearSelection}
                title="Clear all students"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedStudents.length > 0 && (
        <>
          <div className="fee-history-report-header no-print">
            <h3>Student Fee History Report</h3>
            <div className="report-header-actions">
              <button className="btn-secondary" onClick={handleRefreshAll}>Refresh All</button>
              <button className="rpt-btn rpt-btn--save" onClick={handleSavePdf}>
                Save PDF
              </button>
              <button className="rpt-btn rpt-btn--print" onClick={handlePrintReport}>
                Print Report
              </button>
            </div>
          </div>

          <div className="student-history-print-header print-only">
            <div className="school-name">{SCHOOL_NAME}</div>
            <div className="report-title">Student Fee History Report</div>
            <hr className="student-report-divider" />
          </div>

          {selectedStudents.map((student, index) => {
            const studentState = historiesByStudent[String(student.id)] || {
              history: [],
              loading: true,
              error: '',
            }
            const reportSummary = buildStudentSummary(studentState.history, student)
            const reportRows = buildReportRows(studentState.history)

            return (
              <div
                className={`table-section fee-history-report-only student-history-block${index === 0 ? ' student-history-first' : ''}`}
                key={student.id}
              >
                <div className="student-summary-bar">
                  <span className="student-summary-item"><strong>Student:</strong> {reportSummary.studentName}</span>
                  <span className="student-summary-item"><strong>Father:</strong> {reportSummary.fatherName}</span>
                  <span className="student-summary-item"><strong>Class:</strong> {reportSummary.className}</span>
                  <span className="student-summary-item"><strong>Section:</strong> {reportSummary.sectionName}</span>
                  <span className="student-summary-item"><strong>Serial No:</strong> {reportSummary.serialNo}</span>
                  <span className="student-summary-item"><strong>Voucher No:</strong> {reportSummary.latestVoucherNo}</span>
                  <span className="student-summary-item"><strong>Date Range:</strong> {reportSummary.dateRange}</span>
                  <span className="student-summary-item"><strong>Printed On:</strong> {reportSummary.printedOn}</span>
                  <span className="student-summary-item student-summary-item--strong"><strong>Total Paid:</strong> {reportSummary.totalPaid}</span>
                  <span className="student-summary-item student-summary-item--strong"><strong>Total Dues:</strong> {reportSummary.totalDues}</span>
                </div>

                <div className="student-history-table-wrap">
                  {studentState.loading ? (
                    <div className="loading">Loading history...</div>
                  ) : studentState.error ? (
                    <div className="alert alert-error" style={{ margin: '0.5rem' }}>
                      <strong>Unable to load history:</strong> {studentState.error}
                    </div>
                  ) : studentState.history.length === 0 ? (
                    <div className="empty-state">
                      <p>No fee history found for this student</p>
                    </div>
                  ) : (
                    <ReportTable
                      columns={getReportColumns(studentState.history)}
                      rows={reportRows}
                    />
                  )}
                </div>
              </div>
            )
          })}

          <div className="student-history-print-footer print-only">
            <div className="student-history-print-footer__line">{SCHOOL_ADDRESS}</div>
            <div className="student-history-print-footer__line">Phone: {SCHOOL_PHONE} | Email: {SCHOOL_EMAIL}</div>
            <div className="student-history-print-footer__line student-history-print-footer__line--strong">Pay at school office during working hours. Contact: {SCHOOL_PHONE}</div>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentFeeHistory
