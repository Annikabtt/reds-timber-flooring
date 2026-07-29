export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_control_audit_log: {
        Row: {
          access_control_audit_id: string
          change_type: string
          changed_at: string
          changed_by: string | null
          new_value: Json | null
          old_value: Json | null
          permission_code: string | null
          permission_id: string | null
          reason: string | null
          target_auth_user_id: string | null
          target_role_id: string | null
        }
        Insert: {
          access_control_audit_id?: string
          change_type: string
          changed_at?: string
          changed_by?: string | null
          new_value?: Json | null
          old_value?: Json | null
          permission_code?: string | null
          permission_id?: string | null
          reason?: string | null
          target_auth_user_id?: string | null
          target_role_id?: string | null
        }
        Update: {
          access_control_audit_id?: string
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          new_value?: Json | null
          old_value?: Json | null
          permission_code?: string | null
          permission_id?: string | null
          reason?: string | null
          target_auth_user_id?: string | null
          target_role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_control_audit_log_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["permission_id"]
          },
          {
            foreignKeyName: "access_control_audit_log_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_financial_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_financial_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
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
          allow_fractional_quantity: boolean
          base_quantity: number | null
          base_uom_code: string | null
          conversion_factor: number | null
          created_at: string
          created_by: string | null
          customer_invoice_id: string
          customer_invoice_item_id: string
          deleted_at: string | null
          description: string
          discount_amount: number
          discount_percent: number
          is_deleted: boolean
          line_no: number
          line_subtotal: number
          line_total: number
          line_type: string
          notes: string | null
          original_unit_price: number | null
          price_book_id: string | null
          price_book_line_id: string | null
          price_source: string
          product_code_snapshot: string | null
          product_id: string | null
          product_name_snapshot: string | null
          project_area_id: string | null
          quantity: number
          sales_uom_code: string | null
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean
          base_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor?: number | null
          created_at?: string
          created_by?: string | null
          customer_invoice_id: string
          customer_invoice_item_id?: string
          deleted_at?: string | null
          description: string
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          line_no: number
          line_subtotal?: number
          line_total?: number
          line_type?: string
          notes?: string | null
          original_unit_price?: number | null
          price_book_id?: string | null
          price_book_line_id?: string | null
          price_source?: string
          product_code_snapshot?: string | null
          product_id?: string | null
          product_name_snapshot?: string | null
          project_area_id?: string | null
          quantity?: number
          sales_uom_code?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean
          base_quantity?: number | null
          base_uom_code?: string | null
          conversion_factor?: number | null
          created_at?: string
          created_by?: string | null
          customer_invoice_id?: string
          customer_invoice_item_id?: string
          deleted_at?: string | null
          description?: string
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          line_no?: number
          line_subtotal?: number
          line_total?: number
          line_type?: string
          notes?: string | null
          original_unit_price?: number | null
          price_book_id?: string | null
          price_book_line_id?: string | null
          price_source?: string
          product_code_snapshot?: string | null
          product_id?: string | null
          product_name_snapshot?: string | null
          project_area_id?: string | null
          quantity?: number
          sales_uom_code?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoice_items_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "customer_invoice_items_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
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
          {
            foreignKeyName: "customer_invoice_items_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["price_book_id"]
          },
          {
            foreignKeyName: "customer_invoice_items_price_book_line_id_fkey"
            columns: ["price_book_line_id"]
            isOneToOne: false
            referencedRelation: "price_book_lines"
            referencedColumns: ["price_book_line_id"]
          },
          {
            foreignKeyName: "customer_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "customer_invoice_items_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "customer_invoice_items_project_area_id_fkey"
            columns: ["project_area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "customer_invoice_items_sales_uom_code_fkey"
            columns: ["sales_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      customer_invoices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          balance_amount: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          credit_note_reason: string | null
          currency_code: string
          customer_id: string
          customer_invoice_id: string
          customer_reference: string | null
          deleted_at: string | null
          discount_amount: number
          document_status: string
          due_date: string
          due_status: string
          invoice_date: string
          invoice_no: string
          invoice_status: string
          invoice_type: string
          is_deleted: boolean
          issued_at: string | null
          issued_by: string | null
          line_amount_type: string
          notes: string | null
          original_invoice_id: string | null
          paid_amount: number
          payment_status: string
          payment_terms_days: number | null
          payment_terms_type: string | null
          price_book_id: string | null
          project_id: string | null
          project_site_id: string | null
          retention_release_amount: number
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          xero_exported: boolean
          xero_exported_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          balance_amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_reason?: string | null
          currency_code?: string
          customer_id: string
          customer_invoice_id?: string
          customer_reference?: string | null
          deleted_at?: string | null
          discount_amount?: number
          document_status?: string
          due_date: string
          due_status?: string
          invoice_date?: string
          invoice_no: string
          invoice_status?: string
          invoice_type?: string
          is_deleted?: boolean
          issued_at?: string | null
          issued_by?: string | null
          line_amount_type?: string
          notes?: string | null
          original_invoice_id?: string | null
          paid_amount?: number
          payment_status?: string
          payment_terms_days?: number | null
          payment_terms_type?: string | null
          price_book_id?: string | null
          project_id?: string | null
          project_site_id?: string | null
          retention_release_amount?: number
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          balance_amount?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_reason?: string | null
          currency_code?: string
          customer_id?: string
          customer_invoice_id?: string
          customer_reference?: string | null
          deleted_at?: string | null
          discount_amount?: number
          document_status?: string
          due_date?: string
          due_status?: string
          invoice_date?: string
          invoice_no?: string
          invoice_status?: string
          invoice_type?: string
          is_deleted?: boolean
          issued_at?: string | null
          issued_by?: string | null
          line_amount_type?: string
          notes?: string | null
          original_invoice_id?: string | null
          paid_amount?: number
          payment_status?: string
          payment_terms_days?: number | null
          payment_terms_type?: string | null
          price_book_id?: string | null
          project_id?: string | null
          project_site_id?: string | null
          retention_release_amount?: number
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoices_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["price_book_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "customer_invoices_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      customer_payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          created_by: string | null
          customer_invoice_id: string
          customer_payment_allocation_id: string
          customer_payment_id: string
          deleted_at: string | null
          is_deleted: boolean
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          created_by?: string | null
          customer_invoice_id: string
          customer_payment_allocation_id?: string
          customer_payment_id: string
          deleted_at?: string | null
          is_deleted?: boolean
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          created_by?: string | null
          customer_invoice_id?: string
          customer_payment_allocation_id?: string
          customer_payment_id?: string
          deleted_at?: string | null
          is_deleted?: boolean
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_payment_allocations_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
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
            referencedRelation: "_payment_reporting_base"
            referencedColumns: ["customer_payment_id"]
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
          currency_code: string
          customer_id: string
          customer_payment_id: string
          deleted_at: string | null
          is_deleted: boolean
          notes: string | null
          original_payment_id: string | null
          payment_date: string
          payment_method: string
          payment_no: string
          payment_status: string
          reference_no: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          updated_at: string
          updated_by: string | null
          xero_exported: boolean
          xero_exported_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          customer_id: string
          customer_payment_id?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          original_payment_id?: string | null
          payment_date?: string
          payment_method?: string
          payment_no: string
          payment_status?: string
          reference_no?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          updated_at?: string
          updated_by?: string | null
          xero_exported?: boolean
          xero_exported_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          customer_id?: string
          customer_payment_id?: string
          deleted_at?: string | null
          is_deleted?: boolean
          notes?: string | null
          original_payment_id?: string | null
          payment_date?: string
          payment_method?: string
          payment_no?: string
          payment_status?: string
          reference_no?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_original_payment_id_fkey"
            columns: ["original_payment_id"]
            isOneToOne: false
            referencedRelation: "_payment_reporting_base"
            referencedColumns: ["customer_payment_id"]
          },
          {
            foreignKeyName: "customer_payments_original_payment_id_fkey"
            columns: ["original_payment_id"]
            isOneToOne: false
            referencedRelation: "customer_payments"
            referencedColumns: ["customer_payment_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
      inventory_transaction_photos: {
        Row: {
          caption: string | null
          condition_status: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          file_size_bytes: number | null
          inventory_transaction_photo_id: string
          is_active: boolean
          is_deleted: boolean
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          mime_type: string | null
          original_file_name: string | null
          photo_type: string
          sort_order: number
          source_id: string
          source_method: string
          source_type: string
          storage_bucket: string
          storage_path: string
          taken_at: string | null
          updated_at: string
          updated_by: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          condition_status?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          file_size_bytes?: number | null
          inventory_transaction_photo_id?: string
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          mime_type?: string | null
          original_file_name?: string | null
          photo_type: string
          sort_order?: number
          source_id: string
          source_method?: string
          source_type: string
          storage_bucket?: string
          storage_path: string
          taken_at?: string | null
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          condition_status?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          file_size_bytes?: number | null
          inventory_transaction_photo_id?: string
          is_active?: boolean
          is_deleted?: boolean
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          mime_type?: string | null
          original_file_name?: string | null
          photo_type?: string
          sort_order?: number
          source_id?: string
          source_method?: string
          source_type?: string
          storage_bucket?: string
          storage_path?: string
          taken_at?: string | null
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      invoice_sources: {
        Row: {
          created_at: string
          created_by: string | null
          customer_invoice_id: string
          deleted_at: string | null
          invoice_source_id: string
          is_deleted: boolean
          source_amount: number
          source_id: string
          source_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_invoice_id: string
          deleted_at?: string | null
          invoice_source_id?: string
          is_deleted?: boolean
          source_amount?: number
          source_id: string
          source_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_invoice_id?: string
          deleted_at?: string | null
          invoice_source_id?: string
          is_deleted?: boolean
          source_amount?: number
          source_id?: string
          source_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sources_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "material_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
      notification_delivery_attempts: {
        Row: {
          attempt_no: number
          attempted_at: string
          delivery_status: string
          error_message: string | null
          notification_delivery_attempt_id: string
          notification_destination_id: string
          notification_event_id: string
          request_payload: Json | null
          response_payload: Json | null
          sent_at: string | null
          telegram_message_id: string | null
        }
        Insert: {
          attempt_no: number
          attempted_at?: string
          delivery_status?: string
          error_message?: string | null
          notification_delivery_attempt_id?: string
          notification_destination_id: string
          notification_event_id: string
          request_payload?: Json | null
          response_payload?: Json | null
          sent_at?: string | null
          telegram_message_id?: string | null
        }
        Update: {
          attempt_no?: number
          attempted_at?: string
          delivery_status?: string
          error_message?: string | null
          notification_delivery_attempt_id?: string
          notification_destination_id?: string
          notification_event_id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          sent_at?: string | null
          telegram_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_attempts_notification_destination_id_fkey"
            columns: ["notification_destination_id"]
            isOneToOne: false
            referencedRelation: "notification_destinations"
            referencedColumns: ["notification_destination_id"]
          },
          {
            foreignKeyName: "notification_delivery_attempts_notification_event_id_fkey"
            columns: ["notification_event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["notification_event_id"]
          },
        ]
      }
      notification_destinations: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          destination_name: string
          destination_scope: string
          is_active: boolean
          is_deleted: boolean
          metadata: Json
          notification_destination_id: string
          telegram_chat_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          destination_name: string
          destination_scope?: string
          is_active?: boolean
          is_deleted?: boolean
          metadata?: Json
          notification_destination_id?: string
          telegram_chat_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          destination_name?: string
          destination_scope?: string
          is_active?: boolean
          is_deleted?: boolean
          metadata?: Json
          notification_destination_id?: string
          telegram_chat_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notification_event_types: {
        Row: {
          created_at: string
          default_severity: string
          event_code: string
          event_description: string | null
          event_name: string
          is_active: boolean
          phase_no: number
          telegram_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_severity?: string
          event_code: string
          event_description?: string | null
          event_name: string
          is_active?: boolean
          phase_no?: number
          telegram_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_severity?: string
          event_code?: string
          event_description?: string | null
          event_name?: string
          is_active?: boolean
          phase_no?: number
          telegram_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          attempt_count: number
          created_at: string
          created_by: string | null
          event_code: string
          event_key: string
          event_status: string
          failed_at: string | null
          last_error: string | null
          next_attempt_at: string
          notification_event_id: string
          payload: Json
          processing_started_at: string | null
          sent_at: string | null
          severity: string
          source_id: string
          source_table: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          event_code: string
          event_key: string
          event_status?: string
          failed_at?: string | null
          last_error?: string | null
          next_attempt_at?: string
          notification_event_id?: string
          payload?: Json
          processing_started_at?: string | null
          sent_at?: string | null
          severity: string
          source_id: string
          source_table: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          event_code?: string
          event_key?: string
          event_status?: string
          failed_at?: string | null
          last_error?: string | null
          next_attempt_at?: string
          notification_event_id?: string
          payload?: Json
          processing_started_at?: string | null
          sent_at?: string | null
          severity?: string
          source_id?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_event_code_fkey"
            columns: ["event_code"]
            isOneToOne: false
            referencedRelation: "notification_event_types"
            referencedColumns: ["event_code"]
          },
        ]
      }
      notification_role_event_defaults: {
        Row: {
          created_at: string
          created_by: string | null
          event_code: string
          is_enabled: boolean
          notification_role_event_default_id: string
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_code: string
          is_enabled?: boolean
          notification_role_event_default_id?: string
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_code?: string
          is_enabled?: boolean
          notification_role_event_default_id?: string
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_role_event_defaults_event_fkey"
            columns: ["event_code"]
            isOneToOne: false
            referencedRelation: "notification_event_types"
            referencedColumns: ["event_code"]
          },
          {
            foreignKeyName: "notification_role_event_defaults_role_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      notification_routing_rules: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_code: string
          is_active: boolean
          is_deleted: boolean
          notification_destination_id: string
          notification_routing_rule_id: string
          project_id: string | null
          role_code: string | null
          severity_filter: string | null
          site_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_code: string
          is_active?: boolean
          is_deleted?: boolean
          notification_destination_id: string
          notification_routing_rule_id?: string
          project_id?: string | null
          role_code?: string | null
          severity_filter?: string | null
          site_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_code?: string
          is_active?: boolean
          is_deleted?: boolean
          notification_destination_id?: string
          notification_routing_rule_id?: string
          project_id?: string | null
          role_code?: string | null
          severity_filter?: string | null
          site_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_routing_rules_event_code_fkey"
            columns: ["event_code"]
            isOneToOne: false
            referencedRelation: "notification_event_types"
            referencedColumns: ["event_code"]
          },
          {
            foreignKeyName: "notification_routing_rules_notification_destination_id_fkey"
            columns: ["notification_destination_id"]
            isOneToOne: false
            referencedRelation: "notification_destinations"
            referencedColumns: ["notification_destination_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "notification_routing_rules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      notification_user_channels: {
        Row: {
          auth_user_id: string
          channel_type: string
          connected_at: string | null
          connected_by: string | null
          connection_notes: string | null
          connection_status: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          disconnected_at: string | null
          disconnected_by: string | null
          is_deleted: boolean
          is_enabled: boolean
          notification_destination_id: string
          notification_user_channel_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auth_user_id: string
          channel_type?: string
          connected_at?: string | null
          connected_by?: string | null
          connection_notes?: string | null
          connection_status?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          disconnected_at?: string | null
          disconnected_by?: string | null
          is_deleted?: boolean
          is_enabled?: boolean
          notification_destination_id: string
          notification_user_channel_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auth_user_id?: string
          channel_type?: string
          connected_at?: string | null
          connected_by?: string | null
          connection_notes?: string | null
          connection_status?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          disconnected_at?: string | null
          disconnected_by?: string | null
          is_deleted?: boolean
          is_enabled?: boolean
          notification_destination_id?: string
          notification_user_channel_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_user_channels_auth_user_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "notification_user_channels_destination_fkey"
            columns: ["notification_destination_id"]
            isOneToOne: false
            referencedRelation: "notification_destinations"
            referencedColumns: ["notification_destination_id"]
          },
        ]
      }
      notification_user_event_overrides: {
        Row: {
          auth_user_id: string
          created_at: string
          created_by: string | null
          event_code: string
          notification_user_event_override_id: string
          override_reason: string | null
          override_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          created_by?: string | null
          event_code: string
          notification_user_event_override_id?: string
          override_reason?: string | null
          override_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          created_by?: string | null
          event_code?: string
          notification_user_event_override_id?: string
          override_reason?: string | null
          override_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_user_event_overrides_auth_user_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "notification_user_event_overrides_event_fkey"
            columns: ["event_code"]
            isOneToOne: false
            referencedRelation: "notification_event_types"
            referencedColumns: ["event_code"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
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
          discount_amount: number
          discount_percent: number
          is_deleted: boolean
          lead_time_days: number | null
          line_no: number
          line_subtotal: number
          line_total: number
          material_supplier_link_id: string | null
          notes: string | null
          ordered_base_quantity: number | null
          product_id: string
          project_id: string | null
          purchase_order_id: string
          purchase_order_line_id: string
          purchase_uom_code: string | null
          quantity: number
          required_by_date: string | null
          site_id: string | null
          source_snapshot: Json | null
          source_type: string
          stock_request_item_id: string | null
          supplier_product_code: string | null
          supplier_product_name: string | null
          tax_amount: number
          tax_rate: number
          tax_type: string | null
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
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          lead_time_days?: number | null
          line_no: number
          line_subtotal?: number
          line_total?: number
          material_supplier_link_id?: string | null
          notes?: string | null
          ordered_base_quantity?: number | null
          product_id: string
          project_id?: string | null
          purchase_order_id: string
          purchase_order_line_id?: string
          purchase_uom_code?: string | null
          quantity?: number
          required_by_date?: string | null
          site_id?: string | null
          source_snapshot?: Json | null
          source_type?: string
          stock_request_item_id?: string | null
          supplier_product_code?: string | null
          supplier_product_name?: string | null
          tax_amount?: number
          tax_rate?: number
          tax_type?: string | null
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
          discount_amount?: number
          discount_percent?: number
          is_deleted?: boolean
          lead_time_days?: number | null
          line_no?: number
          line_subtotal?: number
          line_total?: number
          material_supplier_link_id?: string | null
          notes?: string | null
          ordered_base_quantity?: number | null
          product_id?: string
          project_id?: string | null
          purchase_order_id?: string
          purchase_order_line_id?: string
          purchase_uom_code?: string | null
          quantity?: number
          required_by_date?: string | null
          site_id?: string | null
          source_snapshot?: Json | null
          source_type?: string
          stock_request_item_id?: string | null
          supplier_product_code?: string | null
          supplier_product_name?: string | null
          tax_amount?: number
          tax_rate?: number
          tax_type?: string | null
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
            foreignKeyName: "purchase_order_lines_material_supplier_link_id_fkey"
            columns: ["material_supplier_link_id"]
            isOneToOne: false
            referencedRelation: "material_supplier_links"
            referencedColumns: ["material_supplier_link_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          default_tax_type: string | null
          deleted_at: string | null
          delivery_address_snapshot: Json | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_destination_type: string
          delivery_instructions: string | null
          delivery_method: string | null
          expected_delivery_date: string | null
          internal_notes: string | null
          is_deleted: boolean
          notes: string | null
          order_date: string
          order_status: string
          payment_terms_days: number | null
          payment_terms_type: string | null
          project_id: string | null
          purchase_order_id: string
          purchase_order_no: string
          site_id: string | null
          source_type: string
          stock_location_id: string | null
          submitted_at: string | null
          submitted_by: string | null
          subtotal_amount: number
          supplier_address_snapshot: Json | null
          supplier_contact_snapshot: Json | null
          supplier_id: string
          supplier_notes: string | null
          supplier_quote_date: string | null
          supplier_quote_no: string | null
          supplier_reference: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          default_tax_type?: string | null
          deleted_at?: string | null
          delivery_address_snapshot?: Json | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_destination_type?: string
          delivery_instructions?: string | null
          delivery_method?: string | null
          expected_delivery_date?: string | null
          internal_notes?: string | null
          is_deleted?: boolean
          notes?: string | null
          order_date?: string
          order_status?: string
          payment_terms_days?: number | null
          payment_terms_type?: string | null
          project_id?: string | null
          purchase_order_id?: string
          purchase_order_no: string
          site_id?: string | null
          source_type?: string
          stock_location_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          subtotal_amount?: number
          supplier_address_snapshot?: Json | null
          supplier_contact_snapshot?: Json | null
          supplier_id: string
          supplier_notes?: string | null
          supplier_quote_date?: string | null
          supplier_quote_no?: string | null
          supplier_reference?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          default_tax_type?: string | null
          deleted_at?: string | null
          delivery_address_snapshot?: Json | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_destination_type?: string
          delivery_instructions?: string | null
          delivery_method?: string | null
          expected_delivery_date?: string | null
          internal_notes?: string | null
          is_deleted?: boolean
          notes?: string | null
          order_date?: string
          order_status?: string
          payment_terms_days?: number | null
          payment_terms_type?: string | null
          project_id?: string | null
          purchase_order_id?: string
          purchase_order_no?: string
          site_id?: string | null
          source_type?: string
          stock_location_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          subtotal_amount?: number
          supplier_address_snapshot?: Json | null
          supplier_contact_snapshot?: Json | null
          supplier_id?: string
          supplier_notes?: string | null
          supplier_quote_date?: string | null
          supplier_quote_no?: string | null
          supplier_reference?: string | null
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "purchase_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "purchase_orders_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotation_revisions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotation_revisions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
      retention_ledger: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_invoice_id: string | null
          description: string
          entry_date: string
          ledger_entry_type: string
          reference_no: string | null
          retention_ledger_id: string
          site_id: string
          source_invoice_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_invoice_id?: string | null
          description: string
          entry_date?: string
          ledger_entry_type: string
          reference_no?: string | null
          retention_ledger_id?: string
          site_id: string
          source_invoice_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_invoice_id?: string | null
          description?: string
          entry_date?: string
          ledger_entry_type?: string
          reference_no?: string | null
          retention_ledger_id?: string
          site_id?: string
          source_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retention_ledger_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "retention_ledger_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "retention_ledger_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "retention_ledger_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "retention_ledger_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "retention_ledger_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "retention_ledger_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "retention_ledger_source_invoice_id_fkey"
            columns: ["source_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
        ]
      }
      site_retention_settings: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          is_enabled: boolean
          notes: string | null
          retention_cap_amount: number | null
          retention_fixed_amount: number | null
          retention_method: string
          retention_percent: number | null
          site_id: string
          site_retention_setting_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_enabled?: boolean
          notes?: string | null
          retention_cap_amount?: number | null
          retention_fixed_amount?: number | null
          retention_method?: string
          retention_percent?: number | null
          site_id: string
          site_retention_setting_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_enabled?: boolean
          notes?: string | null
          retention_cap_amount?: number | null
          retention_fixed_amount?: number | null
          retention_method?: string
          retention_percent?: number | null
          site_id?: string
          site_retention_setting_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_retention_settings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "site_retention_settings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      stock_issue_allocations: {
        Row: {
          allocated_base_quantity: number
          allocation_status: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          issued_base_quantity: number
          notes: string | null
          stock_issue_allocation_id: string
          stock_issue_line_id: string
          stock_lot_id: string
          stock_movement_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allocated_base_quantity: number
          allocation_status?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          issued_base_quantity?: number
          notes?: string | null
          stock_issue_allocation_id?: string
          stock_issue_line_id: string
          stock_lot_id: string
          stock_movement_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allocated_base_quantity?: number
          allocation_status?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          issued_base_quantity?: number
          notes?: string | null
          stock_issue_allocation_id?: string
          stock_issue_line_id?: string
          stock_lot_id?: string
          stock_movement_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_issue_allocations_stock_issue_line_id_fkey"
            columns: ["stock_issue_line_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_lines"
            referencedColumns: ["stock_issue_line_id"]
          },
          {
            foreignKeyName: "stock_issue_allocations_stock_lot_id_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "stock_issue_allocations_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
        ]
      }
      stock_issue_audit_events: {
        Row: {
          actor_auth_user_id: string | null
          area_id: string | null
          created_at: string
          created_by: string | null
          event_at: string
          event_code: string
          event_key: string
          event_name: string
          event_severity: string
          new_status: string | null
          notes: string | null
          notification_event_id: string | null
          notification_queue_error: string | null
          notification_queued: boolean
          old_status: string | null
          payload: Json
          project_id: string | null
          site_id: string | null
          stock_issue_audit_event_id: string
          stock_issue_id: string
          stock_issue_receipt_id: string | null
          stock_request_id: string | null
          stock_transfer_receipt_posting_id: string | null
          work_order_id: string | null
        }
        Insert: {
          actor_auth_user_id?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          event_at?: string
          event_code: string
          event_key: string
          event_name: string
          event_severity?: string
          new_status?: string | null
          notes?: string | null
          notification_event_id?: string | null
          notification_queue_error?: string | null
          notification_queued?: boolean
          old_status?: string | null
          payload?: Json
          project_id?: string | null
          site_id?: string | null
          stock_issue_audit_event_id?: string
          stock_issue_id: string
          stock_issue_receipt_id?: string | null
          stock_request_id?: string | null
          stock_transfer_receipt_posting_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          actor_auth_user_id?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          event_at?: string
          event_code?: string
          event_key?: string
          event_name?: string
          event_severity?: string
          new_status?: string | null
          notes?: string | null
          notification_event_id?: string | null
          notification_queue_error?: string | null
          notification_queued?: boolean
          old_status?: string | null
          payload?: Json
          project_id?: string | null
          site_id?: string | null
          stock_issue_audit_event_id?: string
          stock_issue_id?: string
          stock_issue_receipt_id?: string | null
          stock_request_id?: string | null
          stock_transfer_receipt_posting_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_issue_audit_events_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_notification_event_id_fkey"
            columns: ["notification_event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["notification_event_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_stock_issue_id_fkey"
            columns: ["stock_issue_id"]
            isOneToOne: false
            referencedRelation: "stock_issues"
            referencedColumns: ["stock_issue_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_stock_issue_receipt_id_fkey"
            columns: ["stock_issue_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_receipts"
            referencedColumns: ["stock_issue_receipt_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_stock_request_id_fkey"
            columns: ["stock_request_id"]
            isOneToOne: false
            referencedRelation: "stock_requests"
            referencedColumns: ["stock_request_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_stock_transfer_receipt_posting_id_fkey"
            columns: ["stock_transfer_receipt_posting_id"]
            isOneToOne: false
            referencedRelation: "stock_transfer_receipt_postings"
            referencedColumns: ["stock_transfer_receipt_posting_id"]
          },
          {
            foreignKeyName: "stock_issue_audit_events_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
          },
        ]
      }
      stock_issue_lines: {
        Row: {
          allow_fractional_quantity: boolean
          approved_base_quantity: number
          approved_quantity: number
          base_uom_code: string
          conversion_factor_to_base: number
          created_at: string
          created_by: string | null
          damaged_base_quantity: number
          deleted_at: string | null
          description: string
          is_active: boolean
          is_deleted: boolean
          issue_base_quantity: number
          issue_notes: string | null
          issue_quantity: number
          issue_uom_code: string
          issued_product_id: string
          line_no: number
          line_status: string
          preparation_notes: string | null
          receipt_notes: string | null
          received_base_quantity: number
          requested_product_id: string
          short_base_quantity: number
          stock_issue_id: string
          stock_issue_line_id: string
          stock_request_item_id: string
          substitution_reason: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean
          approved_base_quantity?: number
          approved_quantity?: number
          base_uom_code: string
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          damaged_base_quantity?: number
          deleted_at?: string | null
          description: string
          is_active?: boolean
          is_deleted?: boolean
          issue_base_quantity?: number
          issue_notes?: string | null
          issue_quantity?: number
          issue_uom_code: string
          issued_product_id: string
          line_no: number
          line_status?: string
          preparation_notes?: string | null
          receipt_notes?: string | null
          received_base_quantity?: number
          requested_product_id: string
          short_base_quantity?: number
          stock_issue_id: string
          stock_issue_line_id?: string
          stock_request_item_id: string
          substitution_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean
          approved_base_quantity?: number
          approved_quantity?: number
          base_uom_code?: string
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          damaged_base_quantity?: number
          deleted_at?: string | null
          description?: string
          is_active?: boolean
          is_deleted?: boolean
          issue_base_quantity?: number
          issue_notes?: string | null
          issue_quantity?: number
          issue_uom_code?: string
          issued_product_id?: string
          line_no?: number
          line_status?: string
          preparation_notes?: string | null
          receipt_notes?: string | null
          received_base_quantity?: number
          requested_product_id?: string
          short_base_quantity?: number
          stock_issue_id?: string
          stock_issue_line_id?: string
          stock_request_item_id?: string
          substitution_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_issue_lines_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_issue_lines_issue_uom_code_fkey"
            columns: ["issue_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_issue_lines_issued_product_id_fkey"
            columns: ["issued_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_issue_lines_requested_product_id_fkey"
            columns: ["requested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_issue_lines_stock_issue_id_fkey"
            columns: ["stock_issue_id"]
            isOneToOne: false
            referencedRelation: "stock_issues"
            referencedColumns: ["stock_issue_id"]
          },
          {
            foreignKeyName: "stock_issue_lines_stock_request_item_id_fkey"
            columns: ["stock_request_item_id"]
            isOneToOne: false
            referencedRelation: "stock_request_items"
            referencedColumns: ["stock_request_item_id"]
          },
        ]
      }
      stock_issue_receipt_lines: {
        Row: {
          condition_status: string
          created_at: string
          created_by: string | null
          damaged_base_quantity: number
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          line_no: number
          notes: string | null
          received_base_quantity: number
          short_base_quantity: number
          stock_issue_line_id: string
          stock_issue_receipt_id: string
          stock_issue_receipt_line_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          condition_status?: string
          created_at?: string
          created_by?: string | null
          damaged_base_quantity?: number
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          line_no: number
          notes?: string | null
          received_base_quantity?: number
          short_base_quantity?: number
          stock_issue_line_id: string
          stock_issue_receipt_id: string
          stock_issue_receipt_line_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          condition_status?: string
          created_at?: string
          created_by?: string | null
          damaged_base_quantity?: number
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          line_no?: number
          notes?: string | null
          received_base_quantity?: number
          short_base_quantity?: number
          stock_issue_line_id?: string
          stock_issue_receipt_id?: string
          stock_issue_receipt_line_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_issue_receipt_lines_stock_issue_line_id_fkey"
            columns: ["stock_issue_line_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_lines"
            referencedColumns: ["stock_issue_line_id"]
          },
          {
            foreignKeyName: "stock_issue_receipt_lines_stock_issue_receipt_id_fkey"
            columns: ["stock_issue_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_receipts"
            referencedColumns: ["stock_issue_receipt_id"]
          },
        ]
      }
      stock_issue_receipts: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          receipt_no: number
          receipt_notes: string | null
          receipt_status: string
          received_at: string | null
          received_by_auth_user_id: string | null
          received_by_employee_id: string | null
          received_by_name: string | null
          stock_issue_id: string
          stock_issue_receipt_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          receipt_no: number
          receipt_notes?: string | null
          receipt_status?: string
          received_at?: string | null
          received_by_auth_user_id?: string | null
          received_by_employee_id?: string | null
          received_by_name?: string | null
          stock_issue_id: string
          stock_issue_receipt_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          receipt_no?: number
          receipt_notes?: string | null
          receipt_status?: string
          received_at?: string | null
          received_by_auth_user_id?: string | null
          received_by_employee_id?: string | null
          received_by_name?: string | null
          stock_issue_id?: string
          stock_issue_receipt_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_issue_receipts_received_by_auth_user_id_fkey"
            columns: ["received_by_auth_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "stock_issue_receipts_received_by_employee_id_fkey"
            columns: ["received_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "stock_issue_receipts_stock_issue_id_fkey"
            columns: ["stock_issue_id"]
            isOneToOne: false
            referencedRelation: "stock_issues"
            referencedColumns: ["stock_issue_id"]
          },
        ]
      }
      stock_issues: {
        Row: {
          area_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_method: string
          dispatch_reference: string | null
          dispatched_at: string | null
          dispatched_by: string | null
          from_stock_location_id: string
          is_active: boolean
          is_deleted: boolean
          issue_date: string
          issue_status: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          prepared_at: string | null
          prepared_by: string | null
          priority: string
          project_id: string
          received_at: string | null
          received_by: string | null
          recipient_auth_user_id: string | null
          recipient_employee_id: string | null
          recipient_name: string | null
          required_date: string | null
          site_id: string
          stock_issue_id: string
          stock_issue_no: string
          stock_request_id: string
          to_stock_location_id: string | null
          updated_at: string
          updated_by: string | null
          vehicle_reference: string | null
          work_order_id: string | null
        }
        Insert: {
          area_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_method?: string
          dispatch_reference?: string | null
          dispatched_at?: string | null
          dispatched_by?: string | null
          from_stock_location_id: string
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string
          issue_status?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          prepared_at?: string | null
          prepared_by?: string | null
          priority?: string
          project_id: string
          received_at?: string | null
          received_by?: string | null
          recipient_auth_user_id?: string | null
          recipient_employee_id?: string | null
          recipient_name?: string | null
          required_date?: string | null
          site_id: string
          stock_issue_id?: string
          stock_issue_no: string
          stock_request_id: string
          to_stock_location_id?: string | null
          updated_at?: string
          updated_by?: string | null
          vehicle_reference?: string | null
          work_order_id?: string | null
        }
        Update: {
          area_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_method?: string
          dispatch_reference?: string | null
          dispatched_at?: string | null
          dispatched_by?: string | null
          from_stock_location_id?: string
          is_active?: boolean
          is_deleted?: boolean
          issue_date?: string
          issue_status?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          prepared_at?: string | null
          prepared_by?: string | null
          priority?: string
          project_id?: string
          received_at?: string | null
          received_by?: string | null
          recipient_auth_user_id?: string | null
          recipient_employee_id?: string | null
          recipient_name?: string | null
          required_date?: string | null
          site_id?: string
          stock_issue_id?: string
          stock_issue_no?: string
          stock_request_id?: string
          to_stock_location_id?: string | null
          updated_at?: string
          updated_by?: string | null
          vehicle_reference?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_issues_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "stock_issues_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "stock_issues_from_stock_location_id_fkey"
            columns: ["from_stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "stock_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_issues_recipient_auth_user_id_fkey"
            columns: ["recipient_auth_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "stock_issues_recipient_employee_id_fkey"
            columns: ["recipient_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "stock_issues_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "stock_issues_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "stock_issues_stock_request_id_fkey"
            columns: ["stock_request_id"]
            isOneToOne: false
            referencedRelation: "stock_requests"
            referencedColumns: ["stock_request_id"]
          },
          {
            foreignKeyName: "stock_issues_to_stock_location_id_fkey"
            columns: ["to_stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "stock_issues_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
          stock_issue_allocation_id: string | null
          stock_issue_id: string | null
          stock_issue_receipt_id: string | null
          stock_issue_receipt_line_id: string | null
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
          stock_issue_allocation_id?: string | null
          stock_issue_id?: string | null
          stock_issue_receipt_id?: string | null
          stock_issue_receipt_line_id?: string | null
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
          stock_issue_allocation_id?: string | null
          stock_issue_id?: string | null
          stock_issue_receipt_id?: string | null
          stock_issue_receipt_line_id?: string | null
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
            foreignKeyName: "stock_movements_stock_issue_allocation_id_fkey"
            columns: ["stock_issue_allocation_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_allocations"
            referencedColumns: ["stock_issue_allocation_id"]
          },
          {
            foreignKeyName: "stock_movements_stock_issue_id_fkey"
            columns: ["stock_issue_id"]
            isOneToOne: false
            referencedRelation: "stock_issues"
            referencedColumns: ["stock_issue_id"]
          },
          {
            foreignKeyName: "stock_movements_stock_issue_receipt_id_fkey"
            columns: ["stock_issue_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_receipts"
            referencedColumns: ["stock_issue_receipt_id"]
          },
          {
            foreignKeyName: "stock_movements_stock_issue_receipt_line_id_fkey"
            columns: ["stock_issue_receipt_line_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_receipt_lines"
            referencedColumns: ["stock_issue_receipt_line_id"]
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
          fulfilment_method: string | null
          is_deleted: boolean
          is_over_requirement: boolean
          line_no: number
          line_status: string
          material_requirement_line_id: string | null
          notes: string | null
          over_requirement_base_quantity: number
          pending_request_base_quantity: number
          planned_base_quantity: number | null
          previously_issued_base_quantity: number
          product_id: string
          request_line_type: string | null
          request_uom_code: string | null
          requested_base_quantity: number | null
          requested_quantity: number
          requested_reason: string | null
          review_notes: string | null
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
          fulfilment_method?: string | null
          is_deleted?: boolean
          is_over_requirement?: boolean
          line_no: number
          line_status?: string
          material_requirement_line_id?: string | null
          notes?: string | null
          over_requirement_base_quantity?: number
          pending_request_base_quantity?: number
          planned_base_quantity?: number | null
          previously_issued_base_quantity?: number
          product_id: string
          request_line_type?: string | null
          request_uom_code?: string | null
          requested_base_quantity?: number | null
          requested_quantity?: number
          requested_reason?: string | null
          review_notes?: string | null
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
          fulfilment_method?: string | null
          is_deleted?: boolean
          is_over_requirement?: boolean
          line_no?: number
          line_status?: string
          material_requirement_line_id?: string | null
          notes?: string | null
          over_requirement_base_quantity?: number
          pending_request_base_quantity?: number
          planned_base_quantity?: number | null
          previously_issued_base_quantity?: number
          product_id?: string
          request_line_type?: string | null
          request_uom_code?: string | null
          requested_base_quantity?: number | null
          requested_quantity?: number
          requested_reason?: string | null
          review_notes?: string | null
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
            foreignKeyName: "stock_request_items_material_requirement_line_id_fkey"
            columns: ["material_requirement_line_id"]
            isOneToOne: false
            referencedRelation: "material_requirement_lines"
            referencedColumns: ["material_requirement_line_id"]
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
          approved_at: string | null
          approved_by: string | null
          area_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          is_deleted: boolean
          material_requirement_id: string | null
          notes: string | null
          priority: string
          project_id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_date: string
          request_status: string
          request_type: string
          requested_by: string | null
          requester_auth_user_id: string | null
          requester_employee_id: string | null
          required_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          site_id: string
          stock_request_id: string
          stock_request_no: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          updated_by: string | null
          work_order_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          area_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          is_deleted?: boolean
          material_requirement_id?: string | null
          notes?: string | null
          priority?: string
          project_id: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_date?: string
          request_status?: string
          request_type?: string
          requested_by?: string | null
          requester_auth_user_id?: string | null
          requester_employee_id?: string | null
          required_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id: string
          stock_request_id?: string
          stock_request_no: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          area_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          is_deleted?: boolean
          material_requirement_id?: string | null
          notes?: string | null
          priority?: string
          project_id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_date?: string
          request_status?: string
          request_type?: string
          requested_by?: string | null
          requester_auth_user_id?: string | null
          requester_employee_id?: string | null
          required_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string
          stock_request_id?: string
          stock_request_no?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string | null
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
            foreignKeyName: "stock_requests_material_requirement_id_fkey"
            columns: ["material_requirement_id"]
            isOneToOne: false
            referencedRelation: "material_requirements"
            referencedColumns: ["material_requirement_id"]
          },
          {
            foreignKeyName: "stock_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "stock_requests_requester_employee_id_fkey"
            columns: ["requester_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "stock_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "stock_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "stock_requests_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
          },
        ]
      }
      stock_transfer_receipt_postings: {
        Row: {
          base_uom_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          destination_stock_lot_id: string
          destination_stock_movement_id: string
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          posted_at: string
          posted_base_quantity: number
          posted_by: string | null
          source_stock_issue_allocation_id: string
          source_stock_lot_id: string
          stock_issue_id: string
          stock_issue_line_id: string
          stock_issue_receipt_id: string
          stock_issue_receipt_line_id: string
          stock_transfer_receipt_posting_id: string
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
          destination_stock_lot_id: string
          destination_stock_movement_id: string
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          posted_at?: string
          posted_base_quantity: number
          posted_by?: string | null
          source_stock_issue_allocation_id: string
          source_stock_lot_id: string
          stock_issue_id: string
          stock_issue_line_id: string
          stock_issue_receipt_id: string
          stock_issue_receipt_line_id: string
          stock_transfer_receipt_posting_id?: string
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
          destination_stock_lot_id?: string
          destination_stock_movement_id?: string
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          posted_at?: string
          posted_base_quantity?: number
          posted_by?: string | null
          source_stock_issue_allocation_id?: string
          source_stock_lot_id?: string
          stock_issue_id?: string
          stock_issue_line_id?: string
          stock_issue_receipt_id?: string
          stock_issue_receipt_line_id?: string
          stock_transfer_receipt_posting_id?: string
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_receipt_postin_destination_stock_movement_i_fkey"
            columns: ["destination_stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postin_source_stock_issue_allocatio_fkey"
            columns: ["source_stock_issue_allocation_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_allocations"
            referencedColumns: ["stock_issue_allocation_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_posting_stock_issue_receipt_line_id_fkey"
            columns: ["stock_issue_receipt_line_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_receipt_lines"
            referencedColumns: ["stock_issue_receipt_line_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postings_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postings_destination_stock_lot_id_fkey"
            columns: ["destination_stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postings_source_stock_lot_id_fkey"
            columns: ["source_stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postings_stock_issue_id_fkey"
            columns: ["stock_issue_id"]
            isOneToOne: false
            referencedRelation: "stock_issues"
            referencedColumns: ["stock_issue_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postings_stock_issue_line_id_fkey"
            columns: ["stock_issue_line_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_lines"
            referencedColumns: ["stock_issue_line_id"]
          },
          {
            foreignKeyName: "stock_transfer_receipt_postings_stock_issue_receipt_id_fkey"
            columns: ["stock_issue_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_issue_receipts"
            referencedColumns: ["stock_issue_receipt_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_delivery_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_replacement_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
      tool_loan_issue_postings: {
        Row: {
          base_uom_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          issued_at: string
          issued_base_quantity: number
          issued_by: string | null
          notes: string | null
          stock_lot_id: string
          stock_movement_id: string
          tool_loan_id: string
          tool_loan_issue_posting_id: string
          tool_loan_item_id: string
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
          issued_at?: string
          issued_base_quantity: number
          issued_by?: string | null
          notes?: string | null
          stock_lot_id: string
          stock_movement_id: string
          tool_loan_id: string
          tool_loan_issue_posting_id?: string
          tool_loan_item_id: string
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
          issued_at?: string
          issued_base_quantity?: number
          issued_by?: string | null
          notes?: string | null
          stock_lot_id?: string
          stock_movement_id?: string
          tool_loan_id?: string
          tool_loan_issue_posting_id?: string
          tool_loan_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_loan_issue_postings_item_fkey"
            columns: ["tool_loan_item_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_items"
            referencedColumns: ["tool_loan_item_id"]
          },
          {
            foreignKeyName: "tool_loan_issue_postings_lot_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "tool_loan_issue_postings_movement_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
          {
            foreignKeyName: "tool_loan_issue_postings_tool_loan_fkey"
            columns: ["tool_loan_id"]
            isOneToOne: false
            referencedRelation: "tool_loans"
            referencedColumns: ["tool_loan_id"]
          },
          {
            foreignKeyName: "tool_loan_issue_postings_uom_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      tool_loan_items: {
        Row: {
          allow_fractional_quantity: boolean
          approved_base_quantity: number
          approved_quantity: number
          asset_reference: string | null
          base_uom_code: string
          condition_after: string | null
          condition_before: string | null
          condition_notes_after: string | null
          condition_notes_before: string | null
          conversion_factor_to_base: number
          created_at: string
          created_by: string | null
          damaged_quantity: number
          deleted_at: string | null
          description: string
          is_active: boolean
          is_deleted: boolean
          issued_base_quantity: number
          issued_quantity: number
          item_status: string
          line_no: number
          loan_uom_code: string
          lost_quantity: number
          notes: string | null
          product_id: string
          returned_base_quantity: number
          returned_quantity: number
          serial_number: string | null
          stock_request_item_id: string | null
          tool_loan_id: string
          tool_loan_item_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_fractional_quantity?: boolean
          approved_base_quantity?: number
          approved_quantity?: number
          asset_reference?: string | null
          base_uom_code: string
          condition_after?: string | null
          condition_before?: string | null
          condition_notes_after?: string | null
          condition_notes_before?: string | null
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          description: string
          is_active?: boolean
          is_deleted?: boolean
          issued_base_quantity?: number
          issued_quantity?: number
          item_status?: string
          line_no: number
          loan_uom_code: string
          lost_quantity?: number
          notes?: string | null
          product_id: string
          returned_base_quantity?: number
          returned_quantity?: number
          serial_number?: string | null
          stock_request_item_id?: string | null
          tool_loan_id: string
          tool_loan_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_fractional_quantity?: boolean
          approved_base_quantity?: number
          approved_quantity?: number
          asset_reference?: string | null
          base_uom_code?: string
          condition_after?: string | null
          condition_before?: string | null
          condition_notes_after?: string | null
          condition_notes_before?: string | null
          conversion_factor_to_base?: number
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          description?: string
          is_active?: boolean
          is_deleted?: boolean
          issued_base_quantity?: number
          issued_quantity?: number
          item_status?: string
          line_no?: number
          loan_uom_code?: string
          lost_quantity?: number
          notes?: string | null
          product_id?: string
          returned_base_quantity?: number
          returned_quantity?: number
          serial_number?: string | null
          stock_request_item_id?: string | null
          tool_loan_id?: string
          tool_loan_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_loan_items_base_uom_code_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "tool_loan_items_loan_uom_code_fkey"
            columns: ["loan_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
          {
            foreignKeyName: "tool_loan_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "tool_loan_items_stock_request_item_id_fkey"
            columns: ["stock_request_item_id"]
            isOneToOne: false
            referencedRelation: "stock_request_items"
            referencedColumns: ["stock_request_item_id"]
          },
          {
            foreignKeyName: "tool_loan_items_tool_loan_id_fkey"
            columns: ["tool_loan_id"]
            isOneToOne: false
            referencedRelation: "tool_loans"
            referencedColumns: ["tool_loan_id"]
          },
        ]
      }
      tool_loan_return_items: {
        Row: {
          condition_notes: string | null
          condition_status: string
          created_at: string
          created_by: string | null
          damage_notes: string | null
          damaged_quantity: number
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          line_no: number
          lost_quantity: number
          missing_notes: string | null
          notes: string | null
          returned_base_quantity: number
          returned_quantity: number
          tool_loan_item_id: string
          tool_loan_return_id: string
          tool_loan_return_item_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          condition_notes?: string | null
          condition_status?: string
          created_at?: string
          created_by?: string | null
          damage_notes?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          line_no: number
          lost_quantity?: number
          missing_notes?: string | null
          notes?: string | null
          returned_base_quantity?: number
          returned_quantity?: number
          tool_loan_item_id: string
          tool_loan_return_id: string
          tool_loan_return_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          condition_notes?: string | null
          condition_status?: string
          created_at?: string
          created_by?: string | null
          damage_notes?: string | null
          damaged_quantity?: number
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          line_no?: number
          lost_quantity?: number
          missing_notes?: string | null
          notes?: string | null
          returned_base_quantity?: number
          returned_quantity?: number
          tool_loan_item_id?: string
          tool_loan_return_id?: string
          tool_loan_return_item_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_loan_return_items_tool_loan_item_id_fkey"
            columns: ["tool_loan_item_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_items"
            referencedColumns: ["tool_loan_item_id"]
          },
          {
            foreignKeyName: "tool_loan_return_items_tool_loan_return_id_fkey"
            columns: ["tool_loan_return_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_returns"
            referencedColumns: ["tool_loan_return_id"]
          },
        ]
      }
      tool_loan_return_postings: {
        Row: {
          base_uom_code: string
          created_at: string
          created_by: string | null
          damaged_base_quantity: number
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          lost_base_quantity: number
          notes: string | null
          posted_at: string
          posted_by: string | null
          return_stock_movement_id: string | null
          returned_base_quantity: number
          stock_lot_id: string
          tool_loan_id: string
          tool_loan_issue_posting_id: string
          tool_loan_item_id: string
          tool_loan_return_id: string
          tool_loan_return_item_id: string
          tool_loan_return_posting_id: string
        }
        Insert: {
          base_uom_code: string
          created_at?: string
          created_by?: string | null
          damaged_base_quantity?: number
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          lost_base_quantity?: number
          notes?: string | null
          posted_at?: string
          posted_by?: string | null
          return_stock_movement_id?: string | null
          returned_base_quantity?: number
          stock_lot_id: string
          tool_loan_id: string
          tool_loan_issue_posting_id: string
          tool_loan_item_id: string
          tool_loan_return_id: string
          tool_loan_return_item_id: string
          tool_loan_return_posting_id?: string
        }
        Update: {
          base_uom_code?: string
          created_at?: string
          created_by?: string | null
          damaged_base_quantity?: number
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          lost_base_quantity?: number
          notes?: string | null
          posted_at?: string
          posted_by?: string | null
          return_stock_movement_id?: string | null
          returned_base_quantity?: number
          stock_lot_id?: string
          tool_loan_id?: string
          tool_loan_issue_posting_id?: string
          tool_loan_item_id?: string
          tool_loan_return_id?: string
          tool_loan_return_item_id?: string
          tool_loan_return_posting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_loan_return_postings_issue_posting_fkey"
            columns: ["tool_loan_issue_posting_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_issue_postings"
            referencedColumns: ["tool_loan_issue_posting_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_loan_fkey"
            columns: ["tool_loan_id"]
            isOneToOne: false
            referencedRelation: "tool_loans"
            referencedColumns: ["tool_loan_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_loan_item_fkey"
            columns: ["tool_loan_item_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_items"
            referencedColumns: ["tool_loan_item_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_lot_fkey"
            columns: ["stock_lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
            referencedColumns: ["stock_lot_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_movement_fkey"
            columns: ["return_stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["stock_movement_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_return_fkey"
            columns: ["tool_loan_return_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_returns"
            referencedColumns: ["tool_loan_return_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_return_item_fkey"
            columns: ["tool_loan_return_item_id"]
            isOneToOne: false
            referencedRelation: "tool_loan_return_items"
            referencedColumns: ["tool_loan_return_item_id"]
          },
          {
            foreignKeyName: "tool_loan_return_postings_uom_fkey"
            columns: ["base_uom_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["uom_code"]
          },
        ]
      }
      tool_loan_returns: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          received_by_auth_user_id: string | null
          received_by_employee_id: string | null
          received_by_name: string | null
          return_no: number
          return_notes: string | null
          return_status: string
          returned_at: string | null
          tool_loan_id: string
          tool_loan_return_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          received_by_auth_user_id?: string | null
          received_by_employee_id?: string | null
          received_by_name?: string | null
          return_no: number
          return_notes?: string | null
          return_status?: string
          returned_at?: string | null
          tool_loan_id: string
          tool_loan_return_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          received_by_auth_user_id?: string | null
          received_by_employee_id?: string | null
          received_by_name?: string | null
          return_no?: number
          return_notes?: string | null
          return_status?: string
          returned_at?: string | null
          tool_loan_id?: string
          tool_loan_return_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_loan_returns_received_by_employee_id_fkey"
            columns: ["received_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tool_loan_returns_tool_loan_id_fkey"
            columns: ["tool_loan_id"]
            isOneToOne: false
            referencedRelation: "tool_loans"
            referencedColumns: ["tool_loan_id"]
          },
        ]
      }
      tool_loans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          area_id: string | null
          borrower_auth_user_id: string | null
          borrower_employee_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          due_date: string | null
          from_stock_location_id: string
          is_active: boolean
          is_deleted: boolean
          issued_at: string | null
          issued_by: string | null
          loan_date: string
          loan_status: string
          notes: string | null
          prepared_at: string | null
          prepared_by: string | null
          priority: string
          project_id: string
          returned_date: string | null
          site_id: string
          stock_request_id: string | null
          tool_loan_id: string
          tool_loan_no: string
          updated_at: string
          updated_by: string | null
          work_order_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          area_id?: string | null
          borrower_auth_user_id?: string | null
          borrower_employee_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_date?: string | null
          from_stock_location_id: string
          is_active?: boolean
          is_deleted?: boolean
          issued_at?: string | null
          issued_by?: string | null
          loan_date?: string
          loan_status?: string
          notes?: string | null
          prepared_at?: string | null
          prepared_by?: string | null
          priority?: string
          project_id: string
          returned_date?: string | null
          site_id: string
          stock_request_id?: string | null
          tool_loan_id?: string
          tool_loan_no: string
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          area_id?: string | null
          borrower_auth_user_id?: string | null
          borrower_employee_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_date?: string | null
          from_stock_location_id?: string
          is_active?: boolean
          is_deleted?: boolean
          issued_at?: string | null
          issued_by?: string | null
          loan_date?: string
          loan_status?: string
          notes?: string | null
          prepared_at?: string | null
          prepared_by?: string | null
          priority?: string
          project_id?: string
          returned_date?: string | null
          site_id?: string
          stock_request_id?: string | null
          tool_loan_id?: string
          tool_loan_no?: string
          updated_at?: string
          updated_by?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_loans_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_area_progress_v"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "tool_loans_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "project_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "tool_loans_borrower_employee_id_fkey"
            columns: ["borrower_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "tool_loans_from_stock_location_id_fkey"
            columns: ["from_stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["stock_location_id"]
          },
          {
            foreignKeyName: "tool_loans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tool_loans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tool_loans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tool_loans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_profitability"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tool_loans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tool_loans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "tool_loans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "tool_loans_stock_request_id_fkey"
            columns: ["stock_request_id"]
            isOneToOne: false
            referencedRelation: "stock_requests"
            referencedColumns: ["stock_request_id"]
          },
          {
            foreignKeyName: "tool_loans_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["work_order_id"]
          },
        ]
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
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "variations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "variations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
      _customer_account_summary: {
        Row: {
          abn: string | null
          account_hold_reason: string | null
          available_credit: number | null
          credit_limit: number | null
          current_outstanding: number | null
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          customer_type: string | null
          default_currency: string | null
          draft_invoice_count: number | null
          email: string | null
          is_account_on_hold: boolean | null
          issued_invoice_count: number | null
          overdue_invoice_count: number | null
          overdue_outstanding: number | null
          payment_terms_days: number | null
          payment_terms_type: string | null
          phone: string | null
          recorded_payment_total: number | null
          total_invoiced: number | null
          total_outstanding: number | null
          total_paid: number | null
          unallocated_credit: number | null
        }
        Relationships: []
      }
      _customer_profile_base: {
        Row: {
          abn: string | null
          account_hold_reason: string | null
          active_project_count: number | null
          address_count: number | null
          addresses: Json | null
          aging_1_30: number | null
          aging_31_60: number | null
          aging_61_90: number | null
          aging_90_plus: number | null
          aging_current: number | null
          available_credit: number | null
          completed_project_count: number | null
          contact_count: number | null
          contacts: Json | null
          created_at: string | null
          credit_limit: number | null
          current_outstanding: number | null
          customer_code: string | null
          customer_financial_setting_id: string | null
          customer_id: string | null
          customer_name: string | null
          customer_type: string | null
          default_currency: string | null
          default_sales_account_code: string | null
          default_tax_type: string | null
          discount_percent: number | null
          draft_invoice_count: number | null
          email: string | null
          has_financial_settings: boolean | null
          invoice_delivery_method: string | null
          is_account_on_hold: boolean | null
          is_active: boolean | null
          issued_invoice_count: number | null
          last_xero_export_at: string | null
          last_xero_export_error: string | null
          last_xero_export_status: string | null
          line_amount_type: string | null
          maximum_days_overdue: number | null
          notes: string | null
          oldest_due_date: string | null
          overdue_invoice_count: number | null
          overdue_outstanding: number | null
          payment_terms_days: number | null
          payment_terms_type: string | null
          phone: string | null
          price_book_id: string | null
          primary_address_country: string | null
          primary_address_id: string | null
          primary_address_line1: string | null
          primary_address_line2: string | null
          primary_address_postcode: string | null
          primary_address_state: string | null
          primary_address_suburb: string | null
          primary_address_type: string | null
          primary_contact_email: string | null
          primary_contact_id: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_contact_position: string | null
          project_count: number | null
          projects: Json | null
          recorded_payment_total: number | null
          statement_delivery_method: string | null
          total_invoiced: number | null
          total_outstanding: number | null
          total_paid: number | null
          unallocated_credit: number | null
          updated_at: string | null
          xero_branding_theme_id: string | null
          xero_branding_theme_name: string | null
          xero_contact_id: string | null
          xero_contact_name: string | null
          xero_contact_number: string | null
          xero_export_count: number | null
          xero_export_failed_count: number | null
          xero_export_history: Json | null
          xero_export_success_count: number | null
          xero_last_synced_at: string | null
          xero_status: string | null
          xero_sync_error: string | null
        }
        Relationships: []
      }
      _customer_xero_readiness: {
        Row: {
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          has_address: boolean | null
          has_contact_name: boolean | null
          has_currency: boolean | null
          has_email: boolean | null
          has_financial_settings: boolean | null
          has_payment_terms: boolean | null
          has_phone: boolean | null
          has_sales_account: boolean | null
          has_tax_type: boolean | null
          has_xero_contact_id: boolean | null
          has_xero_contact_name: boolean | null
          is_xero_accounting_ready: boolean | null
          is_xero_minimum_ready: boolean | null
          readiness_issues: Json | null
        }
        Relationships: []
      }
      _invoice_aging_summary: {
        Row: {
          currency_code: string | null
          current_amount: number | null
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          days_1_30: number | null
          days_31_60: number | null
          days_61_90: number | null
          days_90_plus: number | null
          maximum_days_overdue: number | null
          oldest_due_date: string | null
          open_invoice_count: number | null
          total_outstanding: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      _invoice_reporting_base: {
        Row: {
          active_line_count: number | null
          active_source_count: number | null
          aging_bucket: string | null
          approved_at: string | null
          approved_by: string | null
          balance_amount: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          created_by: string | null
          credit_note_reason: string | null
          currency_code: string | null
          customer_abn: string | null
          customer_code: string | null
          customer_email: string | null
          customer_id: string | null
          customer_invoice_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_reference: string | null
          customer_type: string | null
          days_overdue: number | null
          document_status: string | null
          due_date: string | null
          due_status: string | null
          invoice_date: string | null
          invoice_no: string | null
          invoice_type: string | null
          issued_at: string | null
          issued_by: string | null
          legacy_invoice_status: string | null
          notes: string | null
          original_invoice_id: string | null
          original_invoice_no: string | null
          paid_amount: number | null
          payment_status: string | null
          project_id: string | null
          project_name: string | null
          project_no: string | null
          project_site_id: string | null
          retention_release_amount: number | null
          site_code: string | null
          site_name: string | null
          source_types: Json | null
          subtotal_amount: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          updated_by: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          xero_exported: boolean | null
          xero_exported_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "_invoice_reporting_base"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "v_outstanding_invoices"
            referencedColumns: ["customer_invoice_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "customer_invoices_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "customer_invoices_project_site_id_fkey"
            columns: ["project_site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["site_id"]
          },
        ]
      }
      _payment_reporting_base: {
        Row: {
          active_allocation_count: number | null
          allocated_amount: number | null
          allocated_invoices: Json | null
          amount: number | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          customer_payment_id: string | null
          notes: string | null
          original_payment_id: string | null
          original_payment_no: string | null
          payment_date: string | null
          payment_method: string | null
          payment_no: string | null
          payment_status: string | null
          reference_no: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          unallocated_amount: number | null
          updated_at: string | null
          updated_by: string | null
          xero_exported: boolean | null
          xero_exported_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payments_original_payment_id_fkey"
            columns: ["original_payment_id"]
            isOneToOne: false
            referencedRelation: "_payment_reporting_base"
            referencedColumns: ["customer_payment_id"]
          },
          {
            foreignKeyName: "customer_payments_original_payment_id_fkey"
            columns: ["original_payment_id"]
            isOneToOne: false
            referencedRelation: "customer_payments"
            referencedColumns: ["customer_payment_id"]
          },
        ]
      }
      _project_financial_summary: {
        Row: {
          approved_variations: number | null
          available_retention: number | null
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          invoice_count: number | null
          open_invoice_count: number | null
          original_contract_value: number | null
          overdue_outstanding: number | null
          project_id: string | null
          project_name: string | null
          project_no: string | null
          project_status: string | null
          revised_contract_value: number | null
          total_invoiced: number | null
          total_outstanding: number | null
          total_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      _site_retention_summary: {
        Row: {
          adjustment_decrease_amount: number | null
          adjustment_increase_amount: number | null
          available_retention_balance: number | null
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          is_enabled: boolean | null
          last_entry_date: string | null
          ledger_entry_count: number | null
          project_id: string | null
          project_name: string | null
          project_no: string | null
          released_amount: number | null
          retained_amount: number | null
          retention_cap_amount: number | null
          retention_fixed_amount: number | null
          retention_method: string | null
          retention_notes: string | null
          retention_percent: number | null
          reversal_amount: number | null
          site_code: string | null
          site_id: string | null
          site_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_account_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_profile_base"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "_customer_xero_readiness"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
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
            referencedRelation: "_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "_site_retention_summary"
            referencedColumns: ["site_id"]
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
      _active_permission_admin_count: {
        Args: { p_exclude_auth_user_id?: string }
        Returns: number
      }
      _assert_access_control_manager: { Args: never; Returns: undefined }
      _create_invoice_atomic_core: {
        Args: { p_invoice: Json; p_lines: Json; p_sources?: Json }
        Returns: string
      }
      _invoice_active_allocated_amount: {
        Args: { p_invoice_id: string }
        Returns: number
      }
      _payment_allocated_amount: {
        Args: { p_payment_id: string }
        Returns: number
      }
      _recalculate_invoice_payment_state: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      _replace_purchase_order_lines_atomic: {
        Args: {
          p_header_project_id: string
          p_header_site_id: string
          p_lines: Json
          p_purchase_order_id: string
          p_supplier_id: string
        }
        Returns: Json
      }
      _validate_payment_invoice: {
        Args: { p_invoice_id: string; p_payment_id: string }
        Returns: undefined
      }
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
      allocate_customer_payment_atomic: {
        Args: { p_allocations: Json; p_payment_id: string }
        Returns: string
      }
      approve_app_user_atomic: {
        Args: {
          p_admin_notes?: string
          p_auth_user_id: string
          p_role_code: string
        }
        Returns: string
      }
      approve_invoice_atomic: {
        Args: { p_invoice_id: string }
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
      approve_tool_loan_atomic: {
        Args: { p_notes?: string; p_tool_loan_id: string }
        Returns: string
      }
      archive_product_attributes_not_in_category: {
        Args: { p_new_category_id: string; p_product_id: string }
        Returns: number
      }
      assert_invoice_permission: {
        Args: { p_permission_code: string }
        Returns: undefined
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
      assign_user_role_atomic: {
        Args: { p_auth_user_id: string; p_reason?: string; p_role_id: string }
        Returns: string
      }
      build_product_code_size_token: {
        Args: {
          p_first_value?: number
          p_second_value?: number
          p_size_rule_id: string
        }
        Returns: string
      }
      can_delete_inventory_transaction_photo: {
        Args: { p_source_id: string; p_source_type: string }
        Returns: boolean
      }
      can_manage_permissions: { Args: never; Returns: boolean }
      can_manage_products_strict: { Args: never; Returns: boolean }
      can_upload_inventory_transaction_photo: {
        Args: { p_source_id: string; p_source_type: string }
        Returns: boolean
      }
      can_view_inventory_transaction_photo: {
        Args: { p_source_id: string; p_source_type: string }
        Returns: boolean
      }
      cancel_invoice_atomic: {
        Args: { p_invoice_id: string; p_reason: string }
        Returns: string
      }
      cancel_purchase_order_atomic: {
        Args: { p_purchase_order_id: string; p_reason: string }
        Returns: Json
      }
      cancel_quotation_atomic: {
        Args: { p_cancellation_reason: string; p_quotation_id: string }
        Returns: Json
      }
      cancel_quotation_revision_atomic: {
        Args: { p_cancellation_reason: string; p_revision_id: string }
        Returns: Json
      }
      cancel_stock_issue_atomic: {
        Args: { p_reason: string; p_stock_issue_id: string }
        Returns: string
      }
      cancel_stock_issue_receipt_draft: {
        Args: { p_stock_issue_receipt_id: string }
        Returns: string
      }
      cancel_tool_loan_atomic: {
        Args: { p_reason: string; p_tool_loan_id: string }
        Returns: string
      }
      cancel_variation_atomic: {
        Args: { p_cancellation_reason: string; p_variation_id: string }
        Returns: Json
      }
      confirm_purchase_order_atomic: {
        Args: { p_purchase_order_id: string }
        Returns: Json
      }
      confirm_stock_issue_receipt_atomic: {
        Args: {
          p_lines: Json
          p_receipt_notes?: string
          p_received_at?: string
          p_stock_issue_receipt_id: string
        }
        Returns: Json
      }
      create_credit_note_atomic: {
        Args: {
          p_lines: Json
          p_notes?: string
          p_original_invoice_id: string
          p_reason: string
        }
        Returns: string
      }
      create_invoice_atomic: {
        Args: { p_invoice: Json; p_lines: Json; p_sources?: Json }
        Returns: string
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
      create_purchase_order_atomic: {
        Args: { p_lines: Json; p_purchase_order: Json }
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
      create_retention_release_invoice_atomic: {
        Args: { p_notes?: string; p_release_amount: number; p_site_id: string }
        Returns: string
      }
      create_site_goods_receiving_atomic: {
        Args: {
          p_items: Json
          p_notes?: string
          p_site_id: string
          p_stock_location_id: string
          p_supplier_delivery_id: string
        }
        Returns: Json
      }
      create_stock_issue_atomic: {
        Args: { p_header: Json; p_lines: Json }
        Returns: string
      }
      create_stock_issue_receipt_draft: {
        Args: {
          p_receipt_notes?: string
          p_received_by_auth_user_id?: string
          p_received_by_employee_id?: string
          p_received_by_name?: string
          p_stock_issue_id: string
        }
        Returns: string
      }
      create_supplier_delivery_from_purchase_order_atomic: {
        Args: {
          p_delivery_date: string
          p_items?: Json
          p_notes?: string
          p_purchase_order_id: string
          p_supplier_delivery_note_no?: string
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
      create_tool_loan_atomic: {
        Args: { p_header: Json; p_items: Json }
        Returns: string
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
      deliver_stock_issue_atomic: {
        Args: {
          p_delivered_at?: string
          p_notes?: string
          p_stock_issue_id: string
        }
        Returns: string
      }
      disconnect_user_telegram_channel: {
        Args: { p_auth_user_id: string; p_reason?: string }
        Returns: undefined
      }
      dispatch_stock_issue_atomic: {
        Args: {
          p_dispatch_reference?: string
          p_notes?: string
          p_stock_issue_id: string
          p_vehicle_reference?: string
        }
        Returns: string
      }
      end_work_assignment: {
        Args: { p_work_assignment_id: string }
        Returns: undefined
      }
      enqueue_notification_event: {
        Args: {
          p_created_by?: string
          p_event_code: string
          p_event_key: string
          p_payload?: Json
          p_source_id: string
          p_source_table: string
        }
        Returns: string
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
      get_customer_financial_profile: {
        Args: { p_customer_id: string }
        Returns: Json
      }
      get_customer_invoice_detail: {
        Args: { p_invoice_id: string }
        Returns: Json
      }
      get_customer_payment_detail: {
        Args: { p_payment_id: string }
        Returns: Json
      }
      get_customer_xero_contact_payload: {
        Args: { p_customer_id: string }
        Returns: Json
      }
      get_effective_notification_permission: {
        Args: { p_auth_user_id: string; p_event_code: string }
        Returns: {
          auth_user_id: string
          effective_enabled: boolean
          event_code: string
          override_value: string
          permission_source: string
          role_default_enabled: boolean
        }[]
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
      get_role_permission_matrix: {
        Args: { p_role_id: string }
        Returns: {
          action_code: string
          description: string
          is_allowed: boolean
          is_system_permission: boolean
          module_code: string
          permission_code: string
          permission_id: string
          permission_is_active: boolean
          permission_name: string
          role_code: string
          role_id: string
          role_name: string
          role_permission_id: string
          sort_order: number
        }[]
      }
      get_user_permission_matrix: {
        Args: { p_auth_user_id: string }
        Returns: {
          account_status: string
          action_code: string
          auth_user_id: string
          description: string
          effective_is_allowed: boolean
          module_code: string
          override_is_active: boolean
          override_is_allowed: boolean
          override_reason: string
          permission_code: string
          permission_id: string
          permission_name: string
          permission_source: string
          role_code: string
          role_id: string
          role_is_allowed: boolean
          role_name: string
          sort_order: number
        }[]
      }
      get_user_telegram_notification_settings: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      has_active_app_access: { Args: never; Returns: boolean }
      has_permission: { Args: { p_permission_code: string }; Returns: boolean }
      invoice_due_date_from_terms: {
        Args: { p_customer_id: string; p_invoice_date: string }
        Returns: string
      }
      is_active_company_employee: { Args: never; Returns: boolean }
      is_admin_role: { Args: never; Returns: boolean }
      is_payroll_role: { Args: never; Returns: boolean }
      is_project_role: { Args: never; Returns: boolean }
      is_strict_admin_role: { Args: never; Returns: boolean }
      issue_invoice_atomic: { Args: { p_invoice_id: string }; Returns: string }
      issue_stock_issue_atomic: {
        Args: {
          p_movement_date?: string
          p_notes?: string
          p_stock_issue_id: string
        }
        Returns: Json
      }
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
      issue_tool_loan_atomic: {
        Args: { p_allocations: Json; p_notes?: string; p_tool_loan_id: string }
        Returns: string
      }
      list_access_control_audit: {
        Args: {
          p_change_type?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_permission_code?: string
          p_target_auth_user_id?: string
          p_target_role_id?: string
        }
        Returns: {
          access_control_audit_id: string
          change_type: string
          changed_at: string
          changed_by: string
          changed_by_email: string
          changed_by_name: string
          new_value: Json
          old_value: Json
          permission_code: string
          permission_id: string
          reason: string
          target_auth_user_id: string
          target_role_code: string
          target_role_id: string
          target_role_name: string
          target_user_email: string
          target_user_name: string
          total_row_count: number
        }[]
      }
      list_customer_account_summaries: {
        Args: {
          p_customer_id?: string
          p_limit?: number
          p_offset?: number
          p_only_overdue?: boolean
          p_only_with_balance?: boolean
          p_search?: string
        }
        Returns: {
          account_hold_reason: string
          available_credit: number
          credit_limit: number
          current_outstanding: number
          customer_code: string
          customer_id: string
          customer_name: string
          customer_type: string
          default_currency: string
          draft_invoice_count: number
          is_account_on_hold: boolean
          issued_invoice_count: number
          overdue_invoice_count: number
          overdue_outstanding: number
          payment_terms_days: number
          payment_terms_type: string
          recorded_payment_total: number
          total_invoiced: number
          total_outstanding: number
          total_paid: number
          total_row_count: number
          unallocated_credit: number
        }[]
      }
      list_customer_financial_profiles: {
        Args: {
          p_customer_type?: string
          p_limit?: number
          p_offset?: number
          p_only_attention?: boolean
          p_only_overdue?: boolean
          p_only_with_balance?: boolean
          p_search?: string
          p_xero_status?: string
        }
        Returns: {
          active_project_count: number
          available_credit: number
          credit_limit: number
          customer_code: string
          customer_id: string
          customer_name: string
          customer_type: string
          default_currency: string
          has_financial_settings: boolean
          is_account_on_hold: boolean
          is_xero_accounting_ready: boolean
          is_xero_minimum_ready: boolean
          overdue_outstanding: number
          payment_terms_days: number
          payment_terms_type: string
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string
          project_count: number
          readiness_issue_count: number
          total_invoiced: number
          total_outstanding: number
          total_paid: number
          total_row_count: number
          unallocated_credit: number
          xero_status: string
        }[]
      }
      list_customer_invoices: {
        Args: {
          p_customer_id?: string
          p_date_from?: string
          p_date_to?: string
          p_document_status?: string
          p_invoice_type?: string
          p_limit?: number
          p_offset?: number
          p_payment_status?: string
          p_project_id?: string
          p_project_site_id?: string
          p_search?: string
        }
        Returns: {
          active_line_count: number
          active_source_count: number
          aging_bucket: string
          balance_amount: number
          currency_code: string
          customer_code: string
          customer_id: string
          customer_invoice_id: string
          customer_name: string
          customer_reference: string
          days_overdue: number
          document_status: string
          due_date: string
          due_status: string
          invoice_date: string
          invoice_no: string
          invoice_type: string
          paid_amount: number
          payment_status: string
          project_id: string
          project_name: string
          project_no: string
          project_site_id: string
          site_code: string
          site_name: string
          source_types: Json
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          total_row_count: number
        }[]
      }
      list_customer_payments: {
        Args: {
          p_customer_id?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_payment_method?: string
          p_payment_status?: string
          p_search?: string
        }
        Returns: {
          active_allocation_count: number
          allocated_amount: number
          allocated_invoices: Json
          amount: number
          currency_code: string
          customer_code: string
          customer_id: string
          customer_name: string
          customer_payment_id: string
          payment_date: string
          payment_method: string
          payment_no: string
          payment_status: string
          reference_no: string
          reversal_reason: string
          reversed_at: string
          total_row_count: number
          unallocated_amount: number
        }[]
      }
      list_invoice_aging: {
        Args: {
          p_customer_id?: string
          p_limit?: number
          p_offset?: number
          p_only_overdue?: boolean
        }
        Returns: {
          currency_code: string
          current_amount: number
          customer_code: string
          customer_id: string
          customer_name: string
          days_1_30: number
          days_31_60: number
          days_61_90: number
          days_90_plus: number
          maximum_days_overdue: number
          oldest_due_date: string
          open_invoice_count: number
          total_outstanding: number
          total_row_count: number
        }[]
      }
      list_project_financial_summaries: {
        Args: {
          p_customer_id?: string
          p_limit?: number
          p_offset?: number
          p_only_with_outstanding?: boolean
          p_project_id?: string
          p_search?: string
        }
        Returns: {
          approved_variations: number
          available_retention: number
          customer_code: string
          customer_id: string
          customer_name: string
          invoice_count: number
          open_invoice_count: number
          original_contract_value: number
          overdue_outstanding: number
          project_id: string
          project_name: string
          project_no: string
          project_status: string
          revised_contract_value: number
          total_invoiced: number
          total_outstanding: number
          total_paid: number
          total_row_count: number
        }[]
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
      list_site_retention_summaries: {
        Args: {
          p_customer_id?: string
          p_limit?: number
          p_offset?: number
          p_only_with_balance?: boolean
          p_project_id?: string
          p_site_id?: string
        }
        Returns: {
          adjustment_decrease_amount: number
          adjustment_increase_amount: number
          available_retention_balance: number
          customer_code: string
          customer_id: string
          customer_name: string
          is_enabled: boolean
          last_entry_date: string
          ledger_entry_count: number
          project_id: string
          project_name: string
          project_no: string
          released_amount: number
          retained_amount: number
          retention_cap_amount: number
          retention_fixed_amount: number
          retention_method: string
          retention_percent: number
          reversal_amount: number
          site_code: string
          site_id: string
          site_name: string
          total_row_count: number
        }[]
      }
      list_telegram_notification_users: {
        Args: { p_connection_status?: string; p_search?: string }
        Returns: {
          account_status: string
          auth_user_id: string
          connected_at: string
          daily_report_enabled: boolean
          daily_report_source: string
          display_name: string
          email: string
          employee_code: string
          employee_id: string
          goods_receiving_enabled: boolean
          goods_receiving_source: string
          notification_destination_id: string
          role_codes: string[]
          telegram_chat_id_masked: string
          telegram_connected: boolean
          telegram_enabled: boolean
        }[]
      }
      normalise_stock_request_item_approval_snapshot: {
        Args: { p_stock_request_id: string }
        Returns: number
      }
      prepare_stock_issue_atomic: {
        Args: { p_notes?: string; p_stock_issue_id: string }
        Returns: string
      }
      prepare_tool_loan_atomic: {
        Args: { p_notes?: string; p_tool_loan_id: string }
        Returns: string
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
      receive_customer_payment_atomic: {
        Args: { p_allocations?: Json; p_payment: Json }
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
      record_stock_issue_event: {
        Args: {
          p_event_code: string
          p_event_key: string
          p_event_name: string
          p_event_severity: string
          p_new_status?: string
          p_notes?: string
          p_old_status?: string
          p_payload?: Json
          p_stock_issue_id: string
          p_stock_issue_receipt_id?: string
          p_stock_transfer_receipt_posting_id?: string
        }
        Returns: string
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
      refresh_stock_request_issue_progress: {
        Args: { p_stock_request_id: string }
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
      reset_user_notification_overrides: {
        Args: { p_auth_user_id: string }
        Returns: number
      }
      reset_user_permission_overrides_atomic: {
        Args: { p_auth_user_id: string; p_reason?: string }
        Returns: string
      }
      resolve_telegram_notification_recipients: {
        Args: {
          p_event_code: string
          p_project_id?: string
          p_site_id?: string
        }
        Returns: {
          auth_user_id: string
          destination_name: string
          display_name: string
          email: string
          notification_destination_id: string
          permission_source: string
          role_codes: string[]
          telegram_chat_id: string
        }[]
      }
      restore_material_requirement_line: {
        Args: {
          p_adjustment_reason: string
          p_material_requirement_line_id: string
        }
        Returns: Json
      }
      return_tool_loan_atomic: {
        Args: {
          p_allocations: Json
          p_received_by_auth_user_id?: string
          p_received_by_employee_id?: string
          p_received_by_name?: string
          p_return_notes?: string
          p_tool_loan_id: string
        }
        Returns: string
      }
      reverse_customer_payment_atomic: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: string
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
      set_user_notification_override: {
        Args: {
          p_auth_user_id: string
          p_event_code: string
          p_override_value: string
          p_reason?: string
        }
        Returns: undefined
      }
      set_user_telegram_channel_enabled: {
        Args: { p_auth_user_id: string; p_is_enabled: boolean }
        Returns: undefined
      }
      soft_delete_customer_payment_atomic: {
        Args: { p_payment_id: string }
        Returns: string
      }
      soft_delete_invoice_atomic: {
        Args: { p_invoice_id: string }
        Returns: string
      }
      soft_delete_quotation_atomic: {
        Args: { p_quotation_id: string }
        Returns: Json
      }
      soft_delete_quotation_revision_atomic: {
        Args: { p_revision_id: string }
        Returns: Json
      }
      submit_purchase_order_atomic: {
        Args: { p_purchase_order_id: string }
        Returns: Json
      }
      submit_tool_loan_atomic: {
        Args: { p_notes?: string; p_tool_loan_id: string }
        Returns: string
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
      update_draft_invoice_atomic: {
        Args: {
          p_invoice: Json
          p_invoice_id: string
          p_lines: Json
          p_sources?: Json
        }
        Returns: string
      }
      update_draft_purchase_order_atomic: {
        Args: {
          p_lines: Json
          p_purchase_order: Json
          p_purchase_order_id: string
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
      update_draft_stock_issue_atomic: {
        Args: { p_header: Json; p_lines: Json; p_stock_issue_id: string }
        Returns: string
      }
      update_draft_tool_loan_atomic: {
        Args: { p_header: Json; p_items: Json; p_tool_loan_id: string }
        Returns: string
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
      update_notification_role_default: {
        Args: { p_event_code: string; p_is_enabled: boolean; p_role_id: string }
        Returns: undefined
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
      update_role_permissions_atomic: {
        Args: { p_changes: Json; p_reason?: string; p_role_id: string }
        Returns: string
      }
      update_user_permission_overrides_atomic: {
        Args: { p_auth_user_id: string; p_changes: Json; p_reason?: string }
        Returns: string
      }
      update_user_telegram_channel: {
        Args: {
          p_auth_user_id: string
          p_connection_notes?: string
          p_destination_name?: string
          p_is_enabled?: boolean
          p_telegram_chat_id: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: { p_auth_user_id: string; p_permission_code: string }
        Returns: boolean
      }
      validate_invoice_context: {
        Args: {
          p_customer_id: string
          p_project_id: string
          p_project_site_id: string
        }
        Returns: undefined
      }
      validate_invoice_source_context: {
        Args: {
          p_customer_id: string
          p_project_id: string
          p_project_site_id: string
          p_source_amount: number
          p_source_id: string
          p_source_type: string
        }
        Returns: undefined
      }
      void_invoice_atomic: {
        Args: { p_invoice_id: string; p_reason: string }
        Returns: string
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

