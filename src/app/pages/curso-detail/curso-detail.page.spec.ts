import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { CursoDetailPage } from './curso-detail.page';
import { CursoService } from '../../core/services/curso.service';
import { of } from 'rxjs';

describe('CursoDetailPage', () => {
  let component: CursoDetailPage;
  let fixture: ComponentFixture<CursoDetailPage>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => 'test-id'
      }
    }
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockCursoService = {
    getCurso: jasmine.createSpy('getCurso').and.returnValue(Promise.resolve(null)),
    cursos$: of({})
  };

  const mockAlertController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    }))
  };

  const mockModalController = {
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CursoDetailPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: CursoService, useValue: mockCursoService },
        { provide: AlertController, useValue: mockAlertController },
        { provide: ModalController, useValue: mockModalController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CursoDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
