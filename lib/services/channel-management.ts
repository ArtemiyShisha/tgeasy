import { 
  ChannelManagementOperation,
  BulkChannelOperation,
  ChannelSyncResult
} from '@/types/channel'
import { ChannelService } from './channel-service'
import { ChannelRepository } from '@/lib/repositories/channel-repository'
import { getChannelPermissionsService } from './channel-permissions-service'
import { TelegramBotAPI } from '@/lib/integrations/telegram/bot-api'

export class ChannelManagementService {
  private static instance: ChannelManagementService
  private channelService: ChannelService
  private channelRepository: ChannelRepository
  private permissionsService: ReturnType<typeof getChannelPermissionsService>
  private telegramApi: TelegramBotAPI

  private constructor() {
    this.channelService = ChannelService.getInstance()
    this.channelRepository = ChannelRepository.getInstance()
    this.permissionsService = getChannelPermissionsService()
    this.telegramApi = new TelegramBotAPI()
  }

  public static getInstance(): ChannelManagementService {
    if (!ChannelManagementService.instance) {
      ChannelManagementService.instance = new ChannelManagementService()
    }
    return ChannelManagementService.instance
  }

  /**
   * Выполнение операции управления каналом
   */
  async executeChannelOperation(operation: ChannelManagementOperation): Promise<ChannelSyncResult> {
    const { type, channel_id, user_id, options = {} } = operation

    try {
      switch (type) {
        case 'sync_permissions':
          return await this.channelService.syncChannelPermissions(channel_id, user_id)

        case 'verify_status':
          const verification = await this.channelService.verifyChannelStatus(channel_id, user_id)
          return {
            success: verification.is_accessible && verification.bot_is_admin,
            channel_id,
            permissions_updated: false,
            stats_updated: false,
            errors: verification.verification_error ? [verification.verification_error] : [],
            sync_timestamp: verification.last_verified_at
          }

        case 'update_stats':
          const stats = await this.channelService.getChannelStats(channel_id, user_id)
          return {
            success: !!stats,
            channel_id,
            permissions_updated: false,
            stats_updated: !!stats,
            errors: stats ? [] : ['Не удалось получить статистику'],
            sync_timestamp: new Date().toISOString()
          }

        case 'refresh_data':
          // Комплексное обновление: права + статус + статистика
          const syncResult = await this.channelService.syncChannelPermissions(channel_id, user_id)
          const statusVerification = await this.channelService.verifyChannelStatus(channel_id, user_id)
          const statsUpdate = await this.channelService.getChannelStats(channel_id, user_id)

          return {
            success: syncResult.success && statusVerification.is_accessible,
            channel_id,
            permissions_updated: syncResult.permissions_updated,
            stats_updated: !!statsUpdate,
            errors: [
              ...syncResult.errors,
              ...(statusVerification.verification_error ? [statusVerification.verification_error] : [])
            ],
            sync_timestamp: new Date().toISOString()
          }

        default:
          throw new Error(`Неизвестный тип операции: ${type}`)
      }
    } catch (error) {
      return {
        success: false,
        channel_id,
        permissions_updated: false,
        stats_updated: false,
        errors: [error instanceof Error ? error.message : 'Ошибка выполнения операции'],
        sync_timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Массовое выполнение операций над каналами
   */
  async executeBulkOperation(operation: BulkChannelOperation): Promise<ChannelSyncResult[]> {
    const { operation: operationType, channel_ids, user_id, options = {} } = operation
    const results: ChannelSyncResult[] = []

    // Выполняем операции по очереди для избежания rate limiting
    for (const channelId of channel_ids) {
      try {
        const channelOperation: ChannelManagementOperation = {
          type: operationType as any,
          channel_id: channelId,
          user_id,
          options
        }

        const result = await this.executeChannelOperation(channelOperation)
        results.push(result)

        // Небольшая задержка между операциями для Telegram API
        if (channel_ids.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error) {
        results.push({
          success: false,
          channel_id: channelId,
          permissions_updated: false,
          stats_updated: false,
          errors: [error instanceof Error ? error.message : 'Ошибка выполнения операции'],
          sync_timestamp: new Date().toISOString()
        })
      }
    }

    return results
  }

  /**
   * Мониторинг каналов и автоматическое исправление проблем
   */
  async monitorChannels(limit: number = 50): Promise<{
    processed: number
    fixed: number
    errors: number
    results: ChannelSyncResult[]
  }> {
    const channels = await this.channelRepository.getChannelsForMonitoring(limit)
    const results: ChannelSyncResult[] = []
    let fixed = 0
    let errors = 0

    for (const channel of channels) {
      try {
        // Проверка статуса канала
        const verification = await this.channelService.verifyChannelStatus(channel.id, channel.user_id)
        
        if (verification.is_accessible && verification.bot_is_admin) {
          // Канал доступен, синхронизируем права
          const syncResult = await this.channelService.syncChannelPermissions(channel.id, channel.user_id)
          
          if (syncResult.success) {
            fixed++
          } else {
            errors++
          }
          
          results.push(syncResult)
        } else {
          // Канал недоступен или нет прав
          errors++
          results.push({
            success: false,
            channel_id: channel.id,
            permissions_updated: false,
            stats_updated: false,
            errors: [verification.verification_error || 'Канал недоступен'],
            sync_timestamp: verification.last_verified_at
          })
        }

        // Задержка между проверками
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        errors++
        results.push({
          success: false,
          channel_id: channel.id,
          permissions_updated: false,
          stats_updated: false,
          errors: [error instanceof Error ? error.message : 'Ошибка мониторинга'],
          sync_timestamp: new Date().toISOString()
        })
      }
    }

    return {
      processed: channels.length,
      fixed,
      errors,
      results
    }
  }

  /**
   * Очистка неактивных каналов
   */
  async cleanupInactiveChannels(daysInactive: number = 30): Promise<{
    checked: number
    cleaned: number
    errors: string[]
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

    const channels = await this.channelRepository.getChannelsForMonitoring(1000)
    const errors: string[] = []
    let cleaned = 0

    for (const channel of channels) {
      try {
        // Проверяем, давно ли канал был активен
        const lastChecked = channel.last_checked_at ? new Date(channel.last_checked_at) : null
        const shouldCleanup = !lastChecked || lastChecked < cutoffDate

        if (shouldCleanup && !channel.is_active) {
          // Дополнительная проверка: пытаемся получить доступ к каналу
          try {
            const chatInfo = await this.telegramApi.getChat(channel.telegram_channel_id)
            if (!chatInfo) {
              // Канал действительно недоступен, можно удалить
              await this.channelRepository.hardDelete(channel.id)
              cleaned++
            }
          } catch {
            // Канал недоступен, удаляем
            await this.channelRepository.hardDelete(channel.id)
            cleaned++
          }
        }
      } catch (error) {
        errors.push(`Ошибка очистки канала ${channel.id}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
    }

    return {
      checked: channels.length,
      cleaned,
      errors
    }
  }

  /**
   * Синхронизация всех каналов пользователя
   */
  async syncAllUserChannels(userId: string): Promise<{
    total: number
    synced: number
    failed: number
    results: ChannelSyncResult[]
  }> {
    const { channels } = await this.channelRepository.getUserAccessibleChannels(userId, { limit: 1000 })
    const results: ChannelSyncResult[] = []
    let synced = 0
    let failed = 0

    for (const channel of channels) {
      try {
        const result = await this.channelService.syncChannelPermissions(channel.id, userId)
        results.push(result)
        
        if (result.success) {
          synced++
        } else {
          failed++
        }

        // Задержка для rate limiting
        await new Promise(resolve => setTimeout(resolve, 250))
      } catch (error) {
        failed++
        results.push({
          success: false,
          channel_id: channel.id,
          permissions_updated: false,
          stats_updated: false,
          errors: [error instanceof Error ? error.message : 'Ошибка синхронизации'],
          sync_timestamp: new Date().toISOString()
        })
      }
    }

    return {
      total: channels.length,
      synced,
      failed,
      results
    }
  }

  /**
   * Получение отчета о состоянии каналов пользователя
   */
  async getUserChannelsHealthReport(userId: string): Promise<{
    total: number
    active: number
    inactive: number
    with_errors: number
    needs_sync: number
    channels_by_status: Record<string, number>
  }> {
    const { channels } = await this.channelRepository.getUserAccessibleChannels(userId, { limit: 1000 })
    
    const report = {
      total: channels.length,
      active: 0,
      inactive: 0,
      with_errors: 0,
      needs_sync: 0,
      channels_by_status: {} as Record<string, number>
    }

    const now = new Date()
    const syncThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

    for (const channel of channels) {
      // Подсчет по статусу
      const status = channel.is_active ? 'active' : 'inactive'
      report.channels_by_status[status] = (report.channels_by_status[status] || 0) + 1

      if (channel.is_active) {
        report.active++
      } else {
        report.inactive++
      }

      if (channel.error_message) {
        report.with_errors++
      }

      // Проверка необходимости синхронизации
      const lastSynced = channel.user_permissions?.last_synced_at 
        ? new Date(channel.user_permissions.last_synced_at)
        : null

      if (!lastSynced || lastSynced < syncThreshold) {
        report.needs_sync++
      }
    }

    return report
  }

  /**
   * Пакетное обновление last_checked_at
   */
  async batchUpdateLastChecked(channelIds: string[]): Promise<void> {
    if (channelIds.length === 0) return

    // Разбиваем на батчи по 50 каналов
    const batchSize = 50
    for (let i = 0; i < channelIds.length; i += batchSize) {
      const batch = channelIds.slice(i, i + batchSize)
      await this.channelRepository.batchUpdateLastChecked(batch)
      
      // Небольшая задержка между батчами
      if (i + batchSize < channelIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
} 