import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules'
import { Module } from '@nestjs/common'
import { GOOGLE_OPTIONS } from '../google.constants'
import { GoogleModuleOptions } from '../google.interface'
import { GoogleService } from '../services/google.service'

@Module({})
export class GoogleCoreModule extends createConfigurableDynamicRootModule<GoogleCoreModule, GoogleModuleOptions>(GOOGLE_OPTIONS, {
  imports: [],
  providers: [GoogleService],
  exports: [GoogleService],
}) {
  static Deferred = GoogleCoreModule.externallyConfigured(GoogleCoreModule, 0)
}
