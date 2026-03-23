export type ModuleItem = {
  key: string;
  title: string;
  status: "planned" | "in-progress" | "done";
};

export const moduleRoadmap: ModuleItem[] = [
  { key: "core", title: "Core Setup and Settings", status: "in-progress" },
  { key: "admissions", title: "Admissions", status: "in-progress" },
  { key: "students", title: "Student Information", status: "planned" },
  { key: "academics", title: "Academics", status: "planned" },
  { key: "attendance", title: "Attendance", status: "planned" },
  { key: "exams", title: "Exams and Results", status: "planned" },
  { key: "fees", title: "Fees and Finance", status: "planned" },
  { key: "hr", title: "HR and Payroll", status: "planned" },
  { key: "communication", title: "Communication", status: "planned" },
  { key: "reports", title: "Reports and Analytics", status: "planned" },
];
