import { useEffect, useMemo, useState } from 'react'
import { classService, sectionService } from '../services/classService'
import { promotionService } from '../services/promotionService'
import { sortClassesBySequence } from '../utils/classSorting'
import './PromotionManagement.css'

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString()
}

const formatMonthYear = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function PromotionManagement() {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [promotionDate, setPromotionDate] = useState(new Date().toISOString().split('T')[0])
  const [sourceClassId, setSourceClassId] = useState('')
  const [targetClassId, setTargetClassId] = useState('')
  const [selectedSectionIds, setSelectedSectionIds] = useState([])
  const [renameMap, setRenameMap] = useState({})
  const [targetSections, setTargetSections] = useState([])
  const [conflictingSectionNames, setConflictingSectionNames] = useState([])

  const sortedClasses = useMemo(() => sortClassesBySequence(classes), [classes])

  const loadBaseData = async () => {
    setLoading(true)
    setError('')
    try {
      const [classesRes, historyRes] = await Promise.all([
        classService.list(),
        promotionService.history(),
      ])

      setClasses(classesRes?.data || [])
      setHistory(historyRes?.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load promotion data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBaseData()
  }, [])

  useEffect(() => {
    if (!sourceClassId) {
      setSections([])
      setSelectedSectionIds([])
      return
    }

    const loadSections = async () => {
      try {
        const res = await sectionService.list(sourceClassId)
        setSections(res?.data || [])
      } catch {
        setSections([])
      }
    }

    loadSections()
  }, [sourceClassId])

  useEffect(() => {
    if (!targetClassId) {
      setTargetSections([])
      return
    }

    const loadTargetSections = async () => {
      try {
        const res = await sectionService.list(targetClassId)
        setTargetSections(res?.data || [])
      } catch {
        setTargetSections([])
      }
    }

    loadTargetSections()
  }, [targetClassId])

  useEffect(() => {
    if (!sourceClassId || !targetClassId) {
      setConflictingSectionNames([])
      return
    }

    const activeSourceSections = sections.filter((sec) =>
      selectedSectionIds.length === 0 ? true : selectedSectionIds.includes(sec.id)
    )

    const targetNameSet = new Set(targetSections.map((s) => String(s.name || '').trim().toLowerCase()))

    const conflicts = activeSourceSections
      .map((s) => String(s.name || '').trim())
      .filter((name) => targetNameSet.has(name.toLowerCase()))

    setConflictingSectionNames(conflicts)
  }, [sourceClassId, targetClassId, sections, selectedSectionIds, targetSections])

  const toggleSection = (id) => {
    setSelectedSectionIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
  }

  const runPromotion = async (type) => {
    setLoading(true)
    setError('')
    try {
      if (type === 'school') {
        if (!window.confirm('Run Full School Promotion now?')) return
        await promotionService.fullSchoolPromotion({ promotion_date: promotionDate })
      }

      if (type === 'college') {
        if (!window.confirm('Run Full College Promotion now?')) return
        await promotionService.fullCollegePromotion({ promotion_date: promotionDate })
      }

      if (type === 'class') {
        if (!sourceClassId || !targetClassId) {
          throw new Error('Please select source and target class')
        }

        const unresolvedConflicts = conflictingSectionNames.filter((name) => {
          const renamed = String(renameMap[name] || '').trim()
          return !renamed
        })

        if (unresolvedConflicts.length > 0) {
          throw new Error('Resolve same-name section conflicts by adding new names or cancel promotion.')
        }

        const payload = {
          source_class_id: parseInt(sourceClassId, 10),
          target_class_id: parseInt(targetClassId, 10),
          promotion_date: promotionDate,
          section_ids: selectedSectionIds,
          section_rename_map: renameMap,
        }

        if (!window.confirm('Run Class Promotion now?')) return
        await promotionService.classPromotion(payload)
      }

      await loadBaseData()
      alert('Promotion completed successfully')
    } catch (err) {
      setError(err.message || 'Promotion failed')
    } finally {
      setLoading(false)
    }
  }

  const onUndo = async (run) => {
    if (run.status === 'UNDONE') return
    if (!window.confirm(`Undo promotion run #${run.id}?`)) return

    setLoading(true)
    setError('')
    try {
      await promotionService.undo(run.id)
      await loadBaseData()
      alert('Promotion undone successfully')
    } catch (err) {
      setError(err.message || 'Undo failed')
    } finally {
      setLoading(false)
    }
  }

  const sourceClass = sortedClasses.find((c) => String(c.id) === String(sourceClassId))
  const targetClass = sortedClasses.find((c) => String(c.id) === String(targetClassId))
  const unresolvedConflictCount = conflictingSectionNames.filter((name) => !String(renameMap[name] || '').trim()).length
  const classPromotionBlocked = loading || !sourceClass || !targetClass || unresolvedConflictCount > 0

  const completedRuns = history.filter((h) => h.status === 'COMPLETED').length
  const undoneRuns = history.filter((h) => h.status === 'UNDONE').length

  return (
    <div className="students-container promotion-page">
      <div className="page-header">
        <h1>Promotion Module</h1>
        <p className="promotion-subtitle">Manage school, college, and class promotions with full history and safe undo controls.</p>
      </div>

      {error && <div className="alert alert-error"><p>{error}</p></div>}

      <div className="promotion-summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total Runs</span>
          <strong>{history.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Completed</span>
          <strong>{completedRuns}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Undone</span>
          <strong>{undoneRuns}</strong>
        </div>
      </div>

      <div className="section-card promotion-date-row">
        <label htmlFor="promotion-date">Promotion Date</label>
        <input
          id="promotion-date"
          className="form-control"
          type="date"
          value={promotionDate}
          onChange={(e) => setPromotionDate(e.target.value)}
        />
      </div>

      <div className="promotion-cards">
        <div className="section-card promo-card">
          <h3>Full School Promotion</h3>
          <p>PG to Nursery, Nursery to Prep ... 9th to 10th, and 10th to Passout Classes batch.</p>
          <div className="promo-caution">
            <strong>Attention:</strong> This action is saved in Promotion History and can be undone from history if no manual enrollment changes are made after the run.
          </div>
          <button className="btn-primary" disabled={loading} onClick={() => runPromotion('school')}>Run Full School Promotion</button>
        </div>

        <div className="section-card promo-card">
          <h3>Full College Promotion</h3>
          <p>1st Year to 2nd Year, and 2nd Year passout to Passout Classes batch.</p>
          <div className="promo-caution">
            <strong>Important Caution:</strong> This run is stored in history and undo is available from history, but undo can be blocked if students are manually changed later.
          </div>
          <button className="btn-primary" disabled={loading} onClick={() => runPromotion('college')}>Run Full College Promotion</button>
        </div>
      </div>

      <div className="section-card promo-class-box">
        <h3>Class Promotion</h3>
        <div className="promo-caution">
          <strong>Attention:</strong> Class/section promotions from this page are logged in history and can be undone from history with the same safety rule.
        </div>

        <div className="promo-grid">
          <div className="form-field">
            <label>Source Class</label>
            <select className="form-control" value={sourceClassId} onChange={(e) => setSourceClassId(e.target.value)}>
              <option value="">Select Source Class</option>
              {sortedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Target Class</label>
            <select className="form-control" value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)}>
              <option value="">Select Target Class</option>
              {sortedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="section-select-box">
          <label>Select Sections (leave empty to include all sections)</label>
          <div className="section-pills">
            {sections.length === 0 && <span className="muted-text">No sections found for selected source class.</span>}
            {sections.map((sec) => (
              <button
                type="button"
                key={sec.id}
                className={`section-pill ${selectedSectionIds.includes(sec.id) ? 'active' : ''}`}
                onClick={() => toggleSection(sec.id)}
              >
                {sec.name}
              </button>
            ))}
          </div>
        </div>

        {sourceClass && targetClass && conflictingSectionNames.length > 0 && (
          <div className="promo-conflict-box">
            <strong>Same Section Name Conflict Detected:</strong>
            <p>
              Target class already has these section names: {conflictingSectionNames.join(', ')}.
              Add new names below to continue, or cancel promotion.
            </p>
          </div>
        )}

        <div className="rename-box">
          <h4>Section Rename Map (for conflicts)</h4>
          <p>If target already has same section names, write a new name below.</p>
          {sections
            .filter((sec) => (selectedSectionIds.length === 0 ? true : selectedSectionIds.includes(sec.id)))
            .map((sec) => (
            <div key={sec.id} className="rename-row">
              <span>{sec.name}</span>
              <input
                className="form-control"
                placeholder={conflictingSectionNames.includes(sec.name) ? 'Required new section name' : 'Optional new section name'}
                value={renameMap[sec.name] || ''}
                onChange={(e) => setRenameMap((prev) => ({ ...prev, [sec.name]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {unresolvedConflictCount > 0 && (
          <p className="conflict-required-text">
            Please resolve {unresolvedConflictCount} required section rename {unresolvedConflictCount > 1 ? 'entries' : 'entry'} to continue.
          </p>
        )}

        <button className="btn-primary" disabled={classPromotionBlocked} onClick={() => runPromotion('class')}>
          {unresolvedConflictCount > 0 ? 'Resolve Conflicts to Continue' : 'Run Class Promotion'}
        </button>
      </div>

      <div className="section-card history-box">
        <div className="history-top">
          <h3>Promotion History</h3>
          <button className="btn-secondary" onClick={loadBaseData} disabled={loading}>Refresh</button>
        </div>
        <div className="history-caution">
          Important: Undo works only when the promoted students were not changed manually after that run.
        </div>

        <div className="students-table history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Run</th>
                <th>Type</th>
                <th>Date</th>
                <th>Month/Year</th>
                <th>Status</th>
                <th>Promoted</th>
                <th>Archived</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-cell">No promotion history yet.</td>
                </tr>
              )}
              {history.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.promotion_type.replace('_', ' ')}</td>
                  <td>{formatDate(item.promotion_date)}</td>
                  <td>{formatMonthYear(item.promotion_date)}</td>
                  <td>
                    <span className={`status-badge ${item.status === 'UNDONE' ? 'undone' : 'completed'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.summary?.promoted_students || 0}</td>
                  <td>{item.summary?.archived_students || 0}</td>
                  <td>
                    <button
                      className="btn-danger"
                      disabled={loading || item.status === 'UNDONE'}
                      onClick={() => onUndo(item)}
                    >
                      {item.status === 'UNDONE' ? 'Already Undone' : 'Undo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
