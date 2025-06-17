export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cache: {
        Row: {
          created_at: string | null
          expires_at: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          key: string
          value: Json
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      channel_permissions: {
        Row: {
          can_change_info: boolean
          can_delete_messages: boolean
          can_edit_messages: boolean
          can_invite_users: boolean
          can_post_messages: boolean
          channel_id: string
          created_at: string | null
          id: string
          last_synced_at: string | null
          sync_error: string | null
          telegram_status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_change_info?: boolean
          can_delete_messages?: boolean
          can_edit_messages?: boolean
          can_invite_users?: boolean
          can_post_messages?: boolean
          channel_id: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          sync_error?: string | null
          telegram_status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_change_info?: boolean
          can_delete_messages?: boolean
          can_edit_messages?: boolean
          can_invite_users?: boolean
          can_post_messages?: boolean
          channel_id?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          sync_error?: string | null
          telegram_status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_permissions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "telegram_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          advertiser_inn: string
          advertiser_name: string
          created_at: string | null
          expires_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advertiser_inn: string
          advertiser_name: string
          created_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advertiser_inn?: string
          advertiser_name?: string
          created_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          operation: string
          related_payment_id: string | null
          related_post_id: string | null
          related_user_id: string | null
          response_body: string | null
          response_code: number | null
          service: string
          success: boolean
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation: string
          related_payment_id?: string | null
          related_post_id?: string | null
          related_user_id?: string | null
          response_body?: string | null
          response_code?: number | null
          service: string
          success: boolean
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          related_payment_id?: string | null
          related_post_id?: string | null
          related_user_id?: string | null
          response_body?: string | null
          response_code?: number | null
          service?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          message: string
          related_payment_id: string | null
          related_post_id: string | null
          sent_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          channel: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          message: string
          related_payment_id?: string | null
          related_post_id?: string | null
          sent_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          channel?: string
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          message?: string
          related_payment_id?: string | null
          related_post_id?: string | null
          sent_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_address: string | null
          email_enabled: boolean | null
          id: string
          ord_registered_enabled: boolean | null
          payment_failed_enabled: boolean | null
          post_failed_enabled: boolean | null
          post_published_enabled: boolean | null
          subscription_expiring_enabled: boolean | null
          telegram_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          ord_registered_enabled?: boolean | null
          payment_failed_enabled?: boolean | null
          post_failed_enabled?: boolean | null
          post_published_enabled?: boolean | null
          subscription_expiring_enabled?: boolean | null
          telegram_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          ord_registered_enabled?: boolean | null
          payment_failed_enabled?: boolean | null
          post_failed_enabled?: boolean | null
          post_published_enabled?: boolean | null
          subscription_expiring_enabled?: boolean | null
          telegram_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kopecks: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string | null
          user_id: string
          yookassa_invoice_id: string | null
          yookassa_payment_id: string
        }
        Insert: {
          amount_kopecks: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
          user_id: string
          yookassa_invoice_id?: string | null
          yookassa_payment_id: string
        }
        Update: {
          amount_kopecks?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
          user_id?: string
          yookassa_invoice_id?: string | null
          yookassa_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          click_rate: number | null
          clicks: number | null
          created_at: string | null
          forwards: number | null
          id: string
          post_id: string
          views: number | null
        }
        Insert: {
          click_rate?: number | null
          clicks?: number | null
          created_at?: string | null
          forwards?: number | null
          id?: string
          post_id: string
          views?: number | null
        }
        Update: {
          click_rate?: number | null
          clicks?: number | null
          created_at?: string | null
          forwards?: number | null
          id?: string
          post_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          post_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          post_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          advertiser_inn: string
          advertiser_name: string
          channel_id: string
          contract_id: string | null
          created_at: string | null
          creative_text: string
          erid: string | null
          id: string
          ord_status: Database["public"]["Enums"]["ord_status"] | null
          product_description: string
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          target_url: string | null
          telegram_message_id: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advertiser_inn: string
          advertiser_name: string
          channel_id: string
          contract_id?: string | null
          created_at?: string | null
          creative_text: string
          erid?: string | null
          id?: string
          ord_status?: Database["public"]["Enums"]["ord_status"] | null
          product_description: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          target_url?: string | null
          telegram_message_id?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advertiser_inn?: string
          advertiser_name?: string
          channel_id?: string
          contract_id?: string | null
          created_at?: string | null
          creative_text?: string
          erid?: string | null
          id?: string
          ord_status?: Database["public"]["Enums"]["ord_status"] | null
          product_description?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          target_url?: string | null
          telegram_message_id?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "telegram_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      public_stats_links: {
        Row: {
          branding: Json | null
          created_at: string | null
          expires_at: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          link_id: string
          max_views: number | null
          password_hash: string | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          branding?: Json | null
          created_at?: string | null
          expires_at?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          link_id: string
          max_views?: number | null
          password_hash?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          branding?: Json | null
          created_at?: string | null
          expires_at?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          link_id?: string
          max_views?: number | null
          password_hash?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_stats_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_channels: {
        Row: {
          bot_last_checked_at: string | null
          bot_status: Database["public"]["Enums"]["bot_status"] | null
          channel_title: string
          channel_username: string | null
          created_at: string | null
          disconnected_by_users: string[] | null
          error_message: string | null
          id: string
          is_active: boolean
          last_checked_at: string | null
          telegram_channel_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bot_last_checked_at?: string | null
          bot_status?: Database["public"]["Enums"]["bot_status"] | null
          channel_title: string
          channel_username?: string | null
          created_at?: string | null
          disconnected_by_users?: string[] | null
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          telegram_channel_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bot_last_checked_at?: string | null
          bot_status?: Database["public"]["Enums"]["bot_status"] | null
          channel_title?: string
          channel_username?: string | null
          created_at?: string | null
          disconnected_by_users?: string[] | null
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          telegram_channel_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          expires_at: string
          id: string
          max_channels: number
          max_posts_per_month: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_kopecks: number
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          max_channels: number
          max_posts_per_month: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_kopecks: number
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          max_channels?: number
          max_posts_per_month?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_kopecks?: number
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          last_login_at: string | null
          telegram_activated: boolean
          telegram_first_name: string | null
          telegram_id: number
          telegram_last_name: string | null
          telegram_username: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          telegram_activated?: boolean
          telegram_first_name?: string | null
          telegram_id: number
          telegram_last_name?: string | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          telegram_activated?: boolean
          telegram_first_name?: string | null
          telegram_id?: number
          telegram_last_name?: string | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_user_subscriptions: {
        Row: {
          cancelled_at: string | null
          company_name: string | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          max_channels: number | null
          max_posts_per_month: number | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          price_kopecks: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          telegram_username: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_with_analytics: {
        Row: {
          advertiser_inn: string | null
          advertiser_name: string | null
          analytics_updated_at: string | null
          channel_id: string | null
          click_rate: number | null
          clicks: number | null
          contract_id: string | null
          created_at: string | null
          creative_text: string | null
          erid: string | null
          forwards: number | null
          id: string | null
          ord_status: Database["public"]["Enums"]["ord_status"] | null
          product_description: string | null
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          target_url: string | null
          telegram_message_id: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "telegram_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_channel_stats: {
        Args: { channel_uuid: string; days_back?: number }
        Returns: {
          total_posts: number
          total_views: number
          total_clicks: number
          avg_ctr: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      bot_status: "active" | "pending_bot" | "bot_missing"
      notification_type:
        | "post_created"
        | "post_published"
        | "post_failed"
        | "ord_registered"
        | "ord_failed"
        | "subscription_expiring"
        | "payment_failed"
        | "channel_connected"
        | "channel_error"
      ord_status: "pending" | "registered" | "failed" | "expired"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      post_status: "draft" | "scheduled" | "published" | "failed" | "archived"
      subscription_plan: "FREE" | "BASIC" | "PRO" | "BUSINESS"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
      telegram_user_status: "creator" | "administrator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bot_status: ["active", "pending_bot", "bot_missing"],
      notification_type: [
        "post_created",
        "post_published",
        "post_failed",
        "ord_registered",
        "ord_failed",
        "subscription_expiring",
        "payment_failed",
        "channel_connected",
        "channel_error",
      ],
      ord_status: ["pending", "registered", "failed", "expired"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      post_status: ["draft", "scheduled", "published", "failed", "archived"],
      subscription_plan: ["FREE", "BASIC", "PRO", "BUSINESS"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      telegram_user_status: ["creator", "administrator"],
    },
  },
} as const
