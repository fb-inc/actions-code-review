import { z } from "zod";

const SideEnum = z.enum(["RIGHT", "LEFT"]);

// 共通のベーススキーマを定義
const BaseCommentSchema = z.object({
  path: z.string().describe(
    "The relative path to the file that necessitates a comment."
  ),
  body: z.string().describe(
    "Detailed Japanese comments on feedback in Markdown format."
  ),
});

// 各スキーマを共通スキーマを継承して定義
export const FileCommentSchema = BaseCommentSchema.extend({
  subject_type: z.enum(['file'])
});

// 行に関する共通スキーマ
export const SingleLineCommentSchema = BaseCommentSchema.extend({
  line: z.number().describe(
    "The line of the blob in the pull request diff that the comment applies to. For a multi-line comment, the last line of the range that your comment applies to."
  ),
  side: SideEnum.describe(
    "In a split diff view, the side of the diff that the pull request's changes appear on. Can be LEFT or RIGHT."
  ),
});

export const MultiLineCommentSchema = SingleLineCommentSchema.extend({
  start_line: z.number().describe(
    "The start_line is the first line in the pull request diff that your multi-line comment applies to."
  ),
  start_side: SideEnum.describe(
    "Required when using multi-line. The start_line is the first line in the pull request diff that your multi-line comment applies to. Can be LEFT or RIGHT."
  ),
});