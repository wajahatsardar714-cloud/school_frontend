import React, { useState, useEffect } from 'react'
import { classService, sectionService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { sortClassesBySequence } from '../../utils/classSorting'
import './PrintStudentsModal_fixed.css'

const PrintStudentsModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1) // 1: Select class/section, 2: Preview & Print
    const [classes, setClasses] = useState([])
    const [sections, setSections] = useState([])
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSectionId, setSelectedSectionId] = useState('')
    const [selectWholeClass, setSelectWholeClass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [students, setStudents] = useState([])
    const [sectionedStudents, setSectionedStudents] = useState([])

    // Load classes when modal opens
    useEffect(() => {
        if (isOpen) {
            loadClasses()
            setStep(1)
            setSelectedClassId('')
            setSelectedSectionId('')
            setSelectWholeClass(false)
            setStudents([])
            setSectionedStudents([])
            setError('')
        }
    }, [isOpen])

    // Load sections when class is selected
    useEffect(() => {
        if (selectedClassId && !selectWholeClass) {
            loadSections(selectedClassId)
        } else {
            setSections([])
            setSelectedSectionId('')
        }
    }, [selectedClassId, selectWholeClass])

    const loadClasses = async () => {
        try {
            setLoading(true)
            const response = await classService.list()
            const sortedClasses = sortClassesBySequence(response.data || [])
            setClasses(sortedClasses)
        } catch (err) {
            setError('Failed to load classes: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadSections = async (classId) => {
        try {
            setLoading(true)
            const response = await sectionService.list(classId)
            setSections(response.data || [])
        } catch (err) {
            setError('Failed to load sections: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadStudentsForPrint = async () => {
        if (!selectedClassId) {
            setError('Please select a class')
            return
        }

        if (!selectWholeClass && !selectedSectionId) {
            setError('Please select a section')
            return
        }

        try {
            setLoading(true)
            setError('')

            if (selectWholeClass) {
                // Load all sections for this class
                const sectionsResponse = await sectionService.list(selectedClassId)
                const classSections = sectionsResponse.data || []
                
                // Load students for each section
                const sectionData = []
                for (const section of classSections) {
                    const studentsResponse = await studentService.list({
                        class_id: selectedClassId,
                        section_id: section.id,
                        limit: 500
                    })
                    
                    if (studentsResponse.data && studentsResponse.data.length > 0) {
                        sectionData.push({
                            section: section,
                            students: studentsResponse.data
                        })
                    }
                }
                setSectionedStudents(sectionData)
                setStudents([])
            } else {
                // Load students for specific section
                const studentsResponse = await studentService.list({
                    class_id: selectedClassId,
                    section_id: selectedSectionId,
                    limit: 500
                })
                setStudents(studentsResponse.data || [])
                setSectionedStudents([])
            }

            setStep(2) // Go to preview step
        } catch (err) {
            setError('Failed to load students: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        // Generate clean HTML for printing (same approach as Expense Report)
        const printedOn = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Generate table rows
        const generateTableRows = (studentList) => {
            return studentList.map((student, index) => {
                const bg = index % 2 === 0 ? '#ffffff' : '#f0f4ff';
                return `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                    <td style="text-align:center;">${index + 1}</td>
                    <td style="text-align:center;">${student.roll_no || '-'}</td>
                    <td>${student.name}</td>
                    <td>${student.father_name || '-'}</td>
                    <td style="text-align:center;">${student.phone || '-'}</td>
                    <td style="text-align:right;">${student.individual_monthly_fee ? `Rs. ${student.individual_monthly_fee}` : '-'}</td>
                </tr>`;
            }).join('');
        };

        // Generate sections HTML
        let sectionsHtml = '';
        let totalStudents = 0;

        if (selectWholeClass && sectionedStudents.length > 0) {
            sectionedStudents.forEach((sectionData, index) => {
                totalStudents += sectionData.students.length;
                sectionsHtml += `
                    <div class="section-group" ${index > 0 ? 'style="page-break-before:always;"' : ''}>
                        <div class="section-header">
                            <h3>${selectedClass?.name} - ${sectionData.section.name}</h3>
                            <p>Total Students: ${sectionData.students.length}</p>
                        </div>
                        <table>
                            <colgroup>
                                <col class="sno"/><col class="rollno"/><col class="name"/>
                                <col class="father"/><col class="contact"/><col class="fee"/>
                            </colgroup>
                            <thead>
                                <tr>
                                    <th style="text-align:center;">Sr. No</th>
                                    <th style="text-align:center;">Roll No</th>
                                    <th>Student Name</th>
                                    <th>Father Name</th>
                                    <th style="text-align:center;">Contact</th>
                                    <th style="text-align:right;">Monthly Fee</th>
                                </tr>
                            </thead>
                            <tbody>${generateTableRows(sectionData.students)}</tbody>
                        </table>
                    </div>
                `;
            });
        } else {
            totalStudents = students.length;
            sectionsHtml = `
                <table>
                    <colgroup>
                        <col class="sno"/><col class="rollno"/><col class="name"/>
                        <col class="father"/><col class="contact"/><col class="fee"/>
                    </colgroup>
                    <thead>
                        <tr>
                            <th style="text-align:center;">Sr. No</th>
                            <th style="text-align:center;">Roll No</th>
                            <th>Student Name</th>
                            <th>Father Name</th>
                            <th style="text-align:center;">Contact</th>
                            <th style="text-align:right;">Monthly Fee</th>
                        </tr>
                    </thead>
                    <tbody>${generateTableRows(students)}</tbody>
                </table>
            `;
        }

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Student Directory - ${selectedClass?.name}</title>
    <style>
        @page { size: A4 portrait; margin: 1.2cm 0.8cm; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
        .school-name { text-align:center; font-size:11pt; font-weight:800; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.15rem; }
        .school-address { text-align:center; font-size:9pt; color:#555; margin-bottom:.3rem; }
        .report-title { text-align:center; font-size:14pt; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem; }
        .divider { border:none; border-top:2.5px solid #1e3a8a; margin-bottom:0; }
        .meta-bar { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; align-items:center; font-size:8pt; padding:.3rem .6rem; background:#e8edf8; border:1px solid #b5c3e8; border-top:none; margin-bottom:.5rem; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        .meta-bar strong { color:#1e3a8a; }
        .section-group { margin-bottom: 1rem; }
        .section-header { background:#e8edf8; padding:.3rem .6rem; border-left:4px solid #1e3a8a; margin-bottom:.3rem; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        .section-header h3 { font-size:10pt; font-weight:700; color:#1e3a8a; margin:0; }
        .section-header p { font-size:8pt; color:#555; margin:0; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:.5rem; }
        col.sno { width:7%; }
        col.rollno { width:10%; }
        col.name { width:25%; }
        col.father { width:25%; }
        col.contact { width:18%; }
        col.fee { width:15%; }
        th { background:#1e3a8a; color:#fff; font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:.03em; padding:.25rem .4rem; border:1px solid #1e3a8a; white-space:nowrap; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        td { padding:.2rem .4rem; border:.5px solid #c0c0c0; font-size:8.5pt; vertical-align:middle; line-height:1.2; }
        thead { display:table-header-group; }
        tr { page-break-inside:avoid; }
    </style>
</head>
<body>
    <div class="school-name">Muslim Public Higher Secondary School Lar</div>
    <div class="school-address">Bahawalpur Road, Adda Laar</div>
    <div class="report-title">Student Directory</div>
    <hr class="divider"/>
    <div class="meta-bar">
        <span><strong>Class:</strong> ${selectedClass?.name}</span>
        ${!selectWholeClass && selectedSection ? `<span><strong>Section:</strong> ${selectedSection.name}</span>` : ''}
        <span><strong>Total Students:</strong> ${totalStudents}</span>
        <span><strong>Printed On:</strong> ${printedOn}</span>
    </div>
    ${sectionsHtml}
</body>
</html>`;

        const popup = window.open('', '_blank', 'width=900,height=700');
        popup.document.write(html);
        popup.document.close();
        popup.focus();
        setTimeout(() => { popup.print(); popup.close(); }, 400);
    }

    const handleClose = () => {
        setStep(1)
        setSelectedClassId('')
        setSelectedSectionId('')
        setSelectWholeClass(false)
        setStudents([])
        setSectionedStudents([])
        setError('')
        onClose()
    }

    const selectedClass = classes.find(c => c.id == selectedClassId)
    const selectedSection = sections.find(s => s.id == selectedSectionId)

    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${step === 2 ? 'print-preview-modal' : 'print-modal'}`}>
                {step === 1 && (
                    <>
                        <div className="modal-header">
                            <h2>📋 Print Student List</h2>
                            <button className="close-btn" onClick={handleClose}>×</button>
                        </div>

                        <div className="modal-body">
                            {error && <div className="error-message">{error}</div>}

                            <div className="selection-section">
                                <div className="form-group">
                                    <label>Select Class *</label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        disabled={loading}
                                        className="form-select"
                                    >
                                        <option value="">Choose a class...</option>
                                        {/* Group classes by type */}
                                        <optgroup label="━━━━ School Classes ━━━━">
                                            {classes.filter(cls => cls.class_type === 'SCHOOL').map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="━━━━ College Classes ━━━━">
                                            {classes.filter(cls => cls.class_type === 'COLLEGE').map(cls => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                {selectedClassId && (
                                    <div className="form-group">
                                        <div className="checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectWholeClass}
                                                    onChange={(e) => setSelectWholeClass(e.target.checked)}
                                                />
                                                <span>Print entire class (all sections)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {selectedClassId && !selectWholeClass && (
                                    <div className="form-group">
                                        <label>Select Section *</label>
                                        <select
                                            value={selectedSectionId}
                                            onChange={(e) => setSelectedSectionId(e.target.value)}
                                            disabled={loading}
                                            className="form-select"
                                        >
                                            <option value="">Choose a section...</option>
                                            {sections.map(section => (
                                                <option key={section.id} value={section.id}>
                                                    {section.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedClassId && (
                                    <div className="selection-preview">
                                        <h4>📄 Print Preview:</h4>
                                        <p>
                                            <strong>Class:</strong> {selectedClass?.name}
                                        </p>
                                        {selectWholeClass ? (
                                            <p><strong>Sections:</strong> All sections will be printed</p>
                                        ) : selectedSection && (
                                            <p><strong>Section:</strong> {selectedSection.name}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="primary-btn"
                                onClick={loadStudentsForPrint}
                                disabled={loading || !selectedClassId || (!selectWholeClass && !selectedSectionId)}
                            >
                                {loading ? 'Loading...' : 'Continue to Print'}
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="modal-header no-print">
                            <h2>📋 Print Preview</h2>
                            <button className="close-btn" onClick={handleClose}>×</button>
                        </div>

                        <div className="print-preview-container">
                            <div className="print-content">
                            <div className="print-header">
                                <div className="school-info">
                                    <h1>Muslim Public Higher Secondary School</h1>
                                    <p>Bahawalpur Road, Adda Laar</p>
                                </div>
                                <div className="report-info">
                                    <h2>Student Directory</h2>
                                    <p>Class: {selectedClass?.name}</p>
                                    {!selectWholeClass && selectedSection && (
                                        <p>Section: {selectedSection.name}</p>
                                    )}
                                    <p>Printed on: {new Date().toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</p>
                                </div>
                            </div>

                            {selectWholeClass ? (
                                // Print all sections
                                sectionedStudents.map((sectionData, index) => (
                                    <div key={sectionData.section.id} className="section-group">
                                        <div className="section-header">
                                            <h3>{selectedClass?.name} - {sectionData.section.name}</h3>
                                            <p>Total Students: {sectionData.students.length}</p>
                                        </div>
                                        
                                        <div className="students-table">
                                            <table>
                                                <colgroup>
                                                    <col style={{ width: '8%' }} />
                                                    <col style={{ width: '10%' }} />
                                                    <col style={{ width: '27%' }} />
                                                    <col style={{ width: '27%' }} />
                                                    <col style={{ width: '16%' }} />
                                                    <col style={{ width: '12%' }} />
                                                </colgroup>
                                                <thead>
                                                    <tr>
                                                        <th>Sr. No</th>
                                                        <th>Roll No</th>
                                                        <th>Student Name</th>
                                                        <th>Father Name</th>
                                                        <th>Contact</th>
                                                        <th>Monthly Fee</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sectionData.students.map((student, studentIndex) => (
                                                        <tr key={student.id}>
                                                            <td>{studentIndex + 1}</td>
                                                            <td>{student.roll_no || '-'}</td>
                                                            <td>{student.name}</td>
                                                            <td>{student.father_name || '-'}</td>
                                                            <td>{student.phone || '-'}</td>
                                                            <td>{student.individual_monthly_fee ? `Rs. ${student.individual_monthly_fee}` : '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {index < sectionedStudents.length - 1 && <div className="page-break"></div>}
                                    </div>
                                ))
                            ) : (
                                // Print single section
                                <div className="section-group">
                                    <div className="students-table">
                                        <table>
                                            <colgroup>
                                                <col style={{ width: '8%' }} />
                                                <col style={{ width: '10%' }} />
                                                <col style={{ width: '27%' }} />
                                                <col style={{ width: '27%' }} />
                                                <col style={{ width: '16%' }} />
                                                <col style={{ width: '12%' }} />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th>Sr. No</th>
                                                    <th>Roll No</th>
                                                    <th>Student Name</th>
                                                    <th>Father Name</th>
                                                    <th>Contact</th>
                                                    <th>Monthly Fee</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((student, index) => (
                                                    <tr key={student.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{student.roll_no || '-'}</td>
                                                        <td>{student.name}</td>
                                                        <td>{student.father_name || '-'}</td>
                                                        <td>{student.phone || '-'}</td>
                                                        <td>{student.individual_monthly_fee ? `Rs. ${student.individual_monthly_fee}` : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="print-footer">
                                        <p>Total Students: {students.length}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer no-print">
                        <button className="cancel-btn" onClick={() => setStep(1)}>
                            ← Back
                        </button>
                        <button className="primary-btn" onClick={handlePrint}>
                            🖨️ Print
                        </button>
                    </div>
                </>
                )}
            </div>
        </div>
    )
}

export default PrintStudentsModal