'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChatSidebar from '@/components/utilities/chat/ChatSidebar';
import ChatWindow from '@/components/utilities/chat/ChatWindow';
import UserSearchModal from '@/components/utilities/chat/UserSearchModal';
import styles from './page.module.css';
import { chatRequest } from '@/lib/chatApi';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  username?: string;
}

interface Conversation {
  id: number;
  user_id: number;
  user: User;
  last_message?: string;
  last_message_at?: string;
  is_read?: boolean;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  user_count?: number;
  created_at?: string;
}

const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeUser, setActiveUser] = useState<Conversation | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalMode, setSearchModalMode] = useState<'single' | 'multiple'>('single');

  useEffect(() => {
    fetchConnectedUsers();
    fetchGroups();
  }, []);

  const fetchConnectedUsers = async () => {
    try {
      const data: any = await chatRequest({
        method: 'get',
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/chat/messages/connected_users/`,
      });
      const users = data?.users || data || [];
      const mappedConversations = (Array.isArray(users) ? users : []).map((user: User) => ({
        id: user.id,
        user_id: user.id,
        user,
      }));
      setConversations(mappedConversations);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const data: any = await chatRequest({
        method: 'get',
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/chat/groups/`,
      });
      setGroups(data?.results || data || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const handleOpenNewChat = () => {
    setSearchModalMode('single');
    setIsSearchModalOpen(true);
  };

  const handleOpenCreateGroup = () => {
    setSearchModalMode('multiple');
    setIsSearchModalOpen(true);
  };

  const handleSelectUser = (user: User) => {
    // Find or create conversation with this user
    const existing = conversations.find((c) => c.user_id === user.id);
    if (existing) {
      setActiveUser(existing);
    } else {
      // Create new conversation object for display
      const newConversation: Conversation = {
        id: user.id,
        user_id: user.id,
        user: user,
      };
      setActiveUser(newConversation);
      setConversations([...conversations, newConversation]);
    }
  };

  const handleCreateGroup = (group: Group) => {
    setGroups([...groups, group]);
    setActiveGroup(group);
    setActiveUser(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <ChatSidebar
          conversations={conversations}
          groups={groups}
          activeUser={activeUser}
          activeGroup={activeGroup}
          onSelectUser={(conversation) => {
            setActiveUser(conversation);
            setActiveGroup(null);
          }}
          onSelectGroup={(group) => {
            setActiveGroup(group);
            setActiveUser(null);
          }}
          onOpenNewChat={handleOpenNewChat}
          onOpenCreateGroup={handleOpenCreateGroup}
          onRefresh={() => {
            fetchConnectedUsers();
            fetchGroups();
          }}
        />
        <ChatWindow activeUser={activeUser || undefined} activeGroup={activeGroup || undefined} />
      </div>

      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        mode={searchModalMode}
        onSelectUser={handleSelectUser}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default ChatPage;
