export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "admin" | "qa" | "designer" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "admin" | "qa" | "designer" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: "admin" | "qa" | "designer" | "viewer";
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          client_name: string;
          pole_code: string;
          status: "Submitted" | "In QA" | "Issues Found" | "Rework" | "Approved" | "Rejected";
          priority: "LOW" | "MED" | "HIGH";
          designer_id: string;
          qa_owner_id: string;
          created_by: string;
          current_revision: number;
          days_in_qa: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          pole_code: string;
          status?: "Submitted" | "In QA" | "Issues Found" | "Rework" | "Approved" | "Rejected";
          priority?: "LOW" | "MED" | "HIGH";
          designer_id: string;
          qa_owner_id: string;
          created_by: string;
          current_revision?: number;
          days_in_qa?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_name?: string;
          pole_code?: string;
          status?: "Submitted" | "In QA" | "Issues Found" | "Rework" | "Approved" | "Rejected";
          priority?: "LOW" | "MED" | "HIGH";
          designer_id?: string;
          qa_owner_id?: string;
          current_revision?: number;
          days_in_qa?: number;
          updated_at?: string;
        };
      };
      ticket_issues: {
        Row: {
          id: string;
          ticket_id: string;
          title: string;
          severity: "LOW" | "MED" | "HIGH";
          status: "Open" | "In Progress" | "Resolved";
          category: string;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          title: string;
          severity?: "LOW" | "MED" | "HIGH";
          status?: "Open" | "In Progress" | "Resolved";
          category: string;
          assigned_to?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          severity?: "LOW" | "MED" | "HIGH";
          status?: "Open" | "In Progress" | "Resolved";
          category?: string;
          assigned_to?: string | null;
        };
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      ticket_events: {
        Row: {
          id: string;
          ticket_id: string;
          actor_id: string | null;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          actor_id?: string | null;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          payload?: Json;
        };
      };
    };
  };
};
