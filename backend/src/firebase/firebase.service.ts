import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly app: admin.app.App) {
    try {
      this.app.firestore().settings({ ignoreUndefinedProperties: true });
    } catch (_) {}
  }

  firestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  collection(name: string): admin.firestore.CollectionReference {
    return this.app.firestore().collection(name);
  }

  /** Generate a new document ID without writing */
  newId(collection: string): string {
    return this.app.firestore().collection(collection).doc().id;
  }

  /** Removes undefined properties from an object before writing to Firestore */
  clean<T extends Record<string, any>>(obj: T): T {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }
}
