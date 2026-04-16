'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Upload, Leaf, Loader2, RefreshCw, Search, Bookmark, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

interface HerbSuggestion {
  id: number;
  name: string;
  commonName: string;
  confidence: number;
  family: string;
  wikiUrl: string;
  imageUrl?: string;
}

interface IdentificationResult {
  suggestions: HerbSuggestion[];
  message?: string;
  error?: string;
}

export default function HerbIdentifier() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [savedToCollection, setSavedToCollection] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const handleCanPlay = () => {
      video.play()
        .then(() => setCameraReady(true))
        .catch(err => {
          console.error('Video play error:', err);
          setTimeout(() => video.play().catch(() => {}), 500);
        });
    };

    video.srcObject = stream;
    video.addEventListener('canplay', handleCanPlay);
    const fallbackTimer = setTimeout(() => {
      if (!cameraReady) handleCanPlay();
    }, 1000);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      clearTimeout(fallbackTimer);
    };
  }, [stream, cameraReady]);

  const startCamera = async () => {
    try {
      setCameraReady(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsOpen(true);
      setSavedToCollection(false);
    } catch (err: any) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Please use upload instead.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsOpen(false);
    setCapturedImage(null);
    setResult(null);
    setCameraReady(false);
    setSavedToCollection(false);
  }, []);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !cameraReady) {
      toast.error('Camera not ready. Please wait a moment.');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera still initializing. Please try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedImage(imageData);
      identifyHerb(imageData);
    }
  };

  const saveToUserHistory = async (suggestions: HerbSuggestion[], imageData: string) => {
    if (!user) return;
    
    try {
      const topMatch = suggestions[0];
      
      await addDoc(collection(db, 'user_plant_history'), {
        userId: user.uid,
        timestamp: serverTimestamp(),
        topMatch: topMatch,
        allResults: suggestions,
        confidence: topMatch.confidence,
        savedAt: serverTimestamp()
      });
      
      const myHerbsQuery = query(
        collection(db, 'my_herbs'),
        where('userId', '==', user.uid),
        where('plantName', '==', topMatch.name)
      );
      const existing = await getDocs(myHerbsQuery);
      
      if (existing.empty) {
        await addDoc(collection(db, 'my_herbs'), {
          userId: user.uid,
          plantName: topMatch.name,
          commonName: topMatch.commonName,
          family: topMatch.family,
          wikiUrl: topMatch.wikiUrl,
          imageUrl: topMatch.imageUrl,
          identifiedFromPhoto: true,
          dateIdentified: serverTimestamp(),
          timesIdentified: 1
        });
        toast.success('Added to My Herbs collection!');
      } else {
        const docRef = existing.docs[0].ref;
        const currentData = existing.docs[0].data();
        await updateDoc(docRef, {
          timesIdentified: (currentData.timesIdentified || 1) + 1,
          lastIdentified: serverTimestamp()
        });
        toast.info('Plant already in your collection. Updated count!');
      }
      
      setSavedToCollection(true);
    } catch (error) {
      console.error('Error saving to history:', error);
      toast.error('Failed to save to your collection');
    }
  };

  const identifyHerb = async (imageBase64: string) => {
    setIdentifying(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/identify-herb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });
      
      const data: IdentificationResult = await response.json();
      setResult(data);
      
      if (data.suggestions && data.suggestions.length > 0) {
        if (user) {
          await saveToUserHistory(data.suggestions, imageBase64);
        }
      } else if (data.message) {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Identification error:', error);
      toast.error('Identification failed. Please try again.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image too large. Please choose an image under 3MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      setIsOpen(true);
      setSavedToCollection(false);
      identifyHerb(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleViewInDatabase = (herbName: string) => {
    if (user) {
      addDoc(collection(db, 'search_queries'), {
        userId: user.uid,
        query: herbName,
        source: 'herb_identifier',
        timestamp: serverTimestamp()
      }).catch(() => {});
    }
    
    router.push(`/search?q=${encodeURIComponent(herbName)}`);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
    setSavedToCollection(false);
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-[#97A97C]/20">
        <div className="w-16 h-16 bg-[#97A97C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-[#97A97C]" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">Identify Herbs</h3>
        <p className="text-gray-600 mb-6">
          Take a photo of any herb to identify it using AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Button onClick={startCamera} className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
            <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
            Open Camera
          </Button>
          <label className="cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
              aria-label="Upload herb photo from device"
            />
            <Button variant="outline" className="border-[#97A97C] text-[#2C3E2D]">
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Upload Photo
            </Button>
          </label>
        </div>
        {user && (
          <div className="mt-4 flex gap-4 justify-center text-sm text-gray-500">
            <Link href="/my-herbs" className="hover:text-[#97A97C] flex items-center gap-1">
              <Bookmark className="w-4 h-4" aria-hidden="true" /> My Herbs
            </Link>
            <Link href="/history" className="hover:text-[#97A97C] flex items-center gap-1">
              <History className="w-4 h-4" aria-hidden="true" /> History
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" role="dialog" aria-modal="true" aria-label="Herb identification camera">
      <div className="flex justify-between items-center p-4 bg-black/90 text-white border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-[#97A97C]" aria-hidden="true" />
          <h3 className="font-bold text-lg">Herb Identifier</h3>
        </div>
        <button 
          onClick={stopCamera} 
          className="p-2 hover:bg-white/10 rounded-full"
          aria-label="Close camera"
          title="Close camera"
          type="button"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
      
      <div className="flex-1 relative overflow-hidden bg-black">
        {!capturedImage ? (
          <div className="relative h-full flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
              aria-label="Camera feed"
            />
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#97A97C]" aria-hidden="true" />
              </div>
            )}
            
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
              <p className="text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
                Position herb in frame and tap to capture
              </p>
              <button 
                onClick={captureImage} 
                disabled={!cameraReady} 
                className="w-20 h-20 bg-white rounded-full border-4 border-[#97A97C] flex items-center justify-center shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
                aria-label="Capture photo of herb"
                title="Capture photo"
                type="button"
              >
                <div className="w-14 h-14 bg-[#97A97C] rounded-full" aria-hidden="true" />
              </button>
            </div>
            
            <div className="absolute top-4 right-4">
              <label className="cursor-pointer bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors block">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  aria-label="Upload photo instead of using camera"
                />
                <Upload className="w-5 h-5" aria-hidden="true" />
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-[#F5F5F0] h-full overflow-y-auto">
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured herb for identification" 
                className="w-full h-64 object-cover"
              />
              <button 
                onClick={retakePhoto} 
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                aria-label="Retake photo"
                title="Retake photo"
                type="button"
              >
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {identifying ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[#97A97C] mx-auto mb-4" aria-hidden="true" />
                  <p className="text-gray-600">Analyzing herb...</p>
                </div>
              ) : result?.suggestions && result.suggestions.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    {savedToCollection && (
                      <span className="inline-block mb-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1 justify-center">
                        <Bookmark className="w-3 h-3" aria-hidden="true" /> Saved to My Herbs
                      </span>
                    )}
                    <h4 className="text-2xl font-bold text-[#2C3E2D] mb-1">{result.suggestions[0].commonName}</h4>
                    <p className="text-gray-500 italic">{result.suggestions[0].name}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="bg-[#97A97C] text-white px-4 py-1.5 rounded-full text-sm font-medium">
                        {result.suggestions[0].confidence}% Match
                      </span>
                      <span className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                        {result.suggestions[0].family}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#97A97C] hover:bg-[#7A8A63] text-white py-6 text-lg"
                    onClick={() => handleViewInDatabase(result.suggestions![0].commonName)}
                  >
                    <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                    Find in RemedyAfrica Database
                  </Button>
                  
                  {!savedToCollection && user && (
                    <Button 
                      variant="outline" 
                      className="w-full border-[#97A97C] text-[#2C3E2D]"
                      onClick={() => saveToUserHistory(result.suggestions!, capturedImage)}
                    >
                      <Bookmark className="w-4 h-4 mr-2" aria-hidden="true" />
                      Save to My Herbs
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Leaf className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">{result?.message || 'No Matches'}</h4>
                  <Button variant="outline" className="border-[#97A97C] text-[#2C3E2D] mt-4" onClick={retakePhoto}>
                    <Camera className="w-4 h-4 mr-2" aria-hidden="true" /> Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}