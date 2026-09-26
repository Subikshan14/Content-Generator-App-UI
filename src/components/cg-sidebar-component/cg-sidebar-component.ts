import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [MatIconModule, CommonModule],
  standalone: true,
  selector: 'app-cg-sidebar-component',
  styleUrl: './cg-sidebar-component.scss',
  templateUrl: './cg-sidebar-component.html',
})
export class CgSidebarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  @Input() isExpanded: any;

  ngOnInit() {}

  onMenuClick(): void {
    this.menuToggle.emit();
  }
}
