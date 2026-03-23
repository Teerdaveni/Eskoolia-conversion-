"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type Paginated<T> = { count?: number; next?: string | null; previous?: string | null; results?: T[] };
type ApiList<T> = T[] | Paginated<T>;

type RoleOption = { id: number; name: string };
type ClassRow = { id: number; name?: string; class_name?: string };
type SectionRow = { id: number; school_class: number; name?: string; section_name?: string };
type CertificateTemplate = {
  id: number;
  title: string;
  type: "School" | "Lms";
  applicable_role_id?: number | null;
  body: string;
  background_height?: string | number;
  background_width?: string | number;
  padding_top?: string | number;
  padding_right?: string | number;
  padding_bottom?: string | number;
  pading_left?: string | number;
  background_url?: string;
};
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
type UserRoleRow = {
  id: number;
  user: number;
  role: number;
  user_name?: string;
  role_name?: string;
};

type Recipient = {
  id: number;
  label: string;
  admission_no?: string;
  roll_no?: string;
  className?: string;
  sectionName?: string;
  gender?: string;
  dateOfBirth?: string | null;
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

function toText(value: unknown) {
  return value == null ? "" : String(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mm(value: string | number | null | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function replacePlaceholders(body: string, recipient: Recipient) {
  const values: Record<string, string> = {
    student_name: recipient.label,
    name: recipient.label,
    admission_no: recipient.admission_no || "",
    roll_no: recipient.roll_no || "",
    class_name: recipient.className || "",
    section_name: recipient.sectionName || "",
    gender: recipient.gender || "",
    date_of_birth: recipient.dateOfBirth || "",
    today: new Date().toISOString().slice(0, 10),
  };

  let out = body;
  Object.entries(values).forEach(([key, value]) => {
    const brace = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    const bracket = new RegExp(`\\[\\s*${key}\\s*\\]`, "gi");
    out = out.replace(brace, value).replace(bracket, value);
  });
  return out;
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

export function GenerateCertificatePanel() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [roleId, setRoleId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [gridGap, setGridGap] = useState("14");

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
    const rid = Number(roleId);
    return templates.filter((t) => !t.applicable_role_id || t.applicable_role_id === rid);
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
          apiGet<ApiList<CertificateTemplate>>("/api/v1/admissions/certificate-templates/?page_size=100"),
          apiGet<ApiList<ClassRow>>("/api/v1/core/classes/?page_size=100"),
          apiGet<ApiList<SectionRow>>("/api/v1/core/sections/?page_size=200"),
        ]);
        setRoles(listData(roleData));
        setTemplates(listData(templateData));
        setClasses(listData(classData));
        setSections(listData(sectionData));
      } catch {
        setError("Unable to load generate certificate data.");
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

  const loadRecipients = async () => {
    if (!roleId) {
      setError("Select a role first.");
      return;
    }

    try {
      setSearching(true);
      setError("");
      setSuccess("");
      setSelectedIds([]);

      if (isStudentRole) {
        const allStudents = await fetchAllPages<StudentRow>("/api/v1/students/students/");
        const rows = allStudents
          .filter((student) => {
            if (classId && String(student.current_class || "") !== classId) return false;
            if (sectionId && String(student.current_section || "") !== sectionId) return false;
            return true;
          })
          .map((student) => {
            const label = `${toText(student.first_name)} ${toText(student.last_name)}`.trim() || `Student #${student.id}`;
            return {
              id: student.id,
              label,
              admission_no: student.admission_no || "",
              roll_no: student.roll_no || "",
              className: classNameById.get(student.current_class || -1) || "",
              sectionName: sectionNameById.get(student.current_section || -1) || "",
              gender: student.gender || "",
              dateOfBirth: student.date_of_birth || "",
            } satisfies Recipient;
          });
        setRecipients(rows);
        if (!rows.length) setSuccess("No student recipients found.");
      } else {
        const roleUsers = await fetchAllPages<UserRoleRow>(`/api/v1/access-control/user-roles/?role=${encodeURIComponent(roleId)}`);
        const rows = roleUsers.map((row) => ({
          id: row.user,
          label: row.user_name || `User #${row.user}`,
        }));
        setRecipients(rows);
        if (!rows.length) setSuccess("No recipients found for this role.");
      }
    } catch {
      setError("Unable to load recipients.");
    } finally {
      setSearching(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(recipients.map((r) => r.id));
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

  const printCertificates = () => {
    if (!selectedTemplate) {
      setError("Please select a certificate template.");
      return;
    }

    const targets = recipients.filter((r) => selectedIds.includes(r.id));
    if (!targets.length) {
      setError("Please select at least one recipient.");
      return;
    }

    const widthMm = mm(selectedTemplate.background_width, 165);
    const heightMm = mm(selectedTemplate.background_height, 144);
    const pt = mm(selectedTemplate.padding_top, 5);
    const pr = mm(selectedTemplate.padding_right, 5);
    const pb = mm(selectedTemplate.padding_bottom, 5);
    const pl = mm(selectedTemplate.pading_left, 5);
    const gapPx = Number(gridGap) > 0 ? Number(gridGap) : 14;

    const pages = targets
      .map((recipient) => {
        const bodyHtml = replacePlaceholders(selectedTemplate.body || "", recipient);
        return `
          <article class="certificate" style="background-image:url('${escapeHtml(selectedTemplate.background_url || "")}')">
            <div class="content">${bodyHtml}</div>
          </article>
        `;
      })
      .join("\n");

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Generate Certificate</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 14px; font-family: Arial, sans-serif; }
          .sheet { display: grid; grid-template-columns: repeat(auto-fill, minmax(${widthMm}mm, 1fr)); gap: ${gapPx}px; }
          .certificate {
            width: ${widthMm}mm;
            min-height: ${heightMm}mm;
            border: 1px solid #d1d5db;
            padding: ${pt}mm ${pr}mm ${pb}mm ${pl}mm;
            background-size: cover;
            background-position: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .content { font-size: 12px; color: #111827; line-height: 1.4; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">${pages}</div>
      </body>
      </html>
    `;

    const popup = window.open("", "_blank", "width=1200,height=850");
    if (!popup) {
      setError("Popup blocked. Allow popups to print certificates.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();

    setError("");
    setSuccess("Print view opened for selected certificates.");
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Generate Certificate</h1>
            <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span>Admin Section</span>
              <span>/</span>
              <span>Generate Certificate</span>
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
                <option value="">Select certificate *</option>
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
              <button type="button" onClick={() => void loadRecipients()} disabled={loading || searching} style={buttonStyle()}>
                {searching ? "Loading..." : "Search"}
              </button>
              <button type="button" onClick={printCertificates} style={buttonStyle("#0f766e")}>Print Selected</button>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Recipient List</h3>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={!!recipients.length && selectedIds.length === recipients.length}
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
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Name</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Admission</th>
                    <th style={{ padding: 8, borderBottom: "1px solid var(--line)", textAlign: "left" }}>Class/Section</th>
                  </tr>
                </thead>
                <tbody>
                  {!recipients.length ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 12, color: "var(--text-muted)" }}>
                        {loading ? "Loading..." : "No recipients loaded. Click Search."}
                      </td>
                    </tr>
                  ) : (
                    recipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(recipient.id)}
                            onChange={(e) => toggleOne(recipient.id, e.target.checked)}
                          />
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{recipient.label}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{recipient.admission_no || "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                          {recipient.className ? `${recipient.className} (${recipient.sectionName || "-"})` : "-"}
                        </td>
                      </tr>
                    ))
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
