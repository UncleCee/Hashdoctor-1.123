
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN_CEO = 'ADMIN_CEO',
  ADMIN_MANAGER = 'ADMIN_MANAGER',
  ADMIN_CSO = 'ADMIN_CSO',
  ADMIN_CMO = 'ADMIN_CMO'
}

export type CallStatus = 'idle' | 'ringing' | 'connected';

export interface CallSession {
  callerId: string;
  receiverId: string;
  status: CallStatus;
  startTime?: Date;
  isSos?: boolean;
}

export interface Diagnosis {
  id: string;
  date: string;
  doctorId: string;
  doctorName: string;
  condition: string;
  notes: string;
  prescription?: string;
}

export interface PatientRecord {
  age: number;
  ailments: string[];
  conditions: string[];
  lastCheckup: string;
  diagnoses?: Diagnosis[];
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'consultancy_fee';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'disputed' | 'awaiting_authorisation' | 'connected' | 'paid';
  date: string;
  method: string;
  description?: string;
  recipientId?: string;
  senderId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isSubscribed?: boolean;
  isFrozen?: boolean;
  isOnline?: boolean;
  walletBalance: number;
  bonusBalance: number;
  consultationFee?: number;
  specialization?: string;
  location?: string;
  medicalRecord?: PatientRecord;
  password?: string;
  idCardNumber?: string;
  bankAccount?: BankAccount;
  transactions: Transaction[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isAi?: boolean;
}
