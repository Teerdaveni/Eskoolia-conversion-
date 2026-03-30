from django.core.management.base import BaseCommand
from apps.access_control.models import Permission


PERMISSIONS = [
    ("access_control.permission.read", "View permission catalog", "access_control"),
    ("access_control.role.manage", "Create and update roles", "access_control"),
    ("access_control.user_role.manage", "Assign roles to users", "access_control"),
    ("dashboard.view", "Dashboard", "dashboard"),

    ("role_permission.role.view", "Role", "role_permission"),
    ("role_permission.role.manage", "Role Manage", "role_permission"),
    ("role_permission.assign_permission.manage", "Assign Permission", "role_permission"),
    ("role_permission.login_permission.manage", "Login Permission", "role_permission"),
    ("role_permission.due_fees_login_permission.manage", "Due Fees Login Permission", "role_permission"),

    ("admin_section.admission_query.view", "Admission Query", "admin_section"),
    ("admin_section.admission_query.add", "Admission Query Add", "admin_section"),
    ("admin_section.admission_query.edit", "Admission Query Edit", "admin_section"),
    ("admin_section.admission_query.delete", "Admission Query Delete", "admin_section"),
    ("admin_section.visitor_book.view", "Visitor Book", "admin_section"),
    ("admin_section.visitor_book.add", "Visitor Book Add", "admin_section"),
    ("admin_section.visitor_book.edit", "Visitor Book Edit", "admin_section"),
    ("admin_section.visitor_book.delete", "Visitor Book Delete", "admin_section"),
    ("admin_section.complaint.view", "Complaint", "admin_section"),
    ("admin_section.complaint.add", "Complaint Add", "admin_section"),
    ("admin_section.complaint.edit", "Complaint Edit", "admin_section"),
    ("admin_section.complaint.delete", "Complaint Delete", "admin_section"),
    ("admin_section.postal_receive.view", "Postal Receive", "admin_section"),
    ("admin_section.postal_dispatch.view", "Postal Dispatch", "admin_section"),
    ("admin_section.phone_call_log.view", "Phone Call Log", "admin_section"),
    ("admin_section.admin_setup.view", "Admin Setup", "admin_section"),
    ("admin_section.id_card.view", "ID Card", "admin_section"),
    ("admin_section.certificate.view", "Certificate", "admin_section"),
    ("admin_section.generate_certificate.view", "Generate Certificate", "admin_section"),
    ("admin_section.generate_id_card.view", "Generate ID Card", "admin_section"),

    ("student_info.student_category.view", "Student Category", "student_info"),
    ("student_info.add_student.view", "Add Student", "student_info"),
    ("student_info.student_list.view", "Student List", "student_info"),
    ("student_info.multi_class_student.view", "Multi Class Student", "student_info"),
    ("student_info.delete_student_record.view", "Delete Student Record", "student_info"),
    ("student_info.unassigned_student.view", "Unassigned Student", "student_info"),
    ("student_info.student_attendance.view", "Student Attendance", "student_info"),
    ("student_info.student_attendance_import.view", "Student Attendance Import", "student_info"),
    ("student_info.student_group.view", "Student Group", "student_info"),
    ("student_info.student_promote.view", "Student Promote", "student_info"),
    ("student_info.disabled_students.view", "Disabled Students", "student_info"),
    ("student_info.subject_wise_attendance.view", "Subject Wise Attendance", "student_info"),
    ("student_info.subject_wise_attendance_report.view", "Subject Wise Attendance Report", "student_info"),
    ("student_info.student_export.view", "Student Export", "student_info"),
    ("student_info.sms_sending_time.view", "SMS Sending Time", "student_info"),

    ("academics.core_setup.view", "Core Setup", "academics"),
    ("academics.lesson.view", "Lesson", "academics"),
    ("academics.topic.view", "Topic", "academics"),
    ("academics.lesson_planner.view", "Lesson Planner", "academics"),
    ("academics.add_homework.view", "Add Homework", "academics"),
    ("academics.homework_list.view", "Homework List", "academics"),
    ("academics.homework_evaluation_report.view", "Homework Evaluation Report", "academics"),
    ("academics.upload_content.view", "Upload Content", "academics"),
    ("academics.assignment_list.view", "Assignment List", "academics"),
    ("academics.study_material_list.view", "Study Material List", "academics"),
    ("academics.syllabus_list.view", "Syllabus List", "academics"),
    ("academics.other_downloads_list.view", "Other Downloads List", "academics"),

    ("examination.exam_type.view", "Exam Type", "examination"),
    ("examination.exam_setup.view", "Exam Setup", "examination"),
    ("examination.exam_schedule.view", "Exam Schedule", "examination"),
    ("examination.exam_schedule_report.view", "Exam Schedule Report", "examination"),
    ("examination.exam_attendance.view", "Exam Attendance", "examination"),
    ("examination.exam_attendance_report.view", "Exam Attendance Report", "examination"),
    ("examination.marks_register.view", "Marks Register", "examination"),
    ("examination.add_marks.view", "Add Marks", "examination"),
    ("examination.result_publish.view", "Result Publish", "examination"),
    ("examination.student_mark_sheet.view", "Student Mark Sheet", "examination"),
    ("examination.merit_list.view", "Merit List", "examination"),
    ("examination.online_exam.view", "Online Exam", "examination"),
    ("examination.admit_card.view", "Admit Card", "examination"),
    ("examination.seat_plan.view", "Seat Plan", "examination"),

    ("fees.fees_group.view", "Fees Group", "fees"),
    ("fees.fees_type.view", "Fees Type", "fees"),
    ("fees.fees_master.view", "Fees Master", "fees"),
    ("fees.fees_collection.view", "Fees Collection", "fees"),
    ("fees.fees_due.view", "Fees Due", "fees"),
    ("fees.fees_carry_forward.view", "Fees Carry Forward", "fees"),

    ("library.book_categories.view", "Book Categories", "library"),
    ("library.books.view", "Books", "library"),
    ("library.library_members.view", "Library Members", "library"),
    ("library.book_issues.view", "Book Issues", "library"),

    ("human_resource.departments.view", "Departments", "human_resource"),
    ("human_resource.designations.view", "Designations", "human_resource"),
    ("human_resource.staff.view", "Add Staff", "human_resource"),
    ("human_resource.staff_attendance.view", "Staff Attendance", "human_resource"),
    ("human_resource.payroll.view", "Payroll", "human_resource"),
    ("human_resource.leave_type.view", "Leave Type", "human_resource"),
    ("human_resource.leave_define.view", "Leave Define", "human_resource"),
    ("human_resource.apply_leave.view", "Apply Leave", "human_resource"),

    ("accounts.chart_of_accounts.view", "Chart Of Accounts", "accounts"),
    ("accounts.bank_accounts.view", "Bank Accounts", "accounts"),
    ("accounts.ledger_entries.view", "Ledger Entries", "accounts"),
    ("accounts.fund_transfer.view", "Fund Transfer", "accounts"),

    ("settings_section.general_settings.view", "General Settings", "settings_section"),
    ("settings_section.class_periods.view", "Class Periods", "settings_section"),

    ("behaviour.incident.view", "Behaviour Incident", "behaviour"),
    ("behaviour.assigned_incident.view", "Behaviour Assigned Incident", "behaviour"),
    ("behaviour.assigned_incident_comment.view", "Behaviour Assigned Incident Comment", "behaviour"),
    ("behaviour.record_setting.view", "Behaviour Record Setting", "behaviour"),
]


class Command(BaseCommand):
    help = "Seed base permission catalog"

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for code, name, module in PERMISSIONS:
            obj, is_created = Permission.objects.update_or_create(
                code=code,
                defaults={"name": name, "module": module},
            )
            if is_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Permissions seeded. Created={created}, Updated={updated}"))
