export interface Email {
  emailId?: string;
  to: string;
  message?: {
    subject: string;
    text?: string;
    html?: string;
  };
  template?: {
    name: string;
    data: {};
  };
  status?: string;
  time?: string;
}
