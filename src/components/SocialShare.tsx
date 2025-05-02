
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { shareIdea } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SocialShareProps {
  title: string;
  url: string;
  ideaId: string;
  description?: string;
  imageUrl?: string;
}

export const SocialShare = ({ title, url, ideaId, description, imageUrl }: SocialShareProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = React.useState(false);
  const [embedCode, setEmbedCode] = React.useState('');

  const generatePreviewCard = () => {
    // Generate preview card HTML for embedding
    const card = `
<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; max-width: 500px; font-family: system-ui, sans-serif;">
  <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${title}</div>
  ${description ? `<p style="margin-bottom: 12px; color: #64748b;">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>` : ''}
  <div style="font-size: 14px; color: #64748b;">
    <a href="${url}" style="color: #3b82f6; text-decoration: none;">View this idea on IdeaShare</a>
  </div>
</div>
`;
    setEmbedCode(card);
    setShowDialog(true);
  };

  const handleShare = async (platform: string) => {
    let shareUrl = '';
    let shareTitle = encodeURIComponent(title);
    let shareDesc = encodeURIComponent(description || 'Check out this idea on IdeaShare!');
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${shareTitle}&summary=${shareDesc}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${shareDesc}`;
        if (imageUrl) {
          shareUrl += `&media=${encodeURIComponent(imageUrl)}`;
        }
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${shareTitle}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${shareTitle}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${shareTitle}&body=${encodeURIComponent(`Check out this idea: ${title}\n\n${description || ''}\n\n${url}`)}`;
        break;
      case 'embed':
        generatePreviewCard();
        try {
          await shareIdea(ideaId);
        } catch (error) {
          console.error('Failed to update share count:', error);
        }
        return;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({ title: 'Link copied to clipboard' });
        try {
          await shareIdea(ideaId);
        } catch (error) {
          console.error('Failed to update share count:', error);
        }
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      try {
        await shareIdea(ideaId);
      } catch (error) {
        console.error('Failed to update share count:', error);
      }
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: 'Embed code copied to clipboard' });
    setShowDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            Twitter / X
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('linkedin')}>
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('pinterest')}>
            Pinterest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('reddit')}>
            Reddit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('telegram')}>
            Telegram
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')}>
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('embed')}>
            Embed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('copy')}>
            Copy link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Embed this idea</DialogTitle>
            <DialogDescription>
              Copy this code to embed a preview of this idea on your website.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="border rounded-md p-3 bg-muted text-xs overflow-auto max-h-32">
              <pre>{embedCode}</pre>
            </div>
            <div dangerouslySetInnerHTML={{ __html: embedCode }} />
          </div>
          <DialogFooter>
            <Button onClick={copyEmbedCode}>Copy Embed Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
