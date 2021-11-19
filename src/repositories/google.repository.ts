import { GoogleSub } from '../dto/google.payload'
import { Observable } from 'rxjs'

export interface GoogleRepository<T> {
  getByGoogleId(id: string): Observable<T>
  createNewGoogleUser(profile: GoogleSub): Observable<T>
}
