
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, CheckCircle, AlertCircle, LogIn, UserPlus, Eye, EyeOff, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/components/providers';
import ForgotPasswordDialog from '@/components/forgot-password-dialog';

interface AuthFormsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Simple, reliable input that prevents autofill issues
const AntiAutofillInput = ({ value, onChange, placeholder, icon: Icon, onEnter }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: any;
  onEnter?: () => void;
}) => {
  // Use static field name to avoid hydration mismatch
  const fieldName = 'anti-autofill-field';
  
  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        className="pl-10"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        name={fieldName}
        id={fieldName}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        role="presentation"
        tabIndex={0}
      />
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />}
    </div>
  );
};

// Simple, reliable password input that works on all devices
const PasswordInput = ({ value, onChange, placeholder, onEnter }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onEnter?: () => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder={placeholder}
        className="pr-10"
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default function AuthForms({ isOpen, onClose, onSuccess }: AuthFormsProps) {
  // Simple state management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'username' | 'login' | 'register'>('username');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameExists, setUsernameExists] = useState<boolean | null>(null);
  const [existingUser, setExistingUser] = useState<any>(null);
  
  const { setUser } = useAuth();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setUsernameExists(null);
      setExistingUser(null);
      setError('');
      setSuccess('');
      setStep('username');
    }
  }, [isOpen]);

  // Username validation with debouncing
  useEffect(() => {
    if (username.length >= 3 && step === 'username') {
      const timeoutId = setTimeout(async () => {
        setIsCheckingUsername(true);
        try {
          const response = await fetch('/api/auth/username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const data = await response.json();
          
          if (data.userExists) {
            setUsernameExists(true);
            setExistingUser(data.user);
          } else if (data.error) {
            setUsernameExists(null);
          } else {
            setUsernameExists(false);
            setExistingUser(null);
          }
        } catch (err) {
          console.error('Username check error:', err);
        }
        setIsCheckingUsername(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (username.length < 3) {
      setUsernameExists(null);
      setExistingUser(null);
    }
  }, [username, step]);

  // Handle username submission
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameExists === true && existingUser) {
      setStep('login');
    } else if (usernameExists === false) {
      setStep('register');
    }
  };

  // Handle authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    if (step === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Use the correct endpoint based on the step
      const endpoint = step === 'login' ? '/api/auth/signin' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Ensure all user fields are properly set including isAdmin
        setUser({
          id: data.user.id,
          username: data.user.username,
          isAdmin: data.user.isAdmin || false
        });
        setSuccess(data.message || 'Success!');
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setError(data.error || data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to username step
  const goBackToUsername = () => {
    setStep('username');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  // Username form
  const renderUsernameForm = () => (
    <form 
      onSubmit={handleUsernameSubmit} 
      className="space-y-4"
      autoComplete="off"
      data-lpignore="true"
      data-1p-ignore="true"
      data-bwignore="true"
      noValidate
    >

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <AntiAutofillInput
            value={username}
            onChange={setUsername}
            placeholder="Enter your username"
            icon={User}
            onEnter={() => {
              if (username.length >= 3 && usernameExists !== null) {
                handleUsernameSubmit(new Event('submit') as any);
              }
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isCheckingUsername ? (
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
            ) : usernameExists === true ? (
              <User className="w-4 h-4 text-blue-500" />
            ) : usernameExists === false ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : null}
          </div>
        </div>
        {username.length >= 3 && usernameExists !== null && (
          <p className={`text-xs ${
            usernameExists ? 'text-blue-600' : 'text-green-600'
          }`}>
            {usernameExists ? 'Existing user found' : 'Available for registration'}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || username.length < 3 || usernameExists === null}
      >
        {usernameExists === true ? (
          <>
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Login
          </>
        ) : usernameExists === false ? (
          <>
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue to Register
          </>
        ) : (
          'Check Username'
        )}
      </Button>

      <Button
        type="button"
        onClick={onClose}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        <X className="w-4 h-4 mr-2" />
        Return Home
      </Button>

      <div className="text-xs text-gray-500 mt-4">
        <p>• Enter existing username to log in</p>
        <p>• Or create new account with unique username</p>
        <p>• Minimum 3 characters, letters/numbers/underscores only</p>
      </div>
    </form>
  );

  // Login/Register form
  const renderAuthForm = () => (
    <form 
      onSubmit={handleAuth} 
      className="space-y-4"
      autoComplete="off"
      data-lpignore="true"
      data-1p-ignore="true"
      data-bwignore="true"
      noValidate
    >

      <div className="space-y-2">
        <Label>{step === 'login' ? 'Password' : 'Create Password'}</Label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder={step === 'login' ? 'Enter your password' : 'Create password (min. 6 characters)'}
          onEnter={step === 'register' && !confirmPassword ? () => {} : () => handleAuth(new Event('submit') as any)}
        />
      </div>

      {step === 'register' && (
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your password"
            onEnter={() => handleAuth(new Event('submit') as any)}
          />
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !password || (step === 'register' && (!confirmPassword || password !== confirmPassword))}
        >
          {step === 'login' ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
          {isLoading ? 'Processing...' : 
           step === 'login' ? `Log in as ${username}` : 'Create Account & Enter Game'}
        </Button>
        
        {step === 'login' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => setShowForgotPassword(true), 300);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>
        )}
        
        <Button
          type="button"
          onClick={goBackToUsername}
          variant="outline"
          disabled={isLoading}
          className="w-full"
        >
          ← Back to Username
        </Button>
      </div>
    </form>
  );



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">

        
        <DialogHeader>
          <DialogTitle>
            {step === 'username' ? 'Enter Formula Trivia Challenge' :
             step === 'login' ? 'Welcome Back!' :
             'Create Your Account'}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {step === 'username' ? renderUsernameForm() : renderAuthForm()}
        </div>
      </DialogContent>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </Dialog>
  );
}
