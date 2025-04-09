// src/components/QuestionDisplay.tsx
import React from 'react';
import { WorldHistoryQuestion } from '../types';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Divider, Chip} from '@mui/material';

interface QuestionDisplayProps {
  questionData: WorldHistoryQuestion;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questionData }) => {
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
              <ListItem>
                <ListItemText
                  primary={`問${index + 1}: ${q}`}
                  secondary={`答: ${questionData.Answers[index]}`}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                  secondaryTypographyProps={{ color: 'text.primary', fontWeight: 'bold' }}
                />
              </ListItem>
              {/* Optionally display different_answers if available and valid */}
              {questionData.different_answers && questionData.different_answers[index] && (
                 <ListItem sx={{ pl: 4}}>
                    <ListItemText secondary={`(別解/関連: ${questionData.different_answers[index]})`}/>
                 </ListItem>
              )}
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