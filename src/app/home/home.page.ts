import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Curso } from '../core/models';
// Importa los módulos Ionic necesarios si usas Standalone Components
import {
    IonLabel, IonIcon, IonFab, IonFabButton, IonSpinner, IonRefresher,
  IonRefresherContent, IonSearchbar, IonItemSliding, IonItemOptions,
  IonItemOption, IonButton, IonButtons
} from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  // Si usas Standalone Components, agrega los imports aquí
  // imports: [IonTitle, IonToolbar, IonHeader, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonFab, IonFabButton, IonSpinner, IonRefresher, IonRefresherContent, IonSearchbar, IonItemSliding, IonItemOptions, IonItemOption, IonButton, IonButtons]
})
export class HomePage implements OnInit, OnDestroy {
  public cursos$!: Observable<Curso[]>;
  private cursosSub!: Subscription;

  constructor(/* inyecta servicios si es necesario */) {}

  ngOnInit() {
    // Asigna cursos$ desde el servicio correspondiente
    // this.cursos$ = this.cursoService.getCursos();
    this.cursosSub = this.cursos$.subscribe((cursos: Curso[]) => {
      // lógica de inicialización
    });
  }

  ngOnDestroy() {
    if (this.cursosSub) {
      this.cursosSub.unsubscribe();
    }
  }
}
