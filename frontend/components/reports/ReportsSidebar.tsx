import React from "react";
import Link from "next/link";

const ReportsSidebar = () => {
    const reportLinks = [
        { href: "/reports/students/student-report", label: "Student Report" },
        { href: "/reports/students/guardian-report", label: "Guardian Report" },
        { href: "/reports/fees/balance-fees-report", label: "Balance Fees Report" },
        { href: "/reports/fees/collection-report", label: "Collection Report" },
        { href: "/reports/academics/class-report", label: "Class Report" },
        { href: "/reports/examination/online-exam-report", label: "Online Exam Report" },
        { href: "/reports/examination/mark-sheet-report-student", label: "Mark Sheet Report Student" },
        { href: "/reports/examination/tabulation-sheet-report", label: "Tabulation Sheet Report" },
        { href: "/reports/examination/progress-card-report", label: "Progress Card Report" },
        { href: "/reports/accounts/payroll-report", label: "Payroll Report" },
        { href: "/reports/dormitory/student-dormitory-report", label: "Student Dormitory Report" },
        { href: "/reports/transport/student-transport-report", label: "Student Transport Report" },
    ];

    return (
        <div className="legacy-panel">
            <section className="admin-visitor-area up_st_admin_visitor">
                <div className="container-fluid p-0">
                    <div className="white-box rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-4">
                        <h3 className="m-0 mb-3">Reports</h3>
                        <ul className="m-0 list-none p-0">
                            {reportLinks.map((item) => (
                                <li key={item.href} className="mb-1 border-b border-[var(--line)] py-1.5 last:mb-0 last:border-b-0 last:pb-0">
                                    <Link href={item.href} className="text-[13px] text-[var(--text)] hover:text-[var(--primary)]">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
        </div>
            </section>
        </div>
    );
};

export default ReportsSidebar;
