import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { SplitPanelComponent } from './components/split-panel/split-panel.component';

const routes: Routes = [
  {
    path: ':id',
    component: SplitPanelComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatSidenavModule,
    NgxExtendedPdfViewerModule
  ]
})
export class PreviewChatModule { }
