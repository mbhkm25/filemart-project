'use client'

import { createClient } from '@supabase/supabase-js'

/**
 * البيئة:
 * NEXT_PUBLIC_SUPABASE_URL=
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=
 *
 * ملاحظات:
 * - يجب أن تأتي المفاتيح من .env.local (أو بيئة الإنتاج Vercel)
 * - createClient يمكن استخدامه في frontend & server components
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

/**
 * عميل Supabase جاهز للتعامل مع:
 * - Auth
 * - Database (Postgres)
 * - Storage
 * - Edge Functions
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * دوال إضافية تجهيزاً لرفع الصور:
 * يقوم برفع الصور إلى Storage داخل bucket باسم "products"
 */
export async function uploadProductImage(
  file: File,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('products')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Storage upload error:', error)
    return null
  }

  // جلب رابط التحميل العام
  const {
    data: { publicUrl },
  } = supabase.storage.from('products').getPublicUrl(path)

  return publicUrl
}
