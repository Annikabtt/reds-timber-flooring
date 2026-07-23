export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_permissions: {
        Row: {
          action_code: string
          created_at: string
          created_by: string | null
          description: string | null
          is_active: boolean
          is_system_permission: boolean
          module_code: string
          permission_code: string
          permission_id: string
          permission_name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          is_system_permission?: boolean
          module_code: string
          permission_code: string
          permission_id?: string
          permission_name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          is_system_permission?: boolean
          module_code?: string
          permission_code?: string
          permission_id?: string
          permission_name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          is_allowed: boolean
          permission_id: string
          role_id: string
          role_permission_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          is_allowed?: boolean
          permission_id: string
          role_id: string
          role_permission_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          is_allowed?: boolean
          permission_id?: string
          role_id?: string
          role_permission_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["permission_id"]
          },
          {
            foreignKeyName: "app_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      app_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          is_active: boolean
          is_system_role: boolean
          role_code: string
          role_id: string
          role_name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          is_system_role?: boolean
          role_code: string
          role_id?: string
          role_name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          is_system_role?: boolean
          role_code?: string
          role_id?: string
          role_name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_user_permission_overrides: {
        Row: {
          auth_user_id: string
          created_at: string
          created_by: string | null
          is_active: boolean
          is_allowed: boolean
          permission_id: string
          reason: string | null
          updated_at: string
          updated_by: string | null
          user_permission_override_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          is_allowed: boolean
          permission_id: string
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_permission_override_id?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          is_allowed?: boolean
          permission_id?: string
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_permission_override_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["permission_id"]
          },
        ]
      }
      app_user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          auth_user_id: string
          ended_at: string | null
          ended_by: string | null
          is_active: boolean
          notes: string | null
          role_id: string
          user_role_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          auth_user_id: string
          ended_at?: string | null
          ended_by?: string | null
          is_active?: boolean
          notes?: string | null
          role_id: string
          user_role_id?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          auth_user_id?: string
          ended_at?: string | null
          ended_by?: string | null
          is_active?: boolean
          notes?: string | null
          role_id?: string
          user_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      app_users: {
        Row: {
          account_status: string
          admin_notes: string | null
          app_user_id: string
          approved_at: string | null
          approved_by: string | null
          auth_user_id: string
          created_at: string
          created_by: string | null
          display_name: string | null
          email: string
          phone: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_status?: string
          admin_notes?: string | null
          app_user_id?: string
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email: string
          phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_status?: string
          admin_notes?: string | null
          app_user_id?: string
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email?: string
          phone?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_id: string
          address_line1: string
          address_line2: string | null
          address_type: string
          country: string
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          is_primary: boolean
          postcode: string | null
          state: string | null
          suburb: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_id?: string
          address_line1: string
          address_line2?: string | null
          address_type: string
          country?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          postcode?: string | null
          state?: string | null
          suburb?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_id?: string
          address_line1?: string
          address_line2?: string | null
          address_type?: string
          country?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          postcode?: string | null
          state?: string | null
          suburb?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          contact_id: string
          contact_name: string
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          email: string | null
          is_active: boolean
          is_deleted: boolean
          is_primary: boolean
          phone: string | null
          position: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_id?: string
          contact_name: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          email?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          phone?: string | null
          position?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_id?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          email?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          phone?: string | null
          position?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_financial_settings: {
        Row: {
          account_hold_reason: string | null
          created_at: string
          created_by: string | null
          credit_limit: number | null
          customer_financial_setting_id: string
          customer_id: string
          default_currency: string
          default_sales_account_code: string | null
          default_tax_type: string | null
          discount_percent: number
          invoice_delivery_method: string
          is_account_on_hold: boolean
          line_amount_type: string
          payment_terms_days: number
          payment_terms_type: string
          statement_delivery_method: string
          updated_at: string
          updated_by: string | null
          xero_branding_theme_id: string | null
          xero_branding_theme_name: string | null
          xero_contact_id: string | null
          xero_contact_name: string | null
          xero_contact_number: string | null
          xero_last_synced_at: string | null
          xero_status: string
          xero_sync_error: string | null
        }
        Insert: {
          account_hold_reason?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          customer_financial_setting_id?: string
          customer_id: string
          default_currency?: string
          default_sales_account_code?: string | null
          default_tax_type?: string | null
          discount_percent?: number
          invoice_delivery_method?: string
          is_account_on_hold?: boolean
          line_amount_type?: string
          payment_terms_days?: number
          payment_terms_type?: string
          statement_delivery_method?: string
          updated_at?: string
          updated_by?: string | null
          xero_branding_theme_id?: string | null
          xero_branding_theme_name?: string | null
          xero_contact_id?: string | null
          xero_contact_name?: string | null
          xero_contact_number?: string | null
          xero_last_synced_at?: string | null
          xero_status?: string
          xero_sync_error?: string | null
        }
        Update: {
          account_hold_reason?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          customer_financial_setting_id?: string
          customer_id?: string
          default_currency?: string
          default_sales_account_code?: string | null
          default_tax_type?: string | null
          discount_percent?: number
          invoice_delivery_method?: string
          is_account_on_hold?: boolean
          line_amount_type?: string
          payment_terms_days?: number
          payment_terms_type?: string
          statement_delivery_method?: string
          updated_at?: string
          updated_by?: string | null
          xero_branding_theme_id?: string | null
          xero_branding_theme_name?: string | null
          xero_contact_id?: string | null
          xero_contact_name?: string | null
          xero_contact_number?: string | null
          xero_last_synced_at?: string | null
          xero_status?: string
          xero_sync_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_financial_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_invoice_items: {
        Row: {
          created_at: string
          customer_invoice_id: string
          customer_invoice_item_id: string
          description: string
          line_no: number
          line_total: number
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          customer_invoice_id: string
          customer_invoice_item_id?: string
          description: string
          line_no: number
          line_total?: number
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          customer_invoice_id?: string
          customer_invoice_item_id?: string
          description?: string
          line_no?: number
          line_total?: number
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoice_items_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoice_items_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
        ]
      }
      customer_invoices: {
        Row: {
          balance_amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          customer_invoice_id: string
          deleted_at: string | null
          due_date: string
          invoice_date: string
          invoice_no: string
          invoice_status: string
          is_deleted: boolean
          notes: string | null
          paid_amount: number
          project_id: string | null
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
          xero_exported: boolean
          xero_exported_at: string | null
        }
        Insert: {
          balance_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_invoice_id?: string
          deleted_at?: string | null
          due_date: string
          invoice_date?: string
          invoice_no: string
          invoice_status?: string
          is_deleted?: boolean
          notes?: string | null
          paid_amount?: number
          project_id?: string | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Update: {
          balance_amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_invoice_id?: string
          deleted_at?: string | null
          due_date?: string
          invoice_date?: string
          invoice_no?: string
          invoice_status?: string
          is_deleted?: boolean
          notes?: string | null
          paid_amount?: number
          project_id?: string | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      customer_payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          customer_invoice_id: string
          customer_payment_allocation_id: string
          customer_payment_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          customer_invoice_id: string
          customer_payment_allocation_id?: string
          customer_payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          customer_invoice_id?: string
          customer_payment_allocation_id?: string
          customer_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payment_allocations_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_payment_allocations_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_payment_allocations_customer_payment_id_fkey"
            columns: ["customer_payment_id"]
            isOneToOne: false
            referencedRelation: "customer_payments"
            referencedColumns: ["customer_payment_id"]
          },
        ]
      }
      customer_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          customer_payment_id: string
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          payment_date: string
          payment_method: string
          payment_no: string
          reference_no: string | null
          updated_at: string
          updated_by: string | null
          xero_exported: boolean
          xero_exported_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_payment_id?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_no: string
          reference_no?: string | null
          updated_at?: string
          updated_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_payment_id?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_no?: string
          reference_no?: string | null
          updated_at?: string
          updated_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          abn: string | null
          created_at: string
          created_by: string | null
          customer_code: string
          customer_id: string
          customer_name: string
          customer_type: string
          deleted_at: string | null
          email: string | null
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          phone: string | null
          price_book_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          abn?: string | null
          created_at?: string
          created_by?: string | null
          customer_code: string
          customer_id?: string
          customer_name: string
          customer_type: string
          deleted_at?: string | null
          email?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          phone?: string | null
          price_book_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          abn?: string | null
          created_at?: string
          created_by?: string | null
          customer_code?: string
          customer_id?: string
          customer_name?: string
          customer_type?: string
          deleted_at?: string | null
          email?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          phone?: string | null
          price_book_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_report_activities: {
        Row: {
          activity_type_id: string
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          calculated_amount: number
          created_at: string
          daily_report_activity_id: string
          notes: string | null
          pay_basis: string
          rate: number
          rejected_reason: string | null
          report_id: string
          reported_quantity: number
          sort_order: number
          uom_code: string | null
        }
        Insert: {
          activity_type_id: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          calculated_amount?: number
          created_at?: string
          daily_report_activity_id?: string
          notes?: string | null
          pay_basis?: string
          rate?: number
          rejected_reason?: string | null
          report_id: string
          reported_quantity?: number
          sort_order?: number
          uom_code?: string | null
        }
        Update: {
          activity_type_id?: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          calculated_amount?: number
          created_at?: string
          daily_report_activity_id?: string
          notes?: string | null
          pay_basis?: string
          rate?: number
          rejected_reason?: string | null
          report_id?: string
          reported_quantity?: number
          sort_order?: number
          uom_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_activities_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "work_activity_types"
            referencedColumns: ["activity_type_id"]
          },
          {
            foreignKeyName: "daily_report_activities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "daily_report_activities_uom_code_fkey"
            columns: ["uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      daily_report_photos: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          caption: string | null
          created_at: string
          deleted_at: string | null
          is_deleted: boolean
          photo_id: string
          photo_url: string
          rejected_reason: string | null
          report_id: string
          sort_order: number | null
          taken_at: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          is_deleted?: boolean
          photo_id?: string
          photo_url: string
          rejected_reason?: string | null
          report_id: string
          sort_order?: number | null
          taken_at?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          is_deleted?: boolean
          photo_id?: string
          photo_url?: string
          rejected_reason?: string | null
          report_id?: string
          sort_order?: number | null
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["report_id"]
          },
        ]
      }
      daily_report_workers: {
        Row: {
          activity_type_id: string | null
          attendance_status: string | null
          completed_quantity: number
          created_at: string
          daily_report_worker_id: string
          employee_id: string
          notes: string | null
          ot_completed_quantity: number | null
          ot_finish: string | null
          ot_start: string | null
          overtime_hours: number
          regular_hours: number
          replaces_work_assignment_id: string | null
          report_id: string
          updated_at: string
          work_assignment_id: string | null
          worker_role: string | null
          worker_source: string | null
        }
        Insert: {
          activity_type_id?: string | null
          attendance_status?: string | null
          completed_quantity?: number
          created_at?: string
          daily_report_worker_id?: string
          employee_id: string
          notes?: string | null
          ot_completed_quantity?: number | null
          ot_finish?: string | null
          ot_start?: string | null
          overtime_hours?: number
          regular_hours?: number
          replaces_work_assignment_id?: string | null
          report_id: string
          updated_at?: string
          work_assignment_id?: string | null
          worker_role?: string | null
          worker_source?: string | null
        }
        Update: {
          activity_type_id?: string | null
          attendance_status?: string | null
          completed_quantity?: number
          created_at?: string
          daily_report_worker_id?: string
          employee_id?: string
          notes?: string | null
          ot_completed_quantity?: number | null
          ot_finish?: string | null
          ot_start?: string | null
          overtime_hours?: number
          regular_hours?: number
          replaces_work_assignment_id?: string | null
          report_id?: string
          updated_at?: string
          work_assignment_id?: string | null
          worker_role?: string | null
          worker_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_workers_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "work_activity_types"
            referencedColumns: ["activity_type_id"]
          },
          {
            foreignKeyName: "daily_report_workers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "daily_report_workers_replaces_work_assignment_id_fkey"
            columns: ["replaces_work_assignment_id"]
            isOneToOne: false
            referencedRelation: "work_assignments"
            referencedColumns: ["work_assignment_id"]
          },
          {
            foreignKeyName: "daily_report_workers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "daily_report_workers_work_assignment_id_fkey"
            columns: ["work_assignment_id"]
            isOneToOne: false
            referencedRelation: "work_assignments"
            referencedColumns: ["work_assignment_id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          approval_status: string
          area_id: string | null
          completed_quantity: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_deleted: boolean
          issues_found: string | null
          next_actions: string | null
          notes: string | null
          progress_percent: number | null
          project_id: string
          report_date: string
          report_id: string
          site_id: string
          updated_at: string
          updated_by: string | null
          weather_condition: string | null
          work_completed: string | null
          work_order_id: string | null
          workers_count: number | null
        }
        Insert: {
          approval_status?: string
          area_id?: string | null
          completed_quantity?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          issues_found?: string | null
          next_actions?: string | null
          notes?: string | null
          progress_percent?: number | null
          project_id: string
          report_date: string
          report_id?: string
          site_id: string
          updated_at?: string
          updated_by?: string | null
          weather_condition?: string | null
          work_completed?: string | null
          work_order_id?: string | null
          workers_count?: number | null
        }
        Update: {
          approval_status?: string
          area_id?: string | null
          completed_quantity?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          issues_found?: string | null
          next_actions?: string | null
          notes?: string | null
          progress_percent?: number | null
          project_id?: string
          report_date?: string
          report_id?: string
          site_id?: string
          updated_at?: string
          updated_by?: string | null
          weather_condition?: string | null
          work_completed?: string | null
          work_order_id?: string | null
          workers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "daily_reports_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "daily_reports_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          created_at: string
          current_number: number
          document_type: string
          prefix: string
          reset_monthly: boolean
          sequence_id: string
          updated_at: string
          year_month: string | null
        }
        Insert: {
          created_at?: string
          current_number?: number
          document_type: string
          prefix: string
          reset_monthly?: boolean
          sequence_id?: string
          updated_at?: string
          year_month?: string | null
        }
        Update: {
          created_at?: string
          current_number?: number
          document_type?: string
          prefix?: string
          reset_monthly?: boolean
          sequence_id?: string
          updated_at?: string
          year_month?: string | null
        }
        Relationships: []
      }
      employee_pay_rates: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          employee_id: string
          is_active: boolean
          notes: string | null
          pay_method: string
          pay_rate_id: string
          rate_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from: string
          employee_id: string
          is_active?: boolean
          notes?: string | null
          pay_method: string
          pay_rate_id?: string
          rate_amount: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          employee_id?: string
          is_active?: boolean
          notes?: string | null
          pay_method?: string
          pay_rate_id?: string
          rate_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_pay_rates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_user_id: string | null
          bank_account_name: string | null
          bank_account_no: string | null
          bank_bsb: string | null
          bank_name: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          employee_code: string
          employee_id: string
          employment_type: string
          end_date: string | null
          first_name: string
          is_active: boolean
          is_deleted: boolean
          last_name: string
          pay_method: string | null
          pay_rate: number | null
          phone: string | null
          start_date: string | null
          tax_file_number: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auth_user_id?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_bsb?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          employee_code?: string
          employee_id?: string
          employment_type: string
          end_date?: string | null
          first_name: string
          is_active?: boolean
          is_deleted?: boolean
          last_name: string
          pay_method?: string | null
          pay_rate?: number | null
          phone?: string | null
          start_date?: string | null
          tax_file_number?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auth_user_id?: string | null
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_bsb?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          employee_code?: string
          employee_id?: string
          employment_type?: string
          end_date?: string | null
          first_name?: string
          is_active?: boolean
          is_deleted?: boolean
          last_name?: string
          pay_method?: string | null
          pay_rate?: number | null
          phone?: string | null
          start_date?: string | null
          tax_file_number?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      invoice_sources: {
        Row: {
          created_at: string
          customer_invoice_id: string
          invoice_source_id: string
          source_amount: number
          source_id: string
          source_type: string
        }
        Insert: {
          created_at?: string
          customer_invoice_id: string
          invoice_source_id?: string
          source_amount?: number
          source_id: string
          source_type: string
        }
        Update: {
          created_at?: string
          customer_invoice_id?: string
          invoice_source_id?: string
          source_amount?: number
          source_id?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sources_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "invoice_sources_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
        ]
      }
      material_requirement_line_adjustments: {
        Row: {
          adjustment_no: number
          adjustment_reason: string
          adjustment_type: string
          after_snapshot: Json
          approval_required: boolean
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          base_quantity_change: number
          before_snapshot: Json | null
          commercial_impact: string
          created_at: string
          created_by: string | null
          material_requirement_line_adjustment_id: string
          material_requirement_line_id: string
          variation_required: boolean
        }
        Insert: {
          adjustment_no: number
          adjustment_reason: string
          adjustment_type: string
          after_snapshot: Json
          approval_required?: boolean
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          base_quantity_change?: number
          before_snapshot?: Json | null
          commercial_impact?: string
          created_at?: string
          created_by?: string | null
          material_requirement_line_adjustment_id?: string
          material_requirement_line_id: string
          variation_required?: boolean
        }
        Update: {
          adjustment_no?: number
          adjustment_reason?: string
          adjustment_type?: string
          after_snapshot?: Json
          approval_required?: boolean
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          base_quantity_change?: number
          before_snapshot?: Json | null
          commercial_impact?: string
          created_at?: string
          created_by?: string | null
          material_requirement_line_adjustment_id?: string
          material_requirement_line_id?: string
          variation_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "material_requirement_line_adjustments_line_id_fkey"
            columns: ["material_requirement_line_id"]
            isOneToOne: false
            referencedRelation: "material_requirement_lines"
            referencedColumns: ["material_requirement_line_id"]
          },
        ]
      }
      material_requirement_lines: {
        Row: {
          allow_fractional_quantity: boolean
          base_uom_code: string
          commercial_impact: string
          commercial_notes: string | null
          commercial_reviewed_at: string | null
          commercial_reviewed_by: string | null
          conversion_factor_to_base: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          exclusion_reason: string | null
          is_active: boolean
          is_deleted: boolean
          line_no: number
          line_origin: string
          line_status: string
          material_requirement_id: string
          material_requirement_line_id: string
          notes: string | null
          preferred_supplier_id: string | null
          product_id: string | null
          project_area_id: string | null
          required_base_quantity: number
          required_base_quantity_before_waste: number
          required_by_date: string | null
          requirement_quantity: number
          requirement_uom_code: string
          source_allow_fractional_quantity: boolean
          source_base_quantity: number
          source_base_uom_code: string | null
          source_conversion_factor: number
          source_description: string
          source_is_optional: boolean
          source_product_code: string | null
          source_product_id: string | null
          source_product_name: string | null
          source_quantity: number
          source_quotation_line_id: string | null
          source_revision_line_id: string | null
          source_uom_code: string | null
          source_variation_line_id: string | null
          updated_at: string
          updated_by: string | null
          variation_reference: string | null
          variation_required: boolean
          variation_status: string
          waste_base_quantity: number
          waste_percent: number
        }
        Insert: {
          allow_fractional_quantity?: boolean
          base_uom_code: string
          commercial_impact?: string
          commercial_notes?: string | null
          commercial_reviewed_at?: string | null
          commercial_reviewed_by?: string | null
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          exclusion_reason?: string | null
          is_active?: boolean
          is_deleted?: boolean
          line_no: number
          line_origin?: string
          line_status?: string
          material_requirement_id: string
          material_requirement_line_id?: string
          notes?: string | null
          preferred_supplier_id?: string | null
          product_id?: string | null
          project_area_id?: string | null
          required_base_quantity?: number
          required_base_quantity_before_waste?: number
          required_by_date?: string | null
          requirement_quantity?: number
          requirement_uom_code: string
          source_allow_fractional_quantity?: boolean
          source_base_quantity?: number
          source_base_uom_code?: string | null
          source_conversion_factor?: number
          source_description: string
          source_is_optional?: boolean
          source_product_code?: string | null
          source_product_id?: string | null
          source_product_name?: string | null
          source_quantity?: number
          source_quotation_line_id?: string | null
          source_revision_line_id?: string | null
          source_uom_code?: string | null
          source_variation_line_id?: string | null
          updated_at?: string
          updated_by?: string | null
          variation_reference?: string | null
          variation_required?: boolean
          variation_status?: string
          waste_base_quantity?: number
          waste_percent?: number
        }
        Update: {
          allow_fractional_quantity?: boolean
          base_uom_code?: string
          commercial_impact?: string
          commercial_notes?: string | null
          commercial_reviewed_at?: string | null
          commercial_reviewed_by?: string | null
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          exclusion_reason?: string | null
          is_active?: boolean
          is_deleted?: boolean
          line_no?: number
          line_origin?: string
          line_status?: string
          material_requirement_id?: string
          material_requirement_line_id?: string
          notes?: string | null
          preferred_supplier_id?: string | null
          product_id?: string | null
          project_area_id?: string | null
          required_base_quantity?: number
          required_base_quantity_before_waste?: number
          required_by_date?: string | null
          requirement_quantity?: number
          requirement_uom_code?: string
          source_allow_fractional_quantity?: boolean
          source_base_quantity?: number
          source_base_uom_code?: string | null
          source_conversion_factor?: number
          source_description?: string
          source_is_optional?: boolean
          source_product_code?: string | null
          source_product_id?: string | null
          source_product_name?: string | null
          source_quantity?: number
          source_quotation_line_id?: string | null
          source_revision_line_id?: string | null
          source_uom_code?: string | null
          source_variation_line_id?: string | null
          updated_at?: string
          updated_by?: string | null
          variation_reference?: string | null
          variation_required?: boolean
          variation_status?: string
          waste_base_quantity?: number
          waste_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_requirement_lines_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "material_requirement_lines_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_requirement_id_fkey"
            columns: ["material_requirement_id"]
            isOneToOne: false
            referencedRelation: "material_requirements"
            referencedColumns: ["material_requirement_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_requirement_uom_code_fkey"
            columns: ["requirement_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "material_requirement_lines_source_base_uom_code_fkey"
            columns: ["source_base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "material_requirement_lines_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_source_quotation_line_id_fkey"
            columns: ["source_quotation_line_id"]
            isOneToOne: false
            referencedRelation: "quotation_lines"
            referencedColumns: ["quotation_line_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_source_revision_line_id_fkey"
            columns: ["source_revision_line_id"]
            isOneToOne: false
            referencedRelation: "quotation_revision_lines"
            referencedColumns: ["revision_line_id"]
          },
          {
            foreignKeyName: "material_requirement_lines_source_uom_code_fkey"
            columns: ["source_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "material_requirement_lines_source_variation_line_id_fkey"
            columns: ["source_variation_line_id"]
            isOneToOne: false
            referencedRelation: "variation_lines"
            referencedColumns: ["variation_line_id"]
          },
        ]
      }
      material_requirement_procurement_links: {
        Row: {
          base_uom_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          link_status: string
          link_type: string
          linked_base_quantity: number
          material_requirement_line_id: string
          material_requirement_procurement_link_id: string
          notes: string | null
          purchase_order_line_id: string | null
          stock_lot_id: string | null
          stock_movement_id: string | null
          stock_request_item_id: string | null
          supplier_delivery_item_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_uom_code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          link_status?: string
          link_type: string
          linked_base_quantity: number
          material_requirement_line_id: string
          material_requirement_procurement_link_id?: string
          notes?: string | null
          purchase_order_line_id?: string | null
          stock_lot_id?: string | null
          stock_movement_id?: string | null
          stock_request_item_id?: string | null
          supplier_delivery_item_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_uom_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          link_status?: string
          link_type?: string
          linked_base_quantity?: number
          material_requirement_line_id?: string
          material_requirement_procurement_link_id?: string
          notes?: string | null
          purchase_order_line_id?: string | null
          stock_lot_id?: string | null
          stock_movement_id?: string | null
          stock_request_item_id?: string | null
          supplier_delivery_item_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_requirement_procurement_links_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "material_requirement_procurement_links_line_id_fkey"
            columns: ["material_requirement_line_id"]
            isOneToOne: false
            referencedRelation: "material_requirement_lines"
            referencedColumns: ["material_requirement_line_id"]
          },
          {
            foreignKeyName: "material_requirement_procurement_links_purchase_order_line_id_f"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["purchase_order_line_id"]
          },
          {
            foreignKeyName: "material_requirement_procurement_links_stock_lot_id_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "material_requirement_procurement_links_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
          {
            foreignKeyName: "material_requirement_procurement_links_stock_request_item_id_fk"
            columns: ["stock_request_item_id"]
            isOneToOne: false
            referencedRelation: "stock_request_items"
            referencedColumns: ["stock_request_item_id"]
          },
          {
            foreignKeyName: "material_requirement_procurement_links_supplier_delivery_item_i"
            columns: ["supplier_delivery_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_items"
            referencedColumns: ["supplier_delivery_item_id"]
          },
        ]
      }
      material_requirements: {
        Row: {
          accepted_revision_id: string | null
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          delivery_destination_type: string
          delivery_stock_location_id: string | null
          is_active: boolean
          is_deleted: boolean
          material_requirement_id: string
          material_requirement_no: string
          notes: string | null
          project_id: string
          quotation_id: string | null
          ready_at: string | null
          ready_by: string | null
          required_by_date: string | null
          requirement_date: string
          requirement_status: string
          responsible_auth_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          site_id: string | null
          source_type: string
          source_variation_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_revision_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_destination_type?: string
          delivery_stock_location_id?: string | null
          is_active?: boolean
          is_deleted?: boolean
          material_requirement_id?: string
          material_requirement_no: string
          notes?: string | null
          project_id: string
          quotation_id?: string | null
          ready_at?: string | null
          ready_by?: string | null
          required_by_date?: string | null
          requirement_date?: string
          requirement_status?: string
          responsible_auth_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string | null
          source_type: string
          source_variation_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_revision_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_destination_type?: string
          delivery_stock_location_id?: string | null
          is_active?: boolean
          is_deleted?: boolean
          material_requirement_id?: string
          material_requirement_no?: string
          notes?: string | null
          project_id?: string
          quotation_id?: string | null
          ready_at?: string | null
          ready_by?: string | null
          required_by_date?: string | null
          requirement_date?: string
          requirement_status?: string
          responsible_auth_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string | null
          source_type?: string
          source_variation_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_requirements_accepted_revision_id_fkey"
            columns: ["accepted_revision_id"]
            isOneToOne: false
            referencedRelation: "quotation_revisions"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "material_requirements_delivery_stock_location_id_fkey"
            columns: ["delivery_stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "material_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "material_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "material_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "material_requirements_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "material_requirements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "material_requirements_source_variation_id_fkey"
            columns: ["source_variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["variation_id"]
          },
        ]
      }
      material_supplier_links: {
        Row: {
          created_at: string
          created_by: string | null
          currency_code: string
          default_cost_price: number | null
          default_tax_type: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          is_preferred: boolean
          last_purchase_date: string | null
          last_purchase_price: number | null
          lead_time_days: number | null
          material_supplier_link_id: string
          minimum_order_quantity: number | null
          order_multiple: number | null
          price_effective_from: string | null
          price_effective_to: string | null
          product_id: string
          purchase_uom_code: string | null
          supplier_id: string
          supplier_product_code: string | null
          supplier_product_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency_code?: string
          default_cost_price?: number | null
          default_tax_type?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_preferred?: boolean
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          lead_time_days?: number | null
          material_supplier_link_id?: string
          minimum_order_quantity?: number | null
          order_multiple?: number | null
          price_effective_from?: string | null
          price_effective_to?: string | null
          product_id: string
          purchase_uom_code?: string | null
          supplier_id: string
          supplier_product_code?: string | null
          supplier_product_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency_code?: string
          default_cost_price?: number | null
          default_tax_type?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_preferred?: boolean
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          lead_time_days?: number | null
          material_supplier_link_id?: string
          minimum_order_quantity?: number | null
          order_multiple?: number | null
          price_effective_from?: string | null
          price_effective_to?: string | null
          product_id?: string
          purchase_uom_code?: string | null
          supplier_id?: string
          supplier_product_code?: string | null
          supplier_product_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_supplier_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "material_supplier_links_purchase_uom_code_fkey"
            columns: ["purchase_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "material_supplier_links_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          allowance_amount: number
          approved_at: string | null
          approved_by: string | null
          base_amount: number
          created_at: string
          created_by: string | null
          deduction_amount: number
          deleted_at: string | null
          employee_id: string
          gross_amount: number
          is_deleted: boolean
          net_amount: number
          notes: string | null
          overtime_amount: number
          overtime_hours: number
          pay_method: string
          payroll_entry_id: string
          payroll_period_id: string
          regular_hours: number
          status: string
          tax_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowance_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          created_at?: string
          created_by?: string | null
          deduction_amount?: number
          deleted_at?: string | null
          employee_id: string
          gross_amount?: number
          is_deleted?: boolean
          net_amount?: number
          notes?: string | null
          overtime_amount?: number
          overtime_hours?: number
          pay_method: string
          payroll_entry_id?: string
          payroll_period_id: string
          regular_hours?: number
          status?: string
          tax_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowance_amount?: number
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          created_at?: string
          created_by?: string | null
          deduction_amount?: number
          deleted_at?: string | null
          employee_id?: string
          gross_amount?: number
          is_deleted?: boolean
          net_amount?: number
          notes?: string | null
          overtime_amount?: number
          overtime_hours?: number
          pay_method?: string
          payroll_entry_id?: string
          payroll_period_id?: string
          regular_hours?: number
          status?: string
          tax_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["payroll_period_id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_summary"
            referencedColumns: ["payroll_period_id"]
          },
        ]
      }
      payroll_payment_lines: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          employee_id: string
          is_deleted: boolean
          notes: string | null
          payroll_entry_id: string
          payroll_payment_id: string
          payroll_payment_line_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          employee_id: string
          is_deleted?: boolean
          notes?: string | null
          payroll_entry_id: string
          payroll_payment_id: string
          payroll_payment_line_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          employee_id?: string
          is_deleted?: boolean
          notes?: string | null
          payroll_entry_id?: string
          payroll_payment_id?: string
          payroll_payment_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_payment_lines_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "payroll_payment_lines_payroll_entry_id_fkey"
            columns: ["payroll_entry_id"]
            isOneToOne: false
            referencedRelation: "payroll_entries"
            referencedColumns: ["payroll_entry_id"]
          },
          {
            foreignKeyName: "payroll_payment_lines_payroll_payment_id_fkey"
            columns: ["payroll_payment_id"]
            isOneToOne: false
            referencedRelation: "payroll_payments"
            referencedColumns: ["payroll_payment_id"]
          },
        ]
      }
      payroll_payments: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          payment_date: string
          payment_method: string
          payroll_payment_id: string
          payroll_payment_no: string
          payroll_period_id: string
          reference_no: string | null
          status: string
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payroll_payment_id?: string
          payroll_payment_no: string
          payroll_period_id: string
          reference_no?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payroll_payment_id?: string
          payroll_payment_no?: string
          payroll_period_id?: string
          reference_no?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_payments_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["payroll_period_id"]
          },
          {
            foreignKeyName: "payroll_payments_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_summary"
            referencedColumns: ["payroll_period_id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          end_date: string
          is_deleted: boolean
          notes: string | null
          payroll_period_id: string
          period_name: string
          period_no: string
          period_type: string
          start_date: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date: string
          is_deleted?: boolean
          notes?: string | null
          payroll_period_id?: string
          period_name: string
          period_no: string
          period_type: string
          start_date: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string
          is_deleted?: boolean
          notes?: string | null
          payroll_period_id?: string
          period_name?: string
          period_no?: string
          period_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      price_book_lines: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          effective_from: string | null
          effective_to: string | null
          is_active: boolean
          is_deleted: boolean
          minimum_price: number | null
          price_book_id: string
          price_book_line_id: string
          product_id: string
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_active?: boolean
          is_deleted?: boolean
          minimum_price?: number | null
          price_book_id: string
          price_book_line_id?: string
          product_id: string
          unit_price: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_active?: boolean
          is_deleted?: boolean
          minimum_price?: number | null
          price_book_id?: string
          price_book_line_id?: string
          product_id?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_book_lines_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["price_book_id"]
          },
          {
            foreignKeyName: "price_book_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      price_books: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          is_active: boolean
          is_default: boolean
          is_deleted: boolean
          price_book_code: string
          price_book_id: string
          price_book_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          price_book_code: string
          price_book_id?: string
          price_book_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          price_book_code?: string
          price_book_id?: string
          price_book_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_attribute_definitions: {
        Row: {
          attribute_code: string
          attribute_id: string
          attribute_name: string
          created_at: string
          created_by: string | null
          data_type: string
          default_value: Json | null
          deleted_at: string | null
          description: string | null
          help_text: string | null
          is_active: boolean
          is_deleted: boolean
          is_filterable: boolean
          is_searchable: boolean
          placeholder: string | null
          sort_order: number
          unit_uom_code: string | null
          updated_at: string
          updated_by: string | null
          validation_rules: Json
        }
        Insert: {
          attribute_code: string
          attribute_id?: string
          attribute_name: string
          created_at?: string
          created_by?: string | null
          data_type: string
          default_value?: Json | null
          deleted_at?: string | null
          description?: string | null
          help_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_filterable?: boolean
          is_searchable?: boolean
          placeholder?: string | null
          sort_order?: number
          unit_uom_code?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json
        }
        Update: {
          attribute_code?: string
          attribute_id?: string
          attribute_name?: string
          created_at?: string
          created_by?: string | null
          data_type?: string
          default_value?: Json | null
          deleted_at?: string | null
          description?: string | null
          help_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_filterable?: boolean
          is_searchable?: boolean
          placeholder?: string | null
          sort_order?: number
          unit_uom_code?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_definitions_unit_uom_code_fkey"
            columns: ["unit_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      product_attribute_options: {
        Row: {
          attribute_id: string
          attribute_option_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_default: boolean
          is_deleted: boolean
          option_code: string
          option_label: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attribute_id: string
          attribute_option_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          option_code: string
          option_label: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attribute_id?: string
          attribute_option_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          option_code?: string
          option_label?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_options_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_definitions"
            referencedColumns: ["attribute_id"]
          },
        ]
      }
      product_attribute_value_options: {
        Row: {
          attribute_option_id: string
          created_at: string
          created_by: string | null
          product_attribute_value_id: string
          product_attribute_value_option_id: string
        }
        Insert: {
          attribute_option_id: string
          created_at?: string
          created_by?: string | null
          product_attribute_value_id: string
          product_attribute_value_option_id?: string
        }
        Update: {
          attribute_option_id?: string
          created_at?: string
          created_by?: string | null
          product_attribute_value_id?: string
          product_attribute_value_option_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_value_options_attribute_option_id_fkey"
            columns: ["attribute_option_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_options"
            referencedColumns: ["attribute_option_id"]
          },
          {
            foreignKeyName: "product_attribute_value_options_product_attribute_value_id_fkey"
            columns: ["product_attribute_value_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["product_attribute_value_id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_deleted: boolean
          product_attribute_value_id: string
          product_id: string
          selected_option_id: string | null
          updated_at: string
          updated_by: string | null
          value_boolean: boolean | null
          value_date: string | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          attribute_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          product_attribute_value_id?: string
          product_id: string
          selected_option_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          attribute_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          product_attribute_value_id?: string
          product_id?: string
          selected_option_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_definitions"
            referencedColumns: ["attribute_id"]
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_attribute_values_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_options"
            referencedColumns: ["attribute_option_id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_code: string
          category_id: string
          category_name: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          parent_category_id: string | null
          product_specification_type: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_code: string
          category_id?: string
          category_name: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          parent_category_id?: string | null
          product_specification_type?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_code?: string
          category_id?: string
          category_name?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          parent_category_id?: string | null
          product_specification_type?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      product_category_attributes: {
        Row: {
          attribute_id: string
          category_attribute_id: string
          category_id: string
          created_at: string
          created_by: string | null
          default_value_override: Json | null
          deleted_at: string | null
          display_label_override: string | null
          help_text_override: string | null
          is_active: boolean
          is_deleted: boolean
          is_hidden: boolean
          is_inherited: boolean
          is_required: boolean
          section_name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attribute_id: string
          category_attribute_id?: string
          category_id: string
          created_at?: string
          created_by?: string | null
          default_value_override?: Json | null
          deleted_at?: string | null
          display_label_override?: string | null
          help_text_override?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_hidden?: boolean
          is_inherited?: boolean
          is_required?: boolean
          section_name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attribute_id?: string
          category_attribute_id?: string
          category_id?: string
          created_at?: string
          created_by?: string | null
          default_value_override?: Json | null
          deleted_at?: string | null
          display_label_override?: string | null
          help_text_override?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_hidden?: boolean
          is_inherited?: boolean
          is_required?: boolean
          section_name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_category_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_definitions"
            referencedColumns: ["attribute_id"]
          },
          {
            foreignKeyName: "product_category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      product_code_category_variants: {
        Row: {
          colour_mode_override: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          full_category_code: string
          guidance_text: string | null
          is_active: boolean
          is_deleted: boolean
          product_category_id: string | null
          product_code_category_variant_id: string
          product_code_family_id: string
          reservation_notes: string | null
          size_rule_id: string | null
          sort_order: number
          status: string
          subtype_value: string | null
          thickness_mm: number | null
          updated_at: string
          updated_by: string | null
          variant_digit: string
          variant_name: string
        }
        Insert: {
          colour_mode_override?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          full_category_code: string
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_category_id?: string | null
          product_code_category_variant_id?: string
          product_code_family_id: string
          reservation_notes?: string | null
          size_rule_id?: string | null
          sort_order?: number
          status?: string
          subtype_value?: string | null
          thickness_mm?: number | null
          updated_at?: string
          updated_by?: string | null
          variant_digit: string
          variant_name: string
        }
        Update: {
          colour_mode_override?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          full_category_code?: string
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_category_id?: string | null
          product_code_category_variant_id?: string
          product_code_family_id?: string
          reservation_notes?: string | null
          size_rule_id?: string | null
          sort_order?: number
          status?: string
          subtype_value?: string | null
          thickness_mm?: number | null
          updated_at?: string
          updated_by?: string | null
          variant_digit?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_code_category_variants_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: true
            referencedRelation: "product_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "product_code_category_variants_product_code_family_id_fkey"
            columns: ["product_code_family_id"]
            isOneToOne: false
            referencedRelation: "product_code_families"
            referencedColumns: ["product_code_family_id"]
          },
          {
            foreignKeyName: "product_code_category_variants_size_rule_id_fkey"
            columns: ["size_rule_id"]
            isOneToOne: false
            referencedRelation: "product_code_size_rules"
            referencedColumns: ["product_code_size_rule_id"]
          },
        ]
      }
      product_code_families: {
        Row: {
          colour_mode: string
          created_at: string
          created_by: string | null
          default_product_code_type_id: string | null
          default_size_rule_id: string | null
          deleted_at: string | null
          description: string | null
          family_code: string
          family_name: string
          guidance_text: string | null
          is_active: boolean
          is_deleted: boolean
          product_code_family_id: string
          product_code_range_id: string
          product_domain: string
          reservation_notes: string | null
          sort_order: number
          status: string
          updated_at: string
          updated_by: string | null
          variant_meaning: string
        }
        Insert: {
          colour_mode?: string
          created_at?: string
          created_by?: string | null
          default_product_code_type_id?: string | null
          default_size_rule_id?: string | null
          deleted_at?: string | null
          description?: string | null
          family_code: string
          family_name: string
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_code_family_id?: string
          product_code_range_id: string
          product_domain: string
          reservation_notes?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          variant_meaning?: string
        }
        Update: {
          colour_mode?: string
          created_at?: string
          created_by?: string | null
          default_product_code_type_id?: string | null
          default_size_rule_id?: string | null
          deleted_at?: string | null
          description?: string | null
          family_code?: string
          family_name?: string
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_code_family_id?: string
          product_code_range_id?: string
          product_domain?: string
          reservation_notes?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          variant_meaning?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_code_families_default_product_code_type_id_fkey"
            columns: ["default_product_code_type_id"]
            isOneToOne: false
            referencedRelation: "product_code_types"
            referencedColumns: ["product_code_type_id"]
          },
          {
            foreignKeyName: "product_code_families_default_size_rule_id_fkey"
            columns: ["default_size_rule_id"]
            isOneToOne: false
            referencedRelation: "product_code_size_rules"
            referencedColumns: ["product_code_size_rule_id"]
          },
          {
            foreignKeyName: "product_code_families_product_code_range_id_fkey"
            columns: ["product_code_range_id"]
            isOneToOne: false
            referencedRelation: "product_code_ranges"
            referencedColumns: ["product_code_range_id"]
          },
        ]
      }
      product_code_family_types: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_default: boolean
          is_deleted: boolean
          product_code_family_id: string
          product_code_family_type_id: string
          product_code_type_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          product_code_family_id: string
          product_code_family_type_id?: string
          product_code_type_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          product_code_family_id?: string
          product_code_family_type_id?: string
          product_code_type_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_code_family_types_product_code_family_id_fkey"
            columns: ["product_code_family_id"]
            isOneToOne: false
            referencedRelation: "product_code_families"
            referencedColumns: ["product_code_family_id"]
          },
          {
            foreignKeyName: "product_code_family_types_product_code_type_id_fkey"
            columns: ["product_code_type_id"]
            isOneToOne: false
            referencedRelation: "product_code_types"
            referencedColumns: ["product_code_type_id"]
          },
        ]
      }
      product_code_ranges: {
        Row: {
          admin_only_manage: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          end_family_number: number
          guidance_text: string | null
          is_active: boolean
          is_deleted: boolean
          is_locked: boolean
          product_code_range_id: string
          product_domain: string
          range_code: string
          range_name: string
          sort_order: number
          start_family_number: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_only_manage?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_family_number: number
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_locked?: boolean
          product_code_range_id?: string
          product_domain: string
          range_code: string
          range_name: string
          sort_order?: number
          start_family_number: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_only_manage?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          end_family_number?: number
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_locked?: boolean
          product_code_range_id?: string
          product_domain?: string
          range_code?: string
          range_name?: string
          sort_order?: number
          start_family_number?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_code_sequences: {
        Row: {
          colour_code: string
          created_at: string
          full_category_code: string
          last_variant_number: number
          product_code_sequence_id: string
          size_token: string
          type_code: string
          updated_at: string
        }
        Insert: {
          colour_code: string
          created_at?: string
          full_category_code: string
          last_variant_number?: number
          product_code_sequence_id?: string
          size_token: string
          type_code: string
          updated_at?: string
        }
        Update: {
          colour_code?: string
          created_at?: string
          full_category_code?: string
          last_variant_number?: number
          product_code_sequence_id?: string
          size_token?: string
          type_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_code_size_rules: {
        Row: {
          allow_first_unspecified: boolean
          allow_second_unspecified: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          example_size_token: string
          first_value_label: string
          first_value_mode: string
          first_value_unit: string | null
          guidance_text: string | null
          is_active: boolean
          is_deleted: boolean
          product_code_size_rule_id: string
          second_value_label: string
          second_value_mode: string
          second_value_unit: string | null
          size_rule_code: string
          size_rule_name: string
          sort_order: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_first_unspecified?: boolean
          allow_second_unspecified?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          example_size_token: string
          first_value_label: string
          first_value_mode?: string
          first_value_unit?: string | null
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_code_size_rule_id?: string
          second_value_label: string
          second_value_mode?: string
          second_value_unit?: string | null
          size_rule_code: string
          size_rule_name: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_first_unspecified?: boolean
          allow_second_unspecified?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          example_size_token?: string
          first_value_label?: string
          first_value_mode?: string
          first_value_unit?: string | null
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_code_size_rule_id?: string
          second_value_label?: string
          second_value_mode?: string
          second_value_unit?: string | null
          size_rule_code?: string
          size_rule_name?: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_code_types: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          guidance_text: string | null
          is_active: boolean
          is_deleted: boolean
          product_class: string
          product_code_type_id: string
          sort_order: number
          status: string
          type_code: string
          type_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_class: string
          product_code_type_id?: string
          sort_order?: number
          status?: string
          type_code: string
          type_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          product_class?: string
          product_code_type_id?: string
          sort_order?: number
          status?: string
          type_code?: string
          type_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_code_variant_registry: {
        Row: {
          colour_code: string
          full_category_code: string
          full_product_code: string
          product_code_variant_registry_id: string
          product_id: string | null
          reserved_at: string
          reserved_by: string | null
          size_token: string
          type_code: string
          variant_code: string
          variant_description: string | null
          variant_name: string
          variant_number: number
        }
        Insert: {
          colour_code: string
          full_category_code: string
          full_product_code: string
          product_code_variant_registry_id?: string
          product_id?: string | null
          reserved_at?: string
          reserved_by?: string | null
          size_token: string
          type_code: string
          variant_code: string
          variant_description?: string | null
          variant_name: string
          variant_number: number
        }
        Update: {
          colour_code?: string
          full_category_code?: string
          full_product_code?: string
          product_code_variant_registry_id?: string
          product_id?: string | null
          reserved_at?: string
          reserved_by?: string | null
          size_token?: string
          type_code?: string
          variant_code?: string
          variant_description?: string | null
          variant_name?: string
          variant_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_code_variant_registry_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_colours: {
        Row: {
          colour_code: string
          colour_name: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          guidance_text: string | null
          is_active: boolean
          is_deleted: boolean
          is_not_applicable: boolean
          is_reference_only: boolean
          product_colour_id: string
          reference_hex: string | null
          sort_order: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          colour_code: string
          colour_name: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_not_applicable?: boolean
          is_reference_only?: boolean
          product_colour_id?: string
          reference_hex?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          colour_code?: string
          colour_name?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          guidance_text?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_not_applicable?: boolean
          is_reference_only?: boolean
          product_colour_id?: string
          reference_hex?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_coverages: {
        Row: {
          coverage_quantity: number
          coverage_uom_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_default: boolean
          is_deleted: boolean
          is_estimate: boolean
          maximum_coverage: number | null
          minimum_coverage: number | null
          notes: string | null
          product_coverage_id: string
          product_id: string
          sort_order: number
          source_quantity: number
          source_uom_code: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          coverage_quantity: number
          coverage_uom_code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          is_estimate?: boolean
          maximum_coverage?: number | null
          minimum_coverage?: number | null
          notes?: string | null
          product_coverage_id?: string
          product_id: string
          sort_order?: number
          source_quantity?: number
          source_uom_code: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          coverage_quantity?: number
          coverage_uom_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_default?: boolean
          is_deleted?: boolean
          is_estimate?: boolean
          maximum_coverage?: number | null
          minimum_coverage?: number | null
          notes?: string | null
          product_coverage_id?: string
          product_id?: string
          sort_order?: number
          source_quantity?: number
          source_uom_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_coverages_coverage_uom_code_fkey"
            columns: ["coverage_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "product_coverages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_coverages_source_uom_code_fkey"
            columns: ["source_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      product_flooring_specs: {
        Row: {
          coverage_method: string
          created_at: string
          created_by: string | null
          declared_sqm_per_box: number | null
          deleted_at: string | null
          dimension_type: string
          is_active: boolean
          is_deleted: boolean
          manufacturer_name: string | null
          manufacturer_notes: string | null
          manufacturer_product_code: string | null
          maximum_length_mm: number | null
          minimum_length_mm: number | null
          plank_length_mm: number | null
          plank_thickness_mm: number | null
          plank_width_mm: number | null
          planks_per_box: number | null
          product_flooring_spec_id: string
          product_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          coverage_method?: string
          created_at?: string
          created_by?: string | null
          declared_sqm_per_box?: number | null
          deleted_at?: string | null
          dimension_type?: string
          is_active?: boolean
          is_deleted?: boolean
          manufacturer_name?: string | null
          manufacturer_notes?: string | null
          manufacturer_product_code?: string | null
          maximum_length_mm?: number | null
          minimum_length_mm?: number | null
          plank_length_mm?: number | null
          plank_thickness_mm?: number | null
          plank_width_mm?: number | null
          planks_per_box?: number | null
          product_flooring_spec_id?: string
          product_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          coverage_method?: string
          created_at?: string
          created_by?: string | null
          declared_sqm_per_box?: number | null
          deleted_at?: string | null
          dimension_type?: string
          is_active?: boolean
          is_deleted?: boolean
          manufacturer_name?: string | null
          manufacturer_notes?: string | null
          manufacturer_product_code?: string | null
          maximum_length_mm?: number | null
          minimum_length_mm?: number | null
          plank_length_mm?: number | null
          plank_thickness_mm?: number | null
          plank_width_mm?: number | null
          planks_per_box?: number | null
          product_flooring_spec_id?: string
          product_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_flooring_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_units: {
        Row: {
          barcode: string | null
          conversion_to_base: number
          coverage_basis_quantity: number | null
          coverage_notes: string | null
          coverage_quantity: number | null
          coverage_uom_code: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_base_unit: boolean
          is_deleted: boolean
          is_purchase_unit: boolean
          is_request_unit: boolean
          is_sales_unit: boolean
          is_stock_unit: boolean
          product_id: string
          product_unit_id: string
          sort_order: number
          uom_code: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          barcode?: string | null
          conversion_to_base?: number
          coverage_basis_quantity?: number | null
          coverage_notes?: string | null
          coverage_quantity?: number | null
          coverage_uom_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_base_unit?: boolean
          is_deleted?: boolean
          is_purchase_unit?: boolean
          is_request_unit?: boolean
          is_sales_unit?: boolean
          is_stock_unit?: boolean
          product_id: string
          product_unit_id?: string
          sort_order?: number
          uom_code: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          barcode?: string | null
          conversion_to_base?: number
          coverage_basis_quantity?: number | null
          coverage_notes?: string | null
          coverage_quantity?: number | null
          coverage_uom_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_base_unit?: boolean
          is_deleted?: boolean
          is_purchase_unit?: boolean
          is_request_unit?: boolean
          is_sales_unit?: boolean
          is_stock_unit?: boolean
          product_id?: string
          product_unit_id?: string
          sort_order?: number
          uom_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_units_coverage_uom_code_fkey"
            columns: ["coverage_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_units_uom_code_fkey"
            columns: ["uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      product_uom_conversions: {
        Row: {
          allow_fractional_quantity: boolean
          conversion_factor: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          from_uom_code: string
          is_active: boolean
          is_deleted: boolean
          product_id: string
          product_uom_conversion_id: string
          sort_order: number
          to_uom_code: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean
          conversion_factor: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_uom_code: string
          is_active?: boolean
          is_deleted?: boolean
          product_id: string
          product_uom_conversion_id?: string
          sort_order?: number
          to_uom_code: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean
          conversion_factor?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_uom_code?: string
          is_active?: boolean
          is_deleted?: boolean
          product_id?: string
          product_uom_conversion_id?: string
          sort_order?: number
          to_uom_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_uom_conversions_from_uom_code_fkey"
            columns: ["from_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "product_uom_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_uom_conversions_to_uom_code_fkey"
            columns: ["to_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      products: {
        Row: {
          base_uom_code: string
          category_id: string
          cost_price: number | null
          created_at: string
          created_by: string | null
          default_purchase_uom_code: string | null
          default_request_uom_code: string | null
          default_sales_uom_code: string | null
          default_sell_price: number | null
          default_waste_percent: number
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          is_service_item: boolean
          is_stock_item: boolean
          product_code: string
          product_code_category_variant_id: string | null
          product_code_generated_at: string | null
          product_code_generated_by: string | null
          product_code_size_rule_id: string | null
          product_code_size_token: string | null
          product_code_type_id: string | null
          product_code_variant_number: number | null
          product_colour_id: string | null
          product_id: string
          product_name: string
          product_type: string
          search_keywords: string | null
          unit: string
          updated_at: string
          updated_by: string | null
          uses_coverage: boolean
          variant_description: string | null
          variant_name: string | null
        }
        Insert: {
          base_uom_code: string
          category_id: string
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          default_purchase_uom_code?: string | null
          default_request_uom_code?: string | null
          default_sales_uom_code?: string | null
          default_sell_price?: number | null
          default_waste_percent?: number
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_service_item?: boolean
          is_stock_item?: boolean
          product_code: string
          product_code_category_variant_id?: string | null
          product_code_generated_at?: string | null
          product_code_generated_by?: string | null
          product_code_size_rule_id?: string | null
          product_code_size_token?: string | null
          product_code_type_id?: string | null
          product_code_variant_number?: number | null
          product_colour_id?: string | null
          product_id?: string
          product_name: string
          product_type?: string
          search_keywords?: string | null
          unit: string
          updated_at?: string
          updated_by?: string | null
          uses_coverage?: boolean
          variant_description?: string | null
          variant_name?: string | null
        }
        Update: {
          base_uom_code?: string
          category_id?: string
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          default_purchase_uom_code?: string | null
          default_request_uom_code?: string | null
          default_sales_uom_code?: string | null
          default_sell_price?: number | null
          default_waste_percent?: number
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_service_item?: boolean
          is_stock_item?: boolean
          product_code?: string
          product_code_category_variant_id?: string | null
          product_code_generated_at?: string | null
          product_code_generated_by?: string | null
          product_code_size_rule_id?: string | null
          product_code_size_token?: string | null
          product_code_type_id?: string | null
          product_code_variant_number?: number | null
          product_colour_id?: string | null
          product_id?: string
          product_name?: string
          product_type?: string
          search_keywords?: string | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
          uses_coverage?: boolean
          variant_description?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_default_purchase_uom_code_fkey"
            columns: ["default_purchase_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "products_default_request_uom_code_fkey"
            columns: ["default_request_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "products_default_sales_uom_code_fkey"
            columns: ["default_sales_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "products_product_code_category_variant_id_fkey"
            columns: ["product_code_category_variant_id"]
            isOneToOne: false
            referencedRelation: "product_code_category_variants"
            referencedColumns: ["product_code_category_variant_id"]
          },
          {
            foreignKeyName: "products_product_code_size_rule_id_fkey"
            columns: ["product_code_size_rule_id"]
            isOneToOne: false
            referencedRelation: "product_code_size_rules"
            referencedColumns: ["product_code_size_rule_id"]
          },
          {
            foreignKeyName: "products_product_code_type_id_fkey"
            columns: ["product_code_type_id"]
            isOneToOne: false
            referencedRelation: "product_code_types"
            referencedColumns: ["product_code_type_id"]
          },
          {
            foreignKeyName: "products_product_colour_id_fkey"
            columns: ["product_colour_id"]
            isOneToOne: false
            referencedRelation: "product_colours"
            referencedColumns: ["product_colour_id"]
          },
        ]
      }
      project_area_types: {
        Row: {
          area_type_code: string
          area_type_id: string
          area_type_name: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          area_type_code: string
          area_type_id?: string
          area_type_name: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          area_type_code?: string
          area_type_id?: string
          area_type_name?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      project_areas: {
        Row: {
          actual_quantity: number | null
          area_code: string
          area_id: string
          area_name: string
          area_status: string
          area_type: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          estimated_quantity: number | null
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          project_id: string
          site_id: string
          unit_of_measure: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_quantity?: number | null
          area_code?: string
          area_id?: string
          area_name: string
          area_status?: string
          area_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          estimated_quantity?: number | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          project_id: string
          site_id: string
          unit_of_measure?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_quantity?: number | null
          area_code?: string
          area_id?: string
          area_name?: string
          area_status?: string
          area_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          estimated_quantity?: number | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          project_id?: string
          site_id?: string
          unit_of_measure?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      project_sites: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_value: number
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          postcode: string | null
          project_id: string
          site_code: string
          site_id: string
          site_name: string
          site_status: string
          state: string | null
          suburb: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_value?: number
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          postcode?: string | null
          project_id: string
          site_code?: string
          site_id?: string
          site_name: string
          site_status?: string
          state?: string | null
          suburb?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_value?: number
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          postcode?: string | null
          project_id?: string
          site_code?: string
          site_id?: string
          site_name?: string
          site_status?: string
          state?: string | null
          suburb?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          contract_value: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          estimated_completion_date: string | null
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          price_book_id: string | null
          project_id: string
          project_name: string
          project_no: string
          project_status: string
          project_type: string | null
          quotation_id: string | null
          start_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          estimated_completion_date?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          price_book_id?: string | null
          project_id?: string
          project_name: string
          project_no: string
          project_status?: string
          project_type?: string | null
          quotation_id?: string | null
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          estimated_completion_date?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          price_book_id?: string | null
          project_id?: string
          project_name?: string
          project_no?: string
          project_status?: string
          project_type?: string | null
          quotation_id?: string | null
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          allow_fractional_quantity: boolean | null
          area_id: string | null
          base_uom_code: string | null
          conversion_factor_to_base: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_deleted: boolean
          line_no: number
          line_total: number
          notes: string | null
          ordered_base_quantity: number | null
          product_id: string
          project_id: string | null
          purchase_order_id: string
          purchase_order_line_id: string
          purchase_uom_code: string | null
          quantity: number
          site_id: string | null
          stock_request_item_id: string | null
          tax_amount: number
          tax_rate: number
          unit_cost: number
          unit_of_measure: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean | null
          area_id?: string | null
          base_uom_code?: string | null
          conversion_factor_to_base?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no: number
          line_total?: number
          notes?: string | null
          ordered_base_quantity?: number | null
          product_id: string
          project_id?: string | null
          purchase_order_id: string
          purchase_order_line_id?: string
          purchase_uom_code?: string | null
          quantity?: number
          site_id?: string | null
          stock_request_item_id?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean | null
          area_id?: string | null
          base_uom_code?: string | null
          conversion_factor_to_base?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no?: number
          line_total?: number
          notes?: string | null
          ordered_base_quantity?: number | null
          product_id?: string
          project_id?: string | null
          purchase_order_id?: string
          purchase_order_line_id?: string
          purchase_uom_code?: string | null
          quantity?: number
          site_id?: string | null
          stock_request_item_id?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["purchase_order_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_purchase_uom_code_fkey"
            columns: ["purchase_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "purchase_order_lines_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_stock_request_item_id_fkey"
            columns: ["stock_request_item_id"]
            isOneToOne: false
            referencedRelation: "stock_request_items"
            referencedColumns: ["stock_request_item_id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expected_delivery_date: string | null
          is_deleted: boolean
          notes: string | null
          order_date: string
          order_status: string
          project_id: string | null
          purchase_order_id: string
          purchase_order_no: string
          site_id: string | null
          subtotal_amount: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_delivery_date?: string | null
          is_deleted?: boolean
          notes?: string | null
          order_date?: string
          order_status?: string
          project_id?: string | null
          purchase_order_id?: string
          purchase_order_no: string
          site_id?: string | null
          subtotal_amount?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_delivery_date?: string | null
          is_deleted?: boolean
          notes?: string | null
          order_date?: string
          order_status?: string
          project_id?: string | null
          purchase_order_id?: string
          purchase_order_no?: string
          site_id?: string | null
          subtotal_amount?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      quotation_lines: {
        Row: {
          allow_fractional_quantity: boolean
          base_quantity: number | null
          base_uom_code: string | null
          conversion_factor: number | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          discount_amount: number
          discount_percent: number
          is_deleted: boolean
          is_optional: boolean
          line_no: number
          line_total: number
          margin_amount: number | null
          margin_percent: number | null
          notes: string | null
          product_id: string | null
          project_area_id: string | null
          quantity: number
          quotation_id: string
          quotation_line_id: string
          sales_uom_code: string | null
          tax_amount: number
          tax_rate: number
          unit_of_measure: string
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean
          base_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor?: number | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          is_optional?: boolean
          line_no: number
          line_total?: number
          margin_amount?: number | null
          margin_percent?: number | null
          notes?: string | null
          product_id?: string | null
          project_area_id?: string | null
          quantity?: number
          quotation_id: string
          quotation_line_id?: string
          sales_uom_code?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean
          base_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor?: number | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          is_optional?: boolean
          line_no?: number
          line_total?: number
          margin_amount?: number | null
          margin_percent?: number | null
          notes?: string | null
          product_id?: string | null
          project_area_id?: string | null
          quantity?: number
          quotation_id?: string
          quotation_line_id?: string
          sales_uom_code?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_lines_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "quotation_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quotation_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "quotation_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "quotation_lines_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quotation_lines_sales_uom_code_fkey"
            columns: ["sales_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      quotation_revision_lines: {
        Row: {
          allow_fractional_quantity: boolean
          base_quantity: number | null
          base_uom_code: string | null
          conversion_factor: number | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          discount_amount: number
          discount_percent: number
          is_deleted: boolean
          is_optional: boolean
          line_no: number
          line_total: number
          margin_amount: number | null
          margin_percent: number | null
          notes: string | null
          product_id: string | null
          project_area_id: string | null
          quantity: number
          quotation_line_id: string | null
          revision_id: string
          revision_line_id: string
          sales_uom_code: string | null
          tax_amount: number
          tax_rate: number
          unit_of_measure: string
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean
          base_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor?: number | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          is_optional?: boolean
          line_no: number
          line_total?: number
          margin_amount?: number | null
          margin_percent?: number | null
          notes?: string | null
          product_id?: string | null
          project_area_id?: string | null
          quantity?: number
          quotation_line_id?: string | null
          revision_id: string
          revision_line_id?: string
          sales_uom_code?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean
          base_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor?: number | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          is_optional?: boolean
          line_no?: number
          line_total?: number
          margin_amount?: number | null
          margin_percent?: number | null
          notes?: string | null
          product_id?: string | null
          project_area_id?: string | null
          quantity?: number
          quotation_line_id?: string | null
          revision_id?: string
          revision_line_id?: string
          sales_uom_code?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_revision_lines_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "quotation_revision_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quotation_revision_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "quotation_revision_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "quotation_revision_lines_quotation_line_id_fkey"
            columns: ["quotation_line_id"]
            isOneToOne: false
            referencedRelation: "quotation_lines"
            referencedColumns: ["quotation_line_id"]
          },
          {
            foreignKeyName: "quotation_revision_lines_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "quotation_revisions"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "quotation_revision_lines_sales_uom_code_fkey"
            columns: ["sales_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      quotation_revisions: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          discount_amount: number
          internal_notes: string | null
          is_active: boolean
          is_deleted: boolean
          issue_date: string | null
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          price_book_id: string | null
          project_site_id: string | null
          quotation_id: string
          quotation_segment: string
          quotation_source: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          revision_id: string
          revision_no: number
          revision_notes: string | null
          revision_reason: string | null
          revision_status: string
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          discount_amount?: number
          internal_notes?: string | null
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string | null
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          price_book_id?: string | null
          project_site_id?: string | null
          quotation_id: string
          quotation_segment: string
          quotation_source?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revision_id?: string
          revision_no: number
          revision_notes?: string | null
          revision_reason?: string | null
          revision_status?: string
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          discount_amount?: number
          internal_notes?: string | null
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string | null
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          price_book_id?: string | null
          project_site_id?: string | null
          quotation_id?: string
          quotation_segment?: string
          quotation_source?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revision_id?: string
          revision_no?: number
          revision_notes?: string | null
          revision_reason?: string | null
          revision_status?: string
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_revisions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotation_revisions_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["price_book_id"]
          },
          {
            foreignKeyName: "quotation_revisions_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "quotation_revisions_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
          },
        ]
      }
      quotations: {
        Row: {
          acceptance_notes: string | null
          accepted_at: string | null
          accepted_by: string | null
          accepted_revision_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          current_revision_id: string | null
          customer_id: string
          deleted_at: string | null
          discount_amount: number
          internal_notes: string | null
          is_active: boolean
          is_deleted: boolean
          issue_date: string | null
          notes: string | null
          price_book_id: string | null
          project_site_id: string | null
          quotation_id: string
          quotation_no: string
          quotation_segment: string
          quotation_source: string | null
          quotation_status: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          revision_no: number
          sent_at: string | null
          sent_by: string | null
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          acceptance_notes?: string | null
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_revision_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          current_revision_id?: string | null
          customer_id: string
          deleted_at?: string | null
          discount_amount?: number
          internal_notes?: string | null
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string | null
          notes?: string | null
          price_book_id?: string | null
          project_site_id?: string | null
          quotation_id?: string
          quotation_no: string
          quotation_segment: string
          quotation_source?: string | null
          quotation_status?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revision_no?: number
          sent_at?: string | null
          sent_by?: string | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          acceptance_notes?: string | null
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_revision_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          current_revision_id?: string | null
          customer_id?: string
          deleted_at?: string | null
          discount_amount?: number
          internal_notes?: string | null
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string | null
          notes?: string | null
          price_book_id?: string | null
          project_site_id?: string | null
          quotation_id?: string
          quotation_no?: string
          quotation_segment?: string
          quotation_source?: string | null
          quotation_status?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revision_no?: number
          sent_at?: string | null
          sent_by?: string | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_accepted_revision_id_fkey"
            columns: ["accepted_revision_id"]
            isOneToOne: false
            referencedRelation: "quotation_revisions"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "quotations_current_revision_id_fkey"
            columns: ["current_revision_id"]
            isOneToOne: false
            referencedRelation: "quotation_revisions"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotations_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["price_book_id"]
          },
          {
            foreignKeyName: "quotations_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      stock_locations: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          location_code: string
          location_name: string
          location_type: string
          project_id: string | null
          site_id: string | null
          stock_location_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          location_code: string
          location_name: string
          location_type?: string
          project_id?: string | null
          site_id?: string | null
          stock_location_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          location_code?: string
          location_name?: string
          location_type?: string
          project_id?: string | null
          site_id?: string | null
          stock_location_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      stock_lots: {
        Row: {
          average_unit_cost: number | null
          base_uom_code: string
          created_at: string
          created_by: string | null
          damaged_quantity: number
          deleted_at: string | null
          expiry_date: string | null
          is_active: boolean
          is_deleted: boolean
          lot_no: string
          lot_status: string
          notes: string | null
          product_id: string
          received_date: string
          received_quantity: number
          remaining_quantity: number
          reserved_quantity: number
          stock_location_id: string
          stock_lot_id: string
          supplier_delivery_item_id: string | null
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          average_unit_cost?: number | null
          base_uom_code: string
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          expiry_date?: string | null
          is_active?: boolean
          is_deleted?: boolean
          lot_no: string
          lot_status?: string
          notes?: string | null
          product_id: string
          received_date?: string
          received_quantity?: number
          remaining_quantity?: number
          reserved_quantity?: number
          stock_location_id: string
          stock_lot_id?: string
          supplier_delivery_item_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          average_unit_cost?: number | null
          base_uom_code?: string
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          expiry_date?: string | null
          is_active?: boolean
          is_deleted?: boolean
          lot_no?: string
          lot_status?: string
          notes?: string | null
          product_id?: string
          received_date?: string
          received_quantity?: number
          remaining_quantity?: number
          reserved_quantity?: number
          stock_location_id?: string
          stock_lot_id?: string
          supplier_delivery_item_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_lots_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_lots_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "stock_lots_supplier_delivery_item_id_fkey"
            columns: ["supplier_delivery_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_items"
            referencedColumns: ["supplier_delivery_item_id"]
          },
          {
            foreignKeyName: "stock_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          base_uom_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          from_location_id: string | null
          is_deleted: boolean
          movement_date: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference_no: string | null
          stock_lot_id: string
          stock_movement_id: string
          stock_request_item_id: string | null
          supplier_delivery_item_id: string | null
          to_location_id: string | null
          total_cost: number | null
          unit_cost: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_uom_code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_location_id?: string | null
          is_deleted?: boolean
          movement_date?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference_no?: string | null
          stock_lot_id: string
          stock_movement_id?: string
          stock_request_item_id?: string | null
          supplier_delivery_item_id?: string | null
          to_location_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_uom_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          from_location_id?: string | null
          is_deleted?: boolean
          movement_date?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_no?: string | null
          stock_lot_id?: string
          stock_movement_id?: string
          stock_request_item_id?: string | null
          supplier_delivery_item_id?: string | null
          to_location_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_movements_stock_lot_id_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "stock_movements_stock_request_item_id_fkey"
            columns: ["stock_request_item_id"]
            isOneToOne: false
            referencedRelation: "stock_request_items"
            referencedColumns: ["stock_request_item_id"]
          },
          {
            foreignKeyName: "stock_movements_supplier_delivery_item_id_fkey"
            columns: ["supplier_delivery_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_items"
            referencedColumns: ["supplier_delivery_item_id"]
          },
          {
            foreignKeyName: "stock_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
        ]
      }
      stock_request_items: {
        Row: {
          allow_fractional_quantity: boolean | null
          approved_base_quantity: number | null
          approved_quantity: number | null
          base_uom_code: string | null
          conversion_factor_to_base: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_deleted: boolean
          line_no: number
          notes: string | null
          product_id: string
          request_uom_code: string | null
          requested_base_quantity: number | null
          requested_quantity: number
          stock_request_id: string
          stock_request_item_id: string
          unit_of_measure: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean | null
          approved_base_quantity?: number | null
          approved_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor_to_base?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no: number
          notes?: string | null
          product_id: string
          request_uom_code?: string | null
          requested_base_quantity?: number | null
          requested_quantity?: number
          stock_request_id: string
          stock_request_item_id?: string
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean | null
          approved_base_quantity?: number | null
          approved_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor_to_base?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no?: number
          notes?: string | null
          product_id?: string
          request_uom_code?: string | null
          requested_base_quantity?: number | null
          requested_quantity?: number
          stock_request_id?: string
          stock_request_item_id?: string
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_request_items_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_request_items_request_uom_code_fkey"
            columns: ["request_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_request_items_stock_request_id_fkey"
            columns: ["stock_request_id"]
            isOneToOne: false
            referencedRelation: "stock_requests"
            referencedColumns: ["stock_request_id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          area_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          project_id: string
          request_date: string
          request_status: string
          requested_by: string | null
          required_date: string | null
          site_id: string
          stock_request_id: string
          stock_request_no: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id: string
          request_date?: string
          request_status?: string
          requested_by?: string | null
          required_date?: string | null
          site_id: string
          stock_request_id?: string
          stock_request_no: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id?: string
          request_date?: string
          request_status?: string
          requested_by?: string | null
          required_date?: string | null
          site_id?: string
          stock_request_id?: string
          stock_request_no?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_requests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "stock_requests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "stock_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      supplier_addresses: {
        Row: {
          address_id: string
          address_line1: string
          address_line2: string | null
          address_type: string
          country: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          is_primary: boolean
          notes: string | null
          postcode: string | null
          state: string | null
          suburb: string | null
          supplier_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_id?: string
          address_line1: string
          address_line2?: string | null
          address_type: string
          country?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          notes?: string | null
          postcode?: string | null
          state?: string | null
          suburb?: string | null
          supplier_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_id?: string
          address_line1?: string
          address_line2?: string | null
          address_type?: string
          country?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          notes?: string | null
          postcode?: string | null
          state?: string | null
          suburb?: string | null
          supplier_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_addresses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          contact_id: string
          contact_name: string
          contact_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          is_active: boolean
          is_deleted: boolean
          is_primary: boolean
          mobile: string | null
          notes: string | null
          phone: string | null
          position: string | null
          supplier_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          contact_id?: string
          contact_name: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          supplier_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          contact_id?: string
          contact_name?: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          supplier_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      supplier_deliveries: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          delivery_date: string
          delivery_no: string
          delivery_status: string
          is_deleted: boolean
          notes: string | null
          project_id: string | null
          purchase_order_id: string | null
          received_by: string | null
          site_id: string | null
          supplier_delivery_id: string
          supplier_delivery_note_no: string | null
          supplier_id: string
          telegram_notified: boolean
          telegram_notified_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_date?: string
          delivery_no: string
          delivery_status?: string
          is_deleted?: boolean
          notes?: string | null
          project_id?: string | null
          purchase_order_id?: string | null
          received_by?: string | null
          site_id?: string | null
          supplier_delivery_id?: string
          supplier_delivery_note_no?: string | null
          supplier_id: string
          telegram_notified?: boolean
          telegram_notified_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivery_date?: string
          delivery_no?: string
          delivery_status?: string
          is_deleted?: boolean
          notes?: string | null
          project_id?: string | null
          purchase_order_id?: string | null
          received_by?: string | null
          site_id?: string | null
          supplier_delivery_id?: string
          supplier_delivery_note_no?: string | null
          supplier_id?: string
          telegram_notified?: boolean
          telegram_notified_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_deliveries_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["purchase_order_id"]
          },
          {
            foreignKeyName: "supplier_deliveries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "supplier_deliveries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      supplier_delivery_items: {
        Row: {
          accepted_quantity: number
          area_id: string | null
          conversion_factor_to_base: number
          created_at: string
          created_by: string | null
          damaged_quantity: number
          deleted_at: string | null
          is_deleted: boolean
          line_no: number
          material_supplier_link_id: string | null
          notes: string | null
          product_id: string
          project_id: string | null
          purchase_order_line_id: string | null
          received_base_quantity: number
          received_quantity: number
          received_uom_code: string
          rejected_quantity: number
          site_id: string | null
          stock_request_item_id: string | null
          supplier_delivery_id: string
          supplier_delivery_item_id: string
          unit_cost: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_quantity?: number
          area_id?: string | null
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          is_deleted?: boolean
          line_no: number
          material_supplier_link_id?: string | null
          notes?: string | null
          product_id: string
          project_id?: string | null
          purchase_order_line_id?: string | null
          received_base_quantity?: number
          received_quantity?: number
          received_uom_code: string
          rejected_quantity?: number
          site_id?: string | null
          stock_request_item_id?: string | null
          supplier_delivery_id: string
          supplier_delivery_item_id?: string
          unit_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_quantity?: number
          area_id?: string | null
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          is_deleted?: boolean
          line_no?: number
          material_supplier_link_id?: string | null
          notes?: string | null
          product_id?: string
          project_id?: string | null
          purchase_order_line_id?: string | null
          received_base_quantity?: number
          received_quantity?: number
          received_uom_code?: string
          rejected_quantity?: number
          site_id?: string | null
          stock_request_item_id?: string | null
          supplier_delivery_id?: string
          supplier_delivery_item_id?: string
          unit_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_delivery_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_material_supplier_link_id_fkey"
            columns: ["material_supplier_link_id"]
            isOneToOne: false
            referencedRelation: "material_supplier_links"
            referencedColumns: ["material_supplier_link_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_purchase_order_line_id_fkey"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["purchase_order_line_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_received_uom_code_fkey"
            columns: ["received_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "supplier_delivery_items_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_stock_request_item_id_fkey"
            columns: ["stock_request_item_id"]
            isOneToOne: false
            referencedRelation: "stock_request_items"
            referencedColumns: ["stock_request_item_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_supplier_delivery_id_fkey"
            columns: ["supplier_delivery_id"]
            isOneToOne: false
            referencedRelation: "supplier_deliveries"
            referencedColumns: ["supplier_delivery_id"]
          },
        ]
      }
      supplier_delivery_photos: {
        Row: {
          caption: string | null
          created_at: string
          deleted_at: string | null
          is_deleted: boolean
          photo_type: string
          photo_url: string
          sort_order: number | null
          supplier_delivery_id: string
          supplier_delivery_photo_id: string
          supplier_delivery_receipt_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          is_deleted?: boolean
          photo_type?: string
          photo_url: string
          sort_order?: number | null
          supplier_delivery_id: string
          supplier_delivery_photo_id?: string
          supplier_delivery_receipt_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          is_deleted?: boolean
          photo_type?: string
          photo_url?: string
          sort_order?: number | null
          supplier_delivery_id?: string
          supplier_delivery_photo_id?: string
          supplier_delivery_receipt_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_delivery_photos_receipt_id_fkey"
            columns: ["supplier_delivery_receipt_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_receipts"
            referencedColumns: ["supplier_delivery_receipt_id"]
          },
          {
            foreignKeyName: "supplier_delivery_photos_supplier_delivery_id_fkey"
            columns: ["supplier_delivery_id"]
            isOneToOne: false
            referencedRelation: "supplier_deliveries"
            referencedColumns: ["supplier_delivery_id"]
          },
        ]
      }
      supplier_delivery_receipt_items: {
        Row: {
          accepted_base_quantity: number
          accepted_input_quantity: number | null
          accepted_input_uom_code: string | null
          accepted_quantity: number
          conversion_factor_to_base: number
          created_at: string
          created_by: string
          damaged_base_quantity: number | null
          damaged_input_quantity: number | null
          damaged_input_uom_code: string | null
          damaged_quantity: number
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          received_base_quantity: number | null
          received_input_quantity: number | null
          received_input_uom_code: string | null
          received_quantity: number
          received_uom_code: string
          rejected_base_quantity: number | null
          rejected_input_quantity: number | null
          rejected_input_uom_code: string | null
          rejected_quantity: number
          replacement_received_quantity: number
          replacement_required_quantity: number | null
          replacement_required_uom_code: string | null
          stock_location_id: string | null
          stock_lot_id: string | null
          stock_movement_id: string | null
          supplier_delivery_item_id: string
          supplier_delivery_receipt_id: string
          supplier_delivery_receipt_item_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_base_quantity?: number
          accepted_input_quantity?: number | null
          accepted_input_uom_code?: string | null
          accepted_quantity?: number
          conversion_factor_to_base?: number
          created_at?: string
          created_by: string
          damaged_base_quantity?: number | null
          damaged_input_quantity?: number | null
          damaged_input_uom_code?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          received_base_quantity?: number | null
          received_input_quantity?: number | null
          received_input_uom_code?: string | null
          received_quantity: number
          received_uom_code: string
          rejected_base_quantity?: number | null
          rejected_input_quantity?: number | null
          rejected_input_uom_code?: string | null
          rejected_quantity?: number
          replacement_received_quantity?: number
          replacement_required_quantity?: number | null
          replacement_required_uom_code?: string | null
          stock_location_id?: string | null
          stock_lot_id?: string | null
          stock_movement_id?: string | null
          supplier_delivery_item_id: string
          supplier_delivery_receipt_id: string
          supplier_delivery_receipt_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_base_quantity?: number
          accepted_input_quantity?: number | null
          accepted_input_uom_code?: string | null
          accepted_quantity?: number
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string
          damaged_base_quantity?: number | null
          damaged_input_quantity?: number | null
          damaged_input_uom_code?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          received_base_quantity?: number | null
          received_input_quantity?: number | null
          received_input_uom_code?: string | null
          received_quantity?: number
          received_uom_code?: string
          rejected_base_quantity?: number | null
          rejected_input_quantity?: number | null
          rejected_input_uom_code?: string | null
          rejected_quantity?: number
          replacement_received_quantity?: number
          replacement_required_quantity?: number | null
          replacement_required_uom_code?: string | null
          stock_location_id?: string | null
          stock_lot_id?: string | null
          stock_movement_id?: string | null
          supplier_delivery_item_id?: string
          supplier_delivery_receipt_id?: string
          supplier_delivery_receipt_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_accepted_input_uom_fkey"
            columns: ["accepted_input_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "receipt_items_damaged_input_uom_fkey"
            columns: ["damaged_input_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "receipt_items_received_input_uom_fkey"
            columns: ["received_input_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "receipt_items_rejected_input_uom_fkey"
            columns: ["rejected_input_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "receipt_items_replacement_uom_fkey"
            columns: ["replacement_required_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "supplier_delivery_receipt_ite_supplier_delivery_receipt_id_fkey"
            columns: ["supplier_delivery_receipt_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_receipts"
            referencedColumns: ["supplier_delivery_receipt_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipt_items_received_uom_code_fkey"
            columns: ["received_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "supplier_delivery_receipt_items_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipt_items_stock_lot_id_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipt_items_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipt_items_supplier_delivery_item_id_fkey"
            columns: ["supplier_delivery_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_items"
            referencedColumns: ["supplier_delivery_item_id"]
          },
        ]
      }
      supplier_delivery_receipts: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          project_id: string
          receipt_status: string
          received_at: string
          received_by_employee_id: string
          site_id: string
          supplier_delivery_id: string
          supplier_delivery_receipt_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id: string
          receipt_status?: string
          received_at?: string
          received_by_employee_id: string
          site_id: string
          supplier_delivery_id: string
          supplier_delivery_receipt_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id?: string
          receipt_status?: string
          received_at?: string
          received_by_employee_id?: string
          site_id?: string
          supplier_delivery_id?: string
          supplier_delivery_receipt_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_delivery_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipts_received_by_employee_id_fkey"
            columns: ["received_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipts_supplier_delivery_id_fkey"
            columns: ["supplier_delivery_id"]
            isOneToOne: false
            referencedRelation: "supplier_deliveries"
            referencedColumns: ["supplier_delivery_id"]
          },
        ]
      }
      supplier_replacement_claim_items: {
        Row: {
          created_at: string
          created_by: string
          damage_description: string
          deleted_at: string | null
          is_deleted: boolean
          item_status: string
          notes: string | null
          product_id: string
          replacement_received_base_quantity: number
          replacement_received_quantity: number
          replacement_required_base_quantity: number | null
          replacement_required_quantity: number
          replacement_uom_code: string
          supplier_delivery_item_id: string
          supplier_delivery_receipt_item_id: string
          supplier_replacement_claim_id: string
          supplier_replacement_claim_item_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          damage_description: string
          deleted_at?: string | null
          is_deleted?: boolean
          item_status?: string
          notes?: string | null
          product_id: string
          replacement_received_base_quantity?: number
          replacement_received_quantity?: number
          replacement_required_base_quantity?: number | null
          replacement_required_quantity: number
          replacement_uom_code: string
          supplier_delivery_item_id: string
          supplier_delivery_receipt_item_id: string
          supplier_replacement_claim_id: string
          supplier_replacement_claim_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          damage_description?: string
          deleted_at?: string | null
          is_deleted?: boolean
          item_status?: string
          notes?: string | null
          product_id?: string
          replacement_received_base_quantity?: number
          replacement_received_quantity?: number
          replacement_required_base_quantity?: number | null
          replacement_required_quantity?: number
          replacement_uom_code?: string
          supplier_delivery_item_id?: string
          supplier_delivery_receipt_item_id?: string
          supplier_replacement_claim_id?: string
          supplier_replacement_claim_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_replacement_claim_it_supplier_delivery_receipt_it_fkey"
            columns: ["supplier_delivery_receipt_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_receipt_items"
            referencedColumns: ["supplier_delivery_receipt_item_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claim_it_supplier_replacement_claim_i_fkey"
            columns: ["supplier_replacement_claim_id"]
            isOneToOne: false
            referencedRelation: "supplier_replacement_claims"
            referencedColumns: ["supplier_replacement_claim_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claim_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claim_items_replacement_uom_code_fkey"
            columns: ["replacement_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "supplier_replacement_claim_items_supplier_delivery_item_id_fkey"
            columns: ["supplier_delivery_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_delivery_items"
            referencedColumns: ["supplier_delivery_item_id"]
          },
        ]
      }
      supplier_replacement_claims: {
        Row: {
          claim_no: string
          claim_status: string
          completed_at: string | null
          completed_by_employee_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          opened_at: string
          opened_by_employee_id: string
          payment_hold_note: string
          payment_hold_required: boolean
          purchase_order_id: string | null
          replacement_delivery_note_no: string | null
          site_id: string
          supplier_claim_reference: string | null
          supplier_credit_note_no: string | null
          supplier_delivery_id: string
          supplier_id: string
          supplier_replacement_claim_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          claim_no: string
          claim_status?: string
          completed_at?: string | null
          completed_by_employee_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          opened_at?: string
          opened_by_employee_id: string
          payment_hold_note: string
          payment_hold_required?: boolean
          purchase_order_id?: string | null
          replacement_delivery_note_no?: string | null
          site_id: string
          supplier_claim_reference?: string | null
          supplier_credit_note_no?: string | null
          supplier_delivery_id: string
          supplier_id: string
          supplier_replacement_claim_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          claim_no?: string
          claim_status?: string
          completed_at?: string | null
          completed_by_employee_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          opened_at?: string
          opened_by_employee_id?: string
          payment_hold_note?: string
          payment_hold_required?: boolean
          purchase_order_id?: string | null
          replacement_delivery_note_no?: string | null
          site_id?: string
          supplier_claim_reference?: string | null
          supplier_credit_note_no?: string | null
          supplier_delivery_id?: string
          supplier_id?: string
          supplier_replacement_claim_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_replacement_claims_completed_by_employee_id_fkey"
            columns: ["completed_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claims_opened_by_employee_id_fkey"
            columns: ["opened_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claims_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["purchase_order_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claims_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claims_supplier_delivery_id_fkey"
            columns: ["supplier_delivery_id"]
            isOneToOne: false
            referencedRelation: "supplier_deliveries"
            referencedColumns: ["supplier_delivery_id"]
          },
          {
            foreignKeyName: "supplier_replacement_claims_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      supplier_replacement_receipt_items: {
        Row: {
          conversion_factor_to_base: number
          created_at: string
          created_by: string
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          product_id: string
          received_base_quantity: number
          received_quantity: number
          received_uom_code: string
          stock_location_id: string | null
          stock_lot_id: string | null
          stock_movement_id: string | null
          supplier_replacement_claim_item_id: string
          supplier_replacement_receipt_id: string
          supplier_replacement_receipt_item_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          conversion_factor_to_base: number
          created_at?: string
          created_by: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          product_id: string
          received_base_quantity: number
          received_quantity: number
          received_uom_code: string
          stock_location_id?: string | null
          stock_lot_id?: string | null
          stock_movement_id?: string | null
          supplier_replacement_claim_item_id: string
          supplier_replacement_receipt_id: string
          supplier_replacement_receipt_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          product_id?: string
          received_base_quantity?: number
          received_quantity?: number
          received_uom_code?: string
          stock_location_id?: string | null
          stock_lot_id?: string | null
          stock_movement_id?: string | null
          supplier_replacement_claim_item_id?: string
          supplier_replacement_receipt_id?: string
          supplier_replacement_receipt_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_replacement_receipt__supplier_replacement_claim_i_fkey"
            columns: ["supplier_replacement_claim_item_id"]
            isOneToOne: false
            referencedRelation: "supplier_replacement_claim_items"
            referencedColumns: ["supplier_replacement_claim_item_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipt__supplier_replacement_receipt_fkey"
            columns: ["supplier_replacement_receipt_id"]
            isOneToOne: false
            referencedRelation: "supplier_replacement_receipts"
            referencedColumns: ["supplier_replacement_receipt_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipt_items_received_uom_code_fkey"
            columns: ["received_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "supplier_replacement_receipt_items_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipt_items_stock_lot_id_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipt_items_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
        ]
      }
      supplier_replacement_receipts: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          project_id: string | null
          receipt_status: string
          received_at: string
          received_by_employee_id: string
          site_id: string
          supplier_id: string
          supplier_replacement_claim_id: string
          supplier_replacement_note_no: string | null
          supplier_replacement_receipt_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id?: string | null
          receipt_status?: string
          received_at?: string
          received_by_employee_id: string
          site_id: string
          supplier_id: string
          supplier_replacement_claim_id: string
          supplier_replacement_note_no?: string | null
          supplier_replacement_receipt_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id?: string | null
          receipt_status?: string
          received_at?: string
          received_by_employee_id?: string
          site_id?: string
          supplier_id?: string
          supplier_replacement_claim_id?: string
          supplier_replacement_note_no?: string | null
          supplier_replacement_receipt_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_replacement_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_received_by_employee_id_fkey"
            columns: ["received_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_supplier_replacement_claim_i_fkey"
            columns: ["supplier_replacement_claim_id"]
            isOneToOne: false
            referencedRelation: "supplier_replacement_claims"
            referencedColumns: ["supplier_replacement_claim_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          abn: string | null
          created_at: string
          created_by: string | null
          default_currency: string
          default_expense_account_code: string | null
          default_tax_type: string | null
          deleted_at: string | null
          delivery_lead_days: number | null
          email: string | null
          freight_notes: string | null
          is_active: boolean
          is_deleted: boolean
          legal_name: string | null
          minimum_order_value: number | null
          notes: string | null
          payment_terms_days: number
          payment_terms_type: string
          phone: string | null
          supplier_code: string
          supplier_id: string
          supplier_name: string
          supplier_type: string
          updated_at: string
          updated_by: string | null
          website: string | null
          xero_contact_id: string | null
          xero_contact_name: string | null
          xero_contact_number: string | null
          xero_last_synced_at: string | null
          xero_status: string
          xero_sync_error: string | null
        }
        Insert: {
          abn?: string | null
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_expense_account_code?: string | null
          default_tax_type?: string | null
          deleted_at?: string | null
          delivery_lead_days?: number | null
          email?: string | null
          freight_notes?: string | null
          is_active?: boolean
          is_deleted?: boolean
          legal_name?: string | null
          minimum_order_value?: number | null
          notes?: string | null
          payment_terms_days?: number
          payment_terms_type?: string
          phone?: string | null
          supplier_code?: string
          supplier_id?: string
          supplier_name: string
          supplier_type?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
          xero_contact_id?: string | null
          xero_contact_name?: string | null
          xero_contact_number?: string | null
          xero_last_synced_at?: string | null
          xero_status?: string
          xero_sync_error?: string | null
        }
        Update: {
          abn?: string | null
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_expense_account_code?: string | null
          default_tax_type?: string | null
          deleted_at?: string | null
          delivery_lead_days?: number | null
          email?: string | null
          freight_notes?: string | null
          is_active?: boolean
          is_deleted?: boolean
          legal_name?: string | null
          minimum_order_value?: number | null
          notes?: string | null
          payment_terms_days?: number
          payment_terms_type?: string
          phone?: string | null
          supplier_code?: string
          supplier_id?: string
          supplier_name?: string
          supplier_type?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
          xero_contact_id?: string | null
          xero_contact_name?: string | null
          xero_contact_number?: string | null
          xero_last_synced_at?: string | null
          xero_status?: string
          xero_sync_error?: string | null
        }
        Relationships: []
      }
      units_of_measure: {
        Row: {
          created_at: string
          created_by: string | null
          decimal_places: number
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          sort_order: number
          uom_category: string
          uom_code: string
          uom_id: string
          uom_name: string
          uom_symbol: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decimal_places?: number
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          uom_category: string
          uom_code: string
          uom_id?: string
          uom_name: string
          uom_symbol: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decimal_places?: number
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          uom_category?: string
          uom_code?: string
          uom_id?: string
          uom_name?: string
          uom_symbol?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      variation_lines: {
        Row: {
          allow_fractional_quantity: boolean
          base_quantity: number
          base_uom_code: string | null
          conversion_factor: number
          cost_price: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          discount_amount: number
          discount_percent: number
          is_active: boolean
          is_deleted: boolean
          is_optional: boolean
          line_no: number
          line_total: number
          margin_amount: number
          margin_percent: number
          notes: string | null
          product_id: string | null
          project_area_id: string | null
          quantity: number
          sales_uom_code: string | null
          tax_amount: number
          tax_rate: number
          unit_of_measure: string | null
          unit_price: number
          updated_at: string
          updated_by: string | null
          variation_id: string
          variation_line_id: string
        }
        Insert: {
          allow_fractional_quantity?: boolean
          base_quantity?: number
          base_uom_code?: string | null
          conversion_factor?: number
          cost_price?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          discount_amount?: number
          discount_percent?: number
          is_active?: boolean
          is_deleted?: boolean
          is_optional?: boolean
          line_no: number
          line_total?: number
          margin_amount?: number
          margin_percent?: number
          notes?: string | null
          product_id?: string | null
          project_area_id?: string | null
          quantity?: number
          sales_uom_code?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
          variation_id: string
          variation_line_id?: string
        }
        Update: {
          allow_fractional_quantity?: boolean
          base_quantity?: number
          base_uom_code?: string | null
          conversion_factor?: number
          cost_price?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          discount_amount?: number
          discount_percent?: number
          is_active?: boolean
          is_deleted?: boolean
          is_optional?: boolean
          line_no?: number
          line_total?: number
          margin_amount?: number
          margin_percent?: number
          notes?: string | null
          product_id?: string | null
          project_area_id?: string | null
          quantity?: number
          sales_uom_code?: string | null
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
          variation_id?: string
          variation_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_lines_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "variation_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "variation_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "variation_lines_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "variation_lines_sales_uom_code_fkey"
            columns: ["sales_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "variation_lines_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "variations"
            referencedColumns: ["variation_id"]
          },
        ]
      }
      variations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          accepted_revision_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          discount_amount: number
          is_active: boolean
          is_deleted: boolean
          issue_date: string
          notes: string | null
          project_id: string
          project_site_id: string
          quotation_id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          sent_at: string | null
          sent_by: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
          variation_id: string
          variation_no: string
          variation_reason: string
          variation_status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_revision_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          discount_amount?: number
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          project_id: string
          project_site_id: string
          quotation_id: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          sent_by?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          variation_id?: string
          variation_no: string
          variation_reason: string
          variation_status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          accepted_revision_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          discount_amount?: number
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          project_id?: string
          project_site_id?: string
          quotation_id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          sent_by?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          variation_id?: string
          variation_no?: string
          variation_reason?: string
          variation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "variations_accepted_revision_id_fkey"
            columns: ["accepted_revision_id"]
            isOneToOne: false
            referencedRelation: "quotation_revisions"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "variations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "variations_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "variations_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
          },
        ]
      }
      work_activity_types: {
        Row: {
          activity_code: string
          activity_name: string
          activity_type_id: string
          counts_toward_progress: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_code: string
          activity_name: string
          activity_type_id?: string
          counts_toward_progress?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_code?: string
          activity_name?: string
          activity_type_id?: string
          counts_toward_progress?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      work_assignments: {
        Row: {
          activity_type_id: string | null
          area_id: string | null
          assigned_at: string | null
          assigned_date: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          employee_id: string
          ended_at: string | null
          ended_date: string | null
          is_deleted: boolean
          notes: string | null
          project_id: string
          site_id: string | null
          unassigned_date: string | null
          updated_at: string
          updated_by: string | null
          work_assignment_id: string
          work_order_id: string | null
        }
        Insert: {
          activity_type_id?: string | null
          area_id?: string | null
          assigned_at?: string | null
          assigned_date?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          employee_id: string
          ended_at?: string | null
          ended_date?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id: string
          site_id?: string | null
          unassigned_date?: string | null
          updated_at?: string
          updated_by?: string | null
          work_assignment_id?: string
          work_order_id?: string | null
        }
        Update: {
          activity_type_id?: string | null
          area_id?: string | null
          assigned_at?: string | null
          assigned_date?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          employee_id?: string
          ended_at?: string | null
          ended_date?: string | null
          is_deleted?: boolean
          notes?: string | null
          project_id?: string
          site_id?: string | null
          unassigned_date?: string | null
          updated_at?: string
          updated_by?: string | null
          work_assignment_id?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_assignments_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "work_activity_types"
            referencedColumns: ["activity_type_id"]
          },
          {
            foreignKeyName: "work_assignments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "work_assignments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "work_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "work_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "work_assignments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
          },
        ]
      }
      work_order_scopes: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
          work_order_scope_code: string
          work_order_scope_id: string
          work_order_scope_name: string
          work_order_type_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          work_order_scope_code: string
          work_order_scope_id?: string
          work_order_scope_name: string
          work_order_type_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          work_order_scope_code?: string
          work_order_scope_id?: string
          work_order_scope_name?: string
          work_order_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_scopes_type_fk"
            columns: ["work_order_type_id"]
            isOneToOne: false
            referencedRelation: "work_order_types"
            referencedColumns: ["work_order_type_id"]
          },
        ]
      }
      work_order_types: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
          work_order_type_code: string
          work_order_type_id: string
          work_order_type_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          work_order_type_code: string
          work_order_type_id?: string
          work_order_type_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          work_order_type_code?: string
          work_order_type_id?: string
          work_order_type_name?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          area_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_deleted: boolean
          notes: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          priority: string
          project_id: string
          site_id: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          work_order_id: string
          work_order_no: string
          work_order_scope_id: string
          work_order_type_id: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string
          project_id: string
          site_id: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string
          work_order_no?: string
          work_order_scope_id: string
          work_order_type_id: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string
          project_id?: string
          site_id?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string
          work_order_no?: string
          work_order_scope_id?: string
          work_order_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "work_orders_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "work_orders_work_order_scope_id_fkey"
            columns: ["work_order_scope_id"]
            isOneToOne: false
            referencedRelation: "work_order_scopes"
            referencedColumns: ["work_order_scope_id"]
          },
          {
            foreignKeyName: "work_orders_work_order_type_id_fkey"
            columns: ["work_order_type_id"]
            isOneToOne: false
            referencedRelation: "work_order_types"
            referencedColumns: ["work_order_type_id"]
          },
        ]
      }
      work_time_logs: {
        Row: {
          activity_type_id: string | null
          approved: boolean
          approved_at: string | null
          approved_break_minutes: number | null
          approved_by: string | null
          approved_clock_in: string | null
          approved_clock_out: string | null
          approved_overtime_hours: number | null
          approved_regular_hours: number | null
          area_id: string | null
          attendance_status: string | null
          break_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string
          created_by: string | null
          daily_report_id: string | null
          deleted_at: string | null
          employee_id: string
          is_deleted: boolean
          notes: string | null
          ot_completed_quantity: number | null
          ot_finish: string | null
          ot_start: string | null
          overtime_hours: number | null
          project_id: string
          regular_hours: number | null
          replaces_work_assignment_id: string | null
          report_id: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          site_id: string | null
          time_status: string | null
          updated_at: string
          updated_by: string | null
          work_assignment_id: string | null
          work_date: string
          work_order_id: string | null
          work_time_log_id: string
          worker_source: string | null
        }
        Insert: {
          activity_type_id?: string | null
          approved?: boolean
          approved_at?: string | null
          approved_break_minutes?: number | null
          approved_by?: string | null
          approved_clock_in?: string | null
          approved_clock_out?: string | null
          approved_overtime_hours?: number | null
          approved_regular_hours?: number | null
          area_id?: string | null
          attendance_status?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          created_by?: string | null
          daily_report_id?: string | null
          deleted_at?: string | null
          employee_id: string
          is_deleted?: boolean
          notes?: string | null
          ot_completed_quantity?: number | null
          ot_finish?: string | null
          ot_start?: string | null
          overtime_hours?: number | null
          project_id: string
          regular_hours?: number | null
          replaces_work_assignment_id?: string | null
          report_id?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string | null
          time_status?: string | null
          updated_at?: string
          updated_by?: string | null
          work_assignment_id?: string | null
          work_date: string
          work_order_id?: string | null
          work_time_log_id?: string
          worker_source?: string | null
        }
        Update: {
          activity_type_id?: string | null
          approved?: boolean
          approved_at?: string | null
          approved_break_minutes?: number | null
          approved_by?: string | null
          approved_clock_in?: string | null
          approved_clock_out?: string | null
          approved_overtime_hours?: number | null
          approved_regular_hours?: number | null
          area_id?: string | null
          attendance_status?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          created_by?: string | null
          daily_report_id?: string | null
          deleted_at?: string | null
          employee_id?: string
          is_deleted?: boolean
          notes?: string | null
          ot_completed_quantity?: number | null
          ot_finish?: string | null
          ot_start?: string | null
          overtime_hours?: number | null
          project_id?: string
          regular_hours?: number | null
          replaces_work_assignment_id?: string | null
          report_id?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string | null
          time_status?: string | null
          updated_at?: string
          updated_by?: string | null
          work_assignment_id?: string | null
          work_date?: string
          work_order_id?: string | null
          work_time_log_id?: string
          worker_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_time_logs_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "work_activity_types"
            referencedColumns: ["activity_type_id"]
          },
          {
            foreignKeyName: "work_time_logs_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "work_time_logs_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "work_time_logs_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "work_time_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "work_time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_time_logs_replaces_work_assignment_id_fkey"
            columns: ["replaces_work_assignment_id"]
            isOneToOne: false
            referencedRelation: "work_assignments"
            referencedColumns: ["work_assignment_id"]
          },
          {
            foreignKeyName: "work_time_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "work_time_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "work_time_logs_work_assignment_id_fkey"
            columns: ["work_assignment_id"]
            isOneToOne: false
            referencedRelation: "work_assignments"
            referencedColumns: ["work_assignment_id"]
          },
          {
            foreignKeyName: "work_time_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
          },
        ]
      }
      xero_export_logs: {
        Row: {
          created_at: string
          error_message: string | null
          export_status: string
          exported_at: string | null
          exported_by: string | null
          payload: Json | null
          response: Json | null
          source_id: string
          source_type: string
          updated_at: string
          xero_export_log_id: string
          xero_reference_id: string | null
          xero_reference_no: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          export_status?: string
          exported_at?: string | null
          exported_by?: string | null
          payload?: Json | null
          response?: Json | null
          source_id: string
          source_type: string
          updated_at?: string
          xero_export_log_id?: string
          xero_reference_id?: string | null
          xero_reference_no?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          export_status?: string
          exported_at?: string | null
          exported_by?: string | null
          payload?: Json | null
          response?: Json | null
          source_id?: string
          source_type?: string
          updated_at?: string
          xero_export_log_id?: string
          xero_reference_id?: string | null
          xero_reference_no?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      product_flooring_specs_v: {
        Row: {
          calculated_sqm_per_box: number | null
          calculated_sqm_per_plank: number | null
          coverage_difference_sqm: number | null
          coverage_method: string | null
          coverage_validation_message: string | null
          created_at: string | null
          created_by: string | null
          declared_sqm_per_box: number | null
          deleted_at: string | null
          dimension_type: string | null
          effective_sqm_per_box: number | null
          effective_sqm_per_plank: number | null
          is_active: boolean | null
          is_deleted: boolean | null
          manufacturer_name: string | null
          manufacturer_notes: string | null
          manufacturer_product_code: string | null
          maximum_length_mm: number | null
          minimum_length_mm: number | null
          plank_length_mm: number | null
          plank_thickness_mm: number | null
          plank_width_mm: number | null
          planks_per_box: number | null
          product_code: string | null
          product_flooring_spec_id: string | null
          product_id: string | null
          product_name: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_flooring_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      project_area_progress_v: {
        Row: {
          actual_quantity: number | null
          area_code: string | null
          area_id: string | null
          area_name: string | null
          area_type: string | null
          customer_name: string | null
          estimated_quantity: number | null
          progress_percent: number | null
          project_id: string | null
          project_name: string | null
          project_no: string | null
          remaining_quantity: number | null
          site_code: string | null
          site_id: string | null
          site_name: string | null
          unit_of_measure: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      v_cash_flow: {
        Row: {
          balance_amount: number | null
          customer_name: string | null
          due_date: string | null
          invoice_no: string | null
          invoice_status: string | null
          paid_amount: number | null
          total_amount: number | null
        }
        Relationships: []
      }
      v_outstanding_invoices: {
        Row: {
          balance_amount: number | null
          customer_invoice_id: string | null
          customer_name: string | null
          due_date: string | null
          invoice_date: string | null
          invoice_no: string | null
          invoice_status: string | null
          is_overdue: boolean | null
          paid_amount: number | null
          project_name: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      v_payroll_summary: {
        Row: {
          employee_count: number | null
          end_date: string | null
          payroll_period_id: string | null
          period_name: string | null
          period_no: string | null
          start_date: string | null
          status: string | null
          total_gross_amount: number | null
          total_net_amount: number | null
        }
        Relationships: []
      }
      v_project_profitability: {
        Row: {
          customer_name: string | null
          invoice_total: number | null
          labour_cost: number | null
          material_cost: number | null
          project_id: string | null
          project_name: string | null
          project_no: string | null
        }
        Relationships: []
      }
      v_project_progress: {
        Row: {
          customer_name: string | null
          last_report_date: string | null
          latest_progress_percent: number | null
          project_id: string | null
          project_name: string | null
          project_no: string | null
          project_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_quotation_atomic: {
        Args: {
          p_delivery_stock_location_id?: string
          p_material_requirement_notes?: string
          p_quotation_id: string
          p_required_by_date?: string
          p_responsible_auth_user_id?: string
        }
        Returns: string
      }
      accept_variation_atomic: {
        Args: {
          p_delivery_stock_location_id?: string
          p_material_requirement_notes?: string
          p_required_by_date?: string
          p_responsible_auth_user_id?: string
          p_variation_id: string
        }
        Returns: string
      }
      add_material_requirement_operational_line: {
        Args: {
          p_adjustment_reason: string
          p_allow_fractional_quantity?: boolean
          p_base_uom_code: string
          p_commercial_impact?: string
          p_conversion_factor_to_base?: number
          p_description: string
          p_material_requirement_id: string
          p_notes?: string
          p_preferred_supplier_id?: string
          p_product_id: string
          p_project_area_id: string
          p_required_by_date?: string
          p_requirement_quantity: number
          p_requirement_uom_code: string
          p_variation_reference?: string
          p_variation_required?: boolean
          p_variation_status?: string
          p_waste_percent?: number
        }
        Returns: Json
      }
      admin_list_app_users: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          account_status: string
          admin_notes: string
          app_user_id: string
          approved_at: string
          approved_by: string
          auth_user_id: string
          created_at: string
          display_name: string
          email: string
          phone: string
          rejected_at: string
          rejection_reason: string
          role_code: string
          role_id: string
          role_name: string
          suspended_at: string
          suspension_reason: string
          total_count: number
          updated_at: string
        }[]
      }
      approve_app_user_atomic: {
        Args: {
          p_admin_notes?: string
          p_auth_user_id: string
          p_role_code: string
        }
        Returns: string
      }
      approve_stock_request_item: {
        Args: {
          p_approved_quantity: number
          p_stock_request_id: string
          p_stock_request_item_id: string
        }
        Returns: undefined
      }
      archive_product_attributes_not_in_category: {
        Args: { p_new_category_id: string; p_product_id: string }
        Returns: number
      }
      assert_product_required_attributes_complete: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      assign_generated_product_code: {
        Args: {
          p_category_variant_id: string
          p_colour_id: string
          p_first_value?: number
          p_product_code_type_id: string
          p_product_id: string
          p_second_value?: number
          p_size_rule_id: string
        }
        Returns: string
      }
      assign_material_requirement_responsible: {
        Args: {
          p_assignment_reason: string
          p_material_requirement_id: string
          p_responsible_auth_user_id: string
        }
        Returns: Json
      }
      build_product_code_size_token: {
        Args: {
          p_first_value?: number
          p_second_value?: number
          p_size_rule_id: string
        }
        Returns: string
      }
      can_manage_permissions: { Args: never; Returns: boolean }
      can_manage_products_strict: { Args: never; Returns: boolean }
      cancel_quotation_atomic: {
        Args: { p_cancellation_reason: string; p_quotation_id: string }
        Returns: Json
      }
      cancel_quotation_revision_atomic: {
        Args: { p_cancellation_reason: string; p_revision_id: string }
        Returns: Json
      }
      cancel_variation_atomic: {
        Args: { p_cancellation_reason: string; p_variation_id: string }
        Returns: Json
      }
      create_product_atomic: {
        Args: {
          p_attributes?: Json
          p_coverages?: Json
          p_product: Json
          p_uom_conversions?: Json
        }
        Returns: {
          product_code: string
          product_id: string
          product_name: string
          variant_code: string
        }[]
      }
      create_product_atomic_internal: {
        Args: {
          p_attributes?: Json
          p_coverages?: Json
          p_product: Json
          p_uom_conversions?: Json
        }
        Returns: {
          product_code: string
          product_id: string
          product_name: string
          variant_code: string
        }[]
      }
      create_project_area_atomic: {
        Args: {
          p_area_name: string
          p_area_type?: string
          p_estimated_quantity?: number
          p_notes?: string
          p_site_id: string
          p_unit_of_measure?: string
        }
        Returns: Json
      }
      create_quotation_atomic: {
        Args: { p_lines: Json; p_quotation: Json }
        Returns: Json
      }
      create_quotation_revision_atomic: {
        Args: {
          p_quotation_id: string
          p_revision_notes?: string
          p_revision_reason?: string
        }
        Returns: Json
      }
      create_supplier_delivery_receipt: {
        Args: {
          p_items: Json
          p_notes?: string
          p_site_id: string
          p_stock_location_id: string
          p_supplier_delivery_id: string
        }
        Returns: Json
      }
      create_variation_atomic: {
        Args: { p_lines: Json; p_variation: Json }
        Returns: Json
      }
      create_work_assignment: {
        Args: {
          p_area_id: string
          p_employee_id: string
          p_notes?: string
          p_project_id: string
          p_site_id: string
          p_work_order_id: string
        }
        Returns: string
      }
      current_app_role: { Args: never; Returns: string }
      current_app_user_status: { Args: never; Returns: string }
      current_employee_id: { Args: never; Returns: string }
      end_work_assignment: {
        Args: { p_work_assignment_id: string }
        Returns: undefined
      }
      exclude_material_requirement_line: {
        Args: {
          p_adjustment_reason: string
          p_exclusion_reason: string
          p_material_requirement_line_id: string
        }
        Returns: Json
      }
      generate_document_number: {
        Args: {
          p_document_type: string
          p_prefix: string
          p_reset_monthly?: boolean
        }
        Returns: string
      }
      generate_employee_code: { Args: never; Returns: string }
      generate_material_requirement_from_accepted_quotation: {
        Args: {
          p_delivery_stock_location_id?: string
          p_notes?: string
          p_quotation_id: string
          p_required_by_date?: string
          p_responsible_auth_user_id?: string
        }
        Returns: string
      }
      generate_material_requirement_from_accepted_variation: {
        Args: {
          p_delivery_stock_location_id?: string
          p_notes?: string
          p_required_by_date?: string
          p_responsible_auth_user_id?: string
          p_variation_id: string
        }
        Returns: string
      }
      generate_product_code: {
        Args: {
          p_category_variant_id: string
          p_colour_id: string
          p_first_value?: number
          p_product_code_type_id: string
          p_second_value?: number
          p_size_rule_id: string
        }
        Returns: {
          colour_code: string
          full_category_code: string
          generated_at: string
          generated_product_code: string
          size_token: string
          type_code: string
          variant_code: string
          variant_number: number
        }[]
      }
      generate_product_code_variant: {
        Args: {
          p_category_variant_id: string
          p_colour_id: string
          p_first_value?: number
          p_product_code_type_id: string
          p_second_value?: number
          p_size_rule_id: string
          p_variant_description?: string
          p_variant_name?: string
          p_variant_number?: number
        }
        Returns: {
          colour_code: string
          full_category_code: string
          generated_at: string
          generated_product_code: string
          size_token: string
          type_code: string
          variant_code: string
          variant_description: string
          variant_name: string
          variant_number: number
        }[]
      }
      generate_project_area_code: { Args: never; Returns: string }
      generate_project_site_code: { Args: never; Returns: string }
      generate_work_order_no: {
        Args: { p_created_at?: string }
        Returns: string
      }
      get_effective_product_category_attributes: {
        Args: { p_category_id: string }
        Returns: {
          attribute_code: string
          attribute_id: string
          attribute_name: string
          category_attribute_id: string
          data_type: string
          description: string
          effective_default_value: Json
          effective_help_text: string
          effective_label: string
          is_filterable: boolean
          is_required: boolean
          is_searchable: boolean
          section_name: string
          sort_order: number
          source_category_id: string
          source_category_name: string
          source_depth: number
          unit_name: string
          unit_symbol: string
          unit_uom_code: string
          validation_rules: Json
        }[]
      }
      get_effective_product_specification_type: {
        Args: { p_category_id: string }
        Returns: string
      }
      get_missing_required_product_attributes: {
        Args: { p_product_id: string }
        Returns: {
          attribute_code: string
          attribute_id: string
          attribute_label: string
          data_type: string
          section_name: string
        }[]
      }
      get_my_app_user: {
        Args: never
        Returns: {
          account_status: string
          app_user_id: string
          approved_at: string
          auth_user_id: string
          created_at: string
          display_name: string
          email: string
          phone: string
          rejected_at: string
          rejection_reason: string
          suspended_at: string
          suspension_reason: string
          updated_at: string
        }[]
      }
      get_next_available_product_variant_number: {
        Args: {
          p_colour_code: string
          p_full_category_code: string
          p_size_token: string
          p_type_code: string
        }
        Returns: number
      }
      get_product_category_ancestors: {
        Args: { p_category_id: string }
        Returns: {
          category_depth: number
          category_id: string
          category_name: string
          parent_category_id: string
        }[]
      }
      get_product_code_context: {
        Args: {
          p_category_variant_id: string
          p_colour_id: string
          p_first_value?: number
          p_product_code_type_id: string
          p_second_value?: number
          p_size_rule_id: string
        }
        Returns: {
          category_variant_name: string
          colour_code: string
          colour_name: string
          family_code: string
          family_name: string
          full_category_code: string
          size_rule_name: string
          size_token: string
          type_code: string
          type_name: string
        }[]
      }
      get_quotation_detail: { Args: { p_quotation_id: string }; Returns: Json }
      has_active_app_access: { Args: never; Returns: boolean }
      has_permission: { Args: { p_permission_code: string }; Returns: boolean }
      is_active_company_employee: { Args: never; Returns: boolean }
      is_admin_role: { Args: never; Returns: boolean }
      is_payroll_role: { Args: never; Returns: boolean }
      is_project_role: { Args: never; Returns: boolean }
      is_strict_admin_role: { Args: never; Returns: boolean }
      issue_stock_request_item: {
        Args: {
          p_movement_date?: string
          p_notes?: string
          p_quantity: number
          p_stock_lot_id: string
          p_stock_request_item_id: string
        }
        Returns: string
      }
      list_quotations: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      preview_product_code: {
        Args: {
          p_category_variant_id: string
          p_colour_id: string
          p_first_value?: number
          p_product_code_type_id: string
          p_second_value?: number
          p_size_rule_id: string
        }
        Returns: {
          category_variant_name: string
          colour_code: string
          colour_name: string
          family_code: string
          family_name: string
          full_category_code: string
          next_variant_number: number
          product_code_preview: string
          size_rule_name: string
          size_token: string
          type_code: string
          type_name: string
          variant_preview: string
          warning_text: string
        }[]
      }
      preview_product_code_variant: {
        Args: {
          p_category_variant_id: string
          p_colour_id: string
          p_first_value?: number
          p_product_code_type_id: string
          p_second_value?: number
          p_size_rule_id: string
          p_variant_description?: string
          p_variant_name?: string
          p_variant_number?: number
        }
        Returns: {
          category_variant_name: string
          colour_code: string
          colour_name: string
          family_code: string
          family_name: string
          full_category_code: string
          is_variant_available: boolean
          product_code_preview: string
          selected_variant_number: number
          size_rule_name: string
          size_token: string
          type_code: string
          type_name: string
          variant_code: string
          variant_description: string
          variant_name: string
          warning_text: string
        }[]
      }
      reactivate_app_user_atomic: {
        Args: {
          p_admin_notes?: string
          p_auth_user_id: string
          p_role_code: string
        }
        Returns: string
      }
      receive_supplier_delivery_item_to_stock: {
        Args: {
          p_expiry_date?: string
          p_lot_no?: string
          p_notes?: string
          p_stock_location_id: string
          p_supplier_delivery_item_id: string
        }
        Returns: Json
      }
      receive_supplier_replacement: {
        Args: {
          p_items: Json
          p_notes?: string
          p_site_id: string
          p_stock_location_id: string
          p_supplier_replacement_claim_id: string
          p_supplier_replacement_note_no: string
        }
        Returns: Json
      }
      record_stock_movement: {
        Args: {
          p_movement_date?: string
          p_movement_type: string
          p_notes?: string
          p_quantity: number
          p_reason?: string
          p_reference_no?: string
          p_stock_lot_id: string
          p_stock_request_item_id?: string
          p_supplier_delivery_item_id?: string
        }
        Returns: string
      }
      reject_app_user_atomic: {
        Args: { p_auth_user_id: string; p_reason: string }
        Returns: string
      }
      reject_quotation_atomic: {
        Args: { p_quotation_id: string; p_rejection_reason: string }
        Returns: Json
      }
      reject_quotation_revision_atomic: {
        Args: { p_rejection_reason: string; p_revision_id: string }
        Returns: Json
      }
      reject_stock_request: {
        Args: { p_stock_request_id: string }
        Returns: undefined
      }
      reject_variation_atomic: {
        Args: { p_rejection_reason: string; p_variation_id: string }
        Returns: Json
      }
      remove_mistaken_work_assignment: {
        Args: { p_work_assignment_id: string }
        Returns: undefined
      }
      reserve_stock_request_item: {
        Args: {
          p_movement_date?: string
          p_notes?: string
          p_quantity: number
          p_stock_lot_id: string
          p_stock_request_item_id: string
        }
        Returns: string
      }
      restore_material_requirement_line: {
        Args: {
          p_adjustment_reason: string
          p_material_requirement_line_id: string
        }
        Returns: Json
      }
      save_product_flooring_spec: {
        Args: {
          p_coverage_method: string
          p_declared_sqm_per_box: number
          p_dimension_type: string
          p_manufacturer_name?: string
          p_manufacturer_notes?: string
          p_manufacturer_product_code?: string
          p_maximum_length_mm: number
          p_minimum_length_mm: number
          p_plank_length_mm: number
          p_plank_thickness_mm: number
          p_plank_width_mm: number
          p_planks_per_box: number
          p_product_id: string
        }
        Returns: Json
      }
      send_quotation_atomic: { Args: { p_quotation_id: string }; Returns: Json }
      send_quotation_revision_atomic: {
        Args: { p_revision_id: string }
        Returns: Json
      }
      send_variation_atomic: { Args: { p_variation_id: string }; Returns: Json }
      soft_delete_quotation_atomic: {
        Args: { p_quotation_id: string }
        Returns: Json
      }
      soft_delete_quotation_revision_atomic: {
        Args: { p_revision_id: string }
        Returns: Json
      }
      substitute_material_requirement_line_product: {
        Args: {
          p_adjustment_reason: string
          p_allow_fractional_quantity: boolean
          p_base_uom_code: string
          p_commercial_impact?: string
          p_commercial_notes?: string
          p_conversion_factor_to_base: number
          p_description: string
          p_material_requirement_line_id: string
          p_preferred_supplier_id?: string
          p_product_id: string
          p_requirement_quantity: number
          p_requirement_uom_code: string
          p_variation_reference?: string
          p_variation_required?: boolean
          p_variation_status?: string
          p_waste_percent: number
        }
        Returns: Json
      }
      suspend_app_user_atomic: {
        Args: { p_auth_user_id: string; p_reason: string }
        Returns: string
      }
      transition_material_requirement_status: {
        Args: {
          p_action: string
          p_material_requirement_id: string
          p_reason?: string
        }
        Returns: Json
      }
      update_draft_quotation_atomic: {
        Args: { p_lines: Json; p_quotation: Json; p_quotation_id: string }
        Returns: Json
      }
      update_draft_quotation_revision_atomic: {
        Args: { p_lines: Json; p_revision: Json; p_revision_id: string }
        Returns: Json
      }
      update_draft_variation_atomic: {
        Args: { p_lines: Json; p_variation: Json; p_variation_id: string }
        Returns: Json
      }
      update_material_requirement_header: {
        Args: {
          p_delivery_destination_type: string
          p_delivery_stock_location_id: string
          p_material_requirement_id: string
          p_notes: string
          p_required_by_date: string
          p_site_id: string
        }
        Returns: Json
      }
      update_material_requirement_line_quantity: {
        Args: {
          p_adjustment_reason: string
          p_material_requirement_line_id: string
          p_requirement_quantity: number
          p_waste_percent: number
        }
        Returns: Json
      }
      update_product_atomic: {
        Args: {
          p_attributes?: Json
          p_coverages?: Json
          p_product: Json
          p_product_id: string
          p_uom_conversions?: Json
        }
        Returns: {
          product_code: string
          product_id: string
          product_name: string
        }[]
      }
      update_product_atomic_internal: {
        Args: {
          p_attributes?: Json
          p_coverages?: Json
          p_product: Json
          p_product_id: string
          p_uom_conversions?: Json
        }
        Returns: {
          product_code: string
          product_id: string
          product_name: string
        }[]
      }
      user_has_permission: {
        Args: { p_auth_user_id: string; p_permission_code: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
