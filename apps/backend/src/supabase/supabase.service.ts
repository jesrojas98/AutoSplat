import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient
  readonly admin: SupabaseClient

  constructor(private config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const anon = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')
    const serviceRole = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')

    this.client = createClient(url, anon)
    this.admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
}
