export interface Note {
  id: string;
  title: string;
  content: string;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
} 