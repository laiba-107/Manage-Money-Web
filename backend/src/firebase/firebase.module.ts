import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_APP',
      useFactory: (configService: ConfigService) => {
        let app: admin.app.App;

        if (admin.apps.length > 0) {
          app = admin.app();
        } else {
          let privateKey =
            configService.get<string>('FIREBASE_PRIVATE_KEY', '') || '';

          // Strip surrounding double/single quotes if pasted with quotes
          if (
            (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
            (privateKey.startsWith("'") && privateKey.endsWith("'"))
          ) {
            privateKey = privateKey.slice(1, -1);
          }

          // Convert literal \n escape sequences to real newlines
          privateKey = privateKey.replace(/\\n/g, '\n');

          const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
          const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');

          try {
            app = admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
              }),
            });
          } catch (err: any) {
            console.error(
              'Firebase Admin Initialization Error:',
              err?.message || err,
            );
            throw err;
          }
        }

        // Enable ignoreUndefinedProperties so undefined fields are safely ignored by Firestore
        try {
          app.firestore().settings({ ignoreUndefinedProperties: true });
        } catch (_) {}

        return app;
      },
      inject: [ConfigService],
    },
    FirebaseService,
  ],
  exports: [FirebaseService],
})
export class FirebaseModule {}
