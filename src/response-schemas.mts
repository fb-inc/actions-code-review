import { z } from 'zod'

const base_comment_schema = z.object({
  path: z.string().describe('コメントを付けるファイルへの相対パスです。'),
  body: z.string().describe('レビューコメントの本文です。'),
})

export const FILE_COMMENT_SCHEMA = base_comment_schema.extend({
  subject_type: z.enum(['file']), //* ファイル全体へのコメントを示す固定値
})

const side_enum = z.enum(['RIGHT', 'LEFT'])
export const SINGLE_LINE_COMMENT_SCHEMA = base_comment_schema.extend({
  line: z
    .number()
    .describe(
      'プルリクエストの差分内で、コメントを適用する行番号です。複数行コメントの場合は、コメント範囲の最後の行番号を指定します。',
    ),
  side: side_enum.describe(
    '差分の表示位置を指定します。削除された行（赤色表示）には"LEFT"を、追加された行（緑色表示）や文脈として表示される変更のない行（白色表示）には"RIGHT"を使用します。複数行コメントの場合、コメント範囲の最後の行が削除か追加かを示します。',
  ),
})

export const MULTI_LINE_COMMENT_SCHEMA = SINGLE_LINE_COMMENT_SCHEMA.extend({
  start_line: z.number().describe('複数行コメントを適用する範囲の開始行番号です。'),
  start_side: side_enum.describe(
    'コメントを適用する差分の開始位置です。"LEFT"（削除部分）または"RIGHT"（追加部分）を指定できます。',
  ),
})
