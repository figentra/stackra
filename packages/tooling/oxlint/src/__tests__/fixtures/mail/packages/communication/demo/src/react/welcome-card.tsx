// Fixture for no-danger-mail.test.ts (STA-2582): the same markup outside a mail body, which the mail rule leaves alone.
export function WelcomeCard({ note }: { readonly note: string }) {
  return <div dangerouslySetInnerHTML={{ __html: note }} />;
}
