"""
Chat Services
Provides helper methods and business logic for chat operations.
"""

from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import (
    Conversation,
    Group,
    GroupUser,
    GroupMessageRecipient,
    Invitation,
    BlockUser,
)

User = get_user_model()


class InvitationService:
    """Service for managing user invitations and connections"""

    @staticmethod
    def get_all_connected_users(user):
        """
        Get all users connected with the given user (accepted invitations).
        
        Args:
            user: The current user
            
        Returns:
            QuerySet of connected users
        """
        connected_from = Invitation.objects.filter(
            from_user=user,
            status=Invitation.STATUS_CONNECTED
        ).values_list("to_user_id", flat=True)
        
        connected_to = Invitation.objects.filter(
            to_user=user,
            status=Invitation.STATUS_CONNECTED
        ).values_list("from_user_id", flat=True)
        
        connected_user_ids = list(connected_from) + list(connected_to)
        
        return User.objects.filter(
            id__in=connected_user_ids
        ).exclude(id=user.id).distinct()

    @staticmethod
    def get_blocked_users(user):
        """
        Get list of user IDs blocked by the given user.
        
        Args:
            user: The current user
            
        Returns:
            List of blocked user IDs
        """
        return BlockUser.objects.filter(
            blocked_by=user
        ).values_list("blocked_user_id", flat=True)

    @staticmethod
    def send_invitation(from_user, to_user):
        """
        Send an invitation from one user to another.
        
        Args:
            from_user: User sending the invitation
            to_user: User receiving the invitation
            
        Returns:
            Invitation object or error
        """
        if from_user == to_user:
            raise ValueError("Cannot send invitation to yourself")
        
        # Check if invitation already exists
        existing = Invitation.objects.filter(
            Q(from_user=from_user, to_user=to_user) |
            Q(from_user=to_user, to_user=from_user)
        ).first()
        
        if existing:
            return existing
        
        invitation = Invitation.objects.create(
            from_user=from_user,
            to_user=to_user,
            status=Invitation.STATUS_PENDING
        )
        
        return invitation

    @staticmethod
    def accept_invitation(invitation, user):
        """
        Accept a pending invitation.
        
        Args:
            invitation: Invitation object to accept
            user: User accepting the invitation (should be to_user)
            
        Returns:
            Updated invitation or error
        """
        if invitation.to_user != user:
            raise PermissionError("Only recipient can accept invitation")
        
        if not invitation.is_pending():
            raise ValueError("Invitation is not pending")
        
        invitation.status = Invitation.STATUS_CONNECTED
        invitation.save()
        
        # Create reverse invitation
        Invitation.objects.get_or_create(
            from_user=invitation.to_user,
            to_user=invitation.from_user,
            defaults={"status": Invitation.STATUS_CONNECTED}
        )
        
        return invitation

    @staticmethod
    def decline_invitation(invitation, user):
        """
        Decline a pending invitation.
        
        Args:
            invitation: Invitation object to decline
            user: User declining the invitation
        """
        if invitation.to_user != user:
            raise PermissionError("Only recipient can decline invitation")
        
        invitation.delete()


class ConversationService:
    """Service for managing one-to-one conversations"""

    @staticmethod
    def get_conversation_with_user(user, other_user):
        """
        Get all conversations between two users.
        
        Args:
            user: Current user
            other_user: Other user
            
        Returns:
            QuerySet of conversations ordered by creation time
        """
        return Conversation.objects.filter(
            Q(from_user=user, to_user=other_user) |
            Q(from_user=other_user, to_user=user)
        ).select_related(
            "from_user",
            "to_user",
            "reply",
            "forward"
        ).order_by("created_at")

    @staticmethod
    def mark_conversations_as_read(user, other_user):
        """
        Mark all unread messages from other_user as read by user.
        
        Args:
            user: The user reading the messages
            other_user: The sender of the messages
        """
        Conversation.objects.filter(
            to_user=user,
            from_user=other_user,
            status=Conversation.STATUS_UNREAD
        ).update(status=Conversation.STATUS_READ)

    @staticmethod
    def mark_all_as_read(user):
        """
        Mark all unread messages as read for a user.
        
        Args:
            user: The user
        """
        Conversation.objects.filter(
            to_user=user,
            status=Conversation.STATUS_UNREAD
        ).update(status=Conversation.STATUS_READ)

    @staticmethod
    def delete_conversation_for_user(conversation, user):
        """
        Delete a conversation for the participating user (soft delete).
        
        Args:
            conversation: Conversation to delete
            user: User deleting the conversation
            
        Returns:
            Boolean indicating success
        """
        if conversation.from_user == user:
            conversation.delete()
            return True
        elif conversation.to_user == user:
            conversation.deleted_by_receiver = True
            conversation.save()
            return True
        
        return False

    @staticmethod
    def get_unread_count(user):
        """
        Get count of unread messages for a user.
        
        Args:
            user: The user
            
        Returns:
            Count of unread messages
        """
        return Conversation.objects.filter(
            to_user=user,
            status=Conversation.STATUS_UNREAD
        ).count()


class GroupService:
    """Service for managing group conversations"""

    @staticmethod
    def get_user_groups(user):
        """
        Get all groups the user is an active member of.
        
        Args:
            user: The user
            
        Returns:
            QuerySet of groups
        """
        return Group.objects.filter(
            members__user=user,
            members__deleted_at__isnull=True
        ).prefetch_related(
            "members__user"
        ).distinct()

    @staticmethod
    def create_group(name, created_by, user_ids, **kwargs):
        """
        Create a new group.
        
        Args:
            name: Group name
            created_by: User creating the group
            user_ids: List of user IDs to add as members
            **kwargs: Additional group fields (description, photo_url, etc.)
            
        Returns:
            Created Group object
        """
        group = Group.objects.create(
            name=name,
            created_by=created_by,
            description=kwargs.get("description", ""),
            photo_url=kwargs.get("photo_url"),
            privacy=kwargs.get("privacy", Group.PRIVACY_PRIVATE),
            group_type=kwargs.get("group_type", Group.GROUP_TYPE_OPEN),
        )
        
        # Add creator as admin
        GroupUser.objects.create(
            group=group,
            user=created_by,
            role=GroupUser.ROLE_ADMIN,
            added_by=created_by
        )
        
        # Add members
        for user_id in user_ids:
            user = User.objects.get(id=user_id)
            GroupUser.objects.create(
                group=group,
                user=user,
                role=GroupUser.ROLE_MEMBER,
                added_by=created_by
            )
        
        return group

    @staticmethod
    def add_members_to_group(group, user_ids, added_by):
        """
        Add members to a group.
        
        Args:
            group: Group to add members to
            user_ids: List of user IDs to add
            added_by: User adding the members
            
        Returns:
            Count of members added
        """
        added_count = 0
        
        for user_id in user_ids:
            # Check if already a member
            if group.members.filter(
                user_id=user_id,
                deleted_at__isnull=True
            ).exists():
                continue
            
            # Try to restore soft-deleted membership
            existing = group.members.filter(
                user_id=user_id
            ).first()
            
            if existing:
                existing.deleted_at = None
                existing.added_by = added_by
                existing.save()
            else:
                user = User.objects.get(id=user_id)
                GroupUser.objects.create(
                    group=group,
                    user=user,
                    role=GroupUser.ROLE_MEMBER,
                    added_by=added_by
                )
            
            added_count += 1
        
        return added_count

    @staticmethod
    def remove_members_from_group(group, user_ids, removed_by):
        """
        Remove members from a group (soft delete).
        
        Args:
            group: Group to remove members from
            user_ids: List of user IDs to remove
            removed_by: User removing the members
        """
        GroupUser.objects.filter(
            group=group,
            user_id__in=user_ids,
            deleted_at__isnull=True
        ).update(
            deleted_at=timezone.now(),
            removed_by=removed_by
        )

    @staticmethod
    def assign_role(group, user_id, role):
        """
        Assign a role to a group member.
        
        Args:
            group: The group
            user_id: User ID to assign role to
            role: New role value
        """
        membership = group.members.get(
            user_id=user_id,
            deleted_at__isnull=True
        )
        membership.role = role
        membership.save()

    @staticmethod
    def user_leave_group(group, user):
        """
        Remove a user from a group.
        
        Args:
            group: The group
            user: User leaving the group
        """
        GroupUser.objects.filter(
            group=group,
            user=user,
            deleted_at__isnull=True
        ).update(deleted_at=timezone.now())

    @staticmethod
    def send_group_message(group, from_user, message_text, **kwargs):
        """
        Send a message to a group.
        
        Args:
            group: The group
            from_user: User sending the message
            message_text: Message content
            **kwargs: file_name, original_file_name, message_type, etc.
            
        Returns:
            Created Conversation object
        """
        # Create conversation
        conversation = Conversation.objects.create(
            from_user=from_user,
            to_user=from_user,  # Group messages have same from/to
            message=message_text,
            message_type=kwargs.get("message_type", Conversation.MESSAGE_TYPE_TEXT),
            file_name=kwargs.get("file_name"),
            original_file_name=kwargs.get("original_file_name"),
        )
        
        # Create receipts for all active members
        for member in group.members.filter(deleted_at__isnull=True):
            GroupMessageRecipient.objects.create(
                user=member.user,
                conversation=conversation,
                group=group,
                read_at=timezone.now() if member.user == from_user else None
            )
        
        return conversation

    @staticmethod
    def get_group_messages(group, limit=20, offset=0):
        """
        Get messages for a group with limit and offset for pagination.
        
        Args:
            group: The group
            limit: Number of messages to return
            offset: Number of messages to skip
            
        Returns:
            QuerySet of group message recipients
        """
        return GroupMessageRecipient.objects.filter(
            group=group,
            deleted_at__isnull=True
        ).select_related(
            "user",
            "conversation__from_user",
            "conversation__to_user",
            "conversation__reply",
            "conversation__forward"
        ).prefetch_related(
            "removed_messages"
        ).order_by("-created_at")[offset:offset + limit]


class BlockUserService:
    """Service for managing blocked users"""

    @staticmethod
    def block_user(blocked_by, blocked_user):
        """
        Block a user.
        
        Args:
            blocked_by: User doing the blocking
            blocked_user: User to block
            
        Returns:
            BlockUser object
        """
        if blocked_by == blocked_user:
            raise ValueError("Cannot block yourself")
        
        block, _ = BlockUser.objects.get_or_create(
            blocked_by=blocked_by,
            blocked_user=blocked_user
        )
        
        return block

    @staticmethod
    def unblock_user(blocked_by, blocked_user):
        """
        Unblock a user.
        
        Args:
            blocked_by: User doing the unblocking
            blocked_user: User to unblock
        """
        BlockUser.objects.filter(
            blocked_by=blocked_by,
            blocked_user=blocked_user
        ).delete()

    @staticmethod
    def is_user_blocked(blocker, blocked):
        """
        Check if one user has blocked another.
        
        Args:
            blocker: User who did the blocking
            blocked: User who is blocked
            
        Returns:
            Boolean
        """
        return BlockUser.objects.filter(
            blocked_by=blocker,
            blocked_user=blocked
        ).exists()

    @staticmethod
    def get_blocked_users(user):
        """
        Get all users blocked by a specific user.
        
        Args:
            user: The user
            
        Returns:
            QuerySet of blocked users
        """
        return User.objects.filter(
            blocked_by_users__blocked_by=user
        )


class ChatNotificationService:
    """Service for managing chat notifications"""

    @staticmethod
    def read_all_notification_for_user(user, other_user):
        """
        Mark all unread notifications from a specific user as read.
        Similar to PHP readAllNotification method.
        
        Args:
            user: Current user (recipient)
            other_user: The user sending messages
        """
        # Mark conversations as read
        Conversation.objects.filter(
            to_user=user,
            from_user=other_user,
            status=Conversation.STATUS_UNREAD
        ).update(status=Conversation.STATUS_READ)

    @staticmethod
    def read_all_notification_for_group(user, group):
        """
        Mark all unread group messages as read for a user in a group.
        Similar to PHP readAllNotificationGroup method.
        
        Args:
            user: Current user
            group: The group
        """
        GroupMessageRecipient.objects.filter(
            user=user,
            group=group,
            read_at__isnull=True
        ).update(read_at=timezone.now())
