'use client';

import React, { useState, useMemo } from 'react';
import styles from './ChatSidebar.module.css';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

interface Conversation {
  id: number;
  user_id: number;
  user: User;
  last_message?: string;
  last_message_at?: string;
  is_read?: boolean;
  unread_count?: number;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  user_count?: number;
  member_count?: number;
  members?: Array<{ id?: number }>;
  created_at?: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  groups: Group[];
  activeUser: Conversation | null;
  activeGroup: Group | null;
  onSelectUser: (conversation: Conversation) => void;
  onSelectGroup: (group: Group) => void;
  onOpenNewChat: () => void;
  onOpenCreateGroup: () => void;
  onRefresh: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  groups,
  activeUser,
  activeGroup,
  onSelectUser,
  onSelectGroup,
  onOpenNewChat,
  onOpenCreateGroup,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.user.first_name.toLowerCase().includes(query) ||
        conv.user.last_name.toLowerCase().includes(query) ||
        (conv.user.email && conv.user.email.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups;
    }
    const query = searchQuery.toLowerCase();
    return groups.filter((group) =>
      group.name.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const getInitials = (user: User): string => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chats</h2>
        <button
          className={styles.newChatBtn}
          onClick={activeTab === 'groups' ? onOpenCreateGroup : onOpenNewChat}
          title={activeTab === 'groups' ? 'Create Group' : 'New Chat'}
        >
          ➕
        </button>
      </div>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Direct Messages
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'groups' ? styles.active : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.chatList}>
        {activeTab === 'users' ? (
          filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.chatItem} ${
                  activeUser?.id === conversation.id ? styles.active : ''
                }`}
                onClick={() => onSelectUser(conversation)}
              >
                <div className={styles.avatar}>
                  <div className={styles.avatarContent}>
                    {getInitials(conversation.user)}
                  </div>
                </div>
                <div className={styles.chatInfo}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>
                      {conversation.user.first_name} {conversation.user.last_name}
                    </span>
                    {(conversation.unread_count || 0) > 0 ? (
                      <>
                        <span className={styles.unreadDot} />
                        <span className={styles.unreadBadge}>{conversation.unread_count}</span>
                      </>
                    ) : null}
                  </div>
                  <span className={styles.email}>
                    {conversation.user.email || 'No email'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No conversations yet. Start a new chat!</p>
            </div>
          )
        ) : filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`${styles.chatItem} ${
                activeGroup?.id === group.id ? styles.active : ''
              }`}
              onClick={() => onSelectGroup(group)}
            >
              <div className={styles.avatar}>
                <div className={styles.groupAvatar}>👥</div>
              </div>
              <div className={styles.chatInfo}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{group.name}</span>
                </div>
                <span className={styles.email}>
                  {group.member_count ?? group.user_count ?? group.members?.length ?? 0} members
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No groups yet.</p>
            <button
              className={styles.createGroupBtn}
              onClick={onOpenCreateGroup}
            >
              Create a Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
