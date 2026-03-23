"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type ApiList<T> = T[] | { results?: T[] };

type StudentRow = {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  gender?: "male" | "female" | "other";
  date_of_birth?: string | null;
  current_class?: number | null;
  current_section?: number | null;
  is_disabled: boolean;
  is_active: boolean;
};

type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

function buttonStyle() {
  return {
    height: 36,
    border: "1px solid #16a34a",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 8,
    padding: "0 14px",
    cursor: "pointer",
    fontSize: 13,
  } as const;
}

function boxStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 16,
  } as const;
}

function fullName(row: StudentRow) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function escapeCsvValue(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function StudentExportPanel() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentData, classData, sectionData] = await Promise.all([
          apiGet<ApiList<StudentRow>>("/api/v1/students/students/"),
          apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
          apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        ]);
        setStudents(listData(studentData));
        setClasses(listData(classData));
        setSections(listData(sectionData));
      } catch {
        setError("Unable to load students for export.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item.name])), [classes]);
  const sectionMap = useMemo(() => new Map(sections.map((item) => [item.id, item.name])), [sections]);

  const exportRows = useMemo(() => {
    return students.map((row, index) => {
      const className = classMap.get(row.current_class || 0) || "-";
      const sectionName = sectionMap.get(row.current_section || 0) || "-";
      return {
        sl: String(index + 1),
        admission_no: row.admission_no || "-",
        roll_no: row.roll_no || "-",
        name: fullName(row),
        class_section: `${className} (${sectionName})`,
        gender: row.gender || "-",
        date_of_birth: formatDate(row.date_of_birth) || "-",
        status: row.is_active ? (row.is_disabled ? "Disabled" : "Active") : "Inactive",
      };
    });
  }, [students, classMap, sectionMap]);

  const exportCsv = () => {
    if (!exportRows.length) {
      setError("No student data available to export.");
      setSuccess("");
      return;
    }

    const header = ["SL", "Admission No", "Roll No", "Name", "Class (Section)", "Gender", "Date Of Birth", "Status"];
    const lines = [
      header.map(escapeCsvValue).join(","),
      ...exportRows.map((row) =>
        [row.sl, row.admission_no, row.roll_no, row.name, row.class_section, row.gender, row.date_of_birth, row.status]
          .map((value) => escapeCsvValue(value))
          .join(","),
      ),
    ];

    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "all-students-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setError("");
    setSuccess("CSV exported successfully.");
  };

  const exportPdf = () => {
    if (!exportRows.length) {
      setError("No student data available to export.");
      setSuccess("");
      return;
    }

    const rowsHtml = exportRows
      .map(
        (row) => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.admission_no}</td>
            <td>${row.roll_no}</td>
            <td>${row.name}</td>
            <td>${row.class_section}</td>
            <td>${row.gender}</td>
            <td>${row.date_of_birth}</td>
            <td>${row.status}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>All Student Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h2>All Student Export</h2>
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Admission No</th>
              <th>Roll No</th>
              <th>Name</th>
              <th>Class (Section)</th>
              <th>Gender</th>
              <th>Date Of Birth</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    const popup = window.open("", "_blank", "width=1200,height=800");
    if (!popup) {
      setError("Popup blocked. Allow popups to export PDF.");
      setSuccess("");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();

    setError("");
    setSuccess("PDF export opened. Use Save as PDF in print dialog.");
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Student Export</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Student Information</span>
              <span>/</span>
              <span>Student Export</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>All Student Export</h3>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={exportCsv} style={buttonStyle()} disabled={loading}>
                Export To CSV
              </button>
              <button type="button" onClick={exportPdf} style={buttonStyle()} disabled={loading}>
                Export To PDF
              </button>
            </div>

            <p style={{ marginTop: 12, color: "var(--text-muted)" }}>
              {loading ? "Loading student data..." : `Total students ready for export: ${exportRows.length}`}
            </p>
            {error && <p style={{ marginTop: 8, color: "var(--warning)" }}>{error}</p>}
            {success && <p style={{ marginTop: 8, color: "#0f766e" }}>{success}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
