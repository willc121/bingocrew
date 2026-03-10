import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Share2, Download, Copy, Twitter, Linkedin, Facebook, Image } from "lucide-react";

interface ShareExportProps {
  cardRef: React.RefObject<HTMLDivElement>;
  cardTitle: string;
  completedCount: number;
  bingoCount: number;
}

export function ShareExport({ cardRef, cardTitle, completedCount, bingoCount }: ShareExportProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const getShareText = () => {
    const base = `Check out my Resolution Bingo progress: ${completedCount}/25 squares completed`;
    if (bingoCount > 0) {
      return `${base} with ${bingoCount} BINGO${bingoCount > 1 ? 's' : ''}!`;
    }
    return `${base}!`;
  };

  const getShareUrl = () => {
    return window.location.href;
  };

  const handleDownload = async (format: 'png') => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${cardTitle.replace(/\s+/g, '-').toLowerCase()}-bingo.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: "Downloaded!", description: "Your bingo card has been saved as PNG." });
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      toast({ title: "Export failed", description: "Could not export the card. Please try again.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({ title: "Link copied!", description: "Share it with your friends." });
    } catch {
      toast({ title: "Failed to copy", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Try to share with image if supported
        if (cardRef.current && navigator.canShare) {
          const dataUrl = await toPng(cardRef.current, { quality: 0.9, pixelRatio: 2 });
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'bingo-card.png', { type: 'image/png' });
          
          const shareData = {
            title: cardTitle,
            text: getShareText(),
            files: [file],
          };
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        
        // Fallback to text share
        await navigator.share({
          title: cardTitle,
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast({ title: "Share failed", description: "Could not share. Try copying the link instead.", variant: "destructive" });
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(getShareText())}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Main Share Button */}
      <Button 
        onClick={handleNativeShare} 
        variant="default"
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {/* Social Share Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={shareToTwitter} className="gap-2 cursor-pointer">
            <Twitter className="w-4 h-4" />
            Share on X
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToLinkedIn} className="gap-2 cursor-pointer">
            <Linkedin className="w-4 h-4" />
            Share on LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToFacebook} className="gap-2 cursor-pointer">
            <Facebook className="w-4 h-4" />
            Share on Facebook
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
            <Copy className="w-4 h-4" />
            Copy Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Download Button */}
      <Button 
        variant="outline" 
        disabled={isExporting} 
        className="gap-2"
        onClick={() => handleDownload('png')}
        data-testid="button-download-png"
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Saving...' : 'Save Image'}
      </Button>
    </div>
  );
}
