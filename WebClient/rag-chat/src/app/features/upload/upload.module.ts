import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxFileDropModule } from 'ngx-file-drop';

import { GenericUploaderComponent } from './components/generic-uploader/generic-uploader.component';

const routes: Routes = [
  {
    path: '',
    component: GenericUploaderComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    NgxFileDropModule
  ]
})
export class UploadModule { }
