// src/geminiClient.ts
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold, GenerateContentRequest } from "@google/generative-ai";
import { WorldHistoryQuestion, questionSchema } from './types'; // 型定義をインポート

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY is not defined. Please set it in your .env file.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // または gemini-1.5-pro など
    // Structured Output を有効にする場合、 safetySettings や generationConfig を調整することが推奨される
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    generationConfig: {
        // Structured Output を使う場合は temperature を低めに設定すると安定しやすい
        // temperature: 0.2,
        // topP: 0.9,
        // topK: 40,
        responseMimeType: "application/json", // JSON出力を指定
        responseSchema: questionSchema,       // スキーマを指定
    } as GenerationConfig, // 型アサーションが必要な場合がある
});


export async function generateTodaiQuestion(): Promise<WorldHistoryQuestion> {
  const prompt = `
あなたは世界史の専門家です。以下のJSONスキーマに従って、東京大学の入学試験で出題されるようなレベルの世界史の一問一答問題を1セット生成してください。

スキーマ:
${JSON.stringify(questionSchema, null, 2)}

生成する内容:
1.  リード文 (Leading Sentence): 問題の前提となる短い文章。
2.  設問 (Questions): リード文に関連する具体的な問い（複数）。
3.  解答 (Answers): 各設問に対応する正答（複数）。設問と同じ数だけ生成してください。
4.  異なる解答の候補 (different_answers): 誤答や関連する別のキーワードなど（任意）。設問と同じ数だけ生成してください。もし生成が難しければ空配列でも構いません。
5.  解説 (Explanation): 問題全体や各設問の背景、解答の根拠などを詳しく説明する文章。
6.  テーマ (Theme): この問題セットが扱っている主要な歴史的テーマや時代、地域など。

注意点:
*   設問と解答の数は必ず一致させてください。
*   内容はアカデミックで、東大の入試レベルにふさわしい難易度と質を保ってください。
*   リード文、設問、解答、解説、テーマは必ず生成してください。
*   JSON形式で、指定されたスキーマに厳密に従って出力してください。
`;

  try {
    console.log("Sending request to Gemini API...");
    const request: GenerateContentRequest = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    const result = await model.generateContent(request);
    const response = result.response;

    console.log("Received response from Gemini API:", response);

    if (!response || !response.text) {
        // レスポンスがない、またはテキスト部分がない場合
        if (response?.promptFeedback?.blockReason) {
            console.error("API call blocked:", response.promptFeedback.blockReason);
            console.error("Block reason details:", response.promptFeedback.blockReasonMessage);
            throw new Error(`API call blocked due to ${response.promptFeedback.blockReason}.`);
        }
         if(response?.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            console.error("Generation finished unexpectedly:", response.candidates[0].finishReason);
            console.error("Finish reason details:", response.candidates[0].finishMessage);
             throw new Error(`Generation failed. Reason: ${response.candidates[0].finishReason}`);
        }
        throw new Error("Invalid response from Gemini API.");
    }

    const jsonText = response.text();
    console.log("Raw JSON text:", jsonText);

    // JSONパースを試みる
    let parsedData: WorldHistoryQuestion;
    try {
        parsedData = JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error("Invalid JSON string:", jsonText);
        // パースエラーの場合、元のテキストをエラーメッセージに含める
        throw new Error(`Failed to parse response from Gemini API. Raw response: ${jsonText}`);
    }

    // スキーマの必須フィールドを検証 (より厳密に)
    const requiredKeys: (keyof WorldHistoryQuestion)[] = ["Leading Sentence", "Questions", "Answers", "Explanation", "Theme"];
    for (const key of requiredKeys) {
        if (!(key in parsedData) || parsedData[key] === undefined || parsedData[key] === null) {
             console.error(`Missing or invalid required field: ${key}`);
             console.error("Parsed Data:", parsedData);
             throw new Error(`Invalid data structure: Missing or invalid required field "${key}".`);
        }
    }
    // 配列の検証
     if (!Array.isArray(parsedData.Questions) || !Array.isArray(parsedData.Answers)) {
         console.error("Invalid data structure: Questions or Answers are not arrays.");
         console.error("Parsed Data:", parsedData);
         throw new Error("Invalid data structure: Questions or Answers must be arrays.");
     }
     if (parsedData.Questions.length !== parsedData.Answers.length) {
         console.warn("Warning: Number of questions and answers do not match.", parsedData);
         // throw new Error("Number of questions and answers must match."); // 必要に応じてエラーにする
     }


    // different_answers が存在する場合、配列であること、要素数が Questions と一致することを期待するが、必須ではない
    if (parsedData.different_answers && !Array.isArray(parsedData.different_answers)) {
        console.warn("Warning: 'different_answers' is present but not an array. Ignoring.", parsedData);
        delete parsedData.different_answers; // 不正な場合は削除するなどの処理
    }
    // else if (parsedData.different_answers && parsedData.different_answers.length !== parsedData.Questions.length) {
    //     console.warn("Warning: Number of questions and different_answers do not match.", parsedData);
    // }


    console.log("Successfully parsed question data:", parsedData);
    return parsedData;

  } catch (error) {
    console.error("Error generating question:", error);
    // エラーオブジェクトの内容をより詳細に出力
    if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    }
    // キャッチしたエラーをそのまま再スローするか、カスタムエラーをスローする
    throw error; // または throw new Error("Failed to generate question from API.");
  }
}