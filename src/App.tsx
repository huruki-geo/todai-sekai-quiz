import { useState } from 'react';
import { Container, Button, CircularProgress, Alert, Box, CssBaseline, AppBar } from '@mui/material';
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

function App() {
  const [question, setQuestion] = useState<WorldHistoryQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = async () => {
    setLoading(true);
    setError(null);
    setQuestion(null);
    try {
      // 呼び出す関数を差し替え
      const generatedQuestion = await generateTodaiQuestionViaApi();
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
              {/* ... Toolbar ... */}
          </AppBar>
          <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                  {/* ... Typography, Button ... */}
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