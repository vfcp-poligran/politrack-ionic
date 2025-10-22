import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlertController, ActionSheetController } from '@ionic/angular/standalone';
import { HomePage } from './home.page';
import { CursoService } from '../core/services/curso.service';
import { ImportExportService } from '../core/services/import-export.service';
import { of } from 'rxjs';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockCursoService = {
    loadCursos: jasmine.createSpy('loadCursos').and.returnValue(Promise.resolve()),
    cursos$: of({}),
    setCursoActivo: jasmine.createSpy('setCursoActivo'),
    createCursoFromCSV: jasmine.createSpy('createCursoFromCSV').and.returnValue(Promise.resolve('test-id')),
    exportCursoToCSV: jasmine.createSpy('exportCursoToCSV').and.returnValue(Promise.resolve('csv-data')),
    deleteCurso: jasmine.createSpy('deleteCurso').and.returnValue(Promise.resolve())
  };

  const mockImportExportService = {
    readFileFromInput: jasmine.createSpy('readFileFromInput').and.returnValue(Promise.resolve('csv-data')),
    validateCSV: jasmine.createSpy('validateCSV').and.returnValue({ valid: true }),
    exportToCSV: jasmine.createSpy('exportToCSV').and.returnValue(Promise.resolve())
  };

  const mockAlertController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    }))
  };

  const mockActionSheetController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: CursoService, useValue: mockCursoService },
        { provide: ImportExportService, useValue: mockImportExportService },
        { provide: AlertController, useValue: mockAlertController },
        { provide: ActionSheetController, useValue: mockActionSheetController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
