export interface VocabularyItem {
  word: string;
  translation: string;
  example: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: string;
}

export interface LessonContent {
  title: string;
  introduction: string;
  vocabulary: VocabularyItem[];
  story: string;
  quiz: QuizItem[];
}

export enum ViewState {
  HOME = 'HOME',
  LESSON = 'LESSON',
  CHAT = 'CHAT',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
}
