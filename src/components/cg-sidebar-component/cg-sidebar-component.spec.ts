import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CgSidebarComponent } from './cg-sidebar-component';

describe('CgSidebarComponent', () => {
  let component: CgSidebarComponent;
  let fixture: ComponentFixture<CgSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CgSidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CgSidebarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
