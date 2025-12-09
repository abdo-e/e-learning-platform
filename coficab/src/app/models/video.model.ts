export class Video {
  constructor(
    public title: string = '',
    public filename: string = '',
    public duration: number = 0,
    public _id?: string 
  ) {}
}