// src/types.ts
export interface WorldHistoryQuestion {
  "Leading Sentence": string;
  Questions: string[];
  Answers: string[];
  different_answers?: string[]; // オプショナルに変更 (required にないため)
  Explanation: string;
  Theme: string;
}

// Gemini APIが期待するスキーマ形式 (参考用、直接は使わない場合が多い)
export const questionSchema = {
  type: "object",
  properties: {
    "Leading Sentence": { type: "string" },
    Questions: { type: "array", items: { type: "string" } },
    Answers: { type: "array", items: { type: "string" } },
    different_answers: { type: "array", items: { type: "string" } }, // スキーマ定義には含めておく
    Explanation: { type: "string" }, // タイポ修正
    Theme: { type: "string" },
  },
  required: [
    "Leading Sentence",
    "Questions",
    "Answers",
    "Explanation", // タイポ修正
    "Theme",
  ],
};