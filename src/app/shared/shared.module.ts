import { NgModule } from '@angular/core';
import { LoggerService } from './services/logger.service';
import { NotificationService } from './services/notification.service';
import { ErrorHandler } from './model/error-handler';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  declarations: [
  ],
  entryComponents: [
  ],
  providers: [
    ErrorHandler,
    NotificationService,
    LoggerService,
  ],
  exports: [
    CommonModule,
    FormsModule
  ]
})
export class SharedModule {
}

