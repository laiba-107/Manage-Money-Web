import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly app: admin.app.App) {}

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
}
