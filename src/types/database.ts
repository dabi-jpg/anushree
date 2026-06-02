export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MessageType = 'text' | 'image' | 'video' | 'voice';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type UserStatus = 'online' | 'offline' | 'away';

export interface Database {
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          email: string;
        };
        Insert: {
          email: string;
        };
        Update: {
          email?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          last_seen: string;
          status: UserStatus;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          last_seen?: string;
          status?: UserStatus;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          last_seen?: string;
          status?: UserStatus;
        };
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          updated_at?: string;
        };
      };
      conversation_members: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          message_type: MessageType;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
          checksum: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          message_type?: MessageType;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          checksum?: string | null;
        };
        Update: {
          content?: string | null;
          edited_at?: string | null;
          deleted_at?: string | null;
          checksum?: string | null;
        };
      };
      attachments: {
        Row: {
          id: string;
          message_id: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          message_id: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          created_at?: string;
          metadata?: Json;
        };
        Update: {
          metadata?: Json;
        };
      };
      read_receipts: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          read_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          event_type: string;
          ip_hash: string | null;
          user_agent_hash: string | null;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          event_type: string;
          ip_hash?: string | null;
          user_agent_hash?: string | null;
          created_at?: string;
          metadata?: Json;
        };
        Update: never;
      };
    };
    Functions: {
      mark_messages_read: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
        };
        Returns: void;
      };
      update_last_seen: {
        Args: {
          p_user_id: string;
        };
        Returns: void;
      };
    };
  };
}

// Helper types for use throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ReadReceipt = Database['public']['Tables']['read_receipts']['Row'];
export type AuditEvent = Database['public']['Tables']['audit_events']['Row'];

// Extended message with attachment info
export interface MessageWithAttachment extends Message {
  attachments: Attachment[];
  sender_profile?: Profile;
  read_receipts?: ReadReceipt[];
  status?: 'sending' | 'sent' | 'failed';
}
