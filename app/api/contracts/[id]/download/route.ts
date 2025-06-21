import { NextRequest, NextResponse } from 'next/server'
import { contractService } from '@/lib/services/contract-service'
import { fileUploadService } from '@/lib/services/file-upload-service'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/contracts/[id]/download – отдаёт файл договора (private bucket)
 * Логика:
 * 1. Проверяем права пользователя на договор (owner)
 * 2. Получаем путь файла в bucket
 * 3. Генерируем signed URL (60 минут)
 * 4. Redirect 302 на signed URL, чтобы браузер скачал файл
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest(request)

    // Получаем договор
    const contract = await contractService.getContract(userId, params.id)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (!contract.file_url || !contract.file_name) {
      return NextResponse.json({ error: 'File not found for contract' }, { status: 404 })
    }

    // Извлекаем путь внутри bucket contracts/<userId>/filename
    let filePath: string | null = null
    const match = contract.file_url.match(/\/contracts\/(.+)$/)
    if (match && match[1]) {
      filePath = match[1]
    } else {
      // fallback: предполагаем file_name в корне папки пользователя
      filePath = `${userId}/${contract.file_name}`
    }

    // Signed URL for 1 hour
    const signedUrl = await fileUploadService.getSignedUrl(filePath, 3600)

    return NextResponse.redirect(signedUrl, 302)
  } catch (error) {
    console.error('[API] Contract download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 