import LoginPage from '@/components/pages/LoginPage';
import { isValidClerkPublishableKey } from '@/lib/clerk-utils';

const clerkConfigured = isValidClerkPublishableKey(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export default function Page() {
  return <LoginPage clerkConfigured={clerkConfigured} />;
}
