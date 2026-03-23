from rest_framework import serializers
from .models import Permission, Role, UserRole


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "code", "name", "module", "created_at"]
        read_only_fields = ["id", "created_at"]


class RoleSerializer(serializers.ModelSerializer):
    permission_ids = serializers.PrimaryKeyRelatedField(
        source="permissions", queryset=Permission.objects.all(), many=True, required=False
    )

    class Meta:
        model = Role
        fields = ["id", "school", "name", "is_system", "permission_ids", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def create(self, validated_data):
        permissions = validated_data.pop("permissions", [])
        role = Role.objects.create(**validated_data)
        role.permissions.set(permissions)
        return role

    def update(self, instance, validated_data):
        permissions = validated_data.pop("permissions", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        if permissions is not None:
            instance.permissions.set(permissions)
        return instance


class UserRoleSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField(read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)

    class Meta:
        model = UserRole
        fields = ["id", "user", "role", "user_name", "role_name", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_user_name(self, obj):
        user = obj.user
        if not user:
            return None
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username
