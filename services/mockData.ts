
import { UserRole } from "../types.ts";

export const ROLE_MAP: Record<string, UserRole> = {
  'Doctor': UserRole.DOCTOR,
  'CEO': UserRole.ADMIN_CEO,
  'CMO': UserRole.ADMIN_CMO,
  'CFO': UserRole.ADMIN_CSO,
  'Manager': UserRole.ADMIN_MANAGER,
  'Owner': UserRole.ADMIN_CEO,
  'Patient': UserRole.PATIENT
};

export const INITIAL_RECORDS = [
  // Administrative & Medical Staff
  { name: "Colin Aoaeh", email: "colinm.aoaeh@gmail.com", role: "CEO", balance: 0 },
  { name: "Colin Aoaeh", email: "colinm.aoaeh@yahoo.com", role: "CEO", balance: 0 },
  { 
    name: "Dr. Titus Ayerga", 
    email: "tyesio@yahoo.com", 
    role: "Doctor", 
    balance: 0, 
    specialization: "General Practice & Family Medicine", 
    location: "Kano, Nigeria" 
  },
  { 
    name: "Dr. Ukachi Ukachukwu", 
    email: "ukachukwuu@gmail.com", 
    role: "Doctor", 
    balance: 0, 
    specialization: "Internal Medicine & Complex Care", 
    location: "Frankfurt, Germany" 
  },
  { 
    name: "Dr. Amakom Nneka", 
    email: "amakomnneka@yahoo.com", 
    role: "Doctor", 
    balance: 0, 
    specialization: "Pediatrics & Neonatal Health", 
    location: "Abuja, Nigeria" 
  },
  { name: "Ella Aoaeh", email: "queenzylove94@gmail.com", role: "CFO", balance: 0 },
  
  // Specific Medical & Management Overrides
  { 
    name: "Dr. Ukachi Ukachukwu", 
    email: "ukachukwuu@gmail.com", 
    role: "CMO", 
    balance: 0, 
    specialization: "Internal Medicine", 
    location: "Frankfurt, Germany" 
  },
  { 
    name: "Dr. Titus Ayerga", 
    email: "tyesio@yahoo.com", 
    role: "Manager", 
    balance: 0, 
    specialization: "General Practice", 
    location: "Kano, Nigeria" 
  },

  // Patients - All balances reset to 0
  { name: "Test Patient", email: "test@test.com", role: "Patient", balance: 0, age: 25, ailments: ["Sample Fever"], conditions: [] },
  { name: "Colin Test (Hotmail)", email: "colinm.aoaeh@hotmail.com", role: "Patient", balance: 0, age: 45, ailments: ["General Wellness"], conditions: [] },
  { name: "Guinevere Aoaeh", email: "bulli55@gmail.com", role: "Patient", balance: 0, age: 65, ailments: ["Joint Pain"], conditions: ["Hypertension"] },
  { name: "Bernice Aoaeh", email: "summitschoolstar@gmail.com", role: "Patient", balance: 0, age: 30, ailments: ["Fatigue"], conditions: [] },
  { name: "Chinedu Amakom", email: "chanya", role: "Patient", balance: 0 },
  { name: "Maxim Okonghae", email: "maxximovitch@yahoo.com", role: "Patient", balance: 0 },
  { name: "Paul Nkansar", email: "pnbanks@yahoo.com", role: "Patient", balance: 0 },
  { name: "Brian Aoaeh", email: "laun_bb@yahoo.com", role: "Patient", balance: 0 },
  { name: "Bukkie Allison", email: "hadassahallie@yahoo.com", role: "Patient", balance: 0 },
  { name: "Nneka Amakom", email: "amakomnneka@yahoo.com", role: "Patient", balance: 0 }
];
