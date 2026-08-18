import * as admin from 'firebase-admin';
export declare class FirebaseService {
    private readonly app;
    constructor(app: admin.app.App);
    firestore(): admin.firestore.Firestore;
    collection(name: string): admin.firestore.CollectionReference;
    newId(collection: string): string;
    clean<T extends Record<string, any>>(obj: T): T;
}
