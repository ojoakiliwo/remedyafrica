'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload, Leaf, Loader2, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
}

export default function HerbIdentifier() {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // FIX: Play video when stream is ready
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
      });
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraReady(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      setIsOpen(true);
      
      // Wait for video to be ready
      setTimeout(() => setCameraReady(true), 500);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera found. Please use upload instead.');
      } else {
        toast.error('Could not access camera. Please use upload instead.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsOpen(false);
    setCapturedImage(null);
    setResult(null);
    setCameraReady(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && cameraReady) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // FIX: Ensure video dimensions are available
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('Camera not ready. Please wait a moment.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        identifyHerb(imageData);
      }
    }
  };

  const identifyHerb = async (imageBase64: string) => {
    setIdentifying(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/identify-herb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Identification failed');
      }
      
      const data: IdentificationResult = await response.json();
      setResult(data);
      
      if (!data.suggestions || data.suggestions.length === 0) {
        toast.info('No herbs identified. Try a clearer photo or different angle.');
      }
    } catch (error: any) {
      console.error('Identification error:', error);
      toast.error(error.message || 'Identification failed. Please try again.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Please choose an image under 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        setIsOpen(true);
        identifyHerb(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewInDatabase = (herbName: string) => {
    router.push(`/search?q=${encodeURIComponent(herbName)}`);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-[#97A97C]/20">
        <div className="w-16 h-16 bg-[#97A97C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-[#97A97C]" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">Identify Herbs</h3>
        <p className="text-gray-600 mb-6">
          Take a photo of any herb to identify it using AI and learn about its medicinal properties.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={startCamera} 
            className="bg-[#97A97C] hover:bg-[#7A8A63] text-white"
            aria-label="Open camera to identify herb"
          >
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
            <Button variant="outline" className="border-[#97A97C] text-[#2C3E2D] hover:bg-[#97A97C]/10">
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Upload Photo
            </Button>
          </label>
        </div>
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
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close camera and return to homepage"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
      
      <div className="flex-1 relative overflow-hidden bg-black">
        {!capturedImage ? (
          <div className="relative h-full flex items-center justify-center">
            {/* FIX: Better video handling with playsInline and muted */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
              aria-label="Camera feed for herb identification"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Loading state */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#97A97C]" />
              </div>
            )}
            
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
              <p className="text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
                Position herb in frame and tap to capture
              </p>
              <button 
                onClick={captureImage}
                disabled={!cameraReady}
                className="w-20 h-20 bg-white rounded-full border-4 border-[#97A97C] flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                aria-label="Capture photo of herb"
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
                  aria-label="Upload herb photo instead of using camera"
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
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Retake photo"
              >
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {identifying ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[#97A97C] mx-auto mb-4" aria-hidden="true" />
                  <p className="text-gray-600 text-lg">Analyzing herb...</p>
                  <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
                </div>
              ) : result && result.suggestions && result.suggestions.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-[#2C3E2D] mb-1">
                      {result.suggestions[0].commonName}
                    </h4>
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
                  
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex gap-4">
                      {result.suggestions[0].imageUrl && (
                        <img 
                          src={result.suggestions[0].imageUrl} 
                          alt={`${result.suggestions[0].commonName} herb`}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h5 className="font-semibold text-[#2C3E2D] mb-2">Top Match</h5>
                        <p className="text-gray-600 text-sm mb-3">
                          This appears to be <strong>{result.suggestions[0].commonName}</strong> (
                          <em>{result.suggestions[0].name}</em>
                          ), a member of the {result.suggestions[0].family} family.
                        </p>
                        <a 
                          href={result.suggestions[0].wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#97A97C] hover:underline text-sm inline-flex items-center gap-1"
                        >
                          Learn more on Wikipedia →
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-[#97A97C] hover:bg-[#7A8A63] text-white py-6 text-lg"
                      onClick={() => handleViewInDatabase(result.suggestions[0].commonName)}
                    >
                      <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                      Find in RemedyAfrica Database
                    </Button>
                    
                    {result.suggestions.length > 1 && (
                      <div className="pt-4">
                        <h5 className="font-semibold text-gray-700 mb-3">Other Possibilities</h5>
                        <div className="space-y-2">
                          {result.suggestions.slice(1).map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleViewInDatabase(suggestion.commonName)}
                              className="w-full bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-[#97A97C] hover:bg-[#97A97C]/5 transition-colors text-left"
                            >
                              <div>
                                <p className="font-medium text-[#2C3E2D]">{suggestion.commonName}</p>
                                <p className="text-xs text-gray-500">{suggestion.name}</p>
                              </div>
                              <span className="text-sm text-[#97A97C] font-medium">
                                {suggestion.confidence}%
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-gray-400" aria-hidden="true" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No Matches Found</h4>
                  <p className="text-gray-500 mb-6">
                    We couldn&apos;t identify this herb. Try taking a clearer photo with better lighting.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-[#97A97C] text-[#2C3E2D]"
                    onClick={retakePhoto}
                  >
                    <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
                    Try Again
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