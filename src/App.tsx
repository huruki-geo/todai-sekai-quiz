import { useState } from 'react';
import { Container, Button, CircularProgress, Alert, Box, CssBaseline, AppBar ,Typography,Toolbar ,Radio, RadioGroup, FormControlLabel, FormControl, FormLabel} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestionDisplay from './components/QuestionDisplay';
// import { generateTodaiQuestion } from './geminiClient'; // 古いインポートを削除 or コメントアウト
import { generateTodaiQuestionViaApi } from './apiClient'; // 新しいAPIクライアント関数をインポート
import { WorldHistoryQuestion } from './types';
// シンプルなテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#800000', // 東大のスクールカラー（近似色）
    },
    secondary: {
      main: '#f4d03f', // 銀杏の黄色（近似色）
    },
  },
});
const AVAILABLE_MODELS = {
  FLASH: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
};
function App() {
  const [question, setQuestion] = useState<WorldHistoryQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS.FLASH);

  // *** 変更点: モデル選択ラジオボタンの変更ハンドラ ***
  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedModel((event.target as HTMLInputElement).value);
  };

  const handleGenerateClick = async () => {
    setLoading(true);
    setError(null);
    setQuestion(null);
    try {
      // 呼び出す関数を差し替え
      console.log(`App: Requesting generation with model: ${selectedModel}`); // *** 変更点: ログ追加 ***
      // *** 変更点: API呼び出し時に選択されたモデル名を渡す ***
      const generatedQuestion = await generateTodaiQuestionViaApi(selectedModel);
      setQuestion(generatedQuestion);
    } catch (err: any) {
       console.error("App: Error caught from generateTodaiQuestionViaApi:", err);
       // apiClientからスローされたErrorオブジェクトのメッセージを取得
       const errorMessage = err instanceof Error ? err.message : "問題の取得中に予期せぬエラーが発生しました。";
      // エラーメッセージに具体的な原因が含まれていることを期待
      setError(`問題を取得できませんでした: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
      <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="static">
          <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            世界史 一問一答ジェネレーター (Gemini API)
          </Typography>
        </Toolbar>
          </AppBar>
          <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
            新しい問題を生成する
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            下のボタンをクリックすると、Gemini APIを使用して世界史一問一答問題が自動生成されます。
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">使用モデル</FormLabel>
            <RadioGroup
              row
              aria-label="gemini-model"
              name="model-selection"
              value={selectedModel}
              onChange={handleModelChange}
            >
              <FormControlLabel value={AVAILABLE_MODELS.FLASH} control={<Radio />} label="Gemini 1.5 Flash (高速)" />
              <FormControlLabel value={AVAILABLE_MODELS.PRO} control={<Radio />} label="Gemini 1.5 Pro (高品質)" />
            </RadioGroup>
          </FormControl>
                   <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleGenerateClick} // ここで上記の関数が呼ばれる
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {loading ? '生成中...' : '問題生成'}
                    </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {question && !loading && !error && (
                <QuestionDisplay questionData={question} />
              )}
          </Container>
           <Box sx={{ textAlign: 'center', p: 2, mt: 'auto', backgroundColor: 'grey.200' }}>
              {/* ... Footer ... */}
           </Box>
      </ThemeProvider>
  );
}

export default App;