import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

interface RequestRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RequestRecord>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export const RATE_LIMIT_KEY = 'rateLimit'

export interface RateLimitOptions {
  limit: number
  windowMs: number
}

export function RateLimit(limit: number, windowMs: number) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const options: RateLimitOptions = { limit, windowMs }
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value)
    } else {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, target)
    }
    return descriptor ?? target
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options =
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler()) ??
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getClass())

    if (!options) return true

    const req = context.switchToHttp().getRequest()
    const ip: string =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress ??
      'unknown'

    const key = `${ip}:${context.getClass().name}:${context.getHandler().name}`
    const now = Date.now()
    const record = store.get(key)

    if (!record || record.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs })
      return true
    }

    if (record.count >= options.limit) {
      throw new HttpException(
        { message: 'Demasiadas solicitudes. Intenta más tarde.', statusCode: 429 },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    record.count++
    return true
  }
}
