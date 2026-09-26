import { Component, OnInit } from '@angular/core';
import { CgSidebarComponent } from '../cg-sidebar-component/cg-sidebar-component';

@Component({
  imports: [CgSidebarComponent],
  standalone: true,
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  isExpanded = false;

  ngOnInit() {
    this.isExpanded = false;
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }
}
