import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';
import { MESSAGE_TEMPLATE, SYSTEM_PROMPT } from './prompt.js';
import * as path from 'path';
import { readFile } from 'fs/promises';

type ReviewResult = {
  path: string
  line?: number
  side?: 'RIGHT' | 'LEFT' | undefined
  start_line?: number
  start_side?: 'RIGHT' | 'LEFT' | undefined
  body: string
  subject_type?: 'file'
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function review() {

  const filePath = path.join(process.cwd(), process.env.DIFF_FILE_PATH!);
  const content = await readFile(filePath, 'utf8');

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    temperature: 0,
    system: SYSTEM_PROMPT,
    tools: [{
      name: 'add_review',
      description: 'githubのPRにレビューを追加します。',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The relative path to the file that necessitates a comment.'
          },
          line: {
            type: 'number',
            description: 'The line of the blob in the pull request diff that the comment applies to. For a multi-line comment, the last line of the range that your comment applies to.',
          },
          side: {
            type: 'string',
            enum: ['RIGHT', 'LEFT'],
            description: 'In a split diff view, the side of the diff that the pull request\'s changes appear on. Can be LEFT or RIGHT.'
          },
          start_line: {
            type: 'number',
            description: 'The start_line is the first line in the pull request diff that your multi-line comment applies to. '
          },
          start_side: {
            type: 'string',
            enum: ['RIGHT', 'LEFT'],
            description: 'Required when using multi-line. The start_line is the first line in the pull request diff that your multi-line comment applies to. Can be LEFT or RIGHT.'
          },
          body: {
            type: 'string',
            description: 'Detailed Japanese comments on feedback in Markdown format.'
          },
        }
      }
    }],
    messages: [
      {
        'role': 'user',
        'content': `${MESSAGE_TEMPLATE}${content}`
      },
    ],
    tool_choice: {type: "tool", name: "add_review"}
  })

  msg.content.forEach((con) => console.log(con))

  const reviews = msg.content.filter((con) => con.type === 'tool_use').map((review) => review.input) as ReviewResult[]

  const commentPromises = reviews.map((review) => {
      const params = {
        ...review,
        owner: process.env.OWNER as string,
        repo: process.env.REPO as string,
        pull_number: Number(process.env.PULL_NUMBER),
        commit_id: process.env.COMMIT_ID as string,
      }

      if(review.line == null) {
        params.subject_type = 'file'
      }

      const oct_promise = octokit.rest.pulls.createReviewComment(params);

      return oct_promise
  })

    const results = await Promise.all(commentPromises);
  
    // エラーチェック
    const failedComments = results.filter(result => result.status !== 201);
    if (failedComments.length > 0) {
      console.error(`Failed to create ${failedComments.length} review comments:`);
      failedComments.forEach(result => {
        console.error(`Status: ${result.status}`);
      });
    }
}

review().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
