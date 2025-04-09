// src/components/QuestionDisplay.tsx
import React, { useState } from 'react';
import { WorldHistoryQuestion } from '../types';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Chip, Button, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // *** 変更点: アイコン例 ***
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // *** 変更点: アイコン例 ***

interface QuestionDisplayProps {
  questionData: WorldHistoryQuestion;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questionData }) => {
    // *** 変更点: 各設問の解答の開閉状態を管理するStateを追加 ***
  // questionData.Questions の要素数と同じ長さの boolean 配列を生成し、すべて false (初期状態は閉) で初期化
  const [answerOpen, setAnswerOpen] = useState<boolean[]>(() =>
    Array(questionData.Questions.length).fill(false)
  );

  // *** 変更点: 指定されたインデックスの解答の表示状態を切り替える関数 ***
  const toggleAnswer = (index: number) => {
    setAnswerOpen(prevOpenStates =>
      prevOpenStates.map((isOpen, i) => (i === index ? !isOpen : isOpen))
    );
  };
  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Chip label={`テーマ: ${questionData.Theme}`} color="primary" sx={{ mb: 2 }} />

        <Typography variant="h6" gutterBottom>
          リード文
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
          {questionData["Leading Sentence"]}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          設問と解答
        </Typography>
        <List dense>
          {questionData.Questions.map((q, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start"> {/* alignItemsを追加してボタンとの縦位置を調整 */}
                <ListItemText
                  primary={`問${index + 1}: ${q}`}
                  primaryTypographyProps={{ fontWeight: 'medium', mb: 1 }} // *** 変更点: ボタンとの間に少しマージン ***
                  // secondary={`答: ${questionData.Answers[index]}`} // *** 変更点: 解答はCollapse内に移動 ***
                  // secondaryTypographyProps={{ color: 'text.primary', fontWeight: 'bold' }} // *** 変更点: 解答はCollapse内に移動 ***
                />
                 {/* *** 変更点: 解答表示/非表示ボタン *** */}
                 <Button
                    variant="outlined"
                    size="small"
                    onClick={() => toggleAnswer(index)} // クリックで状態切り替え
                    startIcon={answerOpen[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />} // 状態に応じてアイコン変更
                    sx={{ ml: 2, flexShrink: 0 }} // 右側に配置、縮まないように
                >
                    {answerOpen[index] ? '解答を隠す' : '解答を表示'}
                </Button>
              </ListItem>
              <Collapse in={answerOpen[index]} timeout="auto" unmountOnExit>
                <ListItem sx={{ pl: 4 }}> {/* 解答が見やすいようにインデント */}
                    <ListItemText
                        primary={`答: ${questionData.Answers[index]}`}
                        primaryTypographyProps={{ color: 'text.primary', fontWeight: 'bold' }}
                     />
                </ListItem>
                 {/* Optionally display different_answers if available and valid */}
                 {questionData.different_answers && questionData.different_answers[index] && (
                    <ListItem sx={{ pl: 6}}> {/* さらにインデント */}
                        <ListItemText secondary={`(別解/関連: ${questionData.different_answers[index]})`}/>
                    </ListItem>
                 )}
              </Collapse>
              {index < questionData.Questions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          解説
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {questionData.Explanation}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default QuestionDisplay;