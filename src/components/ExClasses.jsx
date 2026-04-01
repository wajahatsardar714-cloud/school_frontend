import { useEffect, useState } from 'react'
import { promotionService } from '../services/promotionService'
import { classService } from '../services/classService'
import './ExClasses.css'

export default function ExClasses() {
  const [batches, setBatches] = useState([])
  const [classTypeMap, setClassTypeMap] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadBatches = async () => {
    setLoading(true)
    setError('')
    try {
      const [batchRes, classRes] = await Promise.all([
        promotionService.listExClasses(),
        classService.list(),
      ])

      const classes = classRes?.data || []
      const map = {}
      classes.forEach((cls) => {
        map[String(cls.id)] = cls.class_type
      })

      setClassTypeMap(map)
      setBatches(batchRes?.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load passout classes')
    } finally {
      setLoading(false)
    }
  }

  const loadBatchDetail = async (batchId) => {
    setLoading(true)
    setError('')
    try {
      const res = await promotionService.getExClassBatch(batchId)
      setSelected(res?.data || null)
    } catch (err) {
      setError(err.message || 'Failed to load batch details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBatches()
  }, [])

  const schoolBatches = batches.filter((b) => classTypeMap[String(b.class_id)] === 'SCHOOL')
  const collegeBatches = batches.filter((b) => classTypeMap[String(b.class_id)] === 'COLLEGE')

  const renderBatchTable = (list, title, subtitle) => (
    <div className="section-card ex-section">
      <div className="ex-section-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="students-table ex-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Year</th>
              <th>Class</th>
              <th>Section</th>
              <th>Students</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td>{b.batch_month}</td>
                <td>{b.batch_year}</td>
                <td>{b.class_name}</td>
                <td>{b.section_name}</td>
                <td>{b.student_count}</td>
                <td>
                  <span className="locked-badge">{b.locked ? 'Locked' : 'Unlocked'}</span>
                </td>
                <td>
                  <button className="btn-secondary" onClick={() => loadBatchDetail(b.id)} disabled={loading}>View</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-cell">No batches found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="students-container ex-classes-page">
      <div className="page-header">
        <h1>Passout Classes</h1>
        <p>Read-only passout records, organized by School and College.</p>
      </div>

      {error && <div className="alert alert-error"><p>{error}</p></div>}

      <div className="section-card ex-topbar">
        <div>
          <h3>Archived Batches</h3>
          <p>These records are locked after promotion for audit and traceability.</p>
        </div>
        <div>
          <button className="btn-secondary" onClick={loadBatches} disabled={loading}>Refresh</button>
        </div>
      </div>

      {renderBatchTable(schoolBatches, 'School Passout Classes', 'Only school passout batches are listed here.')}
      {renderBatchTable(collegeBatches, 'College Passout Classes', 'Only college passout batches are listed here.')}

      {selected && (
        <div className="section-card ex-detail-card">
          <h3>Batch Detail</h3>
          <p className="ex-detail-subtitle">
            {selected.batch.class_name} - {selected.batch.section_name} ({selected.batch.batch_month}/{selected.batch.batch_year})
          </p>

          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Father Name</th>
                  <th>Roll No</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {selected.students.map((s) => (
                  <tr key={s.student_id}>
                    <td>{s.student_name}</td>
                    <td>{s.father_name || '-'}</td>
                    <td>{s.roll_no || '-'}</td>
                    <td>{s.phone || '-'}</td>
                  </tr>
                ))}
                {selected.students.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-cell">No students in this batch.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
