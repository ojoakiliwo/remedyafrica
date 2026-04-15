export interface Consultation {
  id?: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  practitionerId: string;
  practitionerName: string;
  practitionerImage?: string;
  date: string; // Format: "2026-04-15"
  time: string; // Format: "14:00"
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio';
  notes?: string;
  
  // Daily.co fields
  dailyRoomUrl?: string | null;      // e.g., "https://remedyafrica.daily.co/room-abc123"
  roomName?: string | null;          // e.g., "room-abc123"
  
  // Tracking fields
  linksUpdatedAt?: any;              // Timestamp when room was created
  viewedAt?: any;                    // Timestamp when patient viewed the room
  createdAt?: any;
  updatedAt?: any;
}