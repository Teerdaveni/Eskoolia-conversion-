# Chat Module Implementation Guide

This document explains how to integrate the Chat module into the Django project.

## Overview

The Chat module provides:
- **One-to-One Messaging**: Direct messages between users
- **Group Chats**: Multi-party conversations with role-based access
- **User Invitations**: Connection system before messaging
- **File Sharing**: Support for images, documents, PDFs, and voice messages
- **Message Threading**: Reply to and forward messages
- **User Blocking**: Block users from contacting you
- **Read Status Tracking**: Track message read status
- **Online Status**: Track user availability

## Installation Steps

### 1. Add Chat App to Django Settings

Edit `backend/settings/base.py`:

```python
INSTALLED_APPS = [
    # ... existing apps ...
    'apps.chat',
]
```

### 2. Add Chat URLs to Project

Edit `backend/urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... existing URLs ...
    path('api/chat/', include('apps.chat.urls')),
]
```

### 3. Create and Run Migrations

```bash
# Generate migrations for chat models
python manage.py makemigrations chat

# Apply migrations to database
python manage.py migrate chat
```

## API Endpoints

### One-to-One Chat - `/api/chat/messages/`

#### List Messages
```
GET /api/chat/messages/
```
Returns all conversations for the current user.

#### Send Message
```
POST /api/chat/messages/
Content-Type: multipart/form-data

{
    "to_id": 5,
    "message": "Hello!",
    "file_attach": <binary_file>,  # Optional
    "reply": 1,  # Optional - reply to message ID
    "forward": 2  # Optional - forward message ID
}
```

#### Get Conversation with User
```
GET /api/chat/messages/conversation/?user_id=5
```
Returns all messages between current user and specified user.

#### Mark Read
```
POST /api/chat/messages/mark_read/

{
    "from_user_id": 5  # Mark all from this user as read
}
```

#### Forward Message
```
POST /api/chat/messages/forward/

{
    "from_id": 1,
    "to_id": 5,
    "forward": 2,
    "message": "Check this out!"
}
```

#### Get Files Shared
```
GET /api/chat/messages/files/?user_id=5
```
Returns all file attachments shared with a user.

#### Block User
```
POST /api/chat/messages/block_user/

{
    "user_id": 5
}
```

#### Unblock User
```
POST /api/chat/messages/unblock_user/

{
    "user_id": 5
}
```

#### Get Blocked Users
```
GET /api/chat/messages/blocked_users/
```

#### Connected Users
```
GET /api/chat/messages/connected_users/
```
Returns list of users the current user is connected with.

### Group Chat - `/api/chat/groups/`

#### List Groups
```
GET /api/chat/groups/
```
Returns all groups the current user is a member of.

#### Create Group
```
POST /api/chat/groups/

{
    "name": "Project Team",
    "description": "For project discussions",
    "users": [5, 6, 7],
    "photo_url": "https://...",
    "group_type": 1,  # 1=Open (anyone can send), 2=Closed (admin only)
    "privacy": 1  # 1=Public, 2=Private
}
```

#### Get Group Details
```
GET /api/chat/groups/{group_id}/
```
Returns group info and last 20 messages.

#### Delete Group (Admin Only)
```
DELETE /api/chat/groups/{group_id}/
```

#### Send Message to Group
```
POST /api/chat/groups/{group_id}/send/

{
    "message": "Hello group!",
    "file_attach": <binary_file>,  # Optional
    "reply": 1,  # Optional
    "forward": 2  # Optional
}
```

#### Add Members
```
POST /api/chat/groups/{group_id}/add_members/

{
    "user_ids": [8, 9, 10]
}
```

#### Remove Members
```
POST /api/chat/groups/{group_id}/remove_members/

{
    "user_ids": [8, 9]
}
```

#### Assign Role
```
POST /api/chat/groups/{group_id}/assign_role/

{
    "user_id": 5,
    "role": 1  # 1=Admin, 2=Moderator, 3=Member
}
```

#### Leave Group
```
POST /api/chat/groups/{group_id}/leave/
```

#### Delete Message from Group
```
POST /api/chat/groups/{group_id}/delete_message/

{
    "message_id": 123
}
```

### Invitations - `/api/chat/invitations/`

#### List Invitations
```
GET /api/chat/invitations/
```

#### Get Pending Invitations
```
GET /api/chat/invitations/pending/
```
Returns invitation requests sent to the current user.

#### Send Invitation
```
POST /api/chat/invitations/

{
    "to_user_id": 5
}
```

#### Accept Invitation
```
POST /api/chat/invitations/{invitation_id}/accept/
```

#### Decline Invitation
```
POST /api/chat/invitations/{invitation_id}/decline/
```

### User Status - `/api/chat/status/`

#### Set Online
```
POST /api/chat/status/set_online/
```

#### Set Offline
```
POST /api/chat/status/set_offline/
```

#### Get User Status
```
GET /api/chat/status/get_status/?user_id=5
```

## Models

### Conversation
One-to-one messages between users. Supports:
- Text messages
- File attachments (images, PDFs, documents, voice)
- Replies to other messages
- Forwarded messages
- Read/unread status
- Soft delete per user

### Group
Container for group conversations. Supports:
- Privacy levels (public/private)
- Group types (open/closed - who can send messages)
- Read-only mode
- Multiple admins and roles

### GroupUser
Membership relation with roles:
- Admin (1) - Full control
- Moderator (2) - Manage content
- Member (3) - Send messages

### GroupMessageRecipient
Tracks message delivery and read status in groups. Created for each member when a message is sent.

### Invitation
Connection invitations between users:
- Status: Pending, Connected, Blocked
- Two-way connection (both users have invitation)

### BlockUser
Tracks which users have blocked which other users.

### UserStatus
Tracks online/offline/away status of users.

## Services

Located in `apps/chat/services.py`:

### InvitationService
```python
from apps.chat.services import InvitationService

# Get connected users
connected = InvitationService.get_all_connected_users(user)

# Send invitation
inv = InvitationService.send_invitation(from_user, to_user)

# Accept invitation
InvitationService.accept_invitation(invitation, accepting_user)
```

### ConversationService
```python
from apps.chat.services import ConversationService

# Get conversation with user
convs = ConversationService.get_conversation_with_user(user1, user2)

# Mark as read
ConversationService.mark_conversations_as_read(reader, sender)

# Delete conversation
ConversationService.delete_conversation_for_user(conversation, user)
```

### GroupService
```python
from apps.chat.services import GroupService

# Get user's groups
groups = GroupService.get_user_groups(user)

# Create group
group = GroupService.create_group(
    "Team A",
    creator_user,
    [5, 6, 7],
    description="Team A discussions"
)

# Send message
conv = GroupService.send_group_message(
    group,
    sender,
    "Hello all!",
    message_type=Conversation.MESSAGE_TYPE_TEXT
)
```

## File Handling

Files are stored in `chat_files/` directory in the configured storage.

Supported file types:
- **Images**: jpg, jpeg, png, gif, webp
- **Documents**: doc, docx
- **PDFs**: pdf
- **Voice**: mp3, wav, m4a
- **Text**: Any file

## Permission Notes

- Users must be **invited and connected** to message each other
- Group **admins** can manage members and settings
- **Blocked users** cannot send messages
- In **read-only groups**, only admins can send messages
- Users can see group **history after joining**
- Users can **soft-delete messages** they sent or received

## Error Handling

All endpoints return proper HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response
- `400 Bad Request` - Validation error
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found

Error responses include error details:
```json
{
    "error": "Error message",
    "field": ["Specific field error"]
}
```

## Next Steps

1. **Add Django Admin Interface** (optional):
   ```python
   # apps/chat/admin.py
   from django.contrib import admin
   from .models import Conversation, Group, Invitation, BlockUser
   
   admin.site.register(Conversation)
   admin.site.register(Group)
   admin.site.register(Invitation)
   admin.site.register(BlockUser)
   ```

2. **Add Signals** for notifications (if using Django signals):
   ```python
   # apps/chat/signals.py
   from django.db.models.signals import post_save
   from django.dispatch import receiver
   from .models import Conversation
   
   @receiver(post_save, sender=Conversation)
   def notify_new_message(sender, instance, created, **kwargs):
       if created:
           # Send notification to recipient
           pass
   ```

3. **Add WebSocket Support** (optional, using channels):
   - Real-time message delivery
   - Live typing indicators
   - Online status updates

4. **Add Tests**:
   - Create `tests/` directory
   - Add test cases for each ViewSet
   - Test permissions and edge cases

## Differences from PHP

1. **No explicit "initial" field** - Django handles initial message detection differently
2. **UUID for Groups** - UUID is used instead of auto-increment for group IDs
3. **No custom Notification model** - Uses Django's built-in notification system
4. **Soft deletes** - Uses `deleted_at` field instead of SoftDeletes trait
5. **QuerySet optimization** - Uses `select_related` and `prefetch_related` for performance
6. **Serializers** - Reuses serializers for multiple response types instead of Transformers

## Performance Considerations

- **Indexes**: Composite indexes on frequently queried fields
- **Select related**: Foreign key relations are eagerly loaded
- **Prefetch related**: Many-to-many and reverse FK relations are prefetched
- **Pagination**: Large message lists should use pagination (implement offset/limit)
- **Database**: Consider archiving old messages for performance

## Security Notes

- All endpoints require authentication
- Authorization checks on group operations (admin/moderator)
- File uploads are stored with namespacing
- User cannot access other users' conversations without proper relationship
- Block feature prevents unwanted communication
