/**
 * Test Data Fixtures
 *
 * Sample data for testing CRMS functionality
 */
import { Case } from '@/src/domain/entities/Case';
import { Person } from '@/src/domain/entities/Person';
import { Evidence } from '@/src/domain/entities/Evidence';
import { Officer } from '@/src/domain/entities/Officer';

// Sample Officer Data
export const mockOfficer: Officer = new Officer(
  'officer-123',
  'SA-00001',
  'Test Officer',
  'test@crms.gov.sl',
  '+23276123456',
  'role-officer',
  'station-hq',
  true,
  new Date(),
  new Date(),
  0,
  null,
  false,
  new Date(),
  new Date()
);

export const mockOfficerPrisma = {
  id: 'officer-123',
  badge: 'SA-00001',
  name: 'Test Officer',
  email: 'test@crms.gov.sl',
  phone: '+23276123456',
  pinHash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
  roleId: 'role-officer',
  stationId: 'station-hq',
  active: true,
  lastLogin: new Date(),
  pinChangedAt: new Date(),
  failedAttempts: 0,
  lockedUntil: null,
  mfaEnabled: false,
  mfaSecret: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample Case Data
export const mockCase: Case = new Case(
  'case-123',
  'HQ-2025-000001',
  'Sample Theft Case',
  'A laptop was stolen from the office',
  'theft',
  'minor',
  'open',
  new Date('2025-01-15'),
  new Date('2025-01-16'),
  'Freetown, Central Office',
  'station-hq',
  'officer-123',
  new Date(),
  new Date()
);

export const mockCasePrisma = {
  id: 'case-123',
  caseNumber: 'HQ-2025-000001',
  title: 'Sample Theft Case',
  description: 'A laptop was stolen from the office',
  category: 'theft',
  severity: 'minor',
  status: 'open',
  incidentDate: new Date('2025-01-15'),
  reportedDate: new Date('2025-01-16'),
  location: 'Freetown, Central Office',
  stationId: 'station-hq',
  officerId: 'officer-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample Person Data
export const mockPerson: Person = new Person(
  'person-123',
  'NIN-123456789',
  'John',
  'Doe',
  null,
  ['Johnny', 'JD'],
  new Date('1990-01-15'),
  'male',
  'SLE',
  'Freetown',
  'Security Guard',
  'single',
  'high_school',
  'Mende',
  'Christian',
  ['English', 'Krio'],
  'Height 180cm, medium build',
  'https://example.com/photo.jpg',
  [{ type: 'residence' as const, street: '123 Main St', city: 'Freetown', region: 'Western Area', country: 'SLE' }],
  ['+23276123456'],
  ['john.doe@example.com'],
  'fingerprint-hash-abc123',
  null,
  'No prior criminal record',
  null,
  false,
  false,
  null,
  'station-hq',
  'officer-123',
  null,
  new Date(),
  new Date()
);

export const mockPersonPrisma = {
  id: 'person-123',
  nationalId: 'NIN-123456789',
  idType: 'NIN',
  countryCode: 'SLE',
  fullName: 'John Doe',
  aliases: ['Johnny', 'JD'],
  dob: new Date('1990-01-15'),
  gender: 'male',
  nationality: 'SLE',
  addressEncrypted: 'encrypted-address-data',
  phoneEncrypted: 'encrypted-phone-data',
  emailEncrypted: 'encrypted-email-data',
  photoUrl: 'https://example.com/photo.jpg',
  fingerprintHash: 'fingerprint-hash-abc123',
  biometricHash: null,
  createdById: 'officer-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample Evidence Data
export const mockEvidence: Evidence = new Evidence(
  'evidence-123',
  'HQ-EV-2025-000001',
  'case-123',
  'physical',
  'Stolen laptop - Dell Latitude 5520',
  'collected',
  new Date('2025-01-16T10:00:00Z'),
  'Crime Scene - Office 3B',
  'officer-123',
  null, // fileUrl
  null, // fileKey
  null, // fileName
  null, // fileSize
  null, // fileMimeType
  null, // fileHash
  'Evidence Room A, Shelf 3', // storageLocation
  [
    {
      officerId: 'officer-123',
      officerName: 'Test Officer',
      officerBadge: 'SA-00001',
      action: 'collected' as const,
      timestamp: new Date('2025-01-16T10:00:00Z'),
      location: 'Crime Scene - Office 3B',
      notes: 'Initial collection from crime scene',
    },
  ],
  ['critical', 'electronics', 'theft-evidence'],
  'High-value electronics from theft scene',
  false,
  null,
  null,
  'station-hq',
  new Date(),
  new Date()
);

export const mockEvidencePrisma = {
  id: 'evidence-123',
  qrCode: 'HQ-EV-2025-000001',
  caseId: 'case-123',
  type: 'physical',
  description: 'Stolen laptop - Dell Latitude 5520',
  chainOfCustody: [
    {
      officerId: 'officer-123',
      officerName: 'Test Officer',
      officerBadge: 'SA-00001',
      action: 'collected',
      timestamp: new Date('2025-01-16T10:00:00Z'),
      location: 'Crime Scene - Office 3B',
      notes: 'Initial collection from crime scene',
    },
  ],
  status: 'collected',
  collectedDate: new Date('2025-01-16T10:00:00Z'),
  collectedLocation: 'Crime Scene - Office 3B',
  storageLocation: 'Evidence Room A, Shelf 3',
  collectedById: 'officer-123',
  stationId: 'station-hq',
  manufacturer: 'Dell',
  storageUrl: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  fileHash: null,
  isSealed: false,
  isCritical: true,
  tags: ['critical', 'electronics', 'theft-evidence'],
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample SyncQueue Entry
export const mockSyncQueueEntry = {
  id: 'sync-123',
  entityType: 'case',
  entityId: 'case-123',
  operation: 'create',
  payload: { ...mockCasePrisma },
  status: 'pending',
  attempts: 0,
  error: null,
  createdAt: new Date(),
  syncedAt: null,
};

// Valid Create Inputs
export const validCreateCaseInput = {
  title: 'New Theft Case',
  description: 'Description of the theft',
  category: 'theft',
  severity: 'minor',
  incidentDate: new Date('2025-01-20'),
  location: 'Freetown',
};

export const validCreatePersonInput = {
  nin: '12345678901',
  firstName: 'Jane',
  lastName: 'Smith',
  middleName: 'Marie',
  alias: ['JS', 'Janie'],
  dateOfBirth: '1985-05-20',
  gender: 'female' as const,
  nationality: 'SLE',
  placeOfBirth: 'Bo',
  occupation: 'Teacher',
  maritalStatus: 'married',
  educationLevel: 'university',
  tribe: 'Temne',
  religion: 'Muslim',
  languagesSpoken: ['English', 'Krio', 'Temne'],
  physicalDescription: 'Height 165cm, slim build',
  photoUrl: 'https://example.com/jane.jpg',
  addresses: [{ type: 'residence' as const, street: '45 Oak Road', city: 'Bo', region: 'Southern Province', country: 'SLE' }],
  phoneNumbers: ['+23276987654'],
  emails: ['jane.smith@example.com'],
  fingerprintHash: 'fingerprint-hash-xyz789',
  biometricHash: null,
  criminalHistory: null,
  riskLevel: 'low' as const,
  isWanted: false,
  isDeceasedOrMissing: false,
  notes: 'Created for testing',
  stationId: 'station-hq',
};

export const validCreateEvidenceInput = {
  caseId: 'case-123',
  type: 'photo' as const,
  description: 'Crime scene photograph showing point of entry',
  status: 'collected' as const,
  collectedDate: '2025-01-20T14:00:00Z',
  collectedLocation: 'Crime Scene - Building A, Room 205',
  storageLocation: 'Digital Storage - Server A',
  tags: ['photo', 'crime-scene', 'point-of-entry'],
  notes: 'Taken with evidence camera #5',
  file: {
    url: 'https://s3.example.com/evidence/photo-001.jpg',
    name: 'photo-001.jpg',
    size: 2048576, // 2MB
    mimeType: 'image/jpeg',
    hash: 'abc123def456789',
  },
};

// Invalid Inputs for testing validation
export const invalidCaseInput = {
  title: '', // Empty title
  category: 'theft',
  severity: 'minor',
  incidentDate: new Date(Date.now() + 86400000), // Future date (invalid)
};

export const invalidPersonInput = {
  nationalId: '123', // Invalid NIN format
  fullName: '', // Empty name
};
