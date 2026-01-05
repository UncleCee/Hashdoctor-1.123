
import { User, Message, Transaction, UserRole, Diagnosis } from "../types.ts";
import { INITIAL_RECORDS, ROLE_MAP } from "./mockData.ts";

const STORAGE_KEYS = {
  USERS: 'hd_mock_users',
  CHATS: 'hd_mock_chats',
  TRANSACTIONS: 'hd_mock_transactions'
};

export const mockDatabase = {
  // Initialize database with default records if empty
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const users: User[] = INITIAL_RECORDS.map((rec, idx) => {
        const role = ROLE_MAP[rec.role] || UserRole.PATIENT;
        const userId = `u-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        
        return {
          id: userId,
          name: rec.name.trim(),
          email: rec.email.trim(),
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.name}`,
          walletBalance: (rec as any).balance || (role === UserRole.PATIENT ? 50 : 150),
          bonusBalance: 0,
          consultationFee: role === UserRole.DOCTOR ? 25.00 : undefined,
          specialization: (rec as any).specialization,
          location: (rec as any).location,
          isSubscribed: false,
          isOnline: role === UserRole.DOCTOR ? Math.random() > 0.3 : true,
          password: 'password123',
          transactions: [],
          medicalRecord: (rec as any).age ? {
            age: (rec as any).age,
            ailments: (rec as any).ailments || [],
            conditions: (rec as any).conditions || [],
            lastCheckup: new Date().toISOString(),
            diagnoses: []
          } : { age: 0, ailments: [], conditions: [], lastCheckup: "", diagnoses: [] }
        };
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify({}));
    }
  },

  // User Methods
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  updateUser: (userId: string, data: Partial<User>) => {
    const users = mockDatabase.getUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...data } : u);
    mockDatabase.saveUsers(updatedUsers);
    return updatedUsers.find(u => u.id === userId) || null;
  },

  addDiagnosis: (patientId: string, diagnosis: Diagnosis) => {
    const users = mockDatabase.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === patientId && u.medicalRecord) {
        const currentDiagnoses = u.medicalRecord.diagnoses || [];
        return {
          ...u,
          medicalRecord: {
            ...u.medicalRecord,
            diagnoses: [diagnosis, ...currentDiagnoses]
          }
        };
      }
      return u;
    });
    mockDatabase.saveUsers(updatedUsers);
  },

  // Chat Methods
  getChats: (): Record<string, Message[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : {};
  },

  saveMessage: (chatKey: string, message: Message) => {
    const chats = mockDatabase.getChats();
    if (!chats[chatKey]) chats[chatKey] = [];
    chats[chatKey].push(message);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  saveBulkMessages: (chatKey: string, messages: Message[]) => {
    const chats = mockDatabase.getChats();
    if (!chats[chatKey]) chats[chatKey] = [];
    chats[chatKey].push(...messages);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  // Transaction History Methods
  addTransaction: (userId: string, transaction: Transaction) => {
    const users = mockDatabase.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, transactions: [transaction, ...u.transactions] };
      }
      return u;
    });
    mockDatabase.saveUsers(updatedUsers);
  },

  // Migration Tools
  exportFullSnapshot: () => {
    const snapshot = {
      users: mockDatabase.getUsers(),
      chats: mockDatabase.getChats(),
      timestamp: new Date().toISOString(),
      version: '1.13a'
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hashdoctor_backup_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importSnapshot: (jsonString: string) => {
    try {
      const snapshot = JSON.parse(jsonString);
      if (!snapshot.users || !snapshot.chats) throw new Error("Invalid format");
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(snapshot.users));
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(snapshot.chats));
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  },

  resetDatabase: () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    window.location.reload();
  }
};
