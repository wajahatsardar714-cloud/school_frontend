// ============================================================
// PrintReport.jsx — Reusable Print Report Components
// Usage: Import PrintReportHeader, ReportTable, ReportActions
// ============================================================

import React from "react";

// ─────────────────────────────────────────────
// 1. REPORT ACTIONS BAR (Save CSV + Print)
// ─────────────────────────────────────────────
export function ReportActions({ onSave, onPrint, saveLabel = "Save CSV", printLabel = "Print Report" }) {
  return (
    <div className="rpt-actions">
      <button className="rpt-btn rpt-btn--save" onClick={onSave}>
        <SaveIcon /> {saveLabel}
      </button>
      <button className="rpt-btn rpt-btn--print" onClick={onPrint}>
        <PrintIcon /> {printLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. PRINT-ONLY HEADER BLOCK
// ─────────────────────────────────────────────
export function PrintReportHeader({ title, meta = [] }) {
  return (
    <div className="print-only print-header">
      <div className="print-header__title-section">
        <h1 className="school-name">Muslim Public Higher Secondary School Lar</h1>
        <h2 className="report-title">{title}</h2>
      </div>
      <div className="print-header__divider" />
      <div className="print-header__meta">
        {meta.map((item, i) => (
          <div key={i} className="print-header__meta-item">
            <span className="print-header__meta-label">{item.label}:</span>
            <span className="print-header__meta-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. REUSABLE DATA TABLE
// ─────────────────────────────────────────────
// columns: [{ key, label, printHide, printWidth, printAlign }]
// rows: array of objects keyed by col.key (plus optional `id`)
// footerCells: [{ colSpan, content, align }]
export function ReportTable({ columns, rows, footerCells }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <colgroup>
          {columns.map((col) =>
            col.printHide ? null : (
              <col
                key={col.key}
                style={{ width: col.printWidth || "auto" }}
              />
            )
          )}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.printHide ? "no-print" : ""}
                style={col.printAlign ? { textAlign: col.printAlign } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.printHide ? "no-print" : ""}
                  style={col.printAlign ? { textAlign: col.printAlign } : undefined}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footerCells && (
          <tfoot className="print-show">
            <tr>
              {footerCells.map((cell, i) => (
                <td
                  key={i}
                  colSpan={cell.colSpan}
                  style={{
                    textAlign: cell.align || "center",
                    fontWeight: "700",
                  }}
                >
                  {cell.content}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// INLINE SVG ICONS
// ─────────────────────────────────────────────
function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}
function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/><circle cx="18" cy="11.5" r="0.5" fill="currentColor"/>
    </svg>
  );
}
