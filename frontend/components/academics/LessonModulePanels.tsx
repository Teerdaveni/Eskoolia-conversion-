"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from "@/lib/auth";

type AcademicYear = { id: number; name: string; is_current: boolean };
type SchoolClass = { id: number; name: string };
type Section = { id: number; school_class: number; name: string };
type Subject = { id: number; name: string };
type ClassPeriod = { id: number; period: string; start_time: string; end_time: string; period_type: string; is_break: boolean };

type Lesson = {
  id: number;
  academic_year_id?: number | null;
  class_id?: number;
  section_id?: number | null;
  subject_id?: number;
  lesson_title: string;
};

type LessonTopicDetail = {
  id: number;
  topic: number;
  lesson: number;
  topic_title: string;
};

type LessonTopicGroup = {
  id: number;
  class_id?: number;
  section_id?: number;
  subject_id?: number;
  lesson_id?: number;
  topics?: LessonTopicDetail[];
};

type PlannerTopicRow = { id: number; topic_id: number; sub_topic_title: string };

type PlannerRow = {
  id: number;
  lesson_date: string;
  day: number | null;
  lesson_detail_id: number;
  topic_detail_id: number | null;
  sub_topic: string;
  teacher_id: number | null;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  routine_id: number | null;
  class_period_id?: number | null;
  academic_year_id?: number | null;
  topics: PlannerTopicRow[];
};

type TeacherOption = {
  id: number;
  username: string;
  full_name: string;
};

type LessonGroup = {
  class_id: number;
  section_id: number | null;
  subject_id: number;
  items: Lesson[];
};

type WeeklyPlanner = {
  start_date: string;
  end_date: string;
  days: Record<string, PlannerRow[]>;
};

type ApiList<T> = T[] | { results?: T[] };

type ApiErrorPayload = {
  success?: boolean;
  message?: string;
  detail?: string;
  errors?: Record<string, unknown>;
};

class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || payload.detail || `Request failed with status ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

async function readJsonResponse(response: Response): Promise<ApiErrorPayload | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiErrorPayload;
  } catch {
    return { message: text };
  }
}

function toFieldErrors(errors: Record<string, unknown> | undefined): Record<string, string> {
  if (!errors) return {};
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "string") {
        fieldErrors[key] = first;
      }
    } else if (typeof value === "string") {
      fieldErrors[key] = value;
    }
  }
  return fieldErrors;
}

function getApiError(error: unknown): { message: string; fieldErrors: Record<string, string> } {
  if (error instanceof ApiError) {
    return {
      message: error.payload.message || error.payload.detail || error.message,
      fieldErrors: toFieldErrors(error.payload.errors),
    };
  }
  if (error instanceof Error) {
    return { message: error.message, fieldErrors: {} };
  }
  return { message: "Request failed.", fieldErrors: {} };
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearAuthTokens();
    return null;
  }

  const data = (await res.json()) as { access?: string };
  if (!data.access) {
    clearAuthTokens();
    return null;
  }

  setAuthTokens(data.access, refresh);
  return data.access;
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiGet<T>(path: string): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", headers: authHeaders() });
  
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", headers: authHeaders() });
    }
  }
  
  if (!response.ok) {
    const payload = await readJsonResponse(response);
    throw new ApiError(response.status, payload || {});
  }
  return (await response.json()) as T;
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
    }
  }
  
  if (!response.ok) {
    const payload = await readJsonResponse(response);
    throw new ApiError(response.status, payload || {});
  }
  return (await response.json()) as T;
}

async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
    }
  }
  
  if (!response.ok) {
    const payload = await readJsonResponse(response);
    throw new ApiError(response.status, payload || {});
  }
  return (await response.json()) as T;
}

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
    }
  }
  
  if (!response.ok) {
    const payload = await readJsonResponse(response);
    throw new ApiError(response.status, payload || {});
  }
  return (await response.json()) as T;
}

async function apiDelete(path: string): Promise<void> {
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    }
  }
  
  if (!response.ok) {
    const payload = await readJsonResponse(response);
    throw new ApiError(response.status, payload || {});
  }
}

function listData<T>(value: ApiList<T>): T[] {
  return Array.isArray(value) ? value : value.results || [];
}

function useAcademicLookups() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const load = async () => {
      const [yearData, classData, sectionData, subjectData] = await Promise.all([
        apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
        apiGet<ApiList<SchoolClass>>("/api/v1/core/classes/"),
        apiGet<ApiList<Section>>("/api/v1/core/sections/"),
        apiGet<ApiList<Subject>>("/api/v1/core/subjects/"),
      ]);
      setYears(listData(yearData));
      setClasses(listData(classData));
      setSections(listData(sectionData));
      setSubjects(listData(subjectData));
    };
    void load();
  }, []);

  return { years, classes, sections, subjects };
}

function boxStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: 16,
  } as const;
}

function fieldStyle() {
  return {
    width: "100%",
    height: 36,
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "0 10px",
  } as const;
}

function buttonStyle() {
  return {
    height: 36,
    padding: "0 12px",
    border: "1px solid var(--primary)",
    background: "var(--primary)",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
  } as const;
}

function LegacyBreadcrumb({ title, moduleLabel, pageLabel }: { title: string; moduleLabel: string; pageLabel: string }) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div className="row justify-content-between" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div className="bc-pages" style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span>
            <span>/</span>
            <span>{moduleLabel}</span>
            <span>/</span>
            <span>{pageLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegacyPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="admin-visitor-area up_st_admin_visitor">
      <div className="container-fluid p-0">{children}</div>
    </section>
  );
}

export function LessonPagePanel() {
  const { years, classes, sections, subjects } = useAcademicLookups();
  const [items, setItems] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<LessonGroup[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [lessonText, setLessonText] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const filteredSections = useMemo(() => {
    const id = Number(classId);
    if (!id) return [];
    return sections.filter((section) => section.school_class === id);
  }, [classId, sections]);

  const loadLessons = async () => {
    const query = classId ? `?class_id=${classId}` : "";
    const data = await apiGet<ApiList<Lesson>>(`/api/v1/academics/lessons/${query}`);
    setItems(listData(data));
  };

  const loadGroups = async () => {
    const data = await apiGet<LessonGroup[]>("/api/v1/academics/lessons/grouped/");
    setGroups(data);
  };

  useEffect(() => {
    void loadLessons();
    void loadGroups();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const lessonLines = lessonText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!classId || !sectionId || !subjectId || lessonLines.length === 0) {
      setError("Class, section, subject and at least one lesson title are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await apiPost("/api/v1/academics/lessons/", {
        academic_year_id: academicYearId ? Number(academicYearId) : undefined,
        class_id: Number(classId),
        section_id: Number(sectionId),
        subject_id: Number(subjectId),
        lesson: lessonLines,
      });
      setLessonText("");
      await Promise.all([loadLessons(), loadGroups()]);
    } catch {
      setError("Unable to save lesson rows.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: Lesson) => {
    setEditingId(item.id);
    setEditingTitle(item.lesson_title);
  };

  const saveEdit = async (item: Lesson) => {
    if (!editingTitle.trim()) return;
    try {
      await apiPut(`/api/v1/academics/lessons/${item.id}/`, {
        academic_year_id: item.academic_year_id,
        class_id: item.class_id,
        section_id: item.section_id,
        subject_id: item.subject_id,
        lesson_title: editingTitle.trim(),
      });
      setEditingId(null);
      setEditingTitle("");
      await Promise.all([loadLessons(), loadGroups()]);
    } catch {
      setError("Unable to update lesson row.");
    }
  };

  const deleteLesson = async (id: number) => {
    try {
      await apiDelete(`/api/v1/academics/lessons/${id}/`);
      await Promise.all([loadLessons(), loadGroups()]);
    } catch {
      setError("Unable to delete lesson row.");
    }
  };

  const deleteGroup = async () => {
    if (!classId || !sectionId || !subjectId) {
      setError("Select class, section and subject before group delete.");
      return;
    }
    try {
      await apiDelete(`/api/v1/academics/lessons/delete-group/?class_id=${classId}&section_id=${sectionId}&subject_id=${subjectId}`);
      await Promise.all([loadLessons(), loadGroups()]);
    } catch {
      setError("Unable to delete lesson group.");
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Add Lesson" moduleLabel="Lesson" pageLabel="Add Lesson" />
      <LegacyPageFrame>
      <div style={{ marginBottom: 14, color: "var(--text-muted)", fontSize: 13 }}>Grouped create, row edit/delete, and group delete flow matching the PHP lesson screen.</div>

      <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} style={fieldStyle()}>
            <option value="">Academic year (optional)</option>
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={fieldStyle()}>
            <option value="">Class</option>
            {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={fieldStyle()}>
            <option value="">Section</option>
            {filteredSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={fieldStyle()}>
            <option value="">Subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>

          <textarea
            value={lessonText}
            onChange={(e) => setLessonText(e.target.value)}
            rows={4}
            placeholder="One lesson title per line"
            style={{ gridColumn: "1 / -1", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }}
          />

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between" }}>
            <button type="button" onClick={deleteGroup} style={{ ...buttonStyle(), background: "#dc2626", borderColor: "#dc2626" }}>
              Delete Selected Group
            </button>
            <button type="submit" disabled={saving} style={buttonStyle()}>{saving ? "Saving..." : "Save Lessons"}</button>
          </div>
        </form>
        {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
      </div>

      <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Lesson Rows</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>ID</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Lesson Title</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 80 }}>{item.id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                  {editingId === item.id ? (
                    <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} style={{ ...fieldStyle(), height: 32 }} />
                  ) : (
                    item.lesson_title
                  )}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 220 }}>
                  {editingId === item.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => void saveEdit(item)} style={buttonStyle()}>Save</button>
                      <button type="button" onClick={() => setEditingId(null)} style={{ ...buttonStyle(), background: "#6b7280", borderColor: "#6b7280" }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => startEdit(item)} style={buttonStyle()}>Edit</button>
                      <button type="button" onClick={() => void deleteLesson(item.id)} style={{ ...buttonStyle(), background: "#dc2626", borderColor: "#dc2626" }}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 8, color: "var(--text-muted)" }}>No lessons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="white-box" style={boxStyle()}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Lesson Group Report</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Subject</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Lesson Titles</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <tr key={`${group.class_id}-${group.section_id}-${group.subject_id}-${index}`}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{group.class_id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{group.section_id ?? "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{group.subject_id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{group.items.map((row) => row.lesson_title).join(", ")}</td>
              </tr>
            ))}
            {groups.length === 0 && <tr><td colSpan={4} style={{ padding: 8, color: "var(--text-muted)" }}>No grouped lessons.</td></tr>}
          </tbody>
        </table>
      </div>
      </LegacyPageFrame>
    </div>
  );
}

export function TopicPagePanel() {
  const { years, classes, sections, subjects } = useAcademicLookups();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topicGroups, setTopicGroups] = useState<LessonTopicGroup[]>([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [topicText, setTopicText] = useState("");

  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");

  const filteredSections = useMemo(() => {
    const id = Number(classId);
    if (!id) return [];
    return sections.filter((section) => section.school_class === id);
  }, [classId, sections]);

  const loadLessons = async () => {
    const data = await apiGet<ApiList<Lesson>>("/api/v1/academics/lessons/");
    setLessons(listData(data));
  };

  const loadTopicGroups = async () => {
    const data = await apiGet<ApiList<LessonTopicGroup>>("/api/v1/academics/lesson-topics/");
    setTopicGroups(listData(data));
  };

  useEffect(() => {
    void loadLessons();
    void loadTopicGroups();
  }, []);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (classId && Number(classId) !== (lesson.class_id || 0)) return false;
      if (sectionId && Number(sectionId) !== (lesson.section_id || 0)) return false;
      if (subjectId && Number(subjectId) !== (lesson.subject_id || 0)) return false;
      return true;
    });
  }, [lessons, classId, sectionId, subjectId]);

  const topicLines = useMemo(
    () => topicText.split("\n").map((line) => line.trim()).filter(Boolean),
    [topicText],
  );

  const isTopicFormValid = Boolean(classId && sectionId && subjectId && lessonId && topicLines.length > 0 && !saving);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    if (!classId || !sectionId || !subjectId || !lessonId || topicLines.length === 0) {
      setError("Class, section, subject, lesson and topics are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await apiPost("/api/v1/academics/lesson-topics/", {
        academic_year_id: academicYearId ? Number(academicYearId) : undefined,
        class_id: Number(classId),
        section_id: Number(sectionId),
        subject_id: Number(subjectId),
        lesson_id: Number(lessonId),
        topic: topicLines,
      });
      setTopicText("");
      setFieldErrors({});
      await loadTopicGroups();
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message || "Unable to save topics.");
      setFieldErrors(apiError.fieldErrors);
    } finally {
      setSaving(false);
    }
  };

  const startEditTopic = (topic: LessonTopicDetail) => {
    setEditingTopicId(topic.id);
    setEditingTopicTitle(topic.topic_title);
  };

  const saveTopicTitle = async () => {
    if (!editingTopicId || !editingTopicTitle.trim()) return;
    try {
      await apiPatch(`/api/v1/academics/lesson-topic-details/${editingTopicId}/`, { topic_title: editingTopicTitle.trim() });
      setEditingTopicId(null);
      setEditingTopicTitle("");
      await loadTopicGroups();
    } catch {
      setError("Unable to update topic title.");
    }
  };

  const deleteTopicDetail = async (topicId: number) => {
    try {
      await apiDelete(`/api/v1/academics/lesson-topic-details/${topicId}/`);
      await loadTopicGroups();
    } catch {
      setError("Unable to delete topic detail.");
    }
  };

  const deleteTopicGroup = async (groupId: number) => {
    try {
      await apiDelete(`/api/v1/academics/lesson-topics/delete-group/?id=${groupId}`);
      await loadTopicGroups();
    } catch {
      setError("Unable to delete topic group.");
    }
  };

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Add Topic" moduleLabel="Lesson Plan" pageLabel="Topic" />
      <LegacyPageFrame>
      <div style={{ marginBottom: 14, color: "var(--text-muted)", fontSize: 13 }}>Topic group create, topic-title edit, and group delete flow aligned with PHP behavior.</div>

      <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
          <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.academic_year_id ? "#dc2626" : undefined }}>
            <option value="">Academic year (optional)</option>
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={{ ...fieldStyle(), borderColor: fieldErrors.class_id ? "#dc2626" : undefined }}>
            <option value="">Class</option>
            {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.section_id ? "#dc2626" : undefined }}>
            <option value="">Section</option>
            {filteredSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.subject_id ? "#dc2626" : undefined }}>
            <option value="">Subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.lesson_id ? "#dc2626" : undefined }}>
            <option value="">Lesson</option>
            {filteredLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.lesson_title}</option>)}
          </select>

          <textarea
            value={topicText}
            onChange={(e) => setTopicText(e.target.value)}
            rows={4}
            placeholder="One topic title per line"
            style={{ gridColumn: "1 / -1", border: `1px solid ${fieldErrors.topic ? "#dc2626" : "var(--line)"}`, borderRadius: 8, padding: "8px 10px" }}
          />
          {fieldErrors.class_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Class: {fieldErrors.class_id}</div>}
          {fieldErrors.section_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Section: {fieldErrors.section_id}</div>}
          {fieldErrors.subject_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Subject: {fieldErrors.subject_id}</div>}
          {fieldErrors.lesson_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Lesson: {fieldErrors.lesson_id}</div>}
          {fieldErrors.topic && <div style={{ color: "#dc2626", fontSize: 12, gridColumn: "1 / -1" }}>Topics: {fieldErrors.topic}</div>}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={!isTopicFormValid} style={{ ...buttonStyle(), opacity: isTopicFormValid ? 1 : 0.6, cursor: isTopicFormValid ? "pointer" : "not-allowed" }}>{saving ? "Saving..." : "Save Topics"}</button>
          </div>
        </form>
        {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
      </div>

      <div className="white-box" style={boxStyle()}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Topic Groups</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Group ID</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Topics</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {topicGroups.map((group) => (
              <tr key={group.id}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 80 }}>{group.id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(group.topics || []).map((topic) => (
                      <div key={topic.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {editingTopicId === topic.id ? (
                          <>
                            <input value={editingTopicTitle} onChange={(e) => setEditingTopicTitle(e.target.value)} style={{ ...fieldStyle(), height: 30 }} />
                            <button type="button" onClick={() => void saveTopicTitle()} style={buttonStyle()}>Save</button>
                            <button type="button" onClick={() => setEditingTopicId(null)} style={{ ...buttonStyle(), background: "#6b7280", borderColor: "#6b7280" }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <span>{topic.topic_title}</span>
                            <button type="button" onClick={() => startEditTopic(topic)} style={buttonStyle()}>Edit</button>
                            <button type="button" onClick={() => void deleteTopicDetail(topic.id)} style={{ ...buttonStyle(), background: "#dc2626", borderColor: "#dc2626" }}>Delete</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 160 }}>
                  <button type="button" onClick={() => void deleteTopicGroup(group.id)} style={{ ...buttonStyle(), background: "#dc2626", borderColor: "#dc2626" }}>
                    Delete Group
                  </button>
                </td>
              </tr>
            ))}
            {topicGroups.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 8, color: "var(--text-muted)" }}>No topic groups yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </LegacyPageFrame>
    </div>
  );
}

export function LessonPlannerPagePanel() {
  const { years, classes, sections, subjects } = useAcademicLookups();
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topicDetails, setTopicDetails] = useState<LessonTopicDetail[]>([]);
  const [items, setItems] = useState<PlannerRow[]>([]);
  const [overviewItems, setOverviewItems] = useState<PlannerRow[]>([]);
  const [weekly, setWeekly] = useState<WeeklyPlanner | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [academicYearId, setAcademicYearId] = useState("");
  const [day, setDay] = useState("1");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [classPeriodId, setClassPeriodId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subTopic, setSubTopic] = useState("");

  const [customizeMode, setCustomizeMode] = useState(false);
  const [customTopicIds, setCustomTopicIds] = useState("");
  const [customSubTopics, setCustomSubTopics] = useState("");

  const [editingPlannerId, setEditingPlannerId] = useState<number | null>(null);
  const [weeklyStartDate, setWeeklyStartDate] = useState("");

  const filteredSections = useMemo(() => {
    const id = Number(classId);
    if (!id) return [];
    return sections.filter((section) => section.school_class === id);
  }, [classId, sections]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (classId && Number(classId) !== (lesson.class_id || 0)) return false;
      if (sectionId && Number(sectionId) !== (lesson.section_id || 0)) return false;
      if (subjectId && Number(subjectId) !== (lesson.subject_id || 0)) return false;
      return true;
    });
  }, [lessons, classId, sectionId, subjectId]);

  const filteredTopicDetails = useMemo(() => {
    if (!lessonId) return [];
    const selectedLessonId = Number(lessonId);
    return topicDetails.filter((topic) => topic.lesson === selectedLessonId);
  }, [lessonId, topicDetails]);

  const plannerTopicLines = useMemo(() => customTopicIds.split(",").map((value) => value.trim()).filter(Boolean), [customTopicIds]);
  const plannerSubTopicLines = useMemo(() => customSubTopics.split("\n").map((value) => value.trim()), [customSubTopics]);
  const isPlannerFormValid = Boolean(classId && sectionId && subjectId && lessonId && lessonDate && !saving && (customizeMode ? plannerTopicLines.length > 0 : topicId));

  const loadLessons = async () => {
    const data = await apiGet<ApiList<Lesson>>("/api/v1/academics/lessons/");
    setLessons(listData(data));
  };

  const loadTeachers = async () => {
    const data = await apiGet<TeacherOption[]>("/api/v1/academics/lesson-planners/teachers/");
    setTeachers(data);
  };

  const loadClassPeriods = async () => {
    const data = await apiGet<ApiList<ClassPeriod>>("/api/v1/core/class-periods/?period_type=class");
    setClassPeriods(listData(data));
  };

  const loadTopicDetails = async () => {
    const data = await apiGet<ApiList<LessonTopicDetail>>("/api/v1/academics/lesson-topic-details/");
    setTopicDetails(listData(data));
  };

  const loadPlanners = async () => {
    const data = await apiGet<ApiList<PlannerRow>>("/api/v1/academics/lesson-planners/");
    setItems(listData(data));
  };

  const loadOverview = async () => {
    const data = await apiGet<PlannerRow[]>("/api/v1/academics/lesson-planners/overview/");
    setOverviewItems(data);
  };

  const loadWeekly = async () => {
    const query = new URLSearchParams();
    if (teacherId) query.append("teacher_id", teacherId);
    if (weeklyStartDate) query.append("start_date", weeklyStartDate);
    const data = await apiGet<WeeklyPlanner>(`/api/v1/academics/lesson-planners/weekly/?${query.toString()}`);
    setWeekly(data);
  };

  useEffect(() => {
    void Promise.all([loadTeachers(), loadClassPeriods(), loadLessons(), loadTopicDetails(), loadPlanners(), loadOverview(), loadWeekly()]);
  }, []);

  const resetPlannerForm = () => {
    setEditingPlannerId(null);
    setCustomizeMode(false);
    setFieldErrors({});
    setClassPeriodId("");
    setTopicId("");
    setSubTopic("");
    setCustomTopicIds("");
    setCustomSubTopics("");
  };

  const fillPlannerForm = (row: PlannerRow) => {
    setEditingPlannerId(row.id);
    setAcademicYearId(row.academic_year_id ? String(row.academic_year_id) : "");
    setDay(row.day ? String(row.day) : "1");
    setClassId(String(row.class_id));
    setSectionId(row.section_id ? String(row.section_id) : "");
    setSubjectId(String(row.subject_id));
    setLessonId(String(row.lesson_detail_id));
    setLessonDate(row.lesson_date);
    setClassPeriodId(row.class_period_id ? String(row.class_period_id) : "");
    setTeacherId(row.teacher_id ? String(row.teacher_id) : "");

    if (row.topics && row.topics.length > 0) {
      setCustomizeMode(true);
      setCustomTopicIds(row.topics.map((topic) => String(topic.topic_id)).join(","));
      setCustomSubTopics(row.topics.map((topic) => topic.sub_topic_title).join("\n"));
      setTopicId("");
      setSubTopic("");
    } else {
      setCustomizeMode(false);
      setTopicId(row.topic_detail_id ? String(row.topic_detail_id) : "");
      setSubTopic(row.sub_topic || "");
      setCustomTopicIds("");
      setCustomSubTopics("");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    if (!classId || !sectionId || !subjectId || !lessonId || !lessonDate) {
      setError("Class, section, subject, lesson and lesson date are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: Record<string, unknown> = {
        academic_year_id: academicYearId ? Number(academicYearId) : undefined,
        day: Number(day),
        lesson: Number(lessonId),
        teacher_id: teacherId ? Number(teacherId) : undefined,
        subject_id: Number(subjectId),
        class_id: Number(classId),
        section_id: Number(sectionId),
        lesson_date: lessonDate,
        class_period_id: classPeriodId ? Number(classPeriodId) : undefined,
      };

      if (customizeMode) {
        payload.customize = "customize";
        payload.topic = plannerTopicLines.map((value) => Number(value)).filter((value) => !Number.isNaN(value) && value > 0);
        payload.sub_topic = plannerSubTopicLines;
      } else {
        payload.topic = Number(topicId);
        payload.sub_topic = subTopic;
      }

      if (editingPlannerId) {
        await apiPut(`/api/v1/academics/lesson-planners/${editingPlannerId}/`, payload);
      } else {
        await apiPost("/api/v1/academics/lesson-planners/", payload);
      }

      resetPlannerForm();
      await Promise.all([loadPlanners(), loadOverview(), loadWeekly()]);
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message || "Unable to save lesson planner row.");
      setFieldErrors(apiError.fieldErrors);
    } finally {
      setSaving(false);
    }
  };

  const deletePlanner = async (id: number) => {
    try {
      await apiDelete(`/api/v1/academics/lesson-planners/${id}/`);
      await Promise.all([loadPlanners(), loadOverview(), loadWeekly()]);
    } catch {
      setError("Unable to delete planner row.");
    }
  };

  const weeklyDays = weekly ? Object.keys(weekly.days).sort() : [];
  const teacherNameById = new Map(teachers.map((teacher) => [teacher.id, teacher.full_name]));
  const periodNameById = new Map(classPeriods.map((period) => [period.id, `${period.period} (${period.start_time}-${period.end_time})`]));
  const weeklyRows = classPeriods.length > 0
    ? classPeriods.map((period) => ({ key: `period-${period.id}`, label: `${period.period} (${period.start_time}-${period.end_time})`, periodId: period.id }))
    : Array.from({ length: Math.max(weeklyDays.reduce((maxRows, dayKey) => Math.max(maxRows, (weekly?.days[dayKey] || []).length), 0), 1) }).map((_, index) => ({
        key: `row-${index}`,
        label: `Row ${index + 1}`,
        periodId: null as number | null,
      }));

  return (
    <div className="legacy-panel">
      <LegacyBreadcrumb title="Lesson Plan Create" moduleLabel="Lesson Plan" pageLabel="Lesson Plan Create" />
      <LegacyPageFrame>
      <div style={{ marginBottom: 14, color: "var(--text-muted)", fontSize: 13 }}>Planner create/update/delete plus weekly and overview reports in the same legacy flow.</div>

      <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.academic_year_id ? "#dc2626" : undefined }}>
            <option value="">Academic year (optional)</option>
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <input value={day} onChange={(e) => setDay(e.target.value)} type="number" min={1} max={7} placeholder="Day ID" style={{ ...fieldStyle(), borderColor: fieldErrors.day ? "#dc2626" : undefined }} />
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.teacher_id ? "#dc2626" : undefined }}>
            <option value="">Select teacher</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
          </select>
          <select value={classPeriodId} onChange={(e) => setClassPeriodId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.class_period_id ? "#dc2626" : undefined }}>
            <option value="">Select period</option>
            {classPeriods.map((period) => <option key={period.id} value={period.id}>{period.period} ({period.start_time} - {period.end_time})</option>)}
          </select>

          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} style={{ ...fieldStyle(), borderColor: fieldErrors.class_id ? "#dc2626" : undefined }}>
            <option value="">Class</option>
            {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
          </select>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.section_id ? "#dc2626" : undefined }}>
            <option value="">Section</option>
            {filteredSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.subject_id ? "#dc2626" : undefined }}>
            <option value="">Subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.lesson ? "#dc2626" : undefined }}>
            <option value="">Lesson</option>
            {filteredLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.lesson_title}</option>)}
          </select>

          <input value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} type="date" style={{ ...fieldStyle(), borderColor: fieldErrors.lesson_date ? "#dc2626" : undefined }} />

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={customizeMode} onChange={(e) => setCustomizeMode(e.target.checked)} />
            Customize mode
          </label>

          {!customizeMode && (
            <>
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} style={{ ...fieldStyle(), borderColor: fieldErrors.topic ? "#dc2626" : undefined }}>
                <option value="">Topic detail</option>
                {filteredTopicDetails.map((topic) => <option key={topic.id} value={topic.id}>{topic.topic_title} (#{topic.id})</option>)}
              </select>
              <input value={subTopic} onChange={(e) => setSubTopic(e.target.value)} placeholder="Sub topic" style={{ ...fieldStyle(), borderColor: fieldErrors.sub_topic ? "#dc2626" : undefined }} />
            </>
          )}

          {customizeMode && (
            <>
              <input
                value={customTopicIds}
                onChange={(e) => setCustomTopicIds(e.target.value)}
                placeholder="Topic detail IDs (comma separated)"
                style={{ ...fieldStyle(), gridColumn: "1 / -1", borderColor: fieldErrors.topic ? "#dc2626" : undefined }}
              />
              <textarea
                value={customSubTopics}
                onChange={(e) => setCustomSubTopics(e.target.value)}
                placeholder="Sub topic lines (line 1 = first topic id)"
                rows={3}
                style={{ gridColumn: "1 / -1", border: `1px solid ${fieldErrors.sub_topic ? "#dc2626" : "var(--line)"}`, borderRadius: 8, padding: "8px 10px" }}
              />
            </>
          )}

          {fieldErrors.class_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Class: {fieldErrors.class_id}</div>}
          {fieldErrors.section_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Section: {fieldErrors.section_id}</div>}
          {fieldErrors.subject_id && <div style={{ color: "#dc2626", fontSize: 12 }}>Subject: {fieldErrors.subject_id}</div>}
          {fieldErrors.lesson && <div style={{ color: "#dc2626", fontSize: 12 }}>Lesson: {fieldErrors.lesson}</div>}
          {fieldErrors.lesson_date && <div style={{ color: "#dc2626", fontSize: 12 }}>Date: {fieldErrors.lesson_date}</div>}
          {fieldErrors.topic && <div style={{ color: "#dc2626", fontSize: 12, gridColumn: "1 / -1" }}>Topic: {fieldErrors.topic}</div>}
          {fieldErrors.sub_topic && <div style={{ color: "#dc2626", fontSize: 12, gridColumn: "1 / -1" }}>Sub topic: {fieldErrors.sub_topic}</div>}

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {editingPlannerId && (
              <button type="button" onClick={resetPlannerForm} style={{ ...buttonStyle(), background: "#6b7280", borderColor: "#6b7280" }}>
                Cancel Edit
              </button>
            )}
            <button type="submit" disabled={!isPlannerFormValid} style={{ ...buttonStyle(), opacity: isPlannerFormValid ? 1 : 0.6, cursor: isPlannerFormValid ? "pointer" : "not-allowed" }}>{saving ? "Saving..." : editingPlannerId ? "Update Lesson Plan" : "Save Lesson Plan"}</button>
          </div>
        </form>
        {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
      </div>

      <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Planner Rows</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>ID</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Date</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Period</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Lesson</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Topic</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Sub Topic</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 70 }}>{item.id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.lesson_date}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.class_period_id ? (periodNameById.get(item.class_period_id) || `Period #${item.class_period_id}`) : "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.lesson_detail_id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.topic_detail_id || "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.sub_topic || item.topics.map((topic) => topic.sub_topic_title).join(", ") || "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)", width: 180 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => fillPlannerForm(item)} style={buttonStyle()}>Edit</button>
                    <button type="button" onClick={() => void deletePlanner(item.id)} style={{ ...buttonStyle(), background: "#dc2626", borderColor: "#dc2626" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} style={{ padding: 8, color: "var(--text-muted)" }}>No lesson planner rows yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>Weekly Planner Report</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={weeklyStartDate} onChange={(e) => setWeeklyStartDate(e.target.value)} style={fieldStyle()} />
            <button type="button" onClick={() => void loadWeekly()} style={buttonStyle()}>Load Week</button>
          </div>
        </div>
        {weekly && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{weekly.start_date} to {weekly.end_date}</div>
            {weeklyDays.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                      {weeklyDays.map((dayKey) => (
                        <th key={dayKey} style={{ padding: 8, borderBottom: "1px solid var(--line)", minWidth: 220 }}>{dayKey}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyRows.map((rowInfo, rowIndex) => (
                      <tr key={rowInfo.key}>
                        {weeklyDays.map((dayKey) => {
                          const row = rowInfo.periodId
                            ? (weekly.days[dayKey] || []).find((item) => item.class_period_id === rowInfo.periodId)
                            : weekly.days[dayKey]?.[rowIndex];
                          return (
                            <td key={`${dayKey}-${rowIndex}`} style={{ padding: 8, borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                              {row ? (
                                <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 8, background: "#fff" }}>
                                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{row.class_period_id ? (periodNameById.get(row.class_period_id) || `Period #${row.class_period_id}`) : rowInfo.label}</div>
                                  <div style={{ fontWeight: 600, fontSize: 12 }}>Lesson #{row.lesson_detail_id}</div>
                                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Topic: {row.topic_detail_id || "-"}</div>
                                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Routine: {row.routine_id || "-"}</div>
                                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Teacher: {row.teacher_id ? (teacherNameById.get(row.teacher_id) || `#${row.teacher_id}`) : "-"}</div>
                                </div>
                              ) : (
                                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{rowInfo.label}</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>No planner rows for selected week.</div>
            )}
          </div>
        )}
      </div>

      <div className="white-box" style={boxStyle()}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Lesson Planner Overview</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Planner ID</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Date</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Class</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Section</th>
              <th style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>Subject</th>
            </tr>
          </thead>
          <tbody>
            {overviewItems.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.lesson_date}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.class_id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.section_id ?? "-"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.subject_id}</td>
              </tr>
            ))}
            {overviewItems.length === 0 && <tr><td colSpan={5} style={{ padding: 8, color: "var(--text-muted)" }}>No overview rows.</td></tr>}
          </tbody>
        </table>
      </div>
      </LegacyPageFrame>
    </div>
  );
}
