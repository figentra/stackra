// Fixture for no-danger-mail.test.ts (STA-2582): a mail body that writes a tenant's HTML raw. Must be reported.
export function WelcomeMail({ note }: { readonly note: string }) {
  return <div dangerouslySetInnerHTML={{ __html: note }} />;
}
