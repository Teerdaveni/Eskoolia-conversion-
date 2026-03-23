"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";

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

function fieldStyle() {
  return { width: "100%", height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px" } as const;
}

function buttonStyle(color = "var(--primary)") {
  return {
    height: 34,
    border: `1px solid ${color}`,
    background: color,
    color: "#fff",
    borderRadius: 8,
    padding: "0 10px",
    cursor: "pointer",
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

function breadcrumb(title: string) {
  return (
    <section className="sms-breadcrumb mb-20">
      <div className="container-fluid">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
            <span>Dashboard</span>
            <span>/</span>
            <span>Library</span>
            <span>/</span>
            <span>{title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type BookCategory = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
};

type Book = {
  id: number;
  category: number | null;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  quantity: number;
  available_quantity: number;
  rack: string;
};

type Student = {
  id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
};

type Staff = {
  id: number;
  staff_no: string;
  first_name: string;
  last_name: string;
};

type LibraryMember = {
  id: number;
  member_type: "student" | "staff";
  student: number | null;
  staff: number | null;
  card_no: string;
  is_active: boolean;
};

type BookIssue = {
  id: number;
  book: number;
  member: number;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine_amount: string;
  status: "issued" | "returned" | "lost";
};

export function LibraryCategoriesPanel() {
  const [rows, setRows] = useState<BookCategory[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setError("");
      const data = await apiGet<ApiList<BookCategory>>("/api/v1/library/categories/");
      setRows(listData(data));
    } catch {
      setError("Unable to load categories.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = { name: name.trim(), description: description.trim(), is_active: isActive };
      if (editingId) {
        await apiPatch(`/api/v1/library/categories/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/library/categories/", payload);
      }
      setEditingId(null);
      setName("");
      setDescription("");
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await apiDelete(`/api/v1/library/categories/${id}/`);
      await load();
    } catch {
      setError("Unable to delete category.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Book Categories")}
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Category" : "Add Category"}</h3>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name *" style={fieldStyle()} />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={fieldStyle()} />
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
              </label>
              <button type="submit" style={buttonStyle()} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
            </form>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Description</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.description || "-"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          style={buttonStyle("#0ea5e9")}
                          onClick={() => {
                            setEditingId(row.id);
                            setName(row.name);
                            setDescription(row.description || "");
                            setIsActive(row.is_active);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" style={buttonStyle("#dc2626")} onClick={() => void remove(row.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LibraryBooksPanel() {
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [rows, setRows] = useState<Book[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [availableQuantity, setAvailableQuantity] = useState("1");
  const [rack, setRack] = useState("");

  const load = async () => {
    try {
      setError("");
      const [bookData, categoryData] = await Promise.all([
        apiGet<ApiList<Book>>("/api/v1/library/books/"),
        apiGet<ApiList<BookCategory>>("/api/v1/library/categories/?is_active=true"),
      ]);
      setRows(listData(bookData));
      setCategories(listData(categoryData));
    } catch {
      setError("Unable to load books.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Book title is required.");
      return;
    }

    const qty = Number(quantity || "0");
    const available = Number(availableQuantity || "0");
    if (Number.isNaN(qty) || Number.isNaN(available) || qty < 0 || available < 0 || available > qty) {
      setError("Quantity values are invalid.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        category: categoryId ? Number(categoryId) : null,
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        publisher: publisher.trim(),
        quantity: qty,
        available_quantity: available,
        rack: rack.trim(),
      };
      if (editingId) {
        await apiPatch(`/api/v1/library/books/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/library/books/", payload);
      }
      setEditingId(null);
      setCategoryId("");
      setTitle("");
      setAuthor("");
      setIsbn("");
      setPublisher("");
      setQuantity("1");
      setAvailableQuantity("1");
      setRack("");
      await load();
    } catch {
      setError("Unable to save book.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await apiDelete(`/api/v1/library/books/${id}/`);
      await load();
    } catch {
      setError("Unable to delete book.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Books")}
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Book" : "Add Book"}</h3>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={fieldStyle()}>
                <option value="">Category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" style={fieldStyle()} />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" style={fieldStyle()} />
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="ISBN" style={fieldStyle()} />

              <input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" style={fieldStyle()} />
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0" style={fieldStyle()} />
              <input value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} type="number" min="0" style={fieldStyle()} />
              <input value={rack} onChange={(e) => setRack(e.target.value)} placeholder="Rack" style={fieldStyle()} />

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" style={buttonStyle()} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
              </div>
            </form>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Title</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Author</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Category</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Qty</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Available</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Rack</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const category = categories.find((item) => item.id === row.category);
                  return (
                    <tr key={row.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.title}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.author || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{category?.name || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.quantity}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.available_quantity}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.rack || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            style={buttonStyle("#0ea5e9")}
                            onClick={() => {
                              setEditingId(row.id);
                              setCategoryId(row.category ? String(row.category) : "");
                              setTitle(row.title);
                              setAuthor(row.author || "");
                              setIsbn(row.isbn || "");
                              setPublisher(row.publisher || "");
                              setQuantity(String(row.quantity));
                              setAvailableQuantity(String(row.available_quantity));
                              setRack(row.rack || "");
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" style={buttonStyle("#dc2626")} onClick={() => void remove(row.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LibraryMembersPanel() {
  const [rows, setRows] = useState<LibraryMember[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [memberType, setMemberType] = useState<"student" | "staff">("student");
  const [studentId, setStudentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    try {
      setError("");
      const [memberData, studentData, staffData] = await Promise.all([
        apiGet<ApiList<LibraryMember>>("/api/v1/library/members/"),
        apiGet<ApiList<Student>>("/api/v1/students/students/?is_active=true"),
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/?status=active"),
      ]);
      setRows(listData(memberData));
      setStudents(listData(studentData));
      setStaffs(listData(staffData));
    } catch {
      setError("Unable to load members.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cardNo.trim()) {
      setError("Card no is required.");
      return;
    }
    if (memberType === "student" && !studentId) {
      setError("Student is required for student member type.");
      return;
    }
    if (memberType === "staff" && !staffId) {
      setError("Staff is required for staff member type.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        member_type: memberType,
        student: memberType === "student" ? Number(studentId) : null,
        staff: memberType === "staff" ? Number(staffId) : null,
        card_no: cardNo.trim(),
        is_active: isActive,
      };
      if (editingId) {
        await apiPatch(`/api/v1/library/members/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/library/members/", payload);
      }
      setEditingId(null);
      setMemberType("student");
      setStudentId("");
      setStaffId("");
      setCardNo("");
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save member.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await apiDelete(`/api/v1/library/members/${id}/`);
      await load();
    } catch {
      setError("Unable to delete member.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Library Members")}
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Member" : "Add Member"}</h3>
            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 180px auto", gap: 8 }}>
              <select
                value={memberType}
                onChange={(e) => {
                  const next = e.target.value as "student" | "staff";
                  setMemberType(next);
                  if (next === "student") {
                    setStaffId("");
                  } else {
                    setStudentId("");
                  }
                }}
                style={fieldStyle()}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>

              {memberType === "student" ? (
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={fieldStyle()}>
                  <option value="">Select student</option>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>{item.first_name} {item.last_name} ({item.admission_no})</option>
                  ))}
                </select>
              ) : (
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={fieldStyle()}>
                  <option value="">Select staff</option>
                  {staffs.map((item) => (
                    <option key={item.id} value={item.id}>{item.first_name} {item.last_name} ({item.staff_no || "-"})</option>
                  ))}
                </select>
              )}

              <input value={cardNo} onChange={(e) => setCardNo(e.target.value)} placeholder="Card no *" style={fieldStyle()} />
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
              </label>
              <button type="submit" style={buttonStyle()} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
            </form>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Member</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Card No</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const student = students.find((item) => item.id === row.student);
                  const staff = staffs.find((item) => item.id === row.staff);
                  const memberName = row.member_type === "student"
                    ? student
                      ? `${student.first_name} ${student.last_name}`
                      : `Student #${row.student || "-"}`
                    : staff
                      ? `${staff.first_name} ${staff.last_name}`
                      : `Staff #${row.staff || "-"}`;

                  return (
                    <tr key={row.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.member_type}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{memberName}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.card_no}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            style={buttonStyle("#0ea5e9")}
                            onClick={() => {
                              setEditingId(row.id);
                              setMemberType(row.member_type);
                              setStudentId(row.student ? String(row.student) : "");
                              setStaffId(row.staff ? String(row.staff) : "");
                              setCardNo(row.card_no);
                              setIsActive(row.is_active);
                            }}
                          >
                            Edit
                          </button>
                          <button type="button" style={buttonStyle("#dc2626")} onClick={() => void remove(row.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LibraryIssuesPanel() {
  const [rows, setRows] = useState<BookIssue[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [bookId, setBookId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "issued" | "returned" | "lost">("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const bookLabel = useMemo(() => {
    const map = new Map<number, string>();
    books.forEach((book) => {
      map.set(book.id, `${book.title} (${book.available_quantity}/${book.quantity})`);
    });
    return map;
  }, [books]);

  const memberLabel = useMemo(() => {
    const map = new Map<number, string>();
    members.forEach((member) => {
      if (member.member_type === "student") {
        const student = students.find((item) => item.id === member.student);
        map.set(member.id, `${member.card_no} - ${student ? `${student.first_name} ${student.last_name}` : "Student"}`);
      } else {
        const staff = staffs.find((item) => item.id === member.staff);
        map.set(member.id, `${member.card_no} - ${staff ? `${staff.first_name} ${staff.last_name}` : "Staff"}`);
      }
    });
    return map;
  }, [members, students, staffs]);

  const load = async () => {
    try {
      setError("");
      const [bookData, memberData, studentData, staffData, issueData] = await Promise.all([
        apiGet<ApiList<Book>>("/api/v1/library/books/"),
        apiGet<ApiList<LibraryMember>>("/api/v1/library/members/?is_active=true"),
        apiGet<ApiList<Student>>("/api/v1/students/students/?is_active=true"),
        apiGet<ApiList<Staff>>("/api/v1/hr/staff/?status=active"),
        apiGet<ApiList<BookIssue>>("/api/v1/library/issues/"),
      ]);
      setBooks(listData(bookData));
      setMembers(listData(memberData));
      setStudents(listData(studentData));
      setStaffs(listData(staffData));
      setRows(listData(issueData));
    } catch {
      setError("Unable to load library issues.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const issueBook = async (event: FormEvent) => {
    event.preventDefault();
    if (!bookId || !memberId || !issueDate || !dueDate) {
      setError("Book, member, issue date and due date are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await apiPost("/api/v1/library/issues/", {
        book: Number(bookId),
        member: Number(memberId),
        issue_date: issueDate,
        due_date: dueDate,
        status: "issued",
      });
      setBookId("");
      setMemberId("");
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      await load();
    } catch {
      setError("Unable to issue book.");
    } finally {
      setSaving(false);
    }
  };

  const markReturned = async (issue: BookIssue) => {
    try {
      setError("");
      await apiPost(`/api/v1/library/issues/${issue.id}/return/`, {
        return_date: new Date().toISOString().slice(0, 10),
      });
      await load();
    } catch {
      setError("Unable to mark return.");
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) {
        return false;
      }
      if (showOverdueOnly) {
        if (row.status !== "issued") {
          return false;
        }
        return row.due_date < new Date().toISOString().slice(0, 10);
      }
      return true;
    });
  }, [rows, statusFilter, showOverdueOnly]);

  return (
    <div className="legacy-panel">
      {breadcrumb("Book Issues")}
      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Issue Book</h3>
            <form onSubmit={issueBook} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 180px 180px auto", gap: 8 }}>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)} style={fieldStyle()}>
                <option value="">Select book</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>{book.title} ({book.available_quantity}/{book.quantity})</option>
                ))}
              </select>
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={fieldStyle()}>
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{memberLabel.get(member.id) || member.card_no}</option>
                ))}
              </select>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} style={fieldStyle()} />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={fieldStyle()} />
              <button type="submit" style={buttonStyle()} disabled={saving}>{saving ? "Saving..." : "Issue"}</button>
            </form>
            {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
          </div>

          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Search Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "180px auto auto", gap: 8, alignItems: "center" }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | "issued" | "returned" | "lost")} style={fieldStyle()}>
                <option value="">All Status</option>
                <option value="issued">Issued</option>
                <option value="returned">Returned</option>
                <option value="lost">Lost</option>
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={showOverdueOnly} onChange={(e) => setShowOverdueOnly(e.target.checked)} /> Show overdue only
              </label>
              <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void load()}>Refresh</button>
            </div>
          </div>

          <div className="white-box" style={boxStyle()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Book</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Member</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Issue Date</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Due Date</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Return Date</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Fine</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const overdue = row.status === "issued" && row.due_date < new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={row.id}>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{bookLabel.get(row.book) || `Book #${row.book}`}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{memberLabel.get(row.member) || `Member #${row.member}`}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.issue_date}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", color: overdue ? "var(--warning)" : "inherit" }}>{row.due_date}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.return_date || "-"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.fine_amount || "0.00"}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.status}</td>
                      <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                        {row.status === "issued" ? (
                          <button type="button" style={buttonStyle("#059669")} onClick={() => void markReturned(row)}>Mark Return</button>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
