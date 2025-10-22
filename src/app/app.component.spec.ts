import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { DatabaseService } from './core/services/database.service';
import { StorageService } from './core/services/storage.service';

describe('AppComponent', () => {
  const mockDatabaseService = {
    init: jasmine.createSpy('init').and.returnValue(Promise.resolve(true))
  };

  const mockStorageService = {
    init: jasmine.createSpy('init').and.returnValue(Promise.resolve())
  };

  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: StorageService, useValue: mockStorageService }
      ]
    }).compileComponents();
    
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
