export class Course {
  constructor(
    public title: string = '',
    public description: string = '',
    public category: string = '',
    public difficulty: string = '', 
    public videos: string[] = [], 
    public quiz: QuizQuestion[] = [], 
    public createdAt: Date = new Date(), 
    public _id?: string
  ) {}
}

export interface QuizQuestion {
  question: string;
  options: { text: string; correct: boolean }[];
}