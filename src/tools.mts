import { Tool } from '@anthropic-ai/sdk/resources'
import { FILE_COMMENT_SCHEMA, MULTI_LINE_COMMENT_SCHEMA, SINGLE_LINE_COMMENT_SCHEMA } from './response-schemas.mts'

export const ADD_REVIEW_FOR_FILE: Tool = {
  name: 'add_review_for_file',
  description: 'GitHubのPRに特定のファイルを指定してレビューを追加します。',
  input_schema: {
    type: 'object',
    properties: FILE_COMMENT_SCHEMA.shape,
    required: Object.keys(FILE_COMMENT_SCHEMA.shape),
  },
}

export const ADD_REVIEW_FOR_SINGLE_LINE: Tool = {
  name: 'add_review_for_single_line',
  description: 'GitHubのPRに特定の1行を指定してレビューを追加します。',
  input_schema: {
    type: 'object',
    properties: SINGLE_LINE_COMMENT_SCHEMA.shape,
    required: Object.keys(SINGLE_LINE_COMMENT_SCHEMA.shape),
  },
}

export const ADD_REVIEW_FOR_MULTI_LINE: Tool = {
  name: 'add_review_for_multi_line',
  description: 'GitHubのPRに行範囲を指定してレビューを追加します。',
  input_schema: {
    type: 'object',
    properties: MULTI_LINE_COMMENT_SCHEMA.shape,
    required: Object.keys(MULTI_LINE_COMMENT_SCHEMA.shape),
  },
}
