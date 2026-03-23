"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

type AcademicYear = { id: number; name: string };
type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };

type UploadedContent = {
  id: number;
  academic_year_id?: number | null;
  class_id?: number | null;
  section_id?: number | null;
  content_title: string;
  content_type: "as" | "st" | "sy" | "ot";
  available_for_admin: boolean;
  available_for_all_classes: boolean;
  upload_date: string;
  description: string;
  source_url: string;
  upload_file: string;
};

type ContentType = "as" | "st" | "sy" | "ot";

type ApiList<T> = T[] | { results?: T[] };

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequestWithRefresh<T>(path, { headers: { "Content-Type": "application/json" } });
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return apiRequestWithRefresh<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDelete(path: string): Promise<void> {
  await apiRequestWithRefresh<void>(path, { method: "DELETE", headers: { "Content-Type": "application/json" } });
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
}

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function buttonStyle(color = "var(--primary)") {
  return { height: 36, padding: "0 12px", border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, cursor: "pointer" } as const;
}

function LegacyBreadcrumb({ title }: { title: string }) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span><span>/</span><span>Study Material</span><span>/</span><span>{title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function useLookups() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    const load = async () => {
      const [yearData, classData, sectionData] = await Promise.all([
        apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
      ]);
      setYears(listData(yearData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
    };
    void load();
  }, []);

  return { years, classes, sections };
}

const CONTENT_OPTIONS = [
  { value: "as", label: "Assignment" },
  { value: "st", label: "Study Material" },
  { value: "sy", label: "Syllabus" },
  { value: "ot", label: "Other Downloads" },
] as const;

function contentLabel(value: string) {
  return CONTENT_OPTIONS.find((item) => item.value === value)?.label || value;
}

export function UploadContentPagePanel() {
  const { years, classes, sections } = useLookups();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType>("as");
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadFile, setUploadFile] = useState("");
  const [forAdmin, setForAdmin] = useState(false);
  const [forAllClasses, setForAllClasses] = useState(false);

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((section) => section.school_class === Number(classId));
  }, [classId, sections]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!contentTitle.trim()) {
      setError("Content title is required.");
      return;
    }
    if (!forAllClasses && !classId) {
      setError("Class is required unless available for all classes.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await apiPost("/api/v1/academics/upload-contents/", {
        academic_year_id: academicYearId ? Number(academicYearId) : undefined,
        class_id: forAllClasses ? null : Number(classId),
        section_id: forAllClasses || !sectionId ? null : Number(sectionId),
        content_title: contentTitle.trim(),
        content_type: contentType,
        available_for_admin: forAdmin,
        available_for_all_classes: forAllClasses,
        upload_date: uploadDate,
        description: description.trim(),
        source_url: sourceUrl.trim(),
        upload_file: uploadFile.trim(),
      });
      setSuccess("Content uploaded successfully.");
      setContentTitle("");
      setDescription("");
      setSourceUrl("");
      setUploadFile("");
    } catch {
      setError("Unable to upload content.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Upload Content" />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <form onSubmit={submit} className="white-box" style={boxStyle()}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} style={fieldStyle()}>
                <option value="">Academic Year</option>
                {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
              </select>
              <select value={contentType} onChange={(e) => setContentType(e.target.value as "as" | "st" | "sy" | "ot")} style={fieldStyle()}>
                {CONTENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Content Title *" style={fieldStyle()} />

              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()} disabled={forAllClasses}>
                <option value="">Class</option>
                {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()} disabled={forAllClasses || !classId}>
                <option value="">Section</option>
                {filteredSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
              <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} style={fieldStyle()} />

              <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Source URL" style={fieldStyle()} />
              <input value={uploadFile} onChange={(e) => setUploadFile(e.target.value)} placeholder="Upload File URL/Path" style={fieldStyle()} />
            </div>

            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ width: "100%", minHeight: 100, border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginTop: 10 }} />

            <div style={{ marginTop: 10, display: "flex", gap: 20 }}>
              <label><input type="checkbox" checked={forAdmin} onChange={(e) => setForAdmin(e.target.checked)} /> Available For Admin</label>
              <label><input type="checkbox" checked={forAllClasses} onChange={(e) => setForAllClasses(e.target.checked)} /> Available For All Classes</label>
            </div>

            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
            {success && <p style={{ color: "#059669", marginTop: 8 }}>{success}</p>}

            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : "Save Content"}</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function ContentListPagePanel({ title, type, lockType }: { title: string; type: ContentType; lockType: boolean }) {
  const { classes, sections } = useLookups();
  const [items, setItems] = useState<UploadedContent[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UploadedContent | null>(null);
  const [viewing, setViewing] = useState<UploadedContent | null>(null);
  const [actionOpenId, setActionOpenId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [contentType, setContentType] = useState<"" | ContentType>(type);

  const filteredSections = useMemo(() => {
    if (!classId) return [];
    return sections.filter((section) => section.school_class === Number(classId));
  }, [classId, sections]);

  const loadItems = async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (classId) params.set("class_id", classId);
      if (sectionId) params.set("section_id", sectionId);
      if (lockType) {
        params.set("content_type", type);
      } else if (contentType) {
        params.set("content_type", contentType);
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const data = await apiGet<ApiList<UploadedContent>>(`/api/v1/academics/upload-contents/${suffix}`);
      setItems(listData(data));
    } catch {
      setError("Unable to load content list.");
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const removeItem = async (id: number) => {
    try {
      setActionOpenId(null);
      await apiDelete(`/api/v1/academics/upload-contents/${id}/`);
      await loadItems();
    } catch {
      setError("Unable to delete content.");
    }
  };

  const resolveUrl = (value: string) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/")) return value;
    return `/${value}`;
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      setSavingEdit(true);
      await apiPatch(`/api/v1/academics/upload-contents/${editing.id}/`, {
        content_title: editing.content_title,
        content_type: editing.content_type,
        upload_date: editing.upload_date,
        description: editing.description,
        source_url: editing.source_url,
        upload_file: editing.upload_file,
        available_for_admin: editing.available_for_admin,
        available_for_all_classes: editing.available_for_all_classes,
      });
      setEditing(null);
      setActionOpenId(null);
      await loadItems();
    } catch {
      setError("Unable to update content.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title={title} />
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Search Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: lockType ? "repeat(2, minmax(0, 1fr)) auto" : "repeat(4, minmax(0, 1fr)) auto", gap: 8 }}>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
                <option value="">All Classes</option>
                {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
              </select>
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
                <option value="">All Sections</option>
                {filteredSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
              {!lockType && (
                <select value={contentType} onChange={(e) => setContentType(e.target.value as "" | ContentType)} style={fieldStyle()}>
                  <option value="">All Types</option>
                  {CONTENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              )}
              <button type="button" onClick={() => void loadItems()} style={buttonStyle()}>Search</button>
            </div>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Title</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Upload Date</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Source</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>File</th>
                  <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.content_title}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{contentLabel(item.content_type)}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.upload_date}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.source_url || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.upload_file || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <button
                          type="button"
                          onClick={() => setActionOpenId((prev) => (prev === item.id ? null : item.id))}
                          style={buttonStyle("#334155")}
                        >
                          Actions
                        </button>
                        {actionOpenId === item.id && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: 40,
                              width: 150,
                              background: "#fff",
                              border: "1px solid var(--line)",
                              borderRadius: 8,
                              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                              zIndex: 20,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setViewing(item);
                                setActionOpenId(null);
                              }}
                              style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "10px 12px", cursor: "pointer" }}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(item);
                                setActionOpenId(null);
                              }}
                              style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "10px 12px", cursor: "pointer" }}
                            >
                              Edit
                            </button>
                            {resolveUrl(item.upload_file || item.source_url) && (
                              <a
                                href={resolveUrl(item.upload_file || item.source_url)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "block", padding: "10px 12px", textDecoration: "none", color: "inherit" }}
                              >
                                Download
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => void removeItem(item.id)}
                              style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "10px 12px", cursor: "pointer", color: "#b91c1c" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {viewing && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "grid", placeItems: "center", zIndex: 50 }}>
              <div className="white-box" style={{ ...boxStyle(), width: "min(720px, 92vw)" }}>
                <h3 style={{ marginTop: 0 }}>Content Details</h3>
                <p><strong>Title:</strong> {viewing.content_title}</p>
                <p><strong>Type:</strong> {contentLabel(viewing.content_type)}</p>
                <p><strong>Upload Date:</strong> {viewing.upload_date}</p>
                <p><strong>Description:</strong> {viewing.description || "-"}</p>
                <p><strong>Source:</strong> {viewing.source_url || "-"}</p>
                <p><strong>File:</strong> {viewing.upload_file || "-"}</p>
                <button type="button" onClick={() => setViewing(null)} style={buttonStyle("#6b7280")}>Close</button>
              </div>
            </div>
          )}

          {editing && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "grid", placeItems: "center", zIndex: 50 }}>
              <form onSubmit={saveEdit} className="white-box" style={{ ...boxStyle(), width: "min(860px, 94vw)" }}>
                <h3 style={{ marginTop: 0 }}>Edit Content</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <input value={editing.content_title} onChange={(e) => setEditing({ ...editing, content_title: e.target.value })} style={fieldStyle()} />
                  <select value={editing.content_type} onChange={(e) => setEditing({ ...editing, content_type: e.target.value as "as" | "st" | "sy" | "ot" })} style={fieldStyle()}>
                    {CONTENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <input type="date" value={editing.upload_date} onChange={(e) => setEditing({ ...editing, upload_date: e.target.value })} style={fieldStyle()} />
                  <input value={editing.source_url || ""} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} style={fieldStyle()} placeholder="Source URL" />
                  <input value={editing.upload_file || ""} onChange={(e) => setEditing({ ...editing, upload_file: e.target.value })} style={fieldStyle()} placeholder="Upload File URL/Path" />
                </div>
                <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={{ width: "100%", minHeight: 90, border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginTop: 10 }} />
                <div style={{ marginTop: 10, display: "flex", gap: 20 }}>
                  <label><input type="checkbox" checked={editing.available_for_admin} onChange={(e) => setEditing({ ...editing, available_for_admin: e.target.checked })} /> Available For Admin</label>
                  <label><input type="checkbox" checked={editing.available_for_all_classes} onChange={(e) => setEditing({ ...editing, available_for_all_classes: e.target.checked })} /> Available For All Classes</label>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button type="submit" disabled={savingEdit} style={buttonStyle()}>{savingEdit ? "Saving..." : "Update"}</button>
                  <button type="button" onClick={() => setEditing(null)} style={{ ...buttonStyle("#6b7280"), marginLeft: 6 }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {actionOpenId !== null && (
            <button
              type="button"
              onClick={() => setActionOpenId(null)}
              aria-label="Close action menu"
              style={{ position: "fixed", inset: 0, background: "transparent", border: 0, padding: 0, margin: 0, zIndex: 10 }}
            />
          )}
          <div style={{ position: "relative", zIndex: 12 }}>
            {/* Keeps table content above the outside-click overlay while menus stay open. */}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AssignmentListPagePanel() {
  return <ContentListPagePanel title="Assignment List" type="as" lockType={true} />;
}

export function StudyMaterialListPagePanel() {
  return <ContentListPagePanel title="Study Material List" type="st" lockType={true} />;
}

export function SyllabusListPagePanel() {
  return <ContentListPagePanel title="Syllabus List" type="sy" lockType={true} />;
}

export function OtherDownloadsListPagePanel() {
  return <ContentListPagePanel title="Other Downloads List" type="ot" lockType={true} />;
}
