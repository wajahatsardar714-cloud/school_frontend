/**
 * Fee Voucher Management Component
 * 
 * Features:
 * - Generate single/bulk fee vouchers
 * - List and filter vouchers
 * - View voucher details
 * - Edit voucher items
 * - Record payments inline
 * 
 * Security & Performance:
 * - AbortController for request cancellation
 * - Race condition prevention
 * - Debounced search
 * - Optimized re-renders
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { feeVoucherService, feePaymentService } from '../services/feeService'
import { studentService } from '../services/studentService'
import { classService, sectionService } from '../services/classService'
import { useFetch, useMutation, useDebounce } from '../hooks/useApi'
import { sortClassesBySequence, getClassSortOrder } from '../utils/classSorting'
import { useAuth } from '../context/AuthContext'
import '../fee.css'

// Constants
const VOUCHER_STATUS = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
}

const STATUS_COLORS = {
  [VOUCHER_STATUS.UNPAID]: 'status-unpaid',
  [VOUCHER_STATUS.PARTIAL]: 'status-partial',
  [VOUCHER_STATUS.PAID]: 'status-paid',
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

// Fee types available for selection
const FEE_TYPES = [
  { value: 'MONTHLY', label: 'Monthly Fee', description: 'Regular monthly tuition fee (uses individual student fee)' },
  { value: 'OTHER', label: 'Other Charges', description: 'Add custom fees with name and amount' },
]

// Valid item types for the edit voucher modal (matches DB constraint)
const EDIT_FEE_TYPES = [
  { value: 'MONTHLY',    label: 'Monthly Fee' },
  { value: 'ADMISSION',  label: 'Admission Fee' },
  { value: 'PAPER_FUND', label: 'Paper Fund' },
  { value: 'TRANSPORT',  label: 'Transport Fee' },
  { value: 'ARREARS',    label: 'Arrears' },
  { value: 'CUSTOM',     label: 'Custom Charge' },
]

const FeeVoucherManagement = () => {
  // Auth
  const { isAdmin } = useAuth()
  
  // UI State
  const [activeTab, setActiveTab] = useState('list')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selection State for bulk operations
  const [selectedVouchers, setSelectedVouchers] = useState([])
  
  // Edit Items Modal State
  const [showEditItemsModal, setShowEditItemsModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [editItems, setEditItems] = useState([])
  
  // Payment Undo Modal State
  const [showPaymentUndoModal, setShowPaymentUndoModal] = useState(false)
  const [undoVoucher, setUndoVoucher] = useState(null)
  const [undoPayments, setUndoPayments] = useState([])
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([])
  const [undoPaymentsLoading, setUndoPaymentsLoading] = useState(false)
  
  // Filter State
  const [filters, setFilters] = useState({
    class_id: '',
    status: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  // Amount sort order state
  const [amountSortOrder, setAmountSortOrder] = useState('')

  // Voucher list student search (replaces plain text search)
  const [listSearchTerm, setListSearchTerm] = useState('')
  const [listSearchResults, setListSearchResults] = useState([])
  const [listSearchLoading, setListSearchLoading] = useState(false)
  const [showListSearchResults, setShowListSearchResults] = useState(false)
  const [selectedListStudent, setSelectedListStudent] = useState(null)
  const listSearchRef = useRef(null)

  // Display limit for progressive rendering (Show More)
  const [displayLimit, setDisplayLimit] = useState(100)

  // Generate Form State
  const [generateForm, setGenerateForm] = useState({
    type: 'single', // 'single' | 'bulk'
    student_id: '',
    class_id: '',
    section_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: '',
    fee_types: ['MONTHLY'], // Default to monthly fee only
    custom_charges: [] // Array of {description: string, amount: number}
  })
  
  // Preview State (NEW - Issue #3)
  const [previewData, setPreviewData] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDisplayLimit, setPreviewDisplayLimit] = useState(100)

  // Student Search State (for single voucher generation)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [studentSearchResults, setStudentSearchResults] = useState([])
  const [studentSearchLoading, setStudentSearchLoading] = useState(false)
  const [showStudentSearchResults, setShowStudentSearchResults] = useState(false)
  const [selectedStudentName, setSelectedStudentName] = useState('')
  const [selectedStudentClassType, setSelectedStudentClassType] = useState('') // 'SCHOOL' | 'COLLEGE'
  const [yearlyPackageInput, setYearlyPackageInput] = useState('')
  const studentSearchRef = useRef(null)

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    reference_no: '',
  })

  // Yearly college voucher payment ledger state
  const [voucherPayments, setVoucherPayments] = useState([])
  const [voucherPaymentsLoading, setVoucherPaymentsLoading] = useState(false)

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Close generate-form student search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(event.target)) {
        setShowStudentSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close list student search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listSearchRef.current && !listSearchRef.current.contains(event.target)) {
        setShowListSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced list student search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (listSearchTerm.trim().length >= 2) {
        setListSearchLoading(true)
        try {
          const response = await studentService.search(listSearchTerm.trim())
          const students = response.data?.data || response.data || []
          setListSearchResults(students)
          setShowListSearchResults(true)
        } catch (err) {
          setListSearchResults([])
        } finally {
          setListSearchLoading(false)
        }
      } else {
        setListSearchResults([])
        setShowListSearchResults(false)
      }
    }, 300)
    return () => clearTimeout(delay)
  }, [listSearchTerm])

  // Student search with debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (studentSearchTerm.trim().length >= 2) {
        setStudentSearchLoading(true)
        try {
          const response = await studentService.search(studentSearchTerm.trim())
          const students = response.data?.data || response.data || []
          setStudentSearchResults(students)
          setShowStudentSearchResults(true)
        } catch (err) {
          console.error('Student search error:', err)
          setStudentSearchResults([])
        } finally {
          setStudentSearchLoading(false)
        }
      } else {
        setStudentSearchResults([])
        setShowStudentSearchResults(false)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [studentSearchTerm])

  // Data Fetching - classes (fetch once)
  const { 
    data: classesData, 
    loading: classesLoading 
  } = useFetch(
    () => classService.list(),
    [], // empty deps - fetch once
    { enabled: true }
  )

  // Data Fetching - sections for filter (fetch when class selected)
  const { 
    data: filterSectionsData
  } = useFetch(
    () => sectionService.list(filters.class_id),
    [filters.class_id],
    { enabled: !!filters.class_id }
  )

  // Data Fetching - vouchers (fetch when filters change)
  const { 
    data: vouchersData, 
    loading: vouchersLoading, 
    error: vouchersError,
    refetch: refreshVouchers 
  } = useFetch(
    () => feeVoucherService.list({
      // When a student is selected, fetch ALL their vouchers regardless of month/year
      ...(selectedListStudent
        ? { student_id: selectedListStudent.id }
        : { month: filters.month, year: filters.year }
      ),
      class_id: filters.class_id || undefined,
      section_id: filters.section_id || undefined,
      status: filters.status || undefined,
    }),
    [filters.month, filters.year, filters.class_id, filters.section_id, filters.status, selectedListStudent?.id],
    { enabled: true }
  )

  // Data Fetching - students for generate form (filtered by class and optionally section)
  const { 
    data: studentsData,
    refetch: refreshStudents 
  } = useFetch(
    () => studentService.list({ 
      class_id: generateForm.class_id, 
      section_id: generateForm.section_id || undefined,
      is_active: true 
    }),
    [generateForm.class_id, generateForm.section_id],
    { enabled: !!generateForm.class_id }
  )

  // Data Fetching - sections for generate form
  const {
    data: sectionsData,
    refetch: refreshSections
  } = useFetch(
    () => classService.getSections(generateForm.class_id),
    [generateForm.class_id],
    { enabled: !!generateForm.class_id }
  )

  // Mutations with race condition prevention
  const generateMutation = useMutation(
    async (data) => {
      // Backend expects month in format "2026-02-01"
      const monthStr = `${data.year}-${String(data.month).padStart(2, '0')}-01`
      
      // Filter valid custom charges (non-empty description and positive amount)
      const validCustomCharges = (data.custom_charges || []).filter(
        c => c.description && c.description.trim() && parseFloat(c.amount) > 0
      ).map(c => ({ description: c.description.trim(), amount: parseFloat(c.amount) }))

      if (data.type === 'bulk') {
        return feeVoucherService.bulkGenerate({
          class_id: parseInt(data.class_id),
          section_id: data.section_id ? parseInt(data.section_id) : undefined,
          month: monthStr,
          due_date: data.due_date || undefined,
          fee_types: data.fee_types?.length > 0 ? data.fee_types : undefined,
          custom_charges: validCustomCharges.length > 0 ? validCustomCharges : undefined,
        })
      } else {
        // Single generate: include item_type: 'CUSTOM' as backend requires it
        const customItems = validCustomCharges.map(c => ({
          item_type: 'CUSTOM',
          description: c.description,
          amount: c.amount,
        }))
        return feeVoucherService.generate({
          student_id: parseInt(data.student_id),
          month: monthStr,
          due_date: data.due_date || undefined,
          fee_types: data.fee_types?.length > 0 ? data.fee_types : undefined,
          custom_items: customItems.length > 0 ? customItems : undefined,
          ...(data.yearly_package_amount ? { yearly_package_amount: parseFloat(data.yearly_package_amount) } : {}),
        })
      }
    },
    {
      onSuccess: () => {
        refreshVouchers()
        setGenerateForm({
          type: 'single',
          student_id: '',
          class_id: '',
          section_id: '',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          due_date: '',
          fee_types: ['MONTHLY'],
        })
        setActiveTab('list')
      },
    }
  )

  // Edit items mutation
  const editItemsMutation = useMutation(
    async (data) => {
      return feeVoucherService.updateItems(data.voucher_id, data.items)
    },
    {
      onSuccess: () => {
        refreshVouchers()
        closeEditItemsModal()
      },
    }
  )

  const paymentMutation = useMutation(
    async (data) => {
      return feePaymentService.record({
        voucher_id: selectedVoucher.id,
        amount: parseFloat(data.amount),
        payment_date: data.payment_date || undefined,
      })
    },
    {
      onSuccess: () => {
        refreshVouchers()
        closePaymentModal()
      },
    }
  )

  const deleteMutation = useMutation(
    async (id) => {
      return feeVoucherService.delete(id)
    },
    {
      onSuccess: () => refreshVouchers(),
    }
  )

  // Helper to parse month from ISO date string
  const parseVoucherMonth = useCallback((monthStr) => {
    if (!monthStr) return { month: null, year: null }
    const date = new Date(monthStr)
    return {
      month: date.getMonth() + 1, // getMonth() is 0-indexed
      year: date.getFullYear()
    }
  }, [])

  // Memoized filtered vouchers with field mapping
  const filteredVouchers = useMemo(() => {
    // Backend returns vouchers under data key
    const vouchers = vouchersData?.data || vouchersData?.vouchers || vouchersData || []
    if (!Array.isArray(vouchers)) return []
    
    // Map backend fields to component expected fields
    const mappedVouchers = vouchers.map(v => {
      const { month, year } = parseVoucherMonth(v.month)
      return {
        id: v.voucher_id,
        voucher_no: `V-${v.voucher_id}`,
        student_id: v.student_id,
        student_name: v.student_name,
        student_roll_no: v.roll_no,
        class_id: v.class_id,
        class_name: v.class_name,
        section_id: v.section_id,
        section_name: v.section_name,
        father_name: v.father_name,
        month,
        year,
        total_amount: parseFloat(v.total_fee) || 0,
        paid_amount: parseFloat(v.paid_amount) || 0,
        due_amount: parseFloat(v.due_amount) || 0,
        status: v.status,
        voucher_type: v.voucher_type || 'MONTHLY',
        created_at: v.created_at,
        last_payment_date: v.last_payment_date,
      }
    })

    // Sort by class sequence, then section name, then roll number
    mappedVouchers.sort((a, b) => {
      const classOrderA = getClassSortOrder(a.class_name)
      const classOrderB = getClassSortOrder(b.class_name)
      if (classOrderA !== classOrderB) return classOrderA - classOrderB
      
      const secA = (a.section_name || '').toLowerCase()
      const secB = (b.section_name || '').toLowerCase()
      if (secA !== secB) return secA.localeCompare(secB)

      // Sort by roll number numerically
      const rollA = parseInt(a.student_roll_no) || 0
      const rollB = parseInt(b.student_roll_no) || 0
      return rollA - rollB
    })

    // Apply amount sorting if set
    if (amountSortOrder === 'low-to-high') {
      mappedVouchers.sort((a, b) => a.total_amount - b.total_amount)
    } else if (amountSortOrder === 'high-to-low') {
      mappedVouchers.sort((a, b) => b.total_amount - a.total_amount)
    }

    // When student is selected, API already filters by student_id server-side.
    // Still apply text search if manually typed.
    if (selectedListStudent) {
      if (!debouncedSearch) return mappedVouchers
      const searchLower = debouncedSearch.toLowerCase()
      return mappedVouchers.filter(v =>
        v.student_name?.toLowerCase().includes(searchLower) ||
        v.voucher_no?.toLowerCase().includes(searchLower)
      )
    }

    if (!debouncedSearch) return mappedVouchers
    
    const searchLower = debouncedSearch.toLowerCase()
    return mappedVouchers.filter(v => 
      v.student_name?.toLowerCase().includes(searchLower) ||
      v.student_roll_no?.toLowerCase().includes(searchLower) ||
      v.voucher_no?.toLowerCase().includes(searchLower)
    )
  }, [vouchersData, debouncedSearch, parseVoucherMonth, amountSortOrder, selectedListStudent])

  // Clear selection when filters change or tab changes
  useEffect(() => {
    setSelectedVouchers([])
  }, [filters, activeTab])

  // Reset display limit when filters, search or selected student change
  useEffect(() => {
    setDisplayLimit(100)
  }, [filters, debouncedSearch, amountSortOrder, selectedListStudent])

  // Handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      // Reset section when class changes
      if (key === 'class_id') {
        return { ...prev, class_id: value, section_id: '' }
      }
      return { ...prev, [key]: value }
    })
  }, [])

  const handleGenerateFormChange = useCallback((key, value) => {
    setGenerateForm(prev => {
      const newForm = { ...prev, [key]: value }
      // Reset dependent fields
      if (key === 'class_id') {
        newForm.student_id = ''
        newForm.section_id = ''
      }
      if (key === 'type' && value === 'bulk') {
        newForm.student_id = ''
      }
      return newForm
    })
  }, [])

  // Toggle fee type selection
  const handleFeeTypeToggle = useCallback((feeType) => {
    setGenerateForm(prev => {
      const current = prev.fee_types || []
      const newTypes = current.includes(feeType)
        ? current.filter(t => t !== feeType)
        : [...current, feeType]
      return { ...prev, fee_types: newTypes }
    })
  }, [])

  // Handle selecting a student from search results
  const handleSelectStudentFromSearch = useCallback((student) => {
    setGenerateForm(prev => ({ ...prev, student_id: student.id }))
    setSelectedStudentName(student.name)
    setSelectedStudentClassType(student.class_type || '')
    setYearlyPackageInput('') // reset on student change
    setStudentSearchTerm('')
    setShowStudentSearchResults(false)
    setStudentSearchResults([])
  }, [])

  // Clear selected student
  const handleClearSelectedStudent = useCallback(() => {
    setGenerateForm(prev => ({ ...prev, student_id: '' }))
    setSelectedStudentName('')
    setSelectedStudentClassType('')
    setYearlyPackageInput('')
    setStudentSearchTerm('')
  }, [])

  // Add custom charge
  const handleAddCustomCharge = useCallback(() => {
    setGenerateForm(prev => ({
      ...prev,
      custom_charges: [...(prev.custom_charges || []), { description: '', amount: '' }]
    }))
  }, [])

  // Update custom charge
  const handleUpdateCustomCharge = useCallback((index, field, value) => {
    setGenerateForm(prev => ({
      ...prev,
      custom_charges: prev.custom_charges.map((charge, i) => 
        i === index ? { ...charge, [field]: value } : charge
      )
    }))
  }, [])

  // Remove custom charge
  const handleRemoveCustomCharge = useCallback((index) => {
    setGenerateForm(prev => ({
      ...prev,
      custom_charges: prev.custom_charges.filter((_, i) => i !== index)
    }))
  }, [])

  // Open edit items modal
  const openEditItemsModal = useCallback(async (voucher) => {
    try {
      // Fetch full voucher details with items
      const response = await feeVoucherService.getById(voucher.id)
      const fullVoucher = response?.data || response
      setEditingVoucher(fullVoucher)
      // Normalize items: map any 'OTHER' type (legacy) to 'CUSTOM', skip DISCOUNT items
      const items = (fullVoucher.items || [])
        .filter(item => item.item_type !== 'DISCOUNT')
        .map(item => ({
          ...item,
          item_type: item.item_type === 'OTHER' ? 'CUSTOM' : item.item_type,
          description: item.description || '',
          amount: parseFloat(item.amount) || 0,
        }))
      setEditItems(items)
      setShowEditItemsModal(true)
    } catch (error) {
      console.error('Failed to load voucher details:', error)
      alert('Failed to load voucher details. Please try again.')
    }
  }, [])

  // Close edit items modal
  const closeEditItemsModal = useCallback(() => {
    setShowEditItemsModal(false)
    setEditingVoucher(null)
    setEditItems([])
  }, [])

  // Handle edit item change
  const handleEditItemChange = useCallback((index, field, value) => {
    setEditItems(prev => {
      const newItems = [...prev]
      if (field === 'amount') {
        newItems[index] = { ...newItems[index], amount: parseFloat(value) || 0 }
      } else if (field === 'item_type') {
        // Clear description when switching away from CUSTOM
        newItems[index] = { ...newItems[index], item_type: value, description: value === 'CUSTOM' ? (newItems[index].description || '') : '' }
      } else {
        newItems[index] = { ...newItems[index], [field]: value }
      }
      return newItems
    })
  }, [])

  // Add new item
  const handleAddItem = useCallback(() => {
    setEditItems(prev => [...prev, { item_type: 'CUSTOM', amount: 0, description: '' }])
  }, [])

  // Remove item
  const handleRemoveItem = useCallback((index) => {
    setEditItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Submit edit items
  const handleEditItemsSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!editingVoucher || editItems.length === 0) return
    // Validate all CUSTOM items have a description
    const missingDesc = editItems.some(item => item.item_type === 'CUSTOM' && !item.description?.trim())
    if (missingDesc) {
      alert('Please enter a custom name for all "Custom Charge" items.')
      return
    }
    const itemsToSave = editItems.map(item => ({
      item_type: item.item_type,
      amount: item.amount,
      ...(item.item_type === 'CUSTOM' && item.description ? { description: item.description.trim() } : {})
    }))
    await editItemsMutation.mutate({
      voucher_id: editingVoucher.voucher_id || editingVoucher.id,
      items: itemsToSave,
    })
  }, [editingVoucher, editItems, editItemsMutation])

  const handleGenerateSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Validation with user feedback
    if (generateForm.type === 'single' && !generateForm.student_id) {
      alert('Please select a student')
      return
    }
    // College students require yearly package amount
    if (generateForm.type === 'single' && selectedStudentClassType === 'COLLEGE') {
      if (!yearlyPackageInput || parseFloat(yearlyPackageInput) <= 0) {
        alert('Please enter the Total Yearly Package amount for this college student')
        return
      }
      await generateMutation.mutate({ ...generateForm, yearly_package_amount: parseFloat(yearlyPackageInput) })
      return
    }
    if (generateForm.type === 'bulk' && !generateForm.class_id) {
      alert('Please select a class')
      return
    }
    if (!generateForm.due_date) {
      alert('Please select a due date')
      return
    }
    if (!generateForm.fee_types || generateForm.fee_types.length === 0) {
      alert('Please select at least one fee type')
      return
    }

    await generateMutation.mutate(generateForm)
  }, [generateForm, generateMutation])

  // Handle preview bulk vouchers (NEW - Issue #3)
  const handlePreviewBulk = useCallback(async () => {
    if (generateForm.type !== 'bulk' || !generateForm.class_id) {
      alert('Please select a class for bulk preview')
      return
    }
    
    setIsPreviewLoading(true)
    try {
      const monthStr = `${generateForm.year}-${String(generateForm.month).padStart(2, '0')}-01`
      const validCustomCharges = (generateForm.custom_charges || []).filter(
        c => c.description && c.description.trim() && parseFloat(c.amount) > 0
      ).map(c => ({ description: c.description.trim(), amount: parseFloat(c.amount) }))

      const result = await feeVoucherService.previewBulk({
        class_id: parseInt(generateForm.class_id),
        section_id: generateForm.section_id ? parseInt(generateForm.section_id) : undefined,
        month: monthStr,
        due_date: generateForm.due_date || undefined,
        fee_types: generateForm.fee_types?.length > 0 ? generateForm.fee_types : undefined,
        custom_charges: validCustomCharges.length > 0 ? validCustomCharges : undefined,
      })
      
      setPreviewData(result?.data || result)
      setPreviewDisplayLimit(100)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to preview vouchers:', error)
      alert('Failed to preview vouchers: ' + (error.message || 'Unknown error'))
    } finally {
      setIsPreviewLoading(false)
    }
  }, [generateForm])

  // Handle generate and save from preview (NEW - Issue #3)
  const handleGenerateAndSave = useCallback(async () => {
    setShowPreview(false)
    await generateMutation.mutate(generateForm)
  }, [generateForm, generateMutation])

  // Handle print without saving (NEW - Issue #3)
  const handlePrintWithoutSaving = useCallback(async () => {
    if (generateForm.type !== 'bulk' || !generateForm.class_id) {
      return
    }
    
    try {
      const monthStr = `${generateForm.year}-${String(generateForm.month).padStart(2, '0')}-01`
      const blob = await feeVoucherService.generateBulkPDF({
        class_id: parseInt(generateForm.class_id),
        section_id: generateForm.section_id ? parseInt(generateForm.section_id) : undefined,
        month: monthStr,
        due_date: generateForm.due_date || undefined,
        fee_types: generateForm.fee_types?.length > 0 ? generateForm.fee_types : undefined,
      })
      
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
      
      setShowPreview(false)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF: ' + (error.message || 'Unknown error'))
    }
  }, [generateForm])

  // Cancel preview (NEW - Issue #3)
  const handleCancelPreview = useCallback(() => {
    setShowPreview(false)
    setPreviewData(null)
    setPreviewDisplayLimit(100)
  }, [])

  const openPaymentModal = useCallback(async (voucher) => {
    setSelectedVoucher(voucher)
    setPaymentForm({
      amount: (voucher.total_amount - (voucher.paid_amount || 0)).toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      reference_no: '',
    })
    // For YEARLY_COLLEGE vouchers, fetch payment history for the ledger
    if (voucher.voucher_type === 'YEARLY_COLLEGE') {
      setVoucherPaymentsLoading(true)
      try {
        const response = await feePaymentService.getVoucherPayments(voucher.id)
        const payments = response.data?.payments || response.data || []
        setVoucherPayments(
          [...payments].sort((a, b) => {
            // Sort by payment_date first, then by created_at for same-day payments
            const dateCompare = new Date(a.payment_date) - new Date(b.payment_date)
            if (dateCompare === 0 && a.created_at && b.created_at) {
              return new Date(a.created_at) - new Date(b.created_at)
            }
            return dateCompare
          })
        )
      } catch (err) {
        console.error('Failed to load payment history:', err)
        setVoucherPayments([])
      } finally {
        setVoucherPaymentsLoading(false)
      }
    } else {
      setVoucherPayments([])
    }
    setShowPaymentModal(true)
  }, [])

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false)
    setSelectedVoucher(null)
    setVoucherPayments([])
    setPaymentForm({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      reference_no: '',
    })
  }, [])

  const handlePaymentSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return
    await paymentMutation.mutate(paymentForm)
  }, [paymentForm, paymentMutation])

  // Handle print voucher (NEW - Issue #3)
  const handlePrintVoucher = useCallback((voucher) => {
    try {
      feeVoucherService.printVoucher(voucher.id)
    } catch (error) {
      console.error('Failed to print voucher:', error)
      alert('Failed to print voucher')
    }
  }, [])

  const handleDelete = useCallback(async (voucher) => {
    if (voucher.status !== VOUCHER_STATUS.UNPAID) {
      alert('Cannot delete voucher with payments')
      return
    }
    const monthLabel = MONTHS.find(m => m.value === voucher.month)?.label || ''
    if (!confirm(`Are you sure you want to delete voucher ${voucher.voucher_no} for "${voucher.student_name}" (${monthLabel} ${voucher.year})?\n\nOnly this specific month's voucher will be deleted.`)) return
    await deleteMutation.mutate(voucher.id)
  }, [deleteMutation])

  // Handle undo payments (show modal for selective undo)
  const handleUndoPayments = useCallback(async (voucher) => {
    setUndoVoucher(voucher)
    setUndoPaymentsLoading(true)
    setUndoPayments([])
    setSelectedPaymentIds([])
    setShowPaymentUndoModal(true)

    try {
      // Fetch all payments for this voucher
      const response = await feePaymentService.getVoucherPayments(voucher.id)
      const payments = response.data.payments || []

      if (payments.length === 0) {
        alert('No payments found for this voucher')
        setShowPaymentUndoModal(false)
        return
      }

      // Sort payments by date (newest first)
      const sortedPayments = payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
      setUndoPayments(sortedPayments)
    } catch (error) {
      console.error('Failed to load payments:', error)
      alert('Failed to load payment history. Please try again.')
      setShowPaymentUndoModal(false)
    } finally {
      setUndoPaymentsLoading(false)
    }
  }, [])

  // Handle payment selection for undo
  const handlePaymentSelectionToggle = useCallback((paymentId) => {
    setSelectedPaymentIds(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId)
      } else {
        return [...prev, paymentId]
      }
    })
  }, [])

  // Select all payments for undo
  const handleSelectAllPayments = useCallback((checked) => {
    if (checked) {
      setSelectedPaymentIds(undoPayments.map(payment => payment.id))
    } else {
      setSelectedPaymentIds([])
    }
  }, [undoPayments])

  // Close payment undo modal
  const closePaymentUndoModal = useCallback(() => {
    setShowPaymentUndoModal(false)
    setUndoVoucher(null)
    setUndoPayments([])
    setSelectedPaymentIds([])
  }, [])

  // Execute selected payment deletions
  const executePaymentUndo = useCallback(async () => {
    if (selectedPaymentIds.length === 0) {
      alert('Please select at least one payment to undo')
      return
    }

    const selectedPayments = undoPayments.filter(payment => selectedPaymentIds.includes(payment.id))
    const totalAmount = selectedPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)

    if (!confirm(`Are you sure you want to undo ${selectedPaymentIds.length} payment(s) totaling Rs. ${totalAmount.toLocaleString()}?\n\nThis action cannot be undone.`)) {
      return
    }

    setUndoPaymentsLoading(true)
    try {
      let deletedCount = 0
      for (const paymentId of selectedPaymentIds) {
        try {
          await feePaymentService.delete(paymentId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete payment ${paymentId}:`, error)
        }
      }

      if (deletedCount > 0) {
        // Refresh the vouchers list
        refreshVouchers()
        alert(`Successfully undone ${deletedCount} payment(s). Total amount: Rs. ${totalAmount.toLocaleString()}`)
        closePaymentUndoModal()
      } else {
        alert('Failed to delete any payments')
      }
    } catch (error) {
      console.error('Failed to undo payments:', error)
      alert('Failed to undo payments. Please try again.')
    } finally {
      setUndoPaymentsLoading(false)
    }
  }, [selectedPaymentIds, undoPayments, refreshVouchers, closePaymentUndoModal])

  // Checkbox selection handlers
  const handleSelectVoucher = useCallback((voucherId) => {
    setSelectedVouchers(prev => {
      if (prev.includes(voucherId)) {
        return prev.filter(id => id !== voucherId)
      } else {
        return [...prev, voucherId]
      }
    })
  }, [])

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const allVoucherIds = filteredVouchers.map(v => v.id)
      setSelectedVouchers(allVoucherIds)
    } else {
      setSelectedVouchers([])
    }
  }, [filteredVouchers])

  // Bulk operations
  const handleBulkPrint = useCallback(() => {
    if (selectedVouchers.length === 0) {
      alert('Please select at least one voucher to print')
      return
    }
    
    // Open all vouchers sequentially with small delay
    selectedVouchers.forEach((voucherId, index) => {
      setTimeout(() => {
        feeVoucherService.printVoucher(voucherId)
      }, index * 200) // 200ms delay between each print
    })
  }, [selectedVouchers])

  // NEW: Enhanced bulk print with single PDF (4 vouchers per page)
  const handleEnhancedPrint = useCallback(async () => {
    if (selectedVouchers.length === 0) {
      alert('Please select vouchers to print using the checkboxes')
      return
    }

    console.log('Starting enhanced print for vouchers:', selectedVouchers)
    
    // Show loading indicator
    const loadingDiv = document.createElement('div')
    loadingDiv.id = 'enhanced-print-loading'
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(220,38,38,0.95);color:white;padding:20px 40px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;font-size:16px;text-align:center;'
    loadingDiv.innerHTML = `
      <div style="margin-bottom:10px;">🖨️ Generating ${selectedVouchers.length} voucher(s)...</div>
      <div style="font-size:12px;opacity:0.9;">Please wait, creating PDF</div>
    `
    document.body.appendChild(loadingDiv)
    
    try {
      const result = await feeVoucherService.bulkPrintVouchers(selectedVouchers)
      
      console.log('Enhanced print result:', result)
      
      // Remove loading indicator
      const loadingElement = document.getElementById('enhanced-print-loading')
      if (loadingElement) {
        loadingElement.remove()
      }
      
      if (result.success) {
        console.log(`Successfully opened ${result.count} vouchers for printing`)
        
        // Show brief success message
        const successDiv = document.createElement('div')
        successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#dc2626;color:white;padding:12px 20px;border-radius:4px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(220,38,38,0.3);'
        successDiv.innerHTML = `✓ ${result.count} voucher(s) ready to print`
        document.body.appendChild(successDiv)
        setTimeout(() => successDiv.remove(), 3000)
        
        // Clear selection after successful print
        setSelectedVouchers([])
      } else {
        console.error('Enhanced print failed:', result.error)
        alert(`Failed to print vouchers: ${result.error}\n\nPlease try again or contact support if the issue persists.`)
      }
    } catch (error) {
      console.error('Failed to enhanced print vouchers:', error)
      
      // Remove loading indicator
      const loadingElement = document.getElementById('enhanced-print-loading')
      if (loadingElement) {
        loadingElement.remove()
      }
      
      alert(`Failed to print vouchers: ${error.message}\n\nPlease check your connection and try again.`)
    }
  }, [selectedVouchers])

  // NEW: Save selected vouchers as PDF
  const handleSaveAsPDF = useCallback(async () => {
    if (selectedVouchers.length === 0) {
      alert('Please select vouchers to save as PDF using the checkboxes')
      return
    }

    console.log('Starting PDF download for vouchers:', selectedVouchers)
    
    // Show loading indicator
    const loadingDiv = document.createElement('div')
    loadingDiv.id = 'pdf-download-loading'
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(37,99,235,0.95);color:white;padding:20px 40px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;font-size:16px;text-align:center;'
    loadingDiv.innerHTML = `
      <div style="margin-bottom:10px;">📥 Downloading ${selectedVouchers.length} voucher(s)...</div>
      <div style="font-size:12px;opacity:0.9;">Please wait, preparing PDF file</div>
    `
    document.body.appendChild(loadingDiv)
    
    try {
      const result = await feeVoucherService.bulkDownloadPDF(selectedVouchers)
      
      console.log('PDF download result:', result)
      
      // Remove loading indicator
      const loadingElement = document.getElementById('pdf-download-loading')
      if (loadingElement) {
        loadingElement.remove()
      }
      
      if (result.success) {
        console.log(`Successfully downloaded ${result.count} vouchers as PDF`)
        
        // Show brief success message
        const successDiv = document.createElement('div')
        successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px 20px;border-radius:4px;z-index:10000;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.3);'
        successDiv.innerHTML = `✓ ${result.count} voucher(s) saved as PDF`
        document.body.appendChild(successDiv)
        setTimeout(() => successDiv.remove(), 3000)
        
        // Clear selection after successful download
        setSelectedVouchers([])
      } else {
        console.error('PDF download failed:', result.error)
        alert(`Failed to save vouchers as PDF: ${result.error}\n\nPlease try again or contact support if the issue persists.`)
      }
    } catch (error) {
      console.error('Failed to download vouchers as PDF:', error)
      
      // Remove loading indicator
      const loadingElement = document.getElementById('pdf-download-loading')
      if (loadingElement) {
        loadingElement.remove()
      }
      
      alert(`Failed to save vouchers as PDF: ${error.message}\n\nPlease check your connection and try again.`)
    }
  }, [selectedVouchers])

  const handleBulkDelete = useCallback(async () => {
    if (selectedVouchers.length === 0) {
      alert('Please select at least one voucher to delete')
      return
    }

    // Check if any selected voucher has payments
    const selectedVoucherObjects = filteredVouchers.filter(v => selectedVouchers.includes(v.id))
    const hasPayments = selectedVoucherObjects.some(v => v.status !== VOUCHER_STATUS.UNPAID)
    
    if (hasPayments) {
      alert('Cannot delete vouchers with payments. Please deselect paid/partial vouchers.')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedVouchers.length} voucher(s)?`)) return

    // Show progress indicator
    const deleteCount = selectedVouchers.length
    const progressMsg = deleteCount > 10 
      ? `Deleting ${deleteCount} vouchers... Please wait.` 
      : null
    
    if (progressMsg) {
      // For large batches, show a loading message
      const loadingDiv = document.createElement('div')
      loadingDiv.id = 'bulk-delete-loading'
      loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px 40px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;font-size:16px;'
      loadingDiv.innerHTML = `<div style="text-align:center;">🗑️ Deleting ${deleteCount} vouchers...<br/><small>Please wait...</small></div>`
      document.body.appendChild(loadingDiv)
    }

    try {
      // Delete all vouchers concurrently using Promise.allSettled
      const deletePromises = selectedVouchers.map(voucherId => 
        feeVoucherService.delete(voucherId)
          .then(() => ({ success: true, voucherId }))
          .catch(error => ({ success: false, voucherId, error: error.message }))
      )

      const results = await Promise.all(deletePromises)
      
      // Count successes and failures
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success)

      // Remove loading indicator
      const loadingDiv = document.getElementById('bulk-delete-loading')
      if (loadingDiv) loadingDiv.remove()

      // Refresh voucher list
      await refreshVouchers()
      
      // Clear selection
      setSelectedVouchers([])

      // Show results
      if (failed.length === 0) {
        alert(`✅ Successfully deleted all ${successful} voucher(s)!`)
      } else if (successful > 0) {
        alert(`⚠️ Partially completed:\\n✅ Deleted: ${successful}\\n❌ Failed: ${failed.length}\\n\\nPlease refresh and try again for failed vouchers.`)
      } else {
        alert(`❌ Failed to delete vouchers. Please try again or contact support.`)
      }
    } catch (error) {
      // Remove loading indicator
      const loadingDiv = document.getElementById('bulk-delete-loading')
      if (loadingDiv) loadingDiv.remove()
      
      console.error('Bulk delete error:', error)
      alert('❌ An error occurred while deleting vouchers. Please try again.')
    }
  }, [selectedVouchers, filteredVouchers, refreshVouchers])

  // Render helpers
  const renderStatusBadge = (status) => (
    <span className={`status-badge ${STATUS_COLORS[status] || ''}`}>
      {status}
    </span>
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  // Sort classes using centralized sorting
  const classes = useMemo(
    () => sortClassesBySequence(classesData?.data || []),
    [classesData]
  )
  const students = studentsData?.data || []
  const sections = sectionsData?.data || []
  const filterSections = filterSectionsData?.data || []

  return (
    <div className="page-content fee-management">
      <div className="page-header">
        <h2>Fee Voucher Management</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Voucher List
          </button>
          <button 
            className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate Vouchers
          </button>
        </div>
      </div>

      {(vouchersError || generateMutation.error || paymentMutation.error) && (
        <div className="alert alert-error">
          {vouchersError || generateMutation.error || paymentMutation.error}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="voucher-list-section">
          {/* Filters */}
          <div className="filters-section">
            {/* Student name search dropdown (replaces plain text search) */}
            <div ref={listSearchRef} style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              {!selectedListStudent ? (
                <>
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={listSearchTerm}
                    onChange={(e) => setListSearchTerm(e.target.value)}
                    onFocus={() => listSearchResults.length > 0 && setShowListSearchResults(true)}
                    className="search-input"
                    style={{ width: '100%' }}
                    autoComplete="off"
                  />
                  {listSearchLoading && (
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#6b7280' }}>⏳</span>
                  )}
                  {showListSearchResults && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', maxHeight: '240px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      {listSearchResults.length === 0 ? (
                        <div style={{ padding: '10px 14px', color: '#6c757d', fontSize: '13px' }}>No students found</div>
                      ) : listSearchResults.map((student) => {
                        const fatherName = student.father_name || student.father_guardian_name || 'N/A'
                        const className = student.current_class_name || student.current_enrollment?.class_name || student.class_name || 'N/A'
                        const sectionName = student.current_section_name || student.current_enrollment?.section_name || student.section_name || ''
                        return (
                          <div
                            key={student.id}
                            onClick={() => { setSelectedListStudent(student); setListSearchTerm(''); setShowListSearchResults(false) }}
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
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e8f4fd', border: '1px solid #bee3f8', borderRadius: '4px', padding: '6px 10px', height: '38px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                    {selectedListStudent.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedListStudent.name}
                  </span>
                  <button onClick={() => setSelectedListStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '16px', lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                </div>
              )}
            </div>
            
            <select
              value={filters.class_id}
              onChange={(e) => handleFilterChange('class_id', e.target.value)}
              className="filter-select"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
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

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value={VOUCHER_STATUS.UNPAID}>Unpaid</option>
              <option value={VOUCHER_STATUS.PARTIAL}>Partial</option>
              <option value={VOUCHER_STATUS.PAID}>Paid</option>
            </select>

            <select
              value={amountSortOrder}
              onChange={(e) => setAmountSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="">Sort by Amount</option>
              <option value="low-to-high">Amount: Low to High</option>
              <option value="high-to-low">Amount: High to Low</option>
            </select>

            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
              className="filter-select"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <input
              type="number"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
              className="filter-input year-input"
              min="2020"
              max="2030"
            />
          </div>

          {/* Bulk Action Buttons */}
          {selectedVouchers.length > 0 && (
            <div className="bulk-actions-bar" style={{ 
              padding: '12px 16px',
              background: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: '500', color: '#1e40af' }}>
                {selectedVouchers.length} voucher(s) selected
              </span>
              <button
                onClick={handleEnhancedPrint}
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🖨️ Print Selected
              </button>
              <button
                onClick={handleSaveAsPDF}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                💾 Save as PDF
              </button>
              <button
                onClick={handleBulkDelete}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🗑️ Delete Selected
              </button>
              <button
                onClick={() => setSelectedVouchers([])}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Vouchers Table */}
          {vouchersLoading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading vouchers...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="empty-state">
              <p>No vouchers found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedVouchers.length === filteredVouchers.length && filteredVouchers.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th>Voucher #</th>
                    <th>Student</th>
                    <th>Father Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Month/Year</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Last Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.slice(0, displayLimit).map(voucher => (
                    <tr key={voucher.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedVouchers.includes(voucher.id)}
                          onChange={() => handleSelectVoucher(voucher.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td>
                        {voucher.voucher_no}
                        {voucher.voucher_type === 'YEARLY_COLLEGE' && (
                          <span style={{
                            marginLeft: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: '700',
                            background: '#7c3aed', color: 'white', borderRadius: '10px',
                            verticalAlign: 'middle'
                          }}>Annual</span>
                        )}
                      </td>
                      <td>
                        <div className="student-info">
                          <span className="student-name">{voucher.student_name}</span>
                          <span className="student-roll">{voucher.student_roll_no}</span>
                        </div>
                      </td>
                      <td>{voucher.father_name || '-'}</td>
                      <td>{voucher.class_name}</td>
                      <td>{voucher.section_name || '-'}</td>
                      <td>{voucher.voucher_type === 'YEARLY_COLLEGE' ? '📅 Annual Package' : (voucher.month && voucher.year ? `${MONTHS.find(m => m.value === voucher.month)?.label || ''} ${voucher.year}` : '-')}</td>
                      <td>{formatCurrency(voucher.total_amount)}</td>
                      <td>{formatCurrency(voucher.paid_amount)}</td>
                      <td className="balance-cell">
                        {formatCurrency(voucher.due_amount)}
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {voucher.last_payment_date ? new Date(voucher.last_payment_date).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric'
                        }) : (voucher.status === VOUCHER_STATUS.UNPAID ? '-' : 'N/A')}
                      </td>
                      <td>{renderStatusBadge(voucher.status)}</td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', flexDirection: 'row', gap: '0.35rem', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                          {voucher.status !== VOUCHER_STATUS.PAID && (
                            <>
                              <button 
                                className="btn-action btn-pay btn-small"
                                onClick={() => openPaymentModal(voucher)}
                                title="Record a payment for this voucher"
                                style={{ 
                                  fontSize: '0.95rem', 
                                  padding: '0.3rem 0.45rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  lineHeight: '1',
                                  minWidth: 'auto'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                              >
                                💰
                              </button>
                              {isAdmin() && (
                                <button 
                                  className="btn-action btn-edit btn-small"
                                  onClick={() => openEditItemsModal(voucher)}
                                  title="Edit voucher items"
                                  style={{ 
                                    fontSize: '0.95rem', 
                                    padding: '0.3rem 0.45rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    lineHeight: '1',
                                    minWidth: 'auto'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                                  onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                                >
                                  ✏️
                                </button>
                              )}
                            </>
                          )}
                          {(voucher.status === VOUCHER_STATUS.PAID || voucher.status === VOUCHER_STATUS.PARTIAL) && isAdmin() && (
                            <button 
                              className="btn-action btn-undo btn-small"
                              onClick={() => handleUndoPayments(voucher)}
                              title="Undo payments"
                              style={{ 
                                fontSize: '0.95rem', 
                                padding: '0.3rem 0.45rem',
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                lineHeight: '1',
                                minWidth: 'auto'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#d97706'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#f59e0b'}
                            >
                              ↩️
                            </button>
                          )}
                          {voucher.status === VOUCHER_STATUS.UNPAID && isAdmin() && (
                            <button 
                              className="btn-action btn-delete btn-small"
                              onClick={() => handleDelete(voucher)}
                              title={`Delete this voucher (${MONTHS.find(m => m.value === voucher.month)?.label || ''} ${voucher.year})`}
                              style={{ 
                                fontSize: '0.95rem', 
                                padding: '0.3rem 0.45rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                lineHeight: '1',
                                minWidth: 'auto'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVouchers.length > displayLimit && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1.2rem 0 0.5rem' }}>
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 100)}
                    style={{
                      padding: '0.55rem 2rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    Show More ({filteredVouchers.length - displayLimit} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="generate-section">
          <form onSubmit={handleGenerateSubmit} className="generate-form">
            <div className="form-section">
              <h3>Generation Type</h3>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value="single"
                    checked={generateForm.type === 'single'}
                    onChange={(e) => handleGenerateFormChange('type', e.target.value)}
                  />
                  <span>Single Student</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value="bulk"
                    checked={generateForm.type === 'bulk'}
                    onChange={(e) => handleGenerateFormChange('type', e.target.value)}
                  />
                  <span>Bulk (Class/Section)</span>
                </label>
              </div>
            </div>

            <div className="form-row">
              {generateForm.type === 'bulk' && (
                <div className="form-group">
                  <label>Class *</label>
                  <select
                    value={generateForm.class_id}
                    onChange={(e) => handleGenerateFormChange('class_id', e.target.value)}
                    required
                    disabled={classesLoading}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {generateForm.type === 'bulk' && (
                <div className="form-group">
                  <label>Section (Optional)</label>
                  <select
                    value={generateForm.section_id}
                    onChange={(e) => handleGenerateFormChange('section_id', e.target.value)}
                  >
                    <option value="">All Sections</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {generateForm.type === 'single' && (
                <div className="form-group student-search-container" ref={studentSearchRef}>
                  <label>Student * (Search by name)</label>
                  {selectedStudentName ? (
                    <div className="selected-student-display">
                      <span className="selected-student-name">{selectedStudentName}</span>
                      <button 
                        type="button" 
                        className="clear-selection-btn"
                        onClick={handleClearSelectedStudent}
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="student-search-wrapper">
                      <input
                        type="text"
                        placeholder="Type student name to search..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        onFocus={() => studentSearchResults.length > 0 && setShowStudentSearchResults(true)}
                        className="student-search-input"
                      />
                      {studentSearchLoading && <span className="search-loading">Searching...</span>}
                      {studentSearchTerm && !studentSearchLoading && (
                        <button 
                          type="button" 
                          className="clear-search-btn"
                          onClick={() => {
                            setStudentSearchTerm('')
                            setStudentSearchResults([])
                            setShowStudentSearchResults(false)
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                  
                  {showStudentSearchResults && studentSearchResults.length > 0 && (
                    <div className="student-search-results">
                      <div className="search-results-count">Found {studentSearchResults.length} student{studentSearchResults.length > 1 ? 's' : ''}</div>
                      {studentSearchResults.map(student => (
                        <div 
                          key={student.id} 
                          className="student-search-card"
                          onClick={() => handleSelectStudentFromSearch(student)}
                        >
                          <div className="student-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="student-card-info">
                            <div className="student-card-name">{student.name}</div>
                            <div className="student-card-details">
                              <div className="detail-item">
                                <span className="detail-label">FATHER</span>
                                <span className="detail-value">{student.father_name || 'N/A'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">CLASS</span>
                                <span className="detail-value">{student.class_name || 'N/A'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">SECTION</span>
                                <span className="detail-value">{student.section_name || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showStudentSearchResults && studentSearchResults.length === 0 && studentSearchTerm.length >= 2 && !studentSearchLoading && (
                    <div className="student-search-results">
                      <div className="no-results">No students found</div>
                    </div>
                  )}
                </div>
              )}

              {/* College student: yearly package input */}
              {generateForm.type === 'single' && selectedStudentClassType === 'COLLEGE' && (
                <div className="form-group" style={{
                  background: '#fdf4ff',
                  border: '2px solid #a855f7',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <label style={{ color: '#7c3aed', fontWeight: '600' }}>
                    🎓 Total Yearly Package (Rs.) *
                  </label>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0.25rem 0 0.5rem' }}>
                    College student — a single annual voucher will be created. Enter the full year fee amount.
                  </p>
                  <input
                    type="number"
                    value={yearlyPackageInput}
                    onChange={(e) => setYearlyPackageInput(e.target.value)}
                    min="1"
                    placeholder="e.g., 80000"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '18px',
                      fontWeight: '700',
                      textAlign: 'right',
                      border: '2px solid #a855f7',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {yearlyPackageInput && parseFloat(yearlyPackageInput) > 0 && (
                    <p style={{ textAlign: 'right', color: '#7c3aed', fontWeight: '600', marginTop: '0.4rem' }}>
                      Rs. {parseFloat(yearlyPackageInput).toLocaleString()}/-
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Month *</label>
                <select
                  value={generateForm.month}
                  onChange={(e) => handleGenerateFormChange('month', parseInt(e.target.value))}
                  required
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  value={generateForm.year}
                  onChange={(e) => handleGenerateFormChange('year', parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                  required
                />
              </div>

              {/* Due Date — not needed for college yearly vouchers */}
              {!(generateForm.type === 'single' && selectedStudentClassType === 'COLLEGE') && (
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={generateForm.due_date}
                    onChange={(e) => handleGenerateFormChange('due_date', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Fee Types Selection — hidden for college single-student vouchers.
                College students get a single YEARLY_COLLEGE voucher with a custom
                package amount; there is no shared fee structure for college classes. */}
            {!(generateForm.type === 'single' && selectedStudentClassType === 'COLLEGE') && (
            <div className="form-section">
              <h3>Fee Types to Include *</h3>
              <p className="form-hint">Select which fees to include. Monthly fee uses each student's individual fee amount.</p>
              <div className="checkbox-group">
                {FEE_TYPES.map(feeType => (
                  <label key={feeType.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={generateForm.fee_types?.includes(feeType.value) || false}
                      onChange={() => handleFeeTypeToggle(feeType.value)}
                    />
                    <span className="checkbox-text">
                      <strong>{feeType.label}</strong>
                      <small>{feeType.description}</small>
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom Charges Section */}
              {!(generateForm.type === 'single' && selectedStudentClassType === 'COLLEGE') && generateForm.fee_types?.includes('OTHER') && (
                <div className="custom-charges-section">
                  <div className="custom-charges-header">
                    <h4>Custom Charges</h4>
                    <button
                      type="button"
                      className="edit-items-add-btn"
                      onClick={handleAddCustomCharge}
                    >
                      + Add Charge
                    </button>
                  </div>

                  {(generateForm.custom_charges || []).length === 0 ? (
                    <p className="custom-charges-empty">
                      No custom charges added yet. Click "+ Add Charge" to add fees like Library Fee, Sports Fee, etc.
                    </p>
                  ) : (
                    <div className="edit-items-list">
                      {(generateForm.custom_charges || []).map((charge, index) => (
                        <div key={index} className="edit-item-row">
                          <input
                            type="text"
                            className="edit-item-desc-input"
                            placeholder="Fee name (e.g., Library Fee)"
                            value={charge.description}
                            onChange={(e) => handleUpdateCustomCharge(index, 'description', e.target.value)}
                            required
                          />
                          <div className="edit-item-amount-wrap">
                            <input
                              type="number"
                              className="edit-item-amount-input"
                              placeholder="Amount"
                              value={charge.amount}
                              onChange={(e) => handleUpdateCustomCharge(index, 'amount', e.target.value)}
                              min="0"
                              step="50"
                            />
                          </div>
                          <button
                            type="button"
                            className="edit-item-remove-btn"
                            onClick={() => handleRemoveCustomCharge(index)}
                            title="Remove charge"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}{/* end of fee-types section for non-college */}

            {/* Action Buttons */}
            <div className="form-actions">
              {generateForm.type === 'bulk' && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handlePreviewBulk}
                  disabled={isPreviewLoading || !generateForm.class_id || !generateForm.fee_types?.length}
                >
                  {isPreviewLoading ? 'Loading Preview...' : '👁️ Preview Vouchers'}
                </button>
              )}
              <button 
                type="submit" 
                className="btn-primary"
                disabled={generateMutation.loading || (!(generateForm.type === 'single' && selectedStudentClassType === 'COLLEGE') && !generateForm.fee_types?.length)}
              >
                {generateMutation.loading ? 'Generating...' : 
                  generateForm.type === 'bulk' ? 'Generate & Save to Database' : 'Generate Voucher'}
              </button>
            </div>
          </form>

          {/* Preview Section (NEW - Issue #3) */}
          {showPreview && previewData && (
            <div className="preview-section" style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>📋 Voucher Preview</h3>
                <button 
                  onClick={handleCancelPreview}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '24px', 
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ 
                backgroundColor: '#eff6ff', 
                padding: '1rem', 
                borderRadius: '6px', 
                marginBottom: '1rem',
                border: '1px solid #bfdbfe'
              }}>
                <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
                  <strong>Total Vouchers:</strong> {previewData.summary?.total_students || 0}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
                  <strong>Total Amount:</strong> Rs. {(previewData.summary?.total_amount || 0).toLocaleString()}
                </p>
                {previewData.summary?.students_with_custom_fees > 0 && (
                  <p style={{ margin: '0.25rem 0', fontSize: '14px', color: '#059669' }}>
                    ℹ️ <strong>{previewData.summary.students_with_custom_fees}</strong> student(s) with custom fees
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Father Name</th>
                      <th>Roll No</th>
                      <th>Fee Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData.vouchers || []).slice(0, previewDisplayLimit).map((voucher, index) => (
                      <tr key={index}>
                        <td>
                          {voucher.student_name}
                          {voucher.has_custom_fees && (
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '12px', 
                              color: '#059669',
                              fontWeight: 'bold'
                            }}>
                              *
                            </span>
                          )}
                        </td>
                        <td>{voucher.father_name || '-'}</td>
                        <td>{voucher.roll_no}</td>
                        <td>
                          {(voucher.items || []).map((item, idx) => (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              {item.item_type === 'CUSTOM' && item.description
                                ? item.description
                                : (EDIT_FEE_TYPES.find(ft => ft.value === item.item_type)?.label || item.item_type.replace('_', ' '))
                              }: Rs. {item.amount}
                            </div>
                          ))}
                        </td>
                        <td><strong>Rs. {voucher.total_amount.toLocaleString()}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(previewData.vouchers || []).length > previewDisplayLimit && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDisplayLimit(prev => prev + 100)}
                      style={{
                        padding: '0.55rem 2rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      Show More ({(previewData.vouchers || []).length - previewDisplayLimit} remaining)
                    </button>
                  </div>
                )}
              </div>

              {previewData.summary?.students_with_custom_fees > 0 && (
                <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '1rem' }}>
                  * Students with custom fees (different from class defaults)
                </p>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={handleCancelPreview}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handlePrintWithoutSaving}
                  className="btn-secondary"
                >
                  Print Without Saving
                </button>
                <button 
                  type="button"
                  onClick={handleGenerateAndSave}
                  className="btn-primary"
                  disabled={generateMutation.loading}
                >
                  {generateMutation.loading ? 'Saving...' : '💾 Generate & Save to Database'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedVoucher && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="modal-close" onClick={closePaymentModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="voucher-summary">
                <p><strong>Student:</strong> {selectedVoucher.student_name}</p>
                <p><strong>Voucher:</strong> {selectedVoucher.voucher_no}</p>
                <p><strong>Total:</strong> {formatCurrency(selectedVoucher.total_amount)}</p>
                <p><strong>Paid:</strong> {formatCurrency(selectedVoucher.paid_amount)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedVoucher.due_amount)}</p>
              </div>

              {selectedVoucher.voucher_type === 'YEARLY_COLLEGE' && (
                <div style={{ marginBottom: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#059669' }}>
                    📅 Annual Package — Running Ledger
                  </p>
                  {voucherPaymentsLoading ? (
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading payment history...</p>
                  ) : voucherPayments.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#dcfce7' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #bbf7d0', fontWeight: '700' }}>Payment Date & Method</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #bbf7d0', fontWeight: '700' }}>Amount Paid</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #bbf7d0', fontWeight: '700' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucherPayments.map((payment, idx) => {
                          const cumulativePaid = voucherPayments
                            .slice(0, idx + 1)
                            .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                          const remaining = selectedVoucher.total_amount - cumulativePaid
                          return (
                            <tr key={payment.id}>
                              <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                                  {new Date(payment.payment_date).toLocaleDateString('en-PK', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {payment.created_at ? new Date(payment.created_at).toLocaleTimeString('en-PK', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  }) : 'Time not recorded'}
                                </div>
                                {payment.payment_method && (
                                  <div style={{ fontSize: '10px', color: '#7c2d12', background: '#fef3c7', padding: '1px 4px', borderRadius: '3px', marginTop: '2px', display: 'inline-block' }}>
                                    {payment.payment_method}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #e5e7eb', color: '#059669', fontWeight: '600', fontSize: '14px' }}>
                                {formatCurrency(parseFloat(payment.amount))}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #e5e7eb', color: remaining > 0 ? '#dc2626' : '#059669', fontWeight: '700', fontSize: '14px' }}>
                                {formatCurrency(remaining)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>No payments recorded yet.</p>
                  )}
                </div>
              )}

              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    min="1"
                    max={selectedVoucher.due_amount}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Payment</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reference No</label>
                  <input
                    type="text"
                    value={paymentForm.reference_no}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_no: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closePaymentModal}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={paymentMutation.loading}
                  >
                    {paymentMutation.loading ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Items Modal */}
      {showEditItemsModal && editingVoucher && (
        <div className="modal-overlay" onClick={closeEditItemsModal}>
          <div className="modal-content edit-items-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Voucher Items</h3>
              <button className="modal-close" onClick={closeEditItemsModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Student Info Banner */}
              <div className="edit-voucher-student-info">
                <div>
                  <span className="edit-info-label">Student</span>
                  <span className="edit-info-value">{editingVoucher.student_name}</span>
                </div>
                <div>
                  <span className="edit-info-label">Class</span>
                  <span className="edit-info-value">
                    {editingVoucher.class_name}{editingVoucher.section_name && ` – ${editingVoucher.section_name}`}
                  </span>
                </div>
              </div>

              {editItemsMutation.error && (
                <div className="edit-items-error">
                  {editItemsMutation.error}
                </div>
              )}

              <form onSubmit={handleEditItemsSubmit}>
                {/* Column Labels */}
                <div className="edit-items-col-labels">
                  <span style={{ flex: '0 0 150px' }}>Fee Type</span>
                  <span style={{ flex: 1 }}>Custom Name</span>
                  <span style={{ flex: '0 0 110px' }}>Amount (Rs)</span>
                  <span style={{ flex: '0 0 32px' }}></span>
                </div>

                {/* Items */}
                <div className="edit-items-list">
                  {editItems.map((item, index) => (
                    <div key={index} className="edit-item-row">
                      <select
                        className="edit-item-select"
                        value={item.item_type}
                        onChange={(e) => handleEditItemChange(index, 'item_type', e.target.value)}
                      >
                        {EDIT_FEE_TYPES.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>

                      {item.item_type === 'CUSTOM' ? (
                        <input
                          type="text"
                          className="edit-item-desc-input"
                          placeholder="e.g. Library Fee, Sports Fee…"
                          value={item.description || ''}
                          onChange={(e) => handleEditItemChange(index, 'description', e.target.value)}
                          required
                        />
                      ) : (
                        <div className="edit-item-desc-empty">—</div>
                      )}

                      <div className="edit-item-amount-wrap">
                        <input
                          type="number"
                          className="edit-item-amount-input"
                          value={item.amount}
                          onChange={(e) => handleEditItemChange(index, 'amount', e.target.value)}
                          min="0"
                          step="50"
                        />
                      </div>

                      <button
                        type="button"
                        className="edit-item-remove-btn"
                        onClick={() => handleRemoveItem(index)}
                        title="Remove item"
                      >×</button>
                    </div>
                  ))}
                </div>

                {/* Add Item */}
                <button
                  type="button"
                  className="edit-items-add-btn"
                  onClick={handleAddItem}
                >
                  + Add Item
                </button>

                {/* Total */}
                <div className="edit-items-total-row">
                  <span>Total</span>
                  <span>{formatCurrency(editItems.reduce((sum, item) => sum + (item.amount || 0), 0))}</span>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeEditItemsModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={editItemsMutation.loading || editItems.length === 0}
                  >
                    {editItemsMutation.loading ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Undo Modal */}
      {showPaymentUndoModal && undoVoucher && (
        <div className="modal-overlay" onClick={closePaymentUndoModal}>
          <div className="modal-content payment-undo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 Undo Payments</h3>
              <button className="modal-close" onClick={closePaymentUndoModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Voucher Info */}
              <div className="undo-voucher-info" style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Student:</span>
                    <span style={{ marginLeft: '8px', color: '#1e293b' }}>{undoVoucher.student_name}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Voucher:</span>
                    <span style={{ marginLeft: '8px', color: '#1e293b' }}>V-{undoVoucher.id}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Class:</span>
                    <span style={{ marginLeft: '8px', color: '#1e293b' }}>
                      {undoVoucher.class_name}{undoVoucher.section_name && ` - ${undoVoucher.section_name}`}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Status:</span>
                    <span style={{ marginLeft: '8px', color: '#1e293b' }}>{undoVoucher.status}</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                Select the payments you want to undo. Selected payments will be permanently removed and cannot be recovered.
              </p>

              {/* Payment List */}
              {undoPaymentsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                  Loading payment history...
                </div>
              ) : undoPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>📭</div>
                  No payments found for this voucher
                </div>
              ) : (
                <div>
                  {/* Select All Option */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px', 
                    background: '#f1f5f9', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px', 
                    marginBottom: '12px',
                    fontWeight: '600'
                  }}>
                    <input
                      type="checkbox"
                      id="select-all-payments"
                      checked={selectedPaymentIds.length === undoPayments.length && undoPayments.length > 0}
                      onChange={(e) => handleSelectAllPayments(e.target.checked)}
                      style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="select-all-payments" style={{ cursor: 'pointer', color: '#475569' }}>
                      Select All Payments ({undoPayments.length})
                    </label>
                    {selectedPaymentIds.length > 0 && (
                      <span style={{ 
                        marginLeft: 'auto', 
                        fontSize: '13px', 
                        color: '#059669',
                        background: '#dcfce7',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        {selectedPaymentIds.length} selected
                      </span>
                    )}
                  </div>

                  {/* Payment Items */}
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    {undoPayments.map((payment, index) => {
                      const isSelected = selectedPaymentIds.includes(payment.id)
                      return (
                        <div
                          key={payment.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: index < undoPayments.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => handlePaymentSelectionToggle(payment.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePaymentSelectionToggle(payment.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginRight: '12px', transform: 'scale(1.1)' }}
                          />
                          
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                                Payment #{payment.id}
                              </div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                📅 {new Date(payment.payment_date).toLocaleDateString('en-PK', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {payment.payment_method && (
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  Method: {payment.payment_method}
                                </div>
                              )}
                              {payment.reference_no && (
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  Ref: {payment.reference_no}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '16px', color: '#059669' }}>
                              Rs. {parseFloat(payment.amount).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Selected Summary */}
                  {selectedPaymentIds.length > 0 && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: '#fef3c7', 
                      border: '1px solid #f59e0b', 
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#92400e'
                    }}>
                      <strong>⚠️ You are about to undo {selectedPaymentIds.length} payment(s)</strong>
                      <br />
                      Total amount: Rs. {undoPayments
                        .filter(payment => selectedPaymentIds.includes(payment.id))
                        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
                        .toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closePaymentUndoModal}
                  disabled={undoPaymentsLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={executePaymentUndo}
                  disabled={undoPaymentsLoading || selectedPaymentIds.length === 0}
                  style={{
                    background: selectedPaymentIds.length > 0 ? '#dc2626' : '#9ca3af',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: selectedPaymentIds.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {undoPaymentsLoading ? '⏳ Processing...' : `🔄 Undo ${selectedPaymentIds.length} Payment${selectedPaymentIds.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeeVoucherManagement
