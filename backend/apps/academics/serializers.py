from rest_framework import serializers
from .models import (
    ClassOptionalSubjectSetup,
    ClassRoutineSlot,
    ClassSubjectAssignment,
    ClassTeacherAssignment,
    Homework,
    HomeworkSubmission,
    Lesson,
    LessonPlanner,
    LessonPlanTopic,
    LessonTopic,
    LessonTopicDetail,
    OptionalSubjectAssignment,
    UploadedContent,
)


class LegacyAliasMixin(serializers.ModelSerializer):
    """Expose legacy PHP-style *_id keys while keeping FK-backed models."""


class ClassSubjectAssignmentSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=ClassSubjectAssignment._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=ClassSubjectAssignment._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=ClassSubjectAssignment._meta.get_field("subject").related_model.objects.all())
    teacher_id = serializers.PrimaryKeyRelatedField(source="teacher", queryset=ClassSubjectAssignment._meta.get_field("teacher").related_model.objects.all(), allow_null=True, required=False)
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=ClassSubjectAssignment._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = ClassSubjectAssignment
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "subject_id",
            "teacher_id",
            "school_class",
            "section",
            "subject",
            "teacher",
            "academic_year",
            "is_optional",
            "active_status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "school_class",
            "section",
            "subject",
            "teacher",
            "academic_year",
            "created_at",
        ]
        validators = []


class ClassTeacherAssignmentSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=ClassTeacherAssignment._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=ClassTeacherAssignment._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    teacher_id = serializers.PrimaryKeyRelatedField(source="teacher", queryset=ClassTeacherAssignment._meta.get_field("teacher").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=ClassTeacherAssignment._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = ClassTeacherAssignment
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "teacher_id",
            "academic_year",
            "school_class",
            "section",
            "teacher",
            "active_status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "school_class",
            "section",
            "teacher",
            "created_at",
        ]
        validators = []


class ClassRoutineSlotSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=ClassRoutineSlot._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=ClassRoutineSlot._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=ClassRoutineSlot._meta.get_field("subject").related_model.objects.all())
    teacher_id = serializers.PrimaryKeyRelatedField(source="teacher", queryset=ClassRoutineSlot._meta.get_field("teacher").related_model.objects.all(), allow_null=True, required=False)
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=ClassRoutineSlot._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = ClassRoutineSlot
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "subject_id",
            "teacher_id",
            "academic_year",
            "school_class",
            "section",
            "subject",
            "teacher",
            "day",
            "day_id",
            "class_period_id",
            "start_time",
            "end_time",
            "room_id",
            "room",
            "is_break",
            "active_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "school_class",
            "section",
            "subject",
            "teacher",
            "created_at",
            "updated_at",
        ]
        validators = []

    def validate(self, attrs):
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError("end_time must be after start_time")
        return attrs


class ClassOptionalSubjectSetupSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=ClassOptionalSubjectSetup._meta.get_field("school_class").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=ClassOptionalSubjectSetup._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = ClassOptionalSubjectSetup
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "academic_year",
            "school_class",
            "gpa_above",
            "active_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "school_class",
            "created_at",
            "updated_at",
        ]
        validators = []


class OptionalSubjectAssignmentSerializer(LegacyAliasMixin):
    student_id = serializers.PrimaryKeyRelatedField(source="student", queryset=OptionalSubjectAssignment._meta.get_field("student").related_model.objects.all())
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=OptionalSubjectAssignment._meta.get_field("subject").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=OptionalSubjectAssignment._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = OptionalSubjectAssignment
        fields = [
            "id",
            "student_id",
            "subject_id",
            "academic_year_id",
            "student",
            "subject",
            "academic_year",
            "active_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student", "subject", "academic_year", "created_at", "updated_at"]
        validators = []


class HomeworkSubmissionSerializer(LegacyAliasMixin):
    homework_id = serializers.PrimaryKeyRelatedField(source="homework", queryset=HomeworkSubmission._meta.get_field("homework").related_model.objects.all())
    student_id = serializers.PrimaryKeyRelatedField(source="student", queryset=HomeworkSubmission._meta.get_field("student").related_model.objects.all())

    class Meta:
        model = HomeworkSubmission
        fields = [
            "id",
            "homework_id",
            "student_id",
            "homework",
            "student",
            "marks",
            "complete_status",
            "note",
            "file",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "homework", "student", "created_by", "created_at", "updated_at"]
        validators = []


class HomeworkSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="class_id_ref", queryset=Homework._meta.get_field("class_id_ref").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section_id_ref", queryset=Homework._meta.get_field("section_id_ref").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject_id_ref", queryset=Homework._meta.get_field("subject_id_ref").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=Homework._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)
    evaluations = HomeworkSubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = Homework
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "subject_id",
            "academic_year",
            "class_id_ref",
            "section_id_ref",
            "subject_id_ref",
            "homework_date",
            "submission_date",
            "evaluation_date",
            "marks",
            "description",
            "file",
            "created_by",
            "evaluated_by",
            "active_status",
            "evaluations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "class_id_ref",
            "section_id_ref",
            "subject_id_ref",
            "created_by",
            "evaluated_by",
            "evaluations",
            "created_at",
            "updated_at",
        ]
        validators = []


class UploadedContentSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="class_id_ref", queryset=UploadedContent._meta.get_field("class_id_ref").related_model.objects.all(), allow_null=True, required=False)
    section_id = serializers.PrimaryKeyRelatedField(source="section_id_ref", queryset=UploadedContent._meta.get_field("section_id_ref").related_model.objects.all(), allow_null=True, required=False)
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=UploadedContent._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = UploadedContent
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "academic_year",
            "class_id_ref",
            "section_id_ref",
            "content_title",
            "content_type",
            "available_for_admin",
            "available_for_all_classes",
            "upload_date",
            "description",
            "source_url",
            "upload_file",
            "created_by",
            "active_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "class_id_ref",
            "section_id_ref",
            "created_by",
            "created_at",
            "updated_at",
        ]
        validators = []


class LessonTopicDetailSerializer(LegacyAliasMixin):
    class Meta:
        model = LessonTopicDetail
        fields = [
            "id",
            "topic",
            "lesson",
            "topic_title",
            "completed_status",
            "competed_date",
            "active_status",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]


class LessonSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=Lesson._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=Lesson._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=Lesson._meta.get_field("subject").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=Lesson._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "subject_id",
            "academic_year",
            "school_class",
            "section",
            "subject",
            "lesson_title",
            "active_status",
            "user",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "school_class",
            "section",
            "subject",
            "user",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        validators = []


class LessonGroupCreateSerializer(serializers.Serializer):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=Lesson._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=Lesson._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=Lesson._meta.get_field("subject").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=Lesson._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)
    lesson = serializers.ListField(child=serializers.CharField(max_length=255), allow_empty=False)


class LessonTopicSerializer(LegacyAliasMixin):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=LessonTopic._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=LessonTopic._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=LessonTopic._meta.get_field("subject").related_model.objects.all())
    lesson_id = serializers.PrimaryKeyRelatedField(source="lesson", queryset=LessonTopic._meta.get_field("lesson").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=LessonTopic._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)
    topics = LessonTopicDetailSerializer(many=True, read_only=True)

    class Meta:
        model = LessonTopic
        fields = [
            "id",
            "school",
            "academic_year_id",
            "class_id",
            "section_id",
            "subject_id",
            "lesson_id",
            "academic_year",
            "school_class",
            "section",
            "subject",
            "lesson",
            "active_status",
            "user",
            "created_by",
            "updated_by",
            "topics",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "school_class",
            "section",
            "subject",
            "lesson",
            "user",
            "created_by",
            "updated_by",
            "topics",
            "created_at",
            "updated_at",
        ]
        validators = []


class LessonTopicGroupCreateSerializer(serializers.Serializer):
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=LessonTopic._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=LessonTopic._meta.get_field("section").related_model.objects.all())
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=LessonTopic._meta.get_field("subject").related_model.objects.all())
    lesson_id = serializers.PrimaryKeyRelatedField(source="lesson", queryset=LessonTopic._meta.get_field("lesson").related_model.objects.all())
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=LessonTopic._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)
    topic = serializers.ListField(child=serializers.CharField(max_length=255), allow_empty=False)


class LessonPlanTopicSerializer(LegacyAliasMixin):
    topic_id = serializers.PrimaryKeyRelatedField(source="topic", queryset=LessonPlanTopic._meta.get_field("topic").related_model.objects.all())

    class Meta:
        model = LessonPlanTopic
        fields = ["id", "topic_id", "topic", "lesson_planner", "sub_topic_title", "created_at", "updated_at"]
        read_only_fields = ["id", "topic", "lesson_planner", "created_at", "updated_at"]


class LessonPlannerSerializer(LegacyAliasMixin):
    teacher_id = serializers.PrimaryKeyRelatedField(source="teacher", queryset=LessonPlanner._meta.get_field("teacher").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=LessonPlanner._meta.get_field("subject").related_model.objects.all())
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=LessonPlanner._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=LessonPlanner._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    lesson_id = serializers.PrimaryKeyRelatedField(source="lesson", queryset=LessonPlanner._meta.get_field("lesson").related_model.objects.all(), allow_null=True, required=False)
    topic_id = serializers.PrimaryKeyRelatedField(source="topic", queryset=LessonPlanner._meta.get_field("topic").related_model.objects.all(), allow_null=True, required=False)
    lesson_detail_id = serializers.PrimaryKeyRelatedField(source="lesson_detail", queryset=LessonPlanner._meta.get_field("lesson_detail").related_model.objects.all())
    topic_detail_id = serializers.PrimaryKeyRelatedField(source="topic_detail", queryset=LessonPlanner._meta.get_field("topic_detail").related_model.objects.all(), allow_null=True, required=False)
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=LessonPlanner._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)
    topics = LessonPlanTopicSerializer(many=True, read_only=True)

    class Meta:
        model = LessonPlanner
        fields = [
            "id",
            "school",
            "academic_year_id",
            "day",
            "active_status",
            "lesson_id",
            "topic_id",
            "lesson_detail_id",
            "topic_detail_id",
            "teacher_id",
            "subject_id",
            "class_id",
            "section_id",
            "academic_year",
            "lesson",
            "topic",
            "lesson_detail",
            "topic_detail",
            "teacher",
            "subject",
            "school_class",
            "section",
            "sub_topic",
            "lecture_youube_link",
            "lecture_vedio",
            "attachment",
            "teaching_method",
            "general_objectives",
            "previous_knowlege",
            "comp_question",
            "zoom_setup",
            "presentation",
            "note",
            "lesson_date",
            "competed_date",
            "completed_status",
            "room_id",
            "class_period_id",
            "routine_id",
            "created_by",
            "updated_by",
            "topics",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "academic_year",
            "lesson",
            "topic",
            "lesson_detail",
            "topic_detail",
            "teacher",
            "subject",
            "school_class",
            "section",
            "created_by",
            "updated_by",
            "topics",
            "created_at",
            "updated_at",
        ]
        validators = []


class LessonPlannerCreateSerializer(serializers.Serializer):
    academic_year_id = serializers.PrimaryKeyRelatedField(source="academic_year", queryset=LessonPlanner._meta.get_field("academic_year").related_model.objects.all(), allow_null=True, required=False)
    day = serializers.IntegerField(required=False, allow_null=True)
    lesson = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all())
    teacher_id = serializers.PrimaryKeyRelatedField(source="teacher", queryset=LessonPlanner._meta.get_field("teacher").related_model.objects.all(), allow_null=True, required=False)
    subject_id = serializers.PrimaryKeyRelatedField(source="subject", queryset=LessonPlanner._meta.get_field("subject").related_model.objects.all())
    class_id = serializers.PrimaryKeyRelatedField(source="school_class", queryset=LessonPlanner._meta.get_field("school_class").related_model.objects.all())
    section_id = serializers.PrimaryKeyRelatedField(source="section", queryset=LessonPlanner._meta.get_field("section").related_model.objects.all(), allow_null=True, required=False)
    lesson_date = serializers.DateField()
    routine_id = serializers.IntegerField(required=False, allow_null=True)
    room_id = serializers.IntegerField(required=False, allow_null=True)
    class_period_id = serializers.IntegerField(required=False, allow_null=True)
    topic = serializers.JSONField(required=False)
    sub_topic = serializers.JSONField(required=False)
    customize = serializers.CharField(required=False, allow_blank=True)
    youtube_link = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.CharField(required=False, allow_blank=True)
    teaching_method = serializers.CharField(required=False, allow_blank=True)
    general_Objectives = serializers.CharField(required=False, allow_blank=True)
    previous_knowledge = serializers.CharField(required=False, allow_blank=True)
    comprehensive_Questions = serializers.CharField(required=False, allow_blank=True)
    zoom_setup = serializers.CharField(required=False, allow_blank=True)
    presentation = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        customize = attrs.get("customize")
        topic_value = attrs.get("topic")
        if customize == "customize":
            if not isinstance(topic_value, list) or not topic_value:
                raise serializers.ValidationError({"topic": "At least one topic is required for customize mode."})
        elif not topic_value:
            raise serializers.ValidationError({"topic": "A topic is required."})
        return attrs
