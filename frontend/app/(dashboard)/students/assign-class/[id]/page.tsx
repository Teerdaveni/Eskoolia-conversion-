import { StudentMultiClassPanel } from "@/components/students/StudentMultiClassPanel";

export default function AssignClassPage({ params }: { params: { id: string } }) {
  const studentId = Number(params.id);
  return <StudentMultiClassPanel selectedStudentId={Number.isNaN(studentId) ? undefined : studentId} />;
}
