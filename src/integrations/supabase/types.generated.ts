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
          created_at: string
          daily_report_activity_id: string
          notes: string | null
          report_id: string
        }
        Insert: {
          activity_type_id: string
          created_at?: string
          daily_report_activity_id?: string
          notes?: string | null
          report_id: string
        }
        Update: {
          activity_type_id?: string
          created_at?: string
          daily_report_activity_id?: string
          notes?: string | null
          report_id?: string
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
          bank_account_name?: string | null
          bank_account_no?: string | null
          bank_bsb?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          employee_code: string
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
      material_supplier_links: {
        Row: {
          created_at: string
          created_by: string | null
          default_cost_price: number | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          is_preferred: boolean
          lead_time_days: number | null
          material_supplier_link_id: string
          product_id: string
          supplier_id: string
          supplier_product_code: string | null
          supplier_product_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_cost_price?: number | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_preferred?: boolean
          lead_time_days?: number | null
          material_supplier_link_id?: string
          product_id: string
          supplier_id: string
          supplier_product_code?: string | null
          supplier_product_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_cost_price?: number | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_preferred?: boolean
          lead_time_days?: number | null
          material_supplier_link_id?: string
          product_id?: string
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
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          default_sell_price: number | null
          deleted_at: string | null
          description: string | null
          is_active: boolean
          is_deleted: boolean
          is_service_item: boolean
          is_stock_item: boolean
          product_code: string
          product_id: string
          product_name: string
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          default_sell_price?: number | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_service_item?: boolean
          is_stock_item?: boolean
          product_code: string
          product_id?: string
          product_name: string
          unit: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          default_sell_price?: number | null
          deleted_at?: string | null
          description?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_service_item?: boolean
          is_stock_item?: boolean
          product_code?: string
          product_id?: string
          product_name?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      project_areas: {
        Row: {
          actual_quantity: number | null
          area_code: string | null
          area_id: string
          area_name: string
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
          area_code?: string | null
          area_id?: string
          area_name: string
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
          area_code?: string | null
          area_id?: string
          area_name?: string
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
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          is_active: boolean
          is_deleted: boolean
          notes: string | null
          postcode: string | null
          project_id: string
          site_code: string | null
          site_id: string
          site_name: string
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
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          postcode?: string | null
          project_id: string
          site_code?: string | null
          site_id?: string
          site_name: string
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
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          is_active?: boolean
          is_deleted?: boolean
          notes?: string | null
          postcode?: string | null
          project_id?: string
          site_code?: string | null
          site_id?: string
          site_name?: string
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
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_deleted: boolean
          line_no: number
          line_total: number
          notes: string | null
          product_id: string
          purchase_order_id: string
          purchase_order_line_id: string
          quantity: number
          tax_amount: number
          tax_rate: number
          unit_cost: number
          unit_of_measure: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no: number
          line_total?: number
          notes?: string | null
          product_id: string
          purchase_order_id: string
          purchase_order_line_id?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no?: number
          line_total?: number
          notes?: string | null
          product_id?: string
          purchase_order_id?: string
          purchase_order_line_id?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["purchase_order_id"]
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
          tax_amount: number
          tax_rate: number
          unit_of_measure: string
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
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
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
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
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
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
        ]
      }
      quotation_revision_lines: {
        Row: {
          cost_price: number | null
          created_at: string
          created_by: string | null
          description: string
          discount_amount: number
          discount_percent: number
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
          tax_amount: number
          tax_rate: number
          unit_of_measure: string
          unit_price: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          discount_amount?: number
          discount_percent?: number
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
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount_amount?: number
          discount_percent?: number
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
          tax_amount?: number
          tax_rate?: number
          unit_of_measure?: string
          unit_price?: number
        }
        Relationships: [
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
        ]
      }
      quotation_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number
          quotation_id: string
          revision_id: string
          revision_no: number
          revision_notes: string | null
          revision_reason: string | null
          subtotal_amount: number
          tax_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          quotation_id: string
          revision_id?: string
          revision_no: number
          revision_notes?: string | null
          revision_reason?: string | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          quotation_id?: string
          revision_id?: string
          revision_no?: number
          revision_notes?: string | null
          revision_reason?: string | null
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
        }
        Relationships: [
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
          created_at: string
          created_by: string | null
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
          revision_no: number
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
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
          revision_no?: number
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
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
          revision_no?: number
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
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
      stock_request_items: {
        Row: {
          approved_quantity: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          is_deleted: boolean
          line_no: number
          notes: string | null
          product_id: string
          requested_quantity: number
          stock_request_id: string
          stock_request_item_id: string
          unit_of_measure: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_quantity?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no: number
          notes?: string | null
          product_id: string
          requested_quantity?: number
          stock_request_id: string
          stock_request_item_id?: string
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_quantity?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          is_deleted?: boolean
          line_no?: number
          notes?: string | null
          product_id?: string
          requested_quantity?: number
          stock_request_id?: string
          stock_request_item_id?: string
          unit_of_measure?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
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
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_delivery_photos_supplier_delivery_id_fkey"
            columns: ["supplier_delivery_id"]
            isOneToOne: false
            referencedRelation: "supplier_deliveries"
            referencedColumns: ["supplier_delivery_id"]
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
      work_activity_types: {
        Row: {
          activity_code: string
          activity_name: string
          activity_type_id: string
          created_at: string
          description: string | null
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          activity_code: string
          activity_name: string
          activity_type_id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          activity_code?: string
          activity_name?: string
          activity_type_id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      work_assignments: {
        Row: {
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
          work_order_no: string
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
      end_work_assignment: {
        Args: { p_work_assignment_id: string }
        Returns: undefined
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
      generate_work_order_no: {
        Args: { p_created_at?: string }
        Returns: string
      }
      is_admin_role: { Args: never; Returns: boolean }
      is_payroll_role: { Args: never; Returns: boolean }
      is_project_role: { Args: never; Returns: boolean }
      remove_mistaken_work_assignment: {
        Args: { p_work_assignment_id: string }
        Returns: undefined
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
