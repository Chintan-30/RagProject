import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'upload',
    loadChildren: () => import('./features/upload/upload.module').then(m => m.UploadModule)
  },
  {
    path: 'documents',
    loadChildren: () => import('./features/document-details/document-details.module').then(m => m.DocumentDetailsModule)
  },
  {
    path: 'preview',
    loadChildren: () => import('./features/preview-chat/preview-chat.module').then(m => m.PreviewChatModule)
  },
  {
    path: '',
    redirectTo: 'upload',
    pathMatch: 'full'
  }
];
