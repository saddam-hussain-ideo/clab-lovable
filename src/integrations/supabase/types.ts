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
      advertisements: {
        Row: {
          created_at: string
          id: number
          image_url: string
          is_active: boolean
          position: string | null
          target_url: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          image_url: string
          is_active?: boolean
          position?: string | null
          target_url: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string
          is_active?: boolean
          position?: string | null
          target_url?: string
          type?: string
        }
        Relationships: []
      }
      article_favorites: {
        Row: {
          article_id: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_favorites_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_translations: {
        Row: {
          article_id: number
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          language: string
          title: string
          updated_at: string
        }
        Insert: {
          article_id: number
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          language: string
          title: string
          updated_at?: string
        }
        Update: {
          article_id?: number
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          language?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          date: string
          excerpt: string
          id: number
          imageUrl: string
          is_featured: boolean | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          slug: string
          status: string
          title: string
        }
        Insert: {
          author: string
          category: string
          content: string
          created_at?: string
          date?: string
          excerpt: string
          id?: number
          imageUrl: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          slug: string
          status?: string
          title: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          date?: string
          excerpt?: string
          id?: number
          imageUrl?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          button_text: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          order: number
          overlay_image_url: string | null
          position: string
          subtitle: string | null
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          order: number
          overlay_image_url?: string | null
          position?: string
          subtitle?: string | null
          target_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          order?: number
          overlay_image_url?: string | null
          position?: string
          subtitle?: string | null
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_banners: {
        Row: {
          button_text: string | null
          created_at: string
          id: number
          image_url: string
          is_active: boolean | null
          order: number
          position: string | null
          subtitle: string | null
          target_url: string | null
          title: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          id?: never
          image_url: string
          is_active?: boolean | null
          order: number
          position?: string | null
          subtitle?: string | null
          target_url?: string | null
          title: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          id?: never
          image_url?: string
          is_active?: boolean | null
          order?: number
          position?: string | null
          subtitle?: string | null
          target_url?: string | null
          title?: string
        }
        Relationships: []
      }
      clab_documents: {
        Row: {
          button_title: string
          created_at: string | null
          document_type: string
          file_name: string | null
          file_path: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          button_title?: string
          created_at?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          button_title?: string
          created_at?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      defi_card_registrations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_approved: boolean | null
          is_shipped: boolean | null
          last_name: string
          postal_code: string
          state: string
          status: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_approved?: boolean | null
          is_shipped?: boolean | null
          last_name: string
          postal_code: string
          state: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_approved?: boolean | null
          is_shipped?: boolean | null
          last_name?: string
          postal_code?: string
          state?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      defi_card_settings: {
        Row: {
          created_at: string
          id: number
          min_purchase_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          min_purchase_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          min_purchase_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      defi_card_waitlist: {
        Row: {
          country: string | null
          created_at: string
          discord: string | null
          email: string
          id: string
          name: string | null
          telegram: string | null
          twitter: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          discord?: string | null
          email: string
          id?: string
          name?: string | null
          telegram?: string | null
          twitter?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          discord?: string | null
          email?: string
          id?: string
          name?: string | null
          telegram?: string | null
          twitter?: string | null
        }
        Relationships: []
      }
      faq_categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          order?: number
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: number
          is_active: boolean
          order: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          order?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          order?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_id: string
          section_id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_id: string
          section_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_id?: string
          section_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_logos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string
          eth_address: string
          eth_premium_price: number
          id: number
          sol_address: string
          sol_premium_price: number
          sui_address: string | null
          sui_premium_price: number
          test_eth_address: string | null
          updated_at: string
          usdc_address: string | null
          usdc_premium_price: number | null
          usdt_address: string | null
          usdt_premium_price: number | null
        }
        Insert: {
          created_at?: string
          eth_address: string
          eth_premium_price?: number
          id?: number
          sol_address: string
          sol_premium_price?: number
          sui_address?: string | null
          sui_premium_price?: number
          test_eth_address?: string | null
          updated_at?: string
          usdc_address?: string | null
          usdc_premium_price?: number | null
          usdt_address?: string | null
          usdt_premium_price?: number | null
        }
        Update: {
          created_at?: string
          eth_address?: string
          eth_premium_price?: number
          id?: number
          sol_address?: string
          sol_premium_price?: number
          sui_address?: string | null
          sui_premium_price?: number
          test_eth_address?: string | null
          updated_at?: string
          usdc_address?: string | null
          usdc_premium_price?: number | null
          usdt_address?: string | null
          usdt_premium_price?: number | null
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          payment_amount: number
          payment_currency: string
          payment_tx_hash: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_amount: number
          payment_currency: string
          payment_tx_hash: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_amount?: number
          payment_currency?: string
          payment_tx_hash?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      presale_backup_data_backup_2024_09_24: {
        Row: {
          claim_date: string | null
          claim_tx_hash: string | null
          created_at: string | null
          currency: string | null
          distribution_date: string | null
          distribution_tx_hash: string | null
          id: number | null
          network: string | null
          original_amount: number | null
          sol_amount: number | null
          stage_id: number | null
          status: string | null
          token_address: string | null
          token_amount: number | null
          tx_hash: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: number | null
          network?: string | null
          original_amount?: number | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string | null
          token_address?: string | null
          token_amount?: number | null
          tx_hash?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: number | null
          network?: string | null
          original_amount?: number | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string | null
          token_address?: string | null
          token_amount?: number | null
          tx_hash?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      presale_contributions: {
        Row: {
          claim_date: string | null
          claim_tx_hash: string | null
          created_at: string | null
          currency: string | null
          distribution_date: string | null
          distribution_status: string | null
          distribution_tx_hash: string | null
          id: number
          network: string | null
          original_amount: number | null
          original_currency: string | null
          sol_amount: number | null
          stage_id: number | null
          status: string
          token_address: string | null
          token_amount: number
          tx_hash: string
          updated_at: string | null
          user_id: string | null
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_status?: string | null
          distribution_tx_hash?: string | null
          id?: number
          network?: string | null
          original_amount?: number | null
          original_currency?: string | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string
          token_address?: string | null
          token_amount: number
          tx_hash: string
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_status?: string | null
          distribution_tx_hash?: string | null
          id?: number
          network?: string | null
          original_amount?: number | null
          original_currency?: string | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string
          token_address?: string | null
          token_amount?: number
          tx_hash?: string
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presale_contributions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "presale_reports"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "presale_contributions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "presale_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      presale_contributions_backup_2024_09_24: {
        Row: {
          claim_date: string | null
          claim_tx_hash: string | null
          created_at: string | null
          currency: string | null
          distribution_date: string | null
          distribution_status: string | null
          distribution_tx_hash: string | null
          id: number | null
          network: string | null
          original_amount: number | null
          original_currency: string | null
          sol_amount: number | null
          stage_id: number | null
          status: string | null
          token_address: string | null
          token_amount: number | null
          tx_hash: string | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
          wallet_type: string | null
        }
        Insert: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_status?: string | null
          distribution_tx_hash?: string | null
          id?: number | null
          network?: string | null
          original_amount?: number | null
          original_currency?: string | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string | null
          token_address?: string | null
          token_amount?: number | null
          tx_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Update: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_status?: string | null
          distribution_tx_hash?: string | null
          id?: number | null
          network?: string | null
          original_amount?: number | null
          original_currency?: string | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string | null
          token_address?: string | null
          token_amount?: number | null
          tx_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Relationships: []
      }
      presale_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      presale_settings: {
        Row: {
          contract_address: string | null
          created_at: string
          eth_address: string | null
          eth_price: number | null
          id: string
          min_purchase: number
          progress: number
          status: string | null
          target: number | null
          test_contract_address: string | null
          test_eth_address: string | null
          token_description: string | null
          token_metadata_url: string | null
          token_mint_address: string | null
          token_name: string | null
          token_price: number
          token_symbol: string | null
          token_total_supply: number | null
          updated_at: string
        }
        Insert: {
          contract_address?: string | null
          created_at?: string
          eth_address?: string | null
          eth_price?: number | null
          id?: string
          min_purchase?: number
          progress?: number
          status?: string | null
          target?: number | null
          test_contract_address?: string | null
          test_eth_address?: string | null
          token_description?: string | null
          token_metadata_url?: string | null
          token_mint_address?: string | null
          token_name?: string | null
          token_price?: number
          token_symbol?: string | null
          token_total_supply?: number | null
          updated_at?: string
        }
        Update: {
          contract_address?: string | null
          created_at?: string
          eth_address?: string | null
          eth_price?: number | null
          id?: string
          min_purchase?: number
          progress?: number
          status?: string | null
          target?: number | null
          test_contract_address?: string | null
          test_eth_address?: string | null
          token_description?: string | null
          token_metadata_url?: string | null
          token_mint_address?: string | null
          token_name?: string | null
          token_price?: number
          token_symbol?: string | null
          token_total_supply?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      presale_stages: {
        Row: {
          allocation_amount: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          is_active: boolean | null
          is_published: boolean | null
          name: string
          network: string | null
          order_number: number
          start_date: string | null
          target_amount: number | null
          target_amount_usd: number | null
          token_price: number
          token_price_usd: number | null
          updated_at: string | null
        }
        Insert: {
          allocation_amount?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          is_published?: boolean | null
          name: string
          network?: string | null
          order_number: number
          start_date?: string | null
          target_amount?: number | null
          target_amount_usd?: number | null
          token_price: number
          token_price_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          allocation_amount?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          is_published?: boolean | null
          name?: string
          network?: string | null
          order_number?: number
          start_date?: string | null
          target_amount?: number | null
          target_amount_usd?: number | null
          token_price?: number
          token_price_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      presale_transactions: {
        Row: {
          amount: number
          created_at: string
          id: number
          status: string
          tx_hash: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          status?: string
          tx_hash: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          status?: string
          tx_hash?: string
          wallet_address?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          id: string
          interests: string[] | null
          points: number | null
          referral_code: string | null
          social_links: Json | null
          username: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          id: string
          interests?: string[] | null
          points?: number | null
          referral_code?: string | null
          social_links?: Json | null
          username?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          id?: string
          interests?: string[] | null
          points?: number | null
          referral_code?: string | null
          social_links?: Json | null
          username?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      purchase_token_amounts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          sol_amount: number
          token_amount: number
          used: boolean
          wallet_address: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id: string
          sol_amount: number
          token_amount: number
          used?: boolean
          wallet_address: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          sol_amount?: number
          token_amount?: number
          used?: boolean
          wallet_address?: string
        }
        Relationships: []
      }
      purchase_token_amounts_backup_2024_09_24: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          sol_amount: number | null
          token_amount: number | null
          used: boolean | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          sol_amount?: number | null
          token_amount?: number | null
          used?: boolean | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          sol_amount?: number | null
          token_amount?: number | null
          used?: boolean | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          created_at: string
          id: number
          is_correct: boolean
          question_id: number
          quiz_attempt_id: number
          selected_option: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_correct: boolean
          question_id: number
          quiz_attempt_id: number
          selected_option: number
        }
        Update: {
          created_at?: string
          id?: number
          is_correct?: boolean
          question_id?: number
          quiz_attempt_id?: number
          selected_option?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          correct_answers: number
          id: number
          perfect_rounds: number
          questions_answered: number
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_answers?: number
          id?: number
          perfect_rounds?: number
          questions_answered?: number
          score?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_answers?: number
          id?: number
          perfect_rounds?: number
          questions_answered?: number
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: Database["public"]["Enums"]["quiz_category"]
          correct_option: number
          created_at: string
          id: number
          options: Json
          text: string
        }
        Insert: {
          category: Database["public"]["Enums"]["quiz_category"]
          correct_option: number
          created_at?: string
          id?: number
          options: Json
          text: string
        }
        Update: {
          category?: Database["public"]["Enums"]["quiz_category"]
          correct_option?: number
          created_at?: string
          id?: number
          options?: Json
          text?: string
        }
        Relationships: []
      }
      quiz_questions_crypto_personalities: {
        Row: {
          correct_option: number
          created_at: string | null
          id: number
          options: string[]
          question_text: string
          updated_at: string | null
        }
        Insert: {
          correct_option: number
          created_at?: string | null
          id?: number
          options: string[]
          question_text: string
          updated_at?: string | null
        }
        Update: {
          correct_option?: number
          created_at?: string | null
          id?: number
          options?: string[]
          question_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrals_referred_id_profiles"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer_id_profiles"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          createdat: string
          createdby: string
          deliverymethod: string
          enabled: boolean
          filter: Json | null
          frequency: string
          id: string
          lastrun: string | null
          name: string
          nextrun: string | null
          recipients: string[] | null
          reporttype: string
        }
        Insert: {
          createdat?: string
          createdby: string
          deliverymethod: string
          enabled?: boolean
          filter?: Json | null
          frequency: string
          id?: string
          lastrun?: string | null
          name: string
          nextrun?: string | null
          recipients?: string[] | null
          reporttype: string
        }
        Update: {
          createdat?: string
          createdby?: string
          deliverymethod?: string
          enabled?: boolean
          filter?: Json | null
          frequency?: string
          id?: string
          lastrun?: string | null
          name?: string
          nextrun?: string | null
          recipients?: string[] | null
          reporttype?: string
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string
          name: string
          value: string
        }
        Insert: {
          created_at?: string
          name: string
          value: string
        }
        Update: {
          created_at?: string
          name?: string
          value?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_answered_questions: {
        Row: {
          answered_at: string
          id: number
          question_id: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: number
          question_id: number
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: number
          question_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answered_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answered_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          attempt_date: string
          id: number
          user_id: string
        }
        Insert: {
          attempt_date?: string
          id?: number
          user_id: string
        }
        Update: {
          attempt_date?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_attempts_daily: {
        Row: {
          attempt_date: string
          attempts_count: number
          id: string
          user_id: string
        }
        Insert: {
          attempt_date?: string
          attempts_count?: number
          id?: string
          user_id: string
        }
        Update: {
          attempt_date?: string
          attempts_count?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_answered_questions: {
        Row: {
          answered_at: string | null
          id: number
          question_id: number
          wallet_address: string
        }
        Insert: {
          answered_at?: string | null
          id?: number
          question_id: number
          wallet_address: string
        }
        Update: {
          answered_at?: string | null
          id?: number
          question_id?: number
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_connection_logs: {
        Row: {
          connected_at: string
          id: string
          ip_address: string | null
          sync_status: string | null
          user_agent: string | null
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          connected_at?: string
          id?: string
          ip_address?: string | null
          sync_status?: string | null
          user_agent?: string | null
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          connected_at?: string
          id?: string
          ip_address?: string | null
          sync_status?: string | null
          user_agent?: string | null
          wallet_address?: string
          wallet_type?: string | null
        }
        Relationships: []
      }
      wallet_premium_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          payment_amount: number
          payment_currency: string
          payment_tx_hash: string
          wallet_address: string
          wallet_profile_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_amount: number
          payment_currency: string
          payment_tx_hash: string
          wallet_address: string
          wallet_profile_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_amount?: number
          payment_currency?: string
          payment_tx_hash?: string
          wallet_address?: string
          wallet_profile_id?: string | null
        }
        Relationships: []
      }
      wallet_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          points: number | null
          updated_at: string | null
          username: string | null
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address?: string
          wallet_type?: string | null
        }
        Relationships: []
      }
      wallet_quiz_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          id: number
          perfect_rounds: number | null
          questions_answered: number | null
          score: number | null
          wallet_address: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          id?: number
          perfect_rounds?: number | null
          questions_answered?: number | null
          score?: number | null
          wallet_address: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          id?: number
          perfect_rounds?: number | null
          questions_answered?: number | null
          score?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      defi_card_eligibility: {
        Row: {
          has_registered: boolean | null
          is_eligible: boolean | null
          total_usd_value: number | null
          wallet_address: string | null
        }
        Relationships: []
      }
      presale_backup_data: {
        Row: {
          claim_date: string | null
          claim_tx_hash: string | null
          created_at: string | null
          currency: string | null
          distribution_date: string | null
          distribution_tx_hash: string | null
          id: number | null
          network: string | null
          original_amount: number | null
          sol_amount: number | null
          stage_id: number | null
          status: string | null
          token_address: string | null
          token_amount: number | null
          tx_hash: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: number | null
          network?: string | null
          original_amount?: number | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string | null
          token_address?: string | null
          token_amount?: number | null
          tx_hash?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          claim_date?: string | null
          claim_tx_hash?: string | null
          created_at?: string | null
          currency?: string | null
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: number | null
          network?: string | null
          original_amount?: number | null
          sol_amount?: number | null
          stage_id?: number | null
          status?: string | null
          token_address?: string | null
          token_amount?: number | null
          tx_hash?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presale_contributions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "presale_reports"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "presale_contributions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "presale_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      presale_reports: {
        Row: {
          claim_date: string | null
          claim_tx_hash: string | null
          contribution_id: number | null
          currency: string | null
          distribution_date: string | null
          distribution_tx_hash: string | null
          network: string | null
          original_amount: number | null
          purchase_date: string | null
          purchase_tx_hash: string | null
          sol_amount: number | null
          stage_id: number | null
          stage_name: string | null
          status: string | null
          target_amount: number | null
          token_address: string | null
          token_amount: number | null
          token_price: number | null
          wallet_address: string | null
        }
        Relationships: []
      }
      wallet_total_purchases: {
        Row: {
          total_usd_value: number | null
          wallet_address: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_record_contribution: {
        Args: {
          wallet_addr: string
          sol_amt: number
          token_amt: number
          transaction_hash: string
          network_name?: string
          currency_name?: string
          status_value?: string
          stage_id_value?: number
          original_currency_value?: string
          original_amount_value?: number
        }
        Returns: number
      }
      check_contribution_cron_exists: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_daily_quiz_attempts: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      check_policy_exists: {
        Args: {
          table_name: string
          policy_name: string
        }
        Returns: boolean
      }
      check_total_quiz_attempts: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      cleanup_expired_token_amounts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_anon_contribution_policy: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_contribution_cron_15min: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_premium_subscription: {
        Args: {
          p_user_id: string
          p_payment_tx_hash: string
          p_expires_at: string
        }
        Returns: string
      }
      create_presale_notifications_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_profile_for_wallet:
        | {
            Args: {
              wallet_addr: string
              username: string
            }
            Returns: string
          }
        | {
            Args: {
              wallet_addr: string
              username?: string
              wallet_type?: string
            }
            Returns: string
          }
      create_scheduled_reports_table: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_test_premium_subscription: {
        Args: {
          wallet_addr: string
          duration_days?: number
        }
        Returns: string
      }
      create_wallet_profile: {
        Args: {
          wallet_addr: string
          display_name: string
        }
        Returns: string
      }
      drop_contribution_cron: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_payment_settings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_wallet_profile:
        | {
            Args: {
              p_wallet_address: string
            }
            Returns: string
          }
        | {
            Args: {
              p_wallet_address: string
              p_wallet_type?: string
            }
            Returns: string
          }
      get_combined_leaderboard: {
        Args: {
          limit_count?: number
        }
        Returns: {
          id: string
          username: string
          points: number
          avatar_url: string
          is_wallet: boolean
        }[]
      }
      get_daily_contribution_stats: {
        Args: {
          network_param: string
          from_date: string
          to_date: string
        }
        Returns: {
          date: string
          sol_amount: number
          token_amount: number
          count: number
        }[]
      }
      get_or_create_wallet_profile: {
        Args: {
          p_wallet_address: string
          p_wallet_type?: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string | null
          id: string
          points: number | null
          updated_at: string | null
          username: string | null
          wallet_address: string
          wallet_type: string | null
        }[]
      }
      get_user_quiz_activity: {
        Args: {
          p_user_id?: string
          p_wallet_address?: string
        }
        Returns: {
          total_questions_answered: number
          total_points_earned: number
          perfect_rounds: number
          attempts: Json
        }[]
      }
      handle_purchase_verification:
        | {
            Args: {
              p_wallet_address: string
              p_tx_hash: string
              p_amount: number
              p_network?: string
              p_currency?: string
              p_wallet_type?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_wallet_address: string
              p_tx_hash: string
              p_amount: number
              p_network?: string
              p_currency?: string
              p_wallet_type?: string
              p_initial_status?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_wallet_address: string
              p_tx_hash: string
              p_amount: number
              p_network?: string
              p_currency?: string
              p_wallet_type?: string
              p_initial_status?: string
              p_eth_price?: number
            }
            Returns: Json
          }
      handle_purchase_verification_wrapper: {
        Args: {
          p_amount: number
          p_currency: string
          p_eth_price: number
          p_initial_status: string
          p_network: string
          p_tx_hash: string
          p_wallet_address: string
          p_wallet_type: string
        }
        Returns: Json
      }
      has_premium_access: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_wallet_premium_access: {
        Args: {
          wallet_address: string
        }
        Returns: boolean
      }
      insert_presale_contribution: {
        Args: {
          contribution: Json
        }
        Returns: Json
      }
      is_article_favorited: {
        Args: {
          article_id: number
          user_id: string
        }
        Returns: boolean
      }
      is_username_taken: {
        Args: {
          p_username: string
          p_current_user_id?: string
        }
        Returns: boolean
      }
      is_wallet_eligible_for_defi_card: {
        Args: {
          wallet_addr: string
        }
        Returns: boolean
      }
      mark_wallet_question_answered: {
        Args: {
          p_wallet_address: string
          p_question_id: number
        }
        Returns: boolean
      }
      record_wallet_quiz_attempt: {
        Args: {
          p_wallet_address: string
          p_score: number
          p_questions_answered: number
          p_correct_answers: number
          p_perfect_rounds: number
        }
        Returns: number
      }
      reorder_banner: {
        Args: {
          banner_id: string
          move_direction: string
        }
        Returns: undefined
      }
      update_contribution_status: {
        Args: {
          contribution_id: number
          new_status: string
          timestamp_val: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      quiz_category:
        | "satoshi"
        | "bitcoin_history"
        | "ethereum_history"
        | "altcoins"
        | "defi"
        | "web3"
        | "crypto_news"
        | "crypto_personalities"
        | "degenerates"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
