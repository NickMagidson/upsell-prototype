import 'server-only';

import { revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';

import {
    getChatByIdQuery,
    getChatsByUserIdQuery,
    getChatWithMessagesQuery,
    getDocumentByIdQuery,
    getDocumentsByIdQuery,
    getMessagesByChatIdQuery,
    getSessionQuery,
    getSuggestionsByDocumentIdQuery,
    getUserByIdQuery,
    getUserQuery,
    getVotesByChatIdQuery,
} from '@/db/queries';
import { createClient } from '@/lib/supabase/server';

const getSupabase = cache(() => createClient());

// Helper function to clear session cache
export const clearSessionCache = () => {
  revalidateTag('session');
  revalidateTag('user');
};

// Helper function to clear all user-related caches  
export const clearUserCaches = (userId?: string, email?: string) => {
  // Clear general session cache
  clearSessionCache();
  
  // Clear user-specific caches if we have the identifiers
  if (userId) {
    revalidateTag(`user_by_id_${userId.slice(2, 12)}`);
    revalidateTag(`user_${userId}_chats`);
  }
  
  if (email) {
    revalidateTag(`user_${email}`);
  }
};

export const getSession = async () => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getSessionQuery(supabase);
    },
    ['session'],
    {
      tags: [`session`],
      revalidate: 1, // Cache for only 1 second to prevent stale sessions
    }
  )();
};

export const getUserById = async (id: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getUserByIdQuery(supabase, id);
    },
    [`user_by_id`, id.slice(2, 12)],
    {
      tags: [`user_by_id_${id.slice(2, 12)}`],

      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getUser = async (email: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, email);
    },
    ['user', email],
    {
      tags: [`user_${email}`],
      revalidate: 3600, // Cache for 1 hour
    }
  )();
};

export const getChatById = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getChatByIdQuery(supabase, { id: chatId });
    },
    ['chat', chatId],
    {
      tags: [`chat_${chatId}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getChatsByUserId = async (userId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getChatsByUserIdQuery(supabase, { id: userId });
    },
    ['chats', userId],
    {
      tags: [`user_${userId}_chats`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getMessagesByChatId = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getMessagesByChatIdQuery(supabase, { id: chatId });
    },
    ['messages', chatId],
    {
      tags: [`chat_${chatId}_messages`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getVotesByChatId = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getVotesByChatIdQuery(supabase, { id: chatId });
    },
    ['votes', chatId],
    {
      tags: [`chat_${chatId}_votes`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getDocumentById = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getDocumentByIdQuery(supabase, { id: documentId });
    },
    ['document', documentId],
    {
      tags: [`document_${documentId}`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getDocumentsById = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getDocumentsByIdQuery(supabase, { id: documentId });
    },
    ['documents', documentId],
    {
      tags: [`document_${documentId}_versions`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getSuggestionsByDocumentId = async (documentId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getSuggestionsByDocumentIdQuery(supabase, {
        documentId: documentId,
      });
    },
    ['suggestions', documentId],
    {
      tags: [`document_${documentId}_suggestions`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};

export const getChatWithMessages = async (chatId: string) => {
  const supabase = await getSupabase();

  return unstable_cache(
    async () => {
      return getChatWithMessagesQuery(supabase, { id: chatId });
    },
    ['chat_with_messages', chatId],
    {
      tags: [`chat_${chatId}`, `chat_${chatId}_messages`],
      revalidate: 10, // Cache for 10 seconds
    }
  )();
};
