import Anthropic from '@anthropic-ai/sdk'
import * as path from 'path'
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest'
import { readFile } from 'fs/promises'
import { z } from 'zod'
import { fileURLToPath } from 'url'
import { Message } from '@anthropic-ai/sdk/resources/messages'
import { createMessage, formatErrorReviewsToMarkdown, splitForFile } from './utils.mts'
import { ADD_REVIEW_FOR_FILE, ADD_REVIEW_FOR_MULTI_LINE, ADD_REVIEW_FOR_SINGLE_LINE } from './tools.mts'

const env_schema = z.object({
  ANTHROPIC_API_KEY: z.string(),
  UNIT_REVIEW_PROMPT: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .optional()
      .default(
        await readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'prompt-templates', 'unit.md'), 'utf8'),
      ),
  ),
  SYSTEM_REVIEW_PROMPT: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .optional()
      .default(
        await readFile(
          path.join(path.dirname(fileURLToPath(import.meta.url)), 'prompt-templates', 'system.md'),
          'utf8',
        ),
      ),
  ),
  GITHUB_TOKEN: z.string(),
  OWNER: z.string(),
  REPO: z.string(),
  PR_NUMBER: z.string().transform(Number),
  COMMIT_ID: z.string(),
  PR_BODY: z.string(),
  DIFF_FILE_PATH: z.string(),
})

const env_parse_result = env_schema.safeParse(process.env)
if (!env_parse_result.success) {
  console.error(env_parse_result.error.format())
  process.exit(1)
}

const m = new Anthropic({ apiKey: env_parse_result.data.ANTHROPIC_API_KEY }).messages

const diff_content = await readFile(path.join(process.cwd(), env_parse_result.data.DIFF_FILE_PATH!), 'utf8')
const results: Message[] = []

try {
  results.push(
    await createMessage(m, diff_content, {
      temperature: 0.7,
      system: [
        { type: 'text', text: env_parse_result.data.SYSTEM_REVIEW_PROMPT },
        { type: 'text', text: `# PR本文\n\n${env_parse_result.data.PR_BODY}`, cache_control: { type: 'ephemeral' } },
      ],
    }),
  )
} catch (error) {
  console.error('システムレビューの実行中にエラーが発生しました:', error)
  process.exit(1)
}

const system_review_result = `# システムレビュー結果\n\n${results
  .flatMap((_) => _.content)
  .filter((content) => content.type === 'text')
  .map((content) => content.text)
  .join('\n')}`

for (const dc of splitForFile(diff_content)) {
  try {
    results.push(
      await createMessage(m, dc, {
        temperature: 0.3,
        system: [
          { type: 'text', text: env_parse_result.data.UNIT_REVIEW_PROMPT, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `# PR本文\n\n${env_parse_result.data.PR_BODY}`, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: system_review_result, cache_control: { type: 'ephemeral' } },
        ],
        tool_choice: { type: 'any' },
        tools: [ADD_REVIEW_FOR_FILE, ADD_REVIEW_FOR_SINGLE_LINE, ADD_REVIEW_FOR_MULTI_LINE],
      }),
    )
  } catch (error) {
    console.error('個別ファイルのレビュー中にエラーが発生しました:', error)
    process.exit(1)
  }
}

console.log(JSON.stringify(results, null, 2))

const github_rest = new Octokit({ auth: env_parse_result.data.GITHUB_TOKEN }).rest

const comment_results = await Promise.all(
  results
    .flatMap((_) => _.content)
    .map(async (_) => {
      if (_.type === 'tool_use') {
        const result = _.input as RestEndpointMethodTypes['pulls']['createReviewComment']['parameters']

        const crc_params = {
          ...result,
          owner: env_parse_result.data.OWNER,
          repo: env_parse_result.data.REPO,
          pull_number: env_parse_result.data.PR_NUMBER,
          commit_id: env_parse_result.data.COMMIT_ID,
        }
        if (result.line == null) {
          crc_params.subject_type = 'file'
        }

        try {
          return await github_rest.pulls.createReviewComment(crc_params)
        } catch (e: any) {
          console.error(e)
          return JSON.stringify({
            error_message: e instanceof Error ? e.message : 'Unknown error occurred',
            ...e.request.body,
          })
        }
      }

      return github_rest.issues.createComment({
        body: _.text,
        owner: env_parse_result.data.OWNER,
        repo: env_parse_result.data.REPO,
        issue_number: Number(env_parse_result.data.PR_NUMBER),
      })
    }),
)

const failed_comments = comment_results.filter((_): _ is string => typeof _ === 'string')
if (failed_comments.length !== 0) {
  await github_rest.issues.createComment({
    body: formatErrorReviewsToMarkdown(failed_comments),
    owner: env_parse_result.data.OWNER,
    repo: env_parse_result.data.REPO,
    issue_number: Number(env_parse_result.data.PR_NUMBER),
  })
}

await github_rest.issues.createComment({
  body: '🤖 AIによるコードレビューが完了しました。\n\n個別の指摘事項と総評を確認の上、必要な修正をお願いします。\n個別の指摘事項について、対応不要であればその旨を個別レビューにReplyしてください。',
  owner: env_parse_result.data.OWNER,
  repo: env_parse_result.data.REPO,
  issue_number: Number(env_parse_result.data.PR_NUMBER),
})
