import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonTextarea, IonInput, IonItem, IonLabel, IonChip, IonCheckbox,
  IonFooter, IonButtons // <--- AÑADIDO IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, save, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-comentarios-modal',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title>Comentarios y Ajuste - {{ criterioNombre }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancelar()">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item class="comentario-textarea">
        <ion-label position="floating">Comentarios</ion-label>
        <ion-textarea [(ngModel)]="comentarios" rows="6" placeholder="Escriba sus observaciones..."></ion-textarea>
      </ion-item>

      <!-- Sección de Comentarios Comunes -->
      <div class="comentarios-comunes">
        <ion-label class="comentarios-label">Sugerencias (clic para añadir)</ion-label>
        <div class="chips-container">
          <ion-chip *ngFor="let comentario of comentariosComunes" (click)="agregarComentarioComun(comentario)" outline="true" color="primary">
            <ion-icon name="add-circle-outline"></ion-icon>
            <ion-label>{{ comentario }}</ion-label>
          </ion-chip>
        </div>
        <ion-item lines="none" class="guardar-comun-item">
          <!-- Deshabilitar si no hay texto -->
          <ion-checkbox [(ngModel)]="guardarComoComun" slot="start" labelPlacement="end" [disabled]="!comentarios || comentarios.trim().length === 0">
             Guardar comentario actual como sugerencia
          </ion-checkbox>
        </ion-item>
      </div>

      <!-- Sección de Ajuste de Puntaje -->
      <div class="ajuste-puntaje">
        <ion-label class="ajuste-label">Ajuste de Puntaje Manual</ion-label>
        <p class="puntaje-info">Puntaje base (del nivel): <strong>{{ puntajeOriginal }}</strong></p>
        <ion-item class="ajuste-input">
          <ion-label position="floating">Ajuste (+/-)</ion-label>
          <ion-input type="number" [(ngModel)]="ajustePuntaje" placeholder="Ej: -2 o 5"></ion-input>
        </ion-item>
        <p class="puntaje-final">Puntaje Final: <strong>{{ calcularPuntajeFinal() }}</strong></p>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button (click)="confirmar()" color="primary" fill="solid" [strong]="true">
            <ion-icon slot="start" name="save"></ion-icon>
            Guardar Cambios
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    ion-header ion-toolbar {
      --border-width: 0;
    }
    ion-content {
      // Usar un fondo ligeramente gris para el contenido del modal
      --background: var(--ion-color-light-tint);
    }
    .comentario-textarea {
      --background: var(--ion-background-color); // Fondo blanco para el textarea
      --border-radius: 8px;
      margin-bottom: 16px;
    }
    .comentarios-comunes {
      margin-top: 16px;
      padding: 12px;
      background: var(--ion-background-color); // Fondo blanco
      border-radius: 8px;
      border: 1px solid var(--ion-color-step-150);
    }
    .comentarios-label {
      font-weight: 600;
      color: var(--ion-color-medium-shade);
      font-size: 0.9em;
      margin-left: 4px; // Alineado con el item
    }
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 0;
    }
    ion-chip {
      cursor: pointer;
      font-size: 0.9em;
      --padding-start: 8px;
      --padding-end: 8px;
    }
    .guardar-comun-item {
      --padding-start: 0;
      font-size: 0.9em;
      --min-height: 30px;
    }
    .ajuste-puntaje {
      margin-top: 16px;
      padding: 12px;
      border: 1px solid var(--ion-color-step-150);
      background: var(--ion-background-color); // Fondo blanco
      border-radius: 8px;
    }
    .ajuste-label {
      font-weight: 600;
      color: var(--ion-color-primary);
      font-size: 1.1em;
      display: block;
      margin-bottom: 8px;
    }
    .puntaje-info {
      font-size: 0.95em;
      color: var(--ion-color-medium-shade);
      margin: 4px 0 8px;
    }
    .ajuste-input {
      --background: var(--ion-color-light-tint);
      --border-radius: 6px;
    }
    .puntaje-final {
      font-size: 1.2em;
      font-weight: 700;
      text-align: right;
      margin-top: 12px;
      color: var(--ion-color-primary);
    }
    ion-footer ion-toolbar {
      padding: 8px;
      --background: var(--ion-background-color); // Fondo blanco para el footer
      border-top: 1px solid var(--ion-color-step-150);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonTextarea, IonInput, IonItem, IonLabel, IonChip, IonCheckbox,
    IonFooter,
    IonButtons // <--- ESTA ERA LA IMPORTACIÓN FALTANTE
  ]
})
export class ComentariosModalComponent implements OnInit {
  @Input() criterioNombre: string = '';
  @Input() comentarios: string = '';
  @Input() puntajeOriginal: number = 0;
  @Input() ajustePuntaje: number = 0;
  @Input() comentariosComunes: string[] = [];

  guardarComoComun: boolean = false;

  private modalController = inject(ModalController);

  constructor() {
    addIcons({ close, save, addCircleOutline });
  }

  ngOnInit() {
    // Asegurarse de que los tipos son correctos al recibir
    this.puntajeOriginal = Number(this.puntajeOriginal) || 0;
    this.ajustePuntaje = Number(this.ajustePuntaje) || 0;
  }

  cancelar() {
    this.modalController.dismiss(null, 'cancel');
  }

  confirmar() {
    // Asegurarse de que el ajuste sea un número antes de enviarlo
    const ajusteNum = Number(this.ajustePuntaje) || 0;

    const data = {
      comentarios: this.comentarios,
      ajustePuntaje: ajusteNum,
      guardarComoComun: this.guardarComoComun
    };
    this.modalController.dismiss(data, 'confirm');
  }

  agregarComentarioComun(comentario: string) {
    // Añadir comentarios sugeridos con un salto de línea y un guion
    if (this.comentarios && this.comentarios.trim()) {
      this.comentarios = this.comentarios.trim() + '\n- ' + comentario;
    } else {
      this.comentarios = '- ' + comentario;
    }
  }

  calcularPuntajeFinal(): number {
    const base = Number(this.puntajeOriginal) || 0;
    const ajuste = Number(this.ajustePuntaje) || 0;
    return Math.max(0, base + ajuste); // No permitir puntajes negativos
  }
}
