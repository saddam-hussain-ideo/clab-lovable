
import { trackEvent } from './analytics';

/**
 * Standard event categories to ensure consistency
 */
export const EventCategory = {
  ENGAGEMENT: 'engagement',
  PRESALE: 'presale',
  QUIZ: 'quiz',
  USER: 'user',
  CONTENT: 'content',
  NAVIGATION: 'navigation',
  WALLET: 'wallet',
};

/**
 * Track user engagement events
 */
export const trackEngagement = {
  pageView: (pageName: string) => {
    trackEvent('page_view', { 
      page_name: pageName,
      category: EventCategory.NAVIGATION 
    });
  },
  
  buttonClick: (buttonName: string, location: string) => {
    trackEvent('button_click', { 
      button_name: buttonName,
      location,
      category: EventCategory.ENGAGEMENT 
    });
  },
  
  linkClick: (linkText: string, destination: string) => {
    trackEvent('link_click', { 
      link_text: linkText,
      destination,
      category: EventCategory.ENGAGEMENT 
    });
  }
};

/**
 * Track presale-related events
 */
export const trackPresale = {
  view: (stage?: string) => {
    trackEvent('presale_view', { 
      stage,
      category: EventCategory.PRESALE 
    });
  },
  
  purchase: (amount: number, currency: string, tokens?: number) => {
    trackEvent('presale_purchase', { 
      amount,
      currency,
      tokens,
      category: EventCategory.PRESALE 
    });
  },
  
  stageView: (stageName: string) => {
    trackEvent('presale_stage_view', { 
      stage_name: stageName,
      category: EventCategory.PRESALE 
    });
  }
};

/**
 * Track user account events
 */
export const trackUser = {
  signUp: (method: string) => {
    trackEvent('user_sign_up', { 
      method,
      category: EventCategory.USER 
    });
  },
  
  login: (method: string) => {
    trackEvent('user_login', { 
      method,
      category: EventCategory.USER 
    });
  },
  
  profileView: () => {
    trackEvent('profile_view', { 
      category: EventCategory.USER 
    });
  },
  
  profileUpdate: (fields: string[]) => {
    trackEvent('profile_update', { 
      fields,
      category: EventCategory.USER 
    });
  }
};

/**
 * Track quiz-related events
 */
export const trackQuiz = {
  start: (quizId: string, category: string) => {
    trackEvent('quiz_start', { 
      quiz_id: quizId,
      category,
      category_event: EventCategory.QUIZ 
    });
  },
  
  complete: (quizId: string, score: number, totalQuestions: number) => {
    trackEvent('quiz_complete', { 
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      category: EventCategory.QUIZ 
    });
  },
  
  questionAnswer: (quizId: string, questionId: string, isCorrect: boolean) => {
    trackEvent('quiz_question_answer', { 
      quiz_id: quizId,
      question_id: questionId,
      is_correct: isCorrect,
      category: EventCategory.QUIZ 
    });
  }
};

/**
 * Track content engagement
 */
export const trackContent = {
  articleView: (articleId: string, title: string) => {
    trackEvent('article_view', { 
      article_id: articleId,
      title,
      category: EventCategory.CONTENT 
    });
  },
  
  videoWatch: (videoId: string, title: string, duration: number) => {
    trackEvent('video_watch', { 
      video_id: videoId,
      title,
      duration,
      category: EventCategory.CONTENT 
    });
  }
};

/**
 * Track wallet interactions
 */
export const trackWallet = {
  connect: (walletType: string) => {
    trackEvent('wallet_connect', { 
      wallet_type: walletType,
      category: EventCategory.WALLET 
    });
  },
  
  disconnect: (walletType: string) => {
    trackEvent('wallet_disconnect', { 
      wallet_type: walletType,
      category: EventCategory.WALLET 
    });
  }
};
