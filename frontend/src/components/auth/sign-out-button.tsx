'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  /**
   * Optional callback URL to redirect to after sign out.
   * Defaults to '/' (home page).
   */
  callbackUrl?: string;
  /**
   * Optional variant for the button.
   * Defaults to 'ghost' for a subtle look.
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /**
   * Optional size for the button.
   * Defaults to 'sm' (small).
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Optional class name to apply to the button.
   */
  className?: string;
  /**
   * Optional text to display on the button.
   * If not provided, only the icon is shown.
   */
  text?: string;
}

/**
 * A reusable sign-out button that handles the sign-out process.
 * It uses NextAuth's `signOut` function and redirects to the specified URL.
 */
export function SignOutButton({
  callbackUrl = '/',
  variant = 'ghost',
  size = 'sm',
  className = '',
  text,
}: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={`flex items-center gap-2 ${className}`}
      aria-label={text ? undefined : 'Sign out'}
    >
      <LogOut className="h-4 w-4" />
      {text && <span>{text}</span>}
    </Button>
  );
}

export default SignOutButton;
