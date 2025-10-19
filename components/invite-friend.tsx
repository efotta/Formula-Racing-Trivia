
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share, MessageSquare, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface InviteFriendProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteFriend({ isOpen, onClose }: InviteFriendProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [iconError, setIconError] = useState(false);
  const { toast } = useToast();

  // Get the current app URL - will be localhost in dev, deployed URL in production
  const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://your-app.com'; // Fallback - will be updated when deployed
  };

  const defaultMessage = "This free Formula Racing trivia game is fun - give it a try! Fan-created and no ads!";
  const appUrl = getAppUrl();
  const fullMessage = `${defaultMessage}\n\nPlay now: ${appUrl}`;
  
  // Editable message state - starts with default message
  const [editableMessage, setEditableMessage] = useState(fullMessage);

  // Check if Web Share API is supported
  const canWebShare = typeof navigator !== 'undefined' && navigator.share;

  const handleWebShare = async () => {
    if (!canWebShare) {
      toast({
        title: "Web Share not supported",
        description: "Your browser doesn't support web sharing. Try SMS instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.share({
        title: 'Formula Trivia Challenge',
        text: editableMessage,
        url: appUrl,
      });
      
      toast({
        title: "Shared successfully!",
        description: "Your invitation was shared.",
      });
      onClose();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Could not share the invitation. Try copying the message instead.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSMSShare = () => {
    const smsUrl = phoneNumber 
      ? `sms:${phoneNumber}?body=${encodeURIComponent(editableMessage)}`
      : `sms:?body=${encodeURIComponent(editableMessage)}`;
    
    window.open(smsUrl, '_self');
    
    toast({
      title: "Opening SMS app",
      description: "Your SMS app should open with the invitation message.",
    });
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage);
      toast({
        title: "Message copied!",
        description: "The invitation message has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setEditableMessage(fullMessage);
    setIconError(false); // Reset icon error state
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="f1-modal-title flex items-center gap-2">
            <Share className="w-5 h-5 text-blue-500" />
            Invite a Friend
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* App Icon - Medium Size, Centered */}
          <div className="flex justify-center py-2">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-lg">
              {!iconError ? (
                <Image
                  src="/formula-racing-trivia-icon.jpg"
                  alt="Formula Trivia Challenge"
                  fill
                  className="object-cover"
                  priority
                  onError={() => {
                    setIconError(true);
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl bg-blue-600 text-white">
                  🏁
                </div>
              )}
            </div>
          </div>

          {/* Editable Message */}
          <div className="space-y-2">
            <Label htmlFor="editable-message" className="f1-modal-text text-sm">
              Your message (you can edit):
            </Label>
            <Textarea
              id="editable-message"
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              className="min-h-[100px] sm:min-h-[120px] resize-none f1-modal-text text-sm"
              placeholder="Edit your invitation message..."
            />
          </div>

          {/* Phone Number Input - Compact */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="f1-modal-text text-sm">
              Phone # (optional for SMS):
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="f1-modal-text text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Web Share Button (if supported) */}
            {canWebShare && (
              <Button
                onClick={handleWebShare}
                className="w-full bg-green-600 hover:bg-green-700 text-white f1-button-text text-sm sm:text-base"
              >
                <Share className="w-4 h-4 mr-2" />
                Share with Friends
              </Button>
            )}

            {/* SMS Button */}
            <Button
              onClick={handleSMSShare}
              variant="outline"
              className="w-full f1-button-text text-sm sm:text-base"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send via SMS
            </Button>

            {/* Copy Message Button */}
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              className="w-full f1-button-text text-sm sm:text-base"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>

            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              className="w-full f1-button-text text-sm sm:text-base"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
