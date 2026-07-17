import { X } from 'lucide-react';

interface VideoModalProps {
  videoUrl: string;
  onClose: () => void;
}

export default function VideoModal({ videoUrl, onClose }: VideoModalProps) {
  // Extract YouTube video ID
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      let videoId = urlObj.searchParams.get('v');
      
      // Handle youtu.be format just in case
      if (!videoId && urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full max-w-xs bg-[#0F172A] border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-sm font-mono tracking-widest uppercase text-white/90">Tutorial</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full aspect-[9/16] bg-black">
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Exercise Tutorial"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
