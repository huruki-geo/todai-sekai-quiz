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
  あなたは東京大学の入学試験における世界史の問題作成に精通した専門家です。

以下のJSONスキーマに厳密に従って、東大世界史の入試問題で出題されるような、特定の歴史的テーマに基づいた一問一答形式の問題セットを生成してください。

【生成する問題セットの要件】
1.  **リード文 (Leading Sentence):** 問題セット全体の導入となる、特定の歴史的テーマを示す短い文章。このテーマはあなた自身が歴史的に重要だと考えるものを選んでください。
2.  **設問 (Questions):**
    *   リード文のテーマに関連する、複数の独立した小問のリスト（配列形式）。設問数は必ず10問にしてください
    *   各小問は、特定の**固有名詞（人名、地名、事件名、制度名、会議名、条約名、著作名、宗教名、組織名など）**を答えさせる形式にしてください。
    *   設問は、リード文のテーマに沿って、**様々な時代・地域にわたる**内容を含めてください。時代や地域が偏らないように注意してください。
3.  **解答 (Answers):**
    *   各設問に対応する**簡潔な固有名詞**のリスト（配列形式）。
    *   設問 (Questions) と同じ数、同じ順序で解答を生成してください。括弧書きでの補足は最小限にしてください。
4.  **解説 (Explanation):** リード文のテーマ設定の意図、各設問の歴史的背景、解答の根拠、関連情報などを詳しく説明する文章。東大受験生が学習する上で役立つような、深く掘り下げた質の高い解説にしてください。
5.  **テーマ (Theme):** あなたがこの問題セットで設定した主要な歴史的テーマを具体的に記述してください。（例: 民族移動と国家形成、宗教改革とその影響、技術革新と社会変動、帝国主義の展開、国際秩序の変遷、文化交流と衝突など）

【難易度と質】
*   内容はアカデミックで、東京大学の入試レベルにふさわしい難易度と質を保ってください。単なる事実確認だけでなく、歴史的な文脈や意義を理解しているかを問うような設問も含めてください。

【出力形式】
*   以下のJSONスキーマに厳密に従って出力してください。
*   different_answers フィールドは任意です。もし生成する場合は、誤答選択肢や関連キーワードなどを設問と同じ数だけ配列で生成してください。生成が難しい場合は省略するか、空配列 [] としてください。
${JSON.stringify(questionSchema, null, 2)}
【生成する問題の参考例】
以下は、「民衆」をテーマとした東大世界史の問題例です。これと同様の形式、構成、難易度で、あなた自身が選んだ別の歴史的テーマに基づいて問題セットを生成してください。
--- 参考例ここから ---
(リード文例) 民衆の支持は、世界史上のあらゆる政治権力にとって、その正当性の重要な要素であった。また、民衆による政治・社会・宗教運動は、様々な地域・時代における歴史変化の決定的な要因ともなった。世界史における民衆に関連する以下の設問(1)〜(10)に答えなさい。
(設問リスト例)
古代ギリシアの都市国家における民主政は、成年男性市民全員が直接国政に参加する政体であり、アテネにおいて典型的に現れた。紀元前508年、旧来の4部族制を廃止して新たに10部族制を定め、アテネ民主政の基礎を築いた政治家の名前を記しなさい。
秦の圧政に対して蜂起し、「王侯将相いずくんぞ種あらんや」ということばを唱えて農民反乱を主導した人物の名前を記しなさい。
古代ローマの都市に住む民衆にとって最大の娯楽は、皇帝や有力政治家が催す見世物であった。紀元後80年に完成し、剣闘士競技などが行われた都市ローマ最大の競技施設の名称を記しなさい。
ドイツに始まった宗教改革は、領主に対する農民蜂起に結びつく場合もあった。農奴制の廃止を要求して1524年に始まったドイツ農民戦争を指導し、処刑された宗教改革者の名前を記しなさい。
インドでは15世紀以降、イスラーム教の影響を受け、神の前での平等を説く民衆宗教が勃興した。その中で、パンジャーブ地方に王国を建ててイギリス東インド会社と戦った教団が奉じた、ナーナクを祖とする宗教の名称を記しなさい。
植民地化が進むインドで1857年に起こり、またたく間に北インドのほぼ全域に広がった大反乱は、旧支配層から民衆に至る幅広い社会階層が参加するものであった。この反乱のきっかけを作り、その主な担い手ともなったインド人傭兵の名称を記しなさい。
プロイセン=フランス戦争(普仏戦争)に敗れたフランス政府は1871年1月に降伏した。その後結ぼれた仮講和条約に反対し、同年3月、世界史上初めて労働者などの民衆が中心となって作った革命的自治政府の名称を記しなさい。
孫文が死去した年に上海で起こった労働争議は、やがて労働者や学生を中心とする、不平等条約の撤廃などを求める反帝国主義運動へと発展した。この運動の名称を記しなさい。
インドシナにおいてベトナム青年革命同志会を結成して農民運動を指導し、フランス植民地支配に対する抵抗運動の中心となった人物の名前を記しなさい。
1989年に中国では学生や市民による民主化要求運動が起こったが、それはソ連のゴルバチョフが中国を訪問していた時期とも重なっていた。そのゴルバチョフが国内改革のために掲げた、「立て直し」を意味するロシア語のスローガンの名称を記しなさい。
(解答リスト例)
クレイステネス
陳勝
コロッセウム (円形闘技場)
トマス＝ミュンツァー
シク教
シパーヒー (セポイ)
パリ＝コミューン
五・三〇運動
ホー＝チ＝ミン (阮愛国)
ペレストロイカ
(テーマ例) 民衆と政治・社会運動
--- 参考例ここまで ---
上記の例を参考に、あなた自身が選んだ新しいテーマで、同様の形式とレベルの問題セットを生成してください。
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