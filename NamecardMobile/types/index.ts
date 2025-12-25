export interface Contact {
  id: string;
  name: string;
  jobTitle?: string;
  company: string;
  phone: string; // Primary phone for backward compatibility
  phones?: {
    mobile1?: string;
    mobile2?: string;
    office?: string;
    fax?: string;
  };
  email: string;
  address: string;
  imageUrl: string;
  backImageUrl?: string; // Optional back image of business card
  addedDate: string;
  lastContact?: string;
  groupIds?: string[]; // Array of group IDs this contact belongs to
  updatedAt?: string; // For cloud sync conflict resolution
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color code for visual identification
  icon?: string; // Ionicons icon name
  contactCount: number; // Cached count for performance
  createdAt: string;
  updatedAt: string;
  userId?: string; // For cloud sync
}

export type Screen = 'Camera' | 'Contacts' | 'Reminders' | 'Profile' | 'ContactForm' | 'ContactDetail';

export interface ContactFormData {
  name: string;
  jobTitle?: string;
  company: string;
  phone: string;
  email: string;
  address: string;
}