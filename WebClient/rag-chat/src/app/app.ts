import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected title = 'RAG Chat';
  protected isSidenavOpen = true;
  protected currentRoute = '';
  protected isMobile = false;
  private destroy$ = new Subject<void>();

  protected navItems: NavItem[] = [
    { path: '/upload', label: 'Upload Documents', icon: 'upload_file' },
    { path: '/documents', label: 'Document Library', icon: 'library_books' },
    { path: '/preview', label: 'Preview & Chat', icon: 'chat' },
  ];

  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    // Handle route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
    });

    // Handle responsive behavior
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        if (this.isMobile) {
          this.isSidenavOpen = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  // Close sidenav on mobile when a navigation item is clicked
  onNavItemClick() {
    if (this.isMobile) {
      this.isSidenavOpen = false;
    }
  }
}
