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
  return { height: 34, border: `1px solid ${color}`, background: color, color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" } as const;
}

function boxStyle() {
  return { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 } as const;
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
            <span>Finance</span>
            <span>/</span>
            <span>{title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type ChartAccount = {
  id: number;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "income" | "expense";
  description: string;
  is_active: boolean;
  balance?: string;
};

type BankAccount = {
  id: number;
  name: string;
  bank_name: string;
  account_number: string;
  branch: string;
  current_balance: string;
  is_active: boolean;
};

type AcademicYear = { id: number; name: string; is_current?: boolean };

type LedgerEntry = {
  id: number;
  academic_year: number | null;
  account: number;
  entry_type: "debit" | "credit";
  amount: string;
  entry_date: string;
  reference_no: string;
  description: string;
};

type LedgerSummary = {
  count: number;
  total_debit: string;
  total_credit: string;
  net_balance: string;
};

type TrialBalanceRow = {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: string;
  credit: string;
  balance: string;
};

type TrialBalance = {
  accounts: TrialBalanceRow[];
  total_debit: string;
  total_credit: string;
  difference: string;
};

type FundTransfer = {
  id: number;
  from_bank: number;
  to_bank: number;
  amount: string;
  transfer_date: string;
  reference_no: string;
  note: string;
};

type BankStatement = {
  bank_account_id: number;
  bank_account_name: string;
  incoming_total: string;
  outgoing_total: string;
  net_movement: string;
  current_balance: string;
};

export function FinanceChartAccountsPanel() {
  const [rows, setRows] = useState<ChartAccount[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<ChartAccount["account_type"]>("asset");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiGet<ApiList<ChartAccount>>("/api/v1/finance/chart-of-accounts/");
      setRows(listData(data));
      setError("");
    } catch {
      setError("Unable to load chart of accounts.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Code and account name are required.");
      return;
    }

    try {
      setError("");
      const payload = {
        code: code.trim(),
        name: name.trim(),
        account_type: accountType,
        description: description.trim(),
        is_active: isActive,
      };
      if (editingId) {
        await apiPatch(`/api/v1/finance/chart-of-accounts/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/finance/chart-of-accounts/", payload);
      }
      setEditingId(null);
      setCode("");
      setName("");
      setAccountType("asset");
      setDescription("");
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save account.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Chart Of Accounts")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Account" : "Add Account"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "160px 1fr 180px 1fr auto auto", gap: 8 }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code *" style={fieldStyle()} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" style={fieldStyle()} />
            <select value={accountType} onChange={(e) => setAccountType(e.target.value as ChartAccount["account_type"])} style={fieldStyle()}>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={fieldStyle()} />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Code</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Balance</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.code}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.account_type}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.balance || "0.00"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setCode(row.code); setName(row.name); setAccountType(row.account_type); setDescription(row.description || ""); setIsActive(row.is_active); }}>Edit</button>
                      <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/finance/chart-of-accounts/${row.id}/`).then(load).catch(() => setError("Unable to delete account."))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}

export function FinanceBankAccountsPanel() {
  const [rows, setRows] = useState<BankAccount[]>([]);
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [currentBalance, setCurrentBalance] = useState("0.00");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statementFor, setStatementFor] = useState("");
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [statementStart, setStatementStart] = useState("");
  const [statementEnd, setStatementEnd] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await apiGet<ApiList<BankAccount>>("/api/v1/finance/bank-accounts/");
      setRows(listData(data));
      setError("");
    } catch {
      setError("Unable to load bank accounts.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !bankName.trim() || !accountNumber.trim()) {
      setError("Name, bank name and account number are required.");
      return;
    }
    try {
      setError("");
      const payload = {
        name: name.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        branch: branch.trim(),
        current_balance: currentBalance || "0.00",
        is_active: isActive,
      };
      if (editingId) {
        await apiPatch(`/api/v1/finance/bank-accounts/${editingId}/`, payload);
      } else {
        await apiPost("/api/v1/finance/bank-accounts/", payload);
      }
      setEditingId(null);
      setName("");
      setBankName("");
      setAccountNumber("");
      setBranch("");
      setCurrentBalance("0.00");
      setIsActive(true);
      await load();
    } catch {
      setError("Unable to save bank account.");
    }
  };

  const loadStatement = async () => {
    if (!statementFor) {
      setError("Select a bank account to view statement.");
      return;
    }
    try {
      const params = new URLSearchParams();
      if (statementStart) params.set("start_date", statementStart);
      if (statementEnd) params.set("end_date", statementEnd);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const data = await apiGet<BankStatement>(`/api/v1/finance/bank-accounts/${statementFor}/statement/${suffix}`);
      setStatement(data);
      setError("");
    } catch {
      setError("Unable to load bank statement.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Bank Accounts")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editingId ? "Edit Bank Account" : "Add Bank Account"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 180px auto auto", gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name *" style={fieldStyle()} />
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name *" style={fieldStyle()} />
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number *" style={fieldStyle()} />
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch" style={fieldStyle()} />
            <input type="number" min="0" step="0.01" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder="Current balance" style={fieldStyle()} />
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
            <button type="submit" style={buttonStyle()}>{editingId ? "Update" : "Save"}</button>
          </form>
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Bank Statement</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 180px auto", gap: 8 }}>
            <select value={statementFor} onChange={(e) => setStatementFor(e.target.value)} style={fieldStyle()}>
              <option value="">Bank account</option>
              {rows.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.account_number})</option>)}
            </select>
            <input type="date" value={statementStart} onChange={(e) => setStatementStart(e.target.value)} style={fieldStyle()} />
            <input type="date" value={statementEnd} onChange={(e) => setStatementEnd(e.target.value)} style={fieldStyle()} />
            <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => void loadStatement()}>View Statement</button>
          </div>
          {statement && (
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              <div>Incoming: <strong>{statement.incoming_total}</strong></div>
              <div>Outgoing: <strong>{statement.outgoing_total}</strong></div>
              <div>Net: <strong>{statement.net_movement}</strong></div>
              <div>Balance: <strong>{statement.current_balance}</strong></div>
            </div>
          )}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Name</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Bank</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Account No</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Balance</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Status</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.bank_name}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.account_number}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.current_balance}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.is_active ? "Active" : "Inactive"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={buttonStyle("#0ea5e9")} onClick={() => { setEditingId(row.id); setName(row.name); setBankName(row.bank_name); setAccountNumber(row.account_number); setBranch(row.branch || ""); setCurrentBalance(row.current_balance || "0.00"); setIsActive(row.is_active); }}>Edit</button>
                      <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/finance/bank-accounts/${row.id}/`).then(load).catch(() => setError("Unable to delete bank account."))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}

export function FinanceLedgerPanel() {
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);

  const [yearId, setYearId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [entryType, setEntryType] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("0.00");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [filterType, setFilterType] = useState<"" | "debit" | "credit">("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const query = filterType ? `?entry_type=${filterType}` : "";
      const [entryData, accountData, yearData, summaryData, trialData] = await Promise.all([
        apiGet<ApiList<LedgerEntry>>(`/api/v1/finance/ledger-entries/${query}`),
        apiGet<ApiList<ChartAccount>>("/api/v1/finance/chart-of-accounts/?is_active=true"),
        apiGet<ApiList<AcademicYear>>("/api/v1/core/academic-years/"),
        apiGet<LedgerSummary>(`/api/v1/finance/ledger-entries/summary/${query}`),
        apiGet<TrialBalance>(`/api/v1/finance/ledger-entries/trial-balance/${query}`),
      ]);
      const y = listData(yearData);
      setRows(listData(entryData));
      setAccounts(listData(accountData));
      setYears(y);
      setSummary(summaryData);
      setTrialBalance(trialData);
      if (!yearId) {
        const current = y.find((item) => item.is_current) || y[0];
        if (current) setYearId(String(current.id));
      }
      setError("");
    } catch {
      setError("Unable to load ledger data.");
    }
  };

  useEffect(() => {
    void load();
  }, [filterType]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accountId || !amount || !entryDate) {
      setError("Account, amount and entry date are required.");
      return;
    }
    try {
      setError("");
      await apiPost("/api/v1/finance/ledger-entries/", {
        academic_year: yearId ? Number(yearId) : null,
        account: Number(accountId),
        entry_type: entryType,
        amount,
        entry_date: entryDate,
        reference_no: referenceNo.trim(),
        description: description.trim(),
      });
      setAccountId("");
      setEntryType("debit");
      setAmount("0.00");
      setEntryDate(new Date().toISOString().slice(0, 10));
      setReferenceNo("");
      setDescription("");
      await load();
    } catch {
      setError("Unable to save ledger entry.");
    }
  };

  const accountLabel = useMemo(() => {
    const map = new Map<number, string>();
    accounts.forEach((item) => map.set(item.id, `${item.code} - ${item.name}`));
    return map;
  }, [accounts]);

  return (
    <div className="legacy-panel">
      {breadcrumb("Ledger Entries")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Add Ledger Entry</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "180px 1fr 140px 160px 160px 1fr auto", gap: 8 }}>
            <select value={yearId} onChange={(e) => setYearId(e.target.value)} style={fieldStyle()}>
              <option value="">Academic year</option>
              {years.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={fieldStyle()}>
              <option value="">Account</option>
              {accounts.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
            </select>
            <select value={entryType} onChange={(e) => setEntryType(e.target.value as "debit" | "credit")} style={fieldStyle()}>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={fieldStyle()} />
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={fieldStyle()} />
            <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Reference no" style={fieldStyle()} />
            <button type="submit" style={buttonStyle()}>Save</button>
          </form>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ width: "100%", minHeight: 80, border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginTop: 8 }} />
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "180px repeat(3, minmax(0, 1fr))", gap: 8, alignItems: "center" }}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as "" | "debit" | "credit")} style={fieldStyle()}>
              <option value="">All Entries</option>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
            <div>Debit: <strong>{summary?.total_debit || "0.00"}</strong></div>
            <div>Credit: <strong>{summary?.total_credit || "0.00"}</strong></div>
            <div>Net: <strong>{summary?.net_balance || "0.00"}</strong></div>
          </div>
        </div>

        {trialBalance && (
          <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Trial Balance</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Code</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Account</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Debit</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Credit</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Balance</th></tr></thead>
              <tbody>
                {trialBalance.accounts.map((item) => (
                  <tr key={item.account_id}>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.account_code}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.account_name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{item.account_type}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.debit}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.credit}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{item.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              <div>Total Debit: <strong>{trialBalance.total_debit}</strong></div>
              <div>Total Credit: <strong>{trialBalance.total_credit}</strong></div>
              <div>Difference: <strong>{trialBalance.difference}</strong></div>
            </div>
          </div>
        )}

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Date</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Account</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Type</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Amount</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Reference</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Action</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.entry_date}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{accountLabel.get(row.account) || row.account}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)", textTransform: "capitalize" }}>{row.entry_type}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.amount}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.reference_no || "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>
                    <button type="button" style={buttonStyle("#dc2626")} onClick={() => void apiDelete(`/api/v1/finance/ledger-entries/${row.id}/`).then(load).catch(() => setError("Unable to delete ledger entry."))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}

export function FinanceFundTransferPanel() {
  const [rows, setRows] = useState<FundTransfer[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);

  const [fromBank, setFromBank] = useState("");
  const [toBank, setToBank] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const bankLabel = useMemo(() => {
    const map = new Map<number, string>();
    banks.forEach((item) => map.set(item.id, `${item.name} (${item.account_number})`));
    return map;
  }, [banks]);

  const load = async () => {
    try {
      const [transferData, bankData] = await Promise.all([
        apiGet<ApiList<FundTransfer>>("/api/v1/finance/fund-transfers/"),
        apiGet<ApiList<BankAccount>>("/api/v1/finance/bank-accounts/?is_active=true"),
      ]);
      setRows(listData(transferData));
      setBanks(listData(bankData));
      setError("");
    } catch {
      setError("Unable to load fund transfers.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fromBank || !toBank || !amount || !transferDate) {
      setError("From bank, to bank, amount and transfer date are required.");
      return;
    }
    if (fromBank === toBank) {
      setError("From and to bank must be different.");
      return;
    }

    try {
      setError("");
      await apiPost("/api/v1/finance/fund-transfers/", {
        from_bank: Number(fromBank),
        to_bank: Number(toBank),
        amount,
        transfer_date: transferDate,
        reference_no: referenceNo.trim(),
        note: note.trim(),
      });
      setFromBank("");
      setToBank("");
      setAmount("0.00");
      setTransferDate(new Date().toISOString().slice(0, 10));
      setReferenceNo("");
      setNote("");
      await load();
    } catch {
      setError("Unable to save fund transfer.");
    }
  };

  return (
    <div className="legacy-panel">
      {breadcrumb("Fund Transfer")}
      <section className="admin-visitor-area up_st_admin_visitor"><div className="container-fluid p-0">
        <div className="white-box" style={{ ...boxStyle(), marginBottom: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Add Fund Transfer</h3>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 170px 1fr auto", gap: 8 }}>
            <select value={fromBank} onChange={(e) => setFromBank(e.target.value)} style={fieldStyle()}>
              <option value="">From bank</option>
              {banks.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.current_balance})</option>)}
            </select>
            <select value={toBank} onChange={(e) => setToBank(e.target.value)} style={fieldStyle()}>
              <option value="">To bank</option>
              {banks.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.current_balance})</option>)}
            </select>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={fieldStyle()} />
            <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} style={fieldStyle()} />
            <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Reference no" style={fieldStyle()} />
            <button type="submit" style={buttonStyle()}>Save</button>
          </form>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" style={{ width: "100%", minHeight: 80, border: "1px solid var(--line)", borderRadius: 8, padding: 10, marginTop: 8 }} />
          {error && <p style={{ color: "var(--warning)", marginTop: 8 }}>{error}</p>}
        </div>

        <div className="white-box" style={boxStyle()}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Date</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>From</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>To</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Amount</th><th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--line)" }}>Reference</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.transfer_date}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{bankLabel.get(row.from_bank) || row.from_bank}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{bankLabel.get(row.to_bank) || row.to_bank}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.amount}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid var(--line)" }}>{row.reference_no || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></section>
    </div>
  );
}
