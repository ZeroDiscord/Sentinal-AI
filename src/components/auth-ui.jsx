import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { getAuth, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, Mail } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.48a4.68 4.68 0 0 1-2.03 3.07v2.55h3.28c1.92-1.77 3.03-4.38 3.03-7.41z"/>
    <path d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.28-2.55c-.91.61-2.07.97-3.35.97-2.57 0-4.75-1.74-5.53-4.07H1.09v2.56A10 10 0 0 0 10 20z"/>
    <path d="M4.47 12.91A5.99 5.99 0 0 1 4 10c0-.99.18-1.95.47-2.91V4.53H1.09A10 10 0 0 0 0 10c0 1.64.39 3.19 1.09 4.53l3.38-2.56z"/>
    <path d="M10 4.04c1.47 0 2.78.51 3.81 1.51l2.85-2.85C14.97 1.09 12.7 0 10 0A10 10 0 0 0 1.09 4.53l3.38 2.56C5.25 5.78 7.43 4.04 10 4.04z"/>
  </svg>
);

const MaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 50 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 25 2 C 15.058594 2 7 4.6875 7 8 C 7 8 7 16.082031 7 25 C 7 30.082031 12.417969 44.082031 25 47 C 37.582031 44.082031 43 30.082031 43 25 C 43 16.082031 43 8 43 8 C 43 4.6875 34.941406 2 25 2 Z M 17 11 C 20.4375 11 22.195313 14.074219 22.5625 14.4375 C 23.148438 15.023438 23.148438 15.976563 22.5625 16.558594 C 21.976563 17.144531 21.023438 17.144531 20.441406 16.558594 C 20.027344 16.148438 18.6875 13 16 13 C 14.613281 13 12.953125 13.640625 11 15 C 12.855469 11.878906 15.003906 11 17 11 Z M 20 18.5 C 19.082031 19.40625 17.640625 20 16 20 C 14.359375 20 12.917969 19.40625 12 18.5 C 12.917969 17.59375 14.359375 17 16 17 C 17.640625 17 19.082031 17.59375 20 18.5 Z M 27 43 L 25 45 L 23 43 L 23 38 L 27 38 Z M 34 34 L 27 34 L 25 32 L 23 34 L 16 34 L 11 26 L 17 31 L 21 31 L 24 28 L 26 28 L 29 31 L 33 31 L 39 26 Z M 30 18.5 C 30.917969 17.59375 32.359375 17 34 17 C 35.640625 17 37.082031 17.59375 38 18.5 C 37.082031 19.40625 35.640625 20 34 20 C 32.359375 20 30.917969 19.40625 30 18.5 Z M 34 13 C 31.3125 13 29.972656 16.148438 29.5625 16.5625 C 28.976563 17.148438 28.023438 17.148438 27.441406 16.5625 C 26.855469 15.976563 26.855469 15.023438 27.441406 14.441406 C 27.804688 14.074219 29.5625 11 33 11 C 34.996094 11 37.144531 11.878906 39 15 C 37.046875 13.640625 35.386719 13 34 13 Z"/>
  </svg>
);

export default function AuthUI({ variant = "header" }) {
  const { user, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [anonError, setAnonError] = useState(null);
  const [anonLoading, setAnonLoading] = useState(false);
  const router = useRouter();

  const inputClass =
    "input input-bordered w-full rounded-md px-3 py-2 bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none";

  const handleAnonSignIn = async () => {
    setAnonError(null);
    setAnonLoading(true);
    try {
      await firebaseSignInAnonymously(getAuth());
    } catch (err) {
      setAnonError(err.message);
    } finally {
      setAnonLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4" />
      <span className="text-muted-foreground">Loading authentication...</span>
    </div>
  );

  // HEADER VARIANT: Compact user menu or sign in button
  if (variant === "header") {
    if (user) {
      const isAnonymous = user.isAnonymous;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="flex items-center gap-2 cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{isAnonymous ? <MaskIcon /> : (user.email?.[0]?.toUpperCase() || '?')}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm text-foreground/80">
                {isAnonymous
                  ? 'Anonymous'
                  : (
                      user.displayName
                        ? user.displayName.split(' ')[0]
                        : (user.email
                            ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
                            : 'User'
                          )
                    )
                }
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    // Not signed in: just show a sign in button that routes to /
    return (
      <Button variant="default" className="w-full" onClick={() => router.push("/")}>Sign In</Button>
    );
  }

  // CARD VARIANT: Full form, all options, polished for theme
  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <Button
        onClick={handleAnonSignIn}
        variant="default"
        className="w-full flex items-center justify-center gap-2 text-white bg-neutral-900 shadow-[0_0_12px_0_rgba(80,200,255,0.25)] ring-1 ring-cyan-400/30 hover:bg-neutral-800 transition"
        disabled={anonLoading}
      >
        <MaskIcon />
        <span className="ml-2">{anonLoading ? "Signing in..." : "Anonymous access"}</span>
      </Button>
      {anonError && <div className="text-destructive text-center">{anonError}</div>}
      <form
        onSubmit={e => {
          e.preventDefault();
          isSignUp ? signUpWithEmail(email, password) : signInWithEmail(email, password);
        }}
        className="flex flex-col gap-3 w-full"
        style={{ alignItems: 'center' }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={inputClass}
          required
        />
        <Button type="submit" className="w-full flex items-center justify-center gap-2 text-white">
          <Mail className="w-5 h-5" />
          <span className="ml-2">{isSignUp ? 'Sign Up' : 'Sign In'}</span>
        </Button>
      </form>
      <div className="flex items-center w-full my-2">
        <div className="flex-grow border-t border-muted"></div>
        <span className="mx-3 text-muted-foreground text-xs font-medium">OR</span>
        <div className="flex-grow border-t border-muted"></div>
      </div>
      <Button
        onClick={signInWithGoogle}
        variant="default"
        className="w-full flex items-center justify-center gap-2 text-white"
      >
        <span className="flex items-center"><GoogleIcon /><span className="ml-2">Sign in with Google</span></span>
      </Button>
      <button className="text-xs underline" onClick={() => setIsSignUp(s => !s)}>
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </button>
      {error && <div className="text-destructive text-center">{error}</div>}
    </div>
  );
} 