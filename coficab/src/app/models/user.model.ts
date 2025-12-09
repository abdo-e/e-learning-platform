export class User {
    constructor(
      public name: string = '',
      public email: string = '', 
      public password: string = '', 
      public doneCourses: string[] = [], 
      public _id: string | null = null, 
      public role: string = 'user'
    ) {}
  }
  