import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAnalytics } from './analytics';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { credential } from 'firebase-admin';

@Injectable()
export class UserTrackingService implements OnDestroy {

  initialized: Promise<void>;
  private disposables: Subscription[] = [];

  // TODO a user properties injector
  constructor(
    analytics: AngularFireAnalytics,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    auth: AngularFireAuth,
  ) {

    this.initialized = new Promise(resolve => {
      if (!isPlatformServer(platformId)) {
        this.disposables = [
            auth.authState.subscribe(user => {
                analytics.setUserId(user?.uid);
                resolve();
            }),
            auth.credential.subscribe(credential => {
                if (credential) {
                    const method = credential.user.isAnonymous ? 'anonymous' : credential.additionalUserInfo.providerId;
                    if (credential.additionalUserInfo.isNewUser) {
                        analytics.logEvent('sign_up', { method });
                    }
                    analytics.logEvent('login', { method });
                }
            })
        ];
      } else {
        resolve();
      }
    });

  }

  ngOnDestroy() {
    this.disposables.forEach(it => it.unsubscribe());
  }
}