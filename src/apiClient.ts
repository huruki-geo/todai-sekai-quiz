// src/apiClient.ts (新しいファイルとして作成推奨)
import { WorldHistoryQuestion } from './types';

/**
 * バックエンドAPI (/api/generate) を呼び出して世界史の問題を取得します。
 */
export async function generateTodaiQuestionViaApi(): Promise<WorldHistoryQuestion> {
    console.log("Frontend: Sending request to backend API (/api/generate)...");
    try {
        const response = await fetch('/api/generate', { // Cloudflare Functionsのエンドポイント
            method: 'POST', // functions/api/generate.ts で onRequestPost を定義したため
            headers: {
                'Accept': 'application/json',
                // Content-Type は body がなければ不要な場合もあるが、明示しても良い
                // 'Content-Type': 'application/json',
            },
            // 今回はFunctions側でプロンプトを固定しているのでボディは不要
            // body: JSON.stringify({ some_param: 'value' }), // もし何かパラメータを送る場合
        });

        console.log("Frontend: Received response from backend. Status:", response.status);

        // エラーレスポンスの処理
        if (!response.ok) {
            let errorMsg = `API request failed with status ${response.status}`;
            try {
                // エラーレスポンスのボディ(JSON形式を期待)を読み取る
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMsg = errorData.error; // バックエンドからのエラーメッセージを使用
                }
            } catch (e) {
                console.warn("Frontend: Could not parse error response body as JSON.", e);
                // JSONパースに失敗した場合はステータスコードに基づくメッセージを使う
            }
            console.error("Frontend: API Error -", errorMsg);
            throw new Error(errorMsg); // エラーをスローしてUIに表示させる
        }

        // 成功レスポンスの処理
        const data: WorldHistoryQuestion = await response.json();
        console.log("Frontend: Successfully parsed question data from backend:", data);

        // フロントエンド側でも受信データの基本的な検証を行う (任意だが推奨)
         const requiredKeys: (keyof WorldHistoryQuestion)[] = ["Leading Sentence", "Questions", "Answers", "Explanation", "Theme"];
         let missingKeys = requiredKeys.filter(key => !(key in data) || data[key] === null || data[key] === undefined);
         if (missingKeys.length > 0) {
             const errorDetail = `Invalid data structure received from backend. Missing or invalid keys: ${missingKeys.join(', ')}`;
             console.error("Frontend:", errorDetail);
             console.error("Frontend: Received data:", data);
             throw new Error(errorDetail);
         }
         if (!Array.isArray(data.Questions) || !Array.isArray(data.Answers)) {
             const errorDetail = "Invalid data structure from backend: Questions or Answers must be arrays.";
              console.error("Frontend:", errorDetail);
              console.error("Frontend: Received data:", data);
             throw new Error(errorDetail);
         }

        return data;

    } catch (error) {
        // fetch自体(ネットワークエラーなど)や上記の処理中のエラーをキャッチ
        console.error("Frontend: Error fetching question from backend API:", error);
         // App.tsx で処理できるようにエラーを再スロー
        throw error;
    }
}