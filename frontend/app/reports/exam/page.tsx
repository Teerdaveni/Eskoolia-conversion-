"use client";

import ReportExplorer from "@/components/reports/ReportExplorer";
import ReportNotFound from "@/components/reports/ReportNotFound";
import { getReportDefinition } from "@/lib/reports-config";

export default function ExamReportPage() {
    const definition = getReportDefinition("exam");
    if (!definition) {
        return <ReportNotFound title="Exam Report" />;
    }
    return <ReportExplorer definition={definition} />;
}

