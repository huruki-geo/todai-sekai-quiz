// functions/api/generate.ts
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold, GenerateContentRequest } from "@google/generative-ai";

// フロントエンドと同じ型定義を使う場合 (パスはプロジェクト構造に合わせて調整)
// import type { WorldHistoryQuestion } from '../../src/types';

// スキーマ定義 (Functions内でも必要)
const questionSchema = {
  type: "object",
  properties: {
    "Leading Sentence": { type: "string" },
    Questions: { type: "array", items: { type: "string" } },
    Answers: { type: "array", items: { type: "string" } },
    different_answers: { type: "array", items: { type: "string" } },
    Explanation: { type: "string" },
    Theme: { type: "string" },
  },
  required: [
    "Leading Sentence",
    "Questions",
    "Answers",
    "Explanation",
    "Theme",
  ],
};

// Cloudflare Pages Functions の環境変数などの型定義
// 正式な型が必要な場合は `npm install -D @cloudflare/workers-types` してインポート
interface Env {
    GEMINI_API_KEY: string; // Cloudflareダッシュボードで設定する変数名
}

// POSTリクエストを処理するハンドラー関数
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env, waitUntil } = context;

    // 環境変数からAPIキーを取得
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY environment variable not set.");
        return new Response(JSON.stringify({ error: "API key not configured on server." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: questionSchema,
            } as GenerationConfig,
        });

        // プロンプト (ここにあるため、フロントから送る必要はない)
        const prompt = `
   あなたは世界史の専門家です。以下のJSONスキーマに従って、東京大学の入学試験で出題されるようなレベルの世界史の一問一答問題を1セット生成してください。
スキーマ:
${JSON.stringify(questionSchema, null, 2)}
生成する内容:
リード文 (Leading Sentence): 問題の前提となる短い文章。
設問 (Questions): リード文に関連する具体的な問い（複数）。
解答 (Answers): 各設問に対応する正答（複数）。設問と同じ数だけ生成してください。
異なる解答の候補 (different_answers): 誤答や関連する別のキーワードなど（任意）。設問と同じ数だけ生成してください。もし生成が難しければ空配列でも構いません。
解説 (Explanation): 問題全体や各設問の背景、解答の根拠などを詳しく説明する文章。
テーマ (Theme): この問題セットが扱っている主要な歴史的テーマや時代、地域など。
注意点:
設問と解答の数は必ず一致させてください。
内容はアカデミックで、東大の入試レベルにふさわしい難易度と質を保ってください。
リード文、設問、解答、解説、テーマは必ず生成してください。
JSON形式で、指定されたスキーマに厳密に従って出力してください。
`;
console.log("Function: Sending request to Gemini API...");
    const geminiRequest: GenerateContentRequest = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    const result = await model.generateContent(geminiRequest);
    const response = result.response;
    console.log("Function: Received response from Gemini API.");

    // Gemini APIからのレスポンス検証
     if (!response || !response.text) {
        let errorMsg = "Invalid or empty response from Gemini API.";
        if (response?.promptFeedback?.blockReason) {
            errorMsg = `API call blocked due to ${response.promptFeedback.blockReason}. Details: ${response.promptFeedback.blockReasonMessage}`;
            console.error("Function:", errorMsg);
            return new Response(JSON.stringify({ error: `API call blocked. Check server logs.` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
        }
        if(response?.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             errorMsg = `Generation finished unexpectedly. Reason: ${response.candidates[0].finishReason}. Details: ${response.candidates[0].finishMessage}`;
             console.error("Function:", errorMsg);
             return new Response(JSON.stringify({ error: `Generation failed. Check server logs.` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
        }
        console.error("Function:", errorMsg);
        return new Response(JSON.stringify({ error: errorMsg }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const jsonText = response.text();
    console.log("Function: Raw JSON text from Gemini:", jsonText.substring(0, 100) + "..."); // 長い場合は一部のみログ出力

    // JSONパース可能か軽くチェック (クライアント側で詳細な検証を行うため)
    try {
        JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Function: Failed to parse JSON response from Gemini:", parseError);
        console.error("Function: Invalid JSON string received:", jsonText);
        return new Response(JSON.stringify({ error: "Gemini API returned invalid JSON." }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    console.log("Function: Returning successful response to client.");
    // GeminiからのJSON文字列をそのままクライアントに返す
    return new Response(jsonText, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

} catch (error: any) {
    console.error("Function: Error during Gemini API call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown server error occurred.";
    return new Response(JSON.stringify({ error: `Server error: ${errorMessage}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
}
};