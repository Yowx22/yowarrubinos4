import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MusicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SONGS = [
  'https://audio.jukehost.co.uk/B6d6uv9pNK9TYwdLXuw7BieLMYCifaGa',
  'https://audio.jukehost.co.uk/oTERxIhIQjmgKJdQa14r5sysOxDgihQ4',
  'https://audio.jukehost.co.uk/w3MZYahiycAlNMDYCvvwt2wIlT88dbup',
  'https://audio.jukehost.co.uk/0CY07C5V1K9RP6Y0rSBtqpH1OOQ7o3Ip',
  'https://audio.jukehost.co.uk/6b6VGT0o3A1tkA0dKJEgcBjSvkQBrmPX',
  'https://audio.jukehost.co.uk/2y5XmEUzV6GE5BKFnTEWzSKzJReHwYwz',
  'https://audio.jukehost.co.uk/xKwFtvNv93rtoHMFDvKHTfaoTE9NQmbv'
];

export function MusicDialog({ open, onOpenChange }: MusicDialogProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playRandomSong = () => {
    if (audio) {
      audio.pause();
    }
    const randomSong = SONGS[Math.floor(Math.random() * SONGS.length)];
    const newAudio = new Audio(randomSong);
    newAudio.loop = true;
    newAudio.play();
    setAudio(newAudio);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    onOpenChange(false);
  };

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-spdm-dark border-spdm-green/20">
        <DialogHeader>
          <DialogTitle className="text-spdm-green">Want Some Music?</DialogTitle>
          <DialogDescription>
            Would you like to listen to some music while farming?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-spdm-green/30 text-spdm-green hover:bg-spdm-green/10"
          >
            No, thanks
          </Button>
          <Button
            onClick={playRandomSong}
            className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
          >
            Yes, play music
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}