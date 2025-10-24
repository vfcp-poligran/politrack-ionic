import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HomePage } from './home.page';
import { CursoService } from '../core/services/curso.service';
import { Curso, Estudiante } from '../core/models';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let cursoService: jasmine.SpyObj<CursoService>;

  // Mock datos
  const mockEstudiante: Estudiante = {
    apellidos: 'Doe',
    nombres: 'John',
    correo: 'john@example.com',
    grupo: '1',
    subgrupo: '1A'
  };

  const mockCursos: Curso[] = [
    {
      id: '1',
      nombre: 'Math 101',
      estudiantes: [mockEstudiante],
      evaluaciones: {},
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const cursoServiceSpy = jasmine.createSpyObj(
      'CursoService',
      ['loadCursos'],
      {
        cursos$: of(mockCursos),
        loading$: of(false),
        error$: of(null)
      }
    );

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: CursoService, useValue: cursoServiceSpy }
      ]
    }).compileComponents();

    cursoService = TestBed.inject(CursoService) as jasmine.SpyObj<CursoService>;
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize observables from service', () => {
      expect(component.cursos$).toBe(cursoService.cursos$);
      expect(component.loading$).toBe(cursoService.loading$);
      expect(component.error$).toBe(cursoService.error$);
    });
  });

  describe('ngOnInit', () => {
    it('should call cursoService.loadCursos', () => {
      cursoService.loadCursos.and.returnValue(Promise.resolve());
      fixture.detectChanges();
      expect(cursoService.loadCursos).toHaveBeenCalled();
    });

    it('should handle loadCursos error', async () => {
      const error = new Error('Load failed');
      cursoService.loadCursos.and.returnValue(Promise.reject(error));

      spyOn(console, 'error');
      fixture.detectChanges();

      await fixture.whenStable();
      expect(console.error).toHaveBeenCalledWith(
        'Error cargando cursos:',
        error
      );
    });
  });

  describe('Observable Streams', () => {
    it('should emit cursos correctly', (done) => {
      fixture.detectChanges();
      component.cursos$.subscribe(cursos => {
        expect(cursos.length).toBe(1);
        expect(cursos[0].nombre).toBe('Math 101');
        done();
      });
    });

    it('should indicate loading state', (done) => {
      fixture.detectChanges();
      component.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should emit destroy on component destruction', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should unsubscribe from observables', (done) => {
      fixture.detectChanges();
      const subscription = component.cursos$.subscribe();

      spyOn(subscription, 'unsubscribe');
      component.ngOnDestroy();

      // Los observables con takeUntil deberían completarse
      setTimeout(() => {
        expect(subscription.closed).toBe(true);
        done();
      }, 100);
    });
  });
});
