import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Check, Sparkles, Scale, Tag, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeight?: number;
  onSuccess?: (log: { date: string; weight: number; photo: string; angle: string; note: string }) => void;
}

export default function PhotoUploadModal({ isOpen, onClose, currentWeight, onSuccess }: PhotoUploadModalProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState<string>(currentWeight ? String(currentWeight) : '');
  const [angle, setAngle] = useState<'Front' | 'Side' | 'Back' | 'General'>('Front');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720;
        const MAX_HEIGHT = 720;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to high quality web JPEG ~100KB
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.72);
        setPhotoDataUrl(compressedUrl);
        toast.success('Photo ready!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      toast.error('You must be logged in to save photos.');
      return;
    }

    if (!photoDataUrl) {
      toast.error('Please upload or snap a photo first.');
      return;
    }

    setSaving(true);
    const targetDate = logDate || format(new Date(), 'yyyy-MM-dd');
    const parsedWeight = weight ? parseFloat(parseFloat(weight).toFixed(1)) : (currentWeight || 70);

    try {
      // 1. Fetch existing log for targetDate if any to preserve existing fields
      const logRef = doc(db, 'users', auth.currentUser.uid, 'daily_logs', targetDate);
      const existingSnap = await getDoc(logRef);
      const existingData = existingSnap.exists() ? existingSnap.data() : {};

      await setDoc(logRef, {
        ...existingData,
        date: targetDate,
        weight: parsedWeight,
        photo: photoDataUrl,
        angle: angle,
        note: note.trim() || existingData.note || '',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Also update current user weight if targetDate is today
      if (weight && targetDate === format(new Date(), 'yyyy-MM-dd')) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          weight: parsedWeight
        }, { merge: true });
      }

      toast.success("Progress photo saved with timestamp! 📸");
      
      if (onSuccess) {
        onSuccess({
          date: targetDate,
          weight: parsedWeight,
          photo: photoDataUrl,
          angle,
          note
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving progress photo:', err);
      toast.error('Failed to save photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0F172A] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-light tracking-wider uppercase text-white">Daily Photo Check-in</h2>
              <p className="text-[10px] font-mono text-white/50 tracking-wider">
                {format(new Date(), 'EEEE, MMMM dd')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh] no-scrollbar">
          
          {/* Photo Dropzone / Preview */}
          <div className="space-y-2">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />

            {photoDataUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black h-64 flex items-center justify-center group shadow-xl">
                <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 rounded-xl font-mono text-xs uppercase tracking-wider text-white shadow-lg"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    className="p-2 bg-red-600 rounded-xl text-white shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-52 border-2 border-dashed border-white/20 hover:border-fuchsia-500/50 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform text-white">
                  <Upload className="w-6 h-6 text-fuchsia-400" />
                </div>
                <div>
                  <p className="text-xs font-mono tracking-wider uppercase text-white">Upload or Snap Photo</p>
                  <p className="text-[11px] text-white/40 mt-1 font-light">Tap to choose camera or gallery</p>
                </div>
              </div>
            )}
          </div>

          {/* Date Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/60 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Log Date & Timestamp
              </span>
              <span className="text-[9px] font-mono text-white/40 lowercase">auto-timestamped</span>
            </label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
            />
          </div>

          {/* Angle Tag Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Pose / Angle
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Front', 'Side', 'Back', 'General'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngle(a)}
                  className={`py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                    angle === a 
                      ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-md' 
                      : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-400" /> Today's Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 74.5"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-fuchsia-400" /> Notes / How you feel
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Fasted morning check-in, feeling leaner"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-light text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !photoDataUrl}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white font-mono text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>Saving Entry...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Daily Photo</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
