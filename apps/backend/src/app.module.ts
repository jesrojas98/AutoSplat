import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_PIPE } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SupabaseModule } from './supabase/supabase.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { FavoritesModule } from './favorites/favorites.module'
import { MessagesModule } from './messages/messages.module'
import { UploadModule } from './upload/upload.module'
import { JobsModule } from './jobs/jobs.module'
import { NotificationsModule } from './notifications/notifications.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    FavoritesModule,
    MessagesModule,
    UploadModule,
    JobsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule {}
