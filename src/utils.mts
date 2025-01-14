import { MessageCreateParamsNonStreaming, ErrorResponse, Messages, Beta } from '@anthropic-ai/sdk/resources'
import { exponential } from 'backoff'

export const splitForFile = (diff_content: string) => {
  // 改行コードを統一
  const normalized_content = diff_content.replace(/\r\n/g, '\n')

  // "diff --git" で始まる行で分割
  const diff_parts = normalized_content.split(/(?=diff --git )/)

  // 空の要素を除外
  return diff_parts.filter((_) => _.trim().length !== 0)
}

export const createMessage = async (
  m: Messages,
  diff_content: string,
  params: Omit<MessageCreateParamsNonStreaming, 'model' | 'max_tokens' | 'messages'>,
) => {
  const backoff = exponential({ initialDelay: 1000, maxDelay: 60000, factor: 2 })

  let last_error: { error: ErrorResponse } | null = null
  let attempts = 0

  const max_retries = 3
  while (attempts <= max_retries) {
    try {
      const result = await m.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: `# ソース差分\n\n${diff_content}` }],
          },
        ],
        ...params,
      })
      console.log(JSON.stringify(result.usage, null, 2))
      return result
    } catch (error: any) {
      last_error = error

      attempts++
      if (attempts > max_retries) {
        throw new Error(`最大リトライ回数（${max_retries}回）を超過しました: ${last_error!.error.error.message}`)
      }

      if (last_error!.error.error.type === 'rate_limit_error') {
        console.warn(`レート制限エラーが発生しました。リトライを実行します (${attempts}/${max_retries})`)

        const delay = await new Promise<number>((resolve) => {
          backoff.once('ready', (number, delay) => resolve(delay))
          backoff.backoff()
        })

        console.info(`${delay}ms待機後に再試行します...`)
        continue
      }

      throw error
    }
  }

  throw last_error || new Error('予期せぬエラーが発生しました')
}

export const formatErrorReviewsToMarkdown = (failed_reviews: string[]) => {
  const formatted_reviews = failed_reviews
    .map((text) => {
      try {
        const review = JSON.parse(text)
        const sections = [`## 📁 ${review.path}`, '', review.body, '']

        if (review.error_message) {
          sections.push('### ⚠️ エラー情報', '', `${review.error_message}`, '')
        }

        sections.push(`> Commit: ${review.commit_id.substring(0, 7)}`, '')

        return sections.join('\n')
      } catch (e) {
        console.error('レビューのパースに失敗しました:', e)
        return undefined
      }
    })
    .filter((review) => review != null)

  return [
    '🤖 エラーによりコメントできなかったレビューをここでまとめます。\n',
    formatted_reviews.join('\n---\n\n'),
  ].join('\n')
}
