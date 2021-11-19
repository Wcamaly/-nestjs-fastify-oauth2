import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { HttpService } from '@nestjs/axios'

import { GoogleSub, GoogleToken } from '../dto/google.payload'
import { GOOGLE_OPTIONS, GOOGLE_REPOSITORY } from '../google.constants'
import { GoogleModuleOptions } from '../google.interface'
import { GoogleRepository } from '../repositories/google.repository'

@Injectable()
export class GoogleService<T> {
  constructor(
    @Inject(GOOGLE_OPTIONS) private readonly options: GoogleModuleOptions,
    @Inject(GOOGLE_REPOSITORY) private readonly gRepository: GoogleRepository<T>,
    private readonly httpService: HttpService,
  ) {}

  getLoginUrl(): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?scope=${this.options.scope.join(' ')}&client_id=${
      this.options.clientId
    }&response_type=${this.options.responseType}&redirect_uri=${this.options.callbackUrl}&access_type=online&prompt=${
      this.options.prompt
    }&state=${this.options.state}`
  }

  getUserProfile(code: string, state: string): Observable<any> {
    let googleUserData: GoogleSub
    if (state !== this.options.state) {
      throw new BadRequestException()
    }
    return this.getGoogleToken(code).pipe(
      switchMap((tokenData) => {
        return this.getGoogleUser(tokenData)
      }),
      switchMap((userData) => {
        googleUserData = userData
        return this.getByGoogleId(userData.id)
      }),
      switchMap((user) => {
        if (user) {
          return of(user)
        }
        return this.createNewGoogleUser(googleUserData)
      }),
    )
  }

  private getGoogleToken(code: string): Observable<GoogleToken> {
    return this.httpService
      .post<GoogleToken>(
        `https://oauth2.googleapis.com/token`,
        {
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.options.callbackUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      .pipe(map((tokenData) => tokenData.data))
  }

  private getGoogleUser(tokenData: GoogleToken): Observable<GoogleSub> {
    return this.httpService
      .get<GoogleSub>('https://www.googleapis.com/userinfo/v2/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })
      .pipe(map((userDataResp) => userDataResp.data))
  }

  getByGoogleId(id: string): Observable<T> {
    return this.gRepository.getByGoogleId(id)
  }

  createNewGoogleUser(profile: GoogleSub): Observable<T> {
    return this.gRepository.createNewGoogleUser(profile)
  }
}
