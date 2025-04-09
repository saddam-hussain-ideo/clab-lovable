
export type QuizCategory =
  | 'satoshi'
  | 'bitcoin_history'
  | 'ethereum_history'
  | 'altcoins'
  | 'defi'
  | 'web3'
  | 'crypto_news'
  | 'crypto_personalities'
  | 'degenerates';

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correct_option: number;
  category: QuizCategory;
}

export interface QuizAttempt {
  id: number;
  user_id: string;
  score: number;
  questions_answered: number;
  correct_answers: number;
  perfect_rounds: number;
  completed_at: string;
}

