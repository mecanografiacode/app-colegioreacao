/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  Auth,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  getDocs, 
  getDocFromServer, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  Firestore,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';
import { 
  OrdemServico, 
  Equipamento, 
  ChamadoSuporte, 
  LogAuditoria, 
  Funcionario, 
  RegistroPonto, 
  Emprestimo, 
  User as AppUser 
} from '../types';

// ==========================================
// 1. OPERATION TYPES & INTERFACES FOR ERRORS
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// ==========================================
// 2. FIREBASE APP & SERVICES INITIALIZATION
// ==========================================

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Helper to get configuration from file or environment variables (highly useful for production/Vercel deployments)
const getFirebaseConfig = () => {
  const metaEnv = (import.meta as any).env || {};
  const envConfig = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || "",
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: metaEnv.VITE_FIREBASE_APP_ID || "",
    measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "",
    firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || "(default)"
  };

  const hasEnvConfig = envConfig.apiKey && envConfig.apiKey.trim() !== '';

  if (hasEnvConfig) {
    console.log("[Firebase] Using configuration from environment variables (Vercel/Production).");
    return envConfig;
  }

  // Fallback to the json config file
  return firebaseConfig;
};

const finalConfig = getFirebaseConfig();

// Determine if config is validly populated
const hasConfig = !!(
  finalConfig &&
  finalConfig.apiKey && finalConfig.apiKey.trim() !== '' &&
  finalConfig.projectId && finalConfig.projectId.trim() !== '' &&
  finalConfig.appId && finalConfig.appId.trim() !== ''
);

if (hasConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();
    
    // Initialize Firestore with multi-tab offline persistent local cache
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, finalConfig.firestoreDatabaseId);
    
    auth = getAuth(app);

    // Validate connection to Firestore on boot (as per critical constraints)
    const testConnection = async () => {
      if (!db) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase Connection verified successfully.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration: Client is offline.");
        } else {
          console.warn("Initial Firebase test connection warning (expected if Firestore rules are set to deny by default):", error);
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Failed to initialize Firebase Services with local cache:", error);
    // Reset to null if initialization failed to prevent downstream crashes
    app = null;
    db = null;
    auth = null;
  }
} else {
  console.log("Firebase is not fully configured yet. Running in offline/localStorage decoupled mode.");
}

// ==========================================
// 3. ERROR HANDLER (MANDATORY SKILL PATTERN)
// ==========================================

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
      tenantId: currentAuth?.currentUser?.tenantId || null,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Decoupled Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// 4. GENERIC DECOUPLED COLLECTION METHODS
// ==========================================

export interface IDatabaseOperations<T> {
  list(constraints?: QueryConstraint[]): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: T, customId?: string): Promise<string>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  subscribe(callback: (data: T[]) => void, errorCallback?: (error: any) => void, constraints?: QueryConstraint[]): () => void;
}

function createCollectionService<T extends { id: string }>(collectionName: string): IDatabaseOperations<T> {
  return {
    async list(constraints: QueryConstraint[] = []): Promise<T[]> {
      if (!db) throw new Error("Database not initialized");
      const path = collectionName;
      try {
        const collRef = collection(db, path);
        const q = query(collRef, ...constraints);
        const querySnapshot = await getDocs(q);
        const list: T[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as T);
        });
        return list;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    },

    async get(id: string): Promise<T | null> {
      if (!db) throw new Error("Database not initialized");
      const path = `${collectionName}/${id}`;
      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { ...docSnap.data(), id: docSnap.id } as T;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    },

    async create(data: T, customId?: string): Promise<string> {
      if (!db) throw new Error("Database not initialized");
      const path = collectionName;
      try {
        const { id, ...dataToSave } = data as any;
        const targetId = customId || id;

        if (targetId) {
          const docRef = doc(db, collectionName, targetId);
          await setDoc(docRef, { ...dataToSave, id: targetId });
          return targetId;
        } else {
          const docRef = await addDoc(collection(db, collectionName), dataToSave);
          return docRef.id;
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },

    async update(id: string, data: Partial<T>): Promise<void> {
      if (!db) throw new Error("Database not initialized");
      const path = `${collectionName}/${id}`;
      try {
        const docRef = doc(db, collectionName, id);
        const { id: _, ...dataToUpdate } = data as any;
        await updateDoc(docRef, dataToUpdate);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },

    async delete(id: string): Promise<void> {
      if (!db) throw new Error("Database not initialized");
      const path = `${collectionName}/${id}`;
      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },

    subscribe(
      callback: (data: T[]) => void, 
      errorCallback?: (error: any) => void,
      constraints: QueryConstraint[] = []
    ): () => void {
      if (!db) {
        console.warn(`Database not initialized. Subscription on ${collectionName} aborted.`);
        return () => {};
      }
      const path = collectionName;
      const collRef = collection(db, collectionName);
      const q = query(collRef, ...constraints);

      return onSnapshot(
        q, 
        (snapshot) => {
          const list: T[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.id } as T);
          });
          callback(list);
        }, 
        (error) => {
          if (errorCallback) {
            errorCallback(error);
          } else {
            handleFirestoreError(error, OperationType.GET, path);
          }
        }
      );
    }
  };
}

// ==========================================
// 5. THE MAIN DECOUPLED FIREBASE SERVICE
// ==========================================

export const FirebaseService = {
  /**
   * Check if Firebase configuration is loaded.
   */
  isConfigured(): boolean {
    return hasConfig && app !== null;
  },

  /**
   * Return initialized FireStore instance.
   */
  getFirestore(): Firestore | null {
    return db;
  },

  /**
   * Return initialized Auth instance.
   */
  getAuth(): Auth | null {
    return auth;
  },

  // Auth Operations
  auth: {
    async signInWithGoogle(): Promise<FirebaseUser> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
      } catch (error) {
        console.error("Google authentication failed:", error);
        throw error;
      }
    },

    async logout(): Promise<void> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Signout failed:", error);
        throw error;
      }
    },

    onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
      if (!auth) {
        console.warn("Auth not initialized. Cannot listen to auth state changes.");
        return () => {};
      }
      return onAuthStateChanged(auth, callback);
    }
  },

  // Typed Collections Decoupled API
  ordens: createCollectionService<OrdemServico>('ordens'),
  equipamentos: createCollectionService<Equipamento>('equipamentos'),
  suporte: createCollectionService<ChamadoSuporte>('suporte'),
  funcionarios: createCollectionService<Funcionario>('funcionarios'),
  auditoria: createCollectionService<LogAuditoria>('auditoria'),
  pontos: createCollectionService<RegistroPonto>('registro_ponto'),
  emprestimos: createCollectionService<Emprestimo>('emprestimos'),
  users: createCollectionService<AppUser>('users'),
  settings: createCollectionService<any>('settings')
};

export default FirebaseService;
