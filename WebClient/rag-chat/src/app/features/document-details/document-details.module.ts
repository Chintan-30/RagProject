import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDetailsRoutingModule } from './document-details-routing.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DocumentDetailsRoutingModule
    // No need to import the component here since we're lazy loading it
  ]
})
export class DocumentDetailsModule { }
