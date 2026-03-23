"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type Paginated<T> = { count?: number; next?: string | null; previous?: string | null; results?: T[] };
type ApiList<T> = T[] | Paginated<T>;

type RoleOption = { id: number; name: string };
type IdCardTemplate = {
  id: number;
  title: string;
  page_layout_style: "horizontal" | "vertical";
  applicable_role_ids: number[];
  pl_width?: string | number | null;
  pl_height?: string | number | null;
  background_url?: string;
  logo_url?: string;
  signature_url?: string;
};
type ClassRow = { id: number; name?: string; class_name?: string };
type SectionRow = { id: number; school_class: number; name?: string; section_name?: string };
type StudentRow = {
  id: number;
  admission_no?: string;
  roll_no?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  gender?: string;
  current_class?: number | null;
  current_section?: number | null;
};

function fieldStyle() {
  return {
    width: "100%",
    height: 36,
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "0 10px",
  } as const;
}

function buttonStyle(color = "var(--primary)") {
  return {
    height: 36,
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    borderRadius: 8,
    padding: "0 12px",
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

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toText(value: unknown) {
  return value == null ? "" : String(value);
}

function mm(value: string | number | null | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

async function fetchAllPages<T>(path: string, maxPages = 8): Promise<T[]> {
  let page = 1;
  let rows: T[] = [];
  while (page <= maxPages) {
    const joiner = path.includes("?") ? "&" : "?";
    const data = await apiGet<ApiList<T>>(`${path}${joiner}page=${page}&page_size=100`);
    if (Array.isArray(data)) return data;
    rows = rows.concat(data.results || []);
    if (!data.next) break;
    page += 1;
  }
  return rows;
}

export function GenerateIdCardPanel() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [templates, setTemplates] = useState<IdCardTemplate[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [roleId, setRoleId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [gridGap, setGridGap] = useState("12");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const selectedRole = useMemo(() => roles.find((r) => String(r.id) === roleId) || null, [roles, roleId]);
  const selectedTemplate = useMemo(() => templates.find((t) => String(t.id) === templateId) || null, [templates, templateId]);

  const isStudentRole = useMemo(() => {
    if (!selectedRole) return false;
    return selectedRole.name.toLowerCase().includes("student");
  }, [selectedRole]);

  const classNameById = useMemo(() => {
    return new Map(classes.map((c) => [c.id, c.class_name || c.name || `Class ${c.id}`]));
  }, [classes]);

  const sectionNameById = useMemo(() => {
    return new Map(sections.map((s) => [s.id, s.section_name || s.name || `Section ${s.id}`]));
  }, [sections]);

  const availableTemplates = useMemo(() => {
    if (!roleId) return templates;
    const selectedRoleId = Number(roleId);
    return templates.filter((t) => !t.applicable_role_ids?.length || t.applicable_role_ids.includes(selectedRoleId));
  }, [templates, roleId]);

  const filteredSections = useMemo(() => {
    if (!classId) return sections;
    return sections.filter((s) => String(s.school_class) === classId);
  }, [sections, classId]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const [roleData, templateData, classData, sectionData] = await Promise.all([
          apiGet<ApiList<RoleOption>>("/api/v1/access-control/roles/?page_size=100"),
          apiGet<ApiList<IdCardTemplate>>("/api/v1/admissions/id-card-templates/?page_size=100"),
          apiGet<ApiList<ClassRow>>("/api/v1/core/classes/?page_size=100"),
          apiGet<ApiList<SectionRow>>("/api/v1/core/sections/?page_size=200"),
        ]);
        setRoles(listData(roleData));
        setTemplates(listData(templateData));
        setClasses(listData(classData));
        setSections(listData(sectionData));
      } catch {
        setError("Unable to load generate ID card data.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    setTemplateId("");
  }, [roleId]);

  useEffect(() => {
    setSectionId("");
  }, [classId]);

  const searchStudents = async () => {
    try {
      setSearching(true);
      setError("");
      setSuccess("");
      const allStudents = await fetchAllPages<StudentRow>("/api/v1/students/students/");
      const rows = allStudents.filter((row) => {
        if (isStudentRole && classId && String(row.current_class || "") !== classId) return false;
        if (isStudentRole && sectionId && String(row.current_section || "") !== sectionId) return false;
        return true;
      });
      setStudents(rows);
      setSelectedIds([]);
      if (!rows.length) {
        setSuccess("No students found for selected criteria.");
      }
    } catch {
      setError("Unable to load students.");
    } finally {
      setSearching(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map((s) => s.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const printCards = () => {
    if (!selectedTemplate) {
      setError("Please select an ID card template.");
      return;
    }
    const targets = students.filter((s) => selectedIds.includes(s.id));
    if (!targets.length) {
      setError("Please select at least one student.");
      return;
    }

    const widthMm = mm(selectedTemplate.pl_width, selectedTemplate.page_layout_style === "horizontal" ? 85 : 55);
    const heightMm = mm(selectedTemplate.pl_height, selectedTemplate.page_layout_style === "horizontal" ? 54 : 85);
    const gapPx = Number(gridGap) > 0 ? Number(gridGap) : 12;

    const cardsHtml = targets
      .map((student) => {
        const fullName = `${toText(student.first_name)} ${toText(student.last_name)}`.trim() || `Student #${student.id}`;
        const className = classNameById.get(student.current_class || -1) || "-";
        const sectionName = sectionNameById.get(student.current_section || -1) || "-";
        const dob = student.date_of_birth ? toText(student.date_of_birth) : "-";
        const initials = fullName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("") || "S";

        return `
          <div class="id-card" style="background-image:url('${escapeHtml(selectedTemplate.background_url || "")}')">
            ${selectedTemplate.logo_url ? `<img class="logo" src="${escapeHtml(selectedTemplate.logo_url)}" alt="logo" />` : ""}
            <div class="photo">${escapeHtml(initials)}</div>
            <h4>${escapeHtml(fullName)}</h4>
            <p><strong>Admission:</strong> ${escapeHtml(toText(student.admission_no || "-"))}</p>
            <p><strong>Class:</strong> ${escapeHtml(className)} (${escapeHtml(sectionName)})</p>
            <p><strong>Roll:</strong> ${escapeHtml(toText(student.roll_no || "-"))}</p>
            <p><strong>Gender:</strong> ${escapeHtml(toText(student.gender || "-"))}</p>
            <p><strong>DOB:</strong> ${escapeHtml(dob)}</p>
            ${selectedTemplate.signature_url ? `<img class="sign" src="${escapeHtml(selectedTemplate.signature_url)}" alt="signature" />` : ""}
          </div>
        `;
      })
      .join("\n");

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Generate ID Card</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; padding: 14px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(${widthMm}mm, 1fr)); gap: ${gapPx}px; }
          .id-card {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px;
            background-size: cover;
            background-position: center;
            position: relative;
            overflow: hidden;
          }
          .logo { max-width: 22mm; max-height: 10mm; object-fit: contain; }
          .photo {
            width: 18mm;
            height: 18mm;
            border-radius: 999px;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #111827;
            margin-top: 4px;
          }
          h4 { margin: 6px 0; font-size: 13px; }
          p { margin: 2px 0; font-size: 10px; }
          .sign { position: absolute; right: 8px; bottom: 8px; max-width: 25mm; max-height: 10mm; object-fit: contain; }
          @media print {
            body { padding: 0; }
            .id-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="grid">${cardsHtml}</div>
      </body>
      </html>
    `;

    const popup = window.open("", "_blank", "width=1200,height=800");
    if (!popup) {
      setError("Popup blocked. Allow popups to print ID cards.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    setError("");
    setSuccess("Print view opened for selected ID cards.");
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Generate ID Card</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Generate ID Card</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_admin_visitor">
        <div className="container-fluid p-0" style={{ display: "grid", gap: 12 }}>
          <div className="white-box" style={boxStyle()}>
            <h3 style={{ marginTop: 0 }}>Select Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(140px, 1fr))", gap: 8 }}>
              <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={fieldStyle()}>
                <option value="">Select role *</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>

              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={fieldStyle()}>
                <option value="">Select ID card *</option>
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>

              {isStudentRole ? (
                <select value={classId} onChange={(e) => setClassId(e.target.value)} style={fieldStyle()}>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_name || c.name || `Class ${c.id}`}</option>
                  ))}
                </select>
              ) : (
                <input value="All classes" readOnly style={{ ...fieldStyle(), background: "#f9fafb" }} />
              )}

              {isStudentRole ? (
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                  <option value="">Select section</option>
                  {filteredSections.map((s) => (
                    <option key={s.id} value={s.id}>{s.section_name || s.name || `Section ${s.id}`}</option>
                  ))}
                </select>
              ) : (
                <input value="All sections" readOnly style={{ ...fieldStyle(), background: "#f9fafb" }} />
              )}

              <input type="number" min={0} value={gridGap} onChange={(e) => setGridGap(e.target.value)} placeholder="Grid gap (px)" style={fieldStyle()} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => void searchStudents()} disabled={loading || searching} style={buttonStyle()}>
                {searching ? "Loading..." : "Search"}
              </button>
              <button type="button" onClick={printCards} style={buttonStyle("#0f766e")}>Print Selected</button>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Student List</h3>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={!!students.length && selectedIds.length === students.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                Select all
              </label>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Select</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Admission</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Name</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Class/Section</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Gender</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>DOB</th>
                  </tr>
                </thead>
                <tbody>
                  {!students.length ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 12, color: "var(--text-muted)" }}>
                        {loading ? "Loading..." : "No students loaded. Click Search."}
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const checked = selectedIds.includes(student.id);
                      const className = classNameById.get(student.current_class || -1) || "-";
                      const sectionName = sectionNameById.get(student.current_section || -1) || "-";
                      const fullName = `${toText(student.first_name)} ${toText(student.last_name)}`.trim() || `Student #${student.id}`;

                      return (
                        <tr key={student.id}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                            <input type="checkbox" checked={checked} onChange={(e) => toggleOne(student.id, e.target.checked)} />
                          </td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.admission_no || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{fullName}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{className} ({sectionName})</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.gender || "-"}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{student.date_of_birth || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p style={{ color: "var(--warning)", margin: 0 }}>{error}</p>}
          {success && <p style={{ color: "#0f766e", margin: 0 }}>{success}</p>}
        </div>
      </section>
    </div>
  );
}
