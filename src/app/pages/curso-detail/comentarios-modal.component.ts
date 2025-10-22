import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonTextarea, IonInput, IonChip,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, saveOutline, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-comentarios-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonTextarea, IonInput, IonChip
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Comentarios - {{ criterioNombre }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Ajuste de puntaje -->
      <div class="puntaje-section" *ngIf="puntajeOriginal !== undefined">
        <h4>Ajuste de Puntaje</h4>
        <div class="puntaje-info">
          <div class="puntaje-item">
            <span class="label">Puntaje original:</span>
            <span class="value">{{ puntajeOriginal }}</span>
          </div>
          <div class="puntaje-item">
            <span class="label">Ajuste:</span>
            <ion-input
              type="number"
              [(ngModel)]="ajustePuntaje"
              placeholder="0"
              fill="outline"
              style="max-width: 100px;">
            </ion-input>
          </div>
          <div class="puntaje-item total">
            <span class="label">Puntaje final:</span>
            <span class="value final">{{ calcularPuntajeFinal() }}</span>
          </div>
        </div>
        <p class="ajuste-nota" *ngIf="ajustePuntaje !== 0">
          {{ ajustePuntaje > 0 ? '+' : '' }}{{ ajustePuntaje }} puntos 
          {{ ajustePuntaje > 0 ? 'agregados' : 'descontados' }}
        </p>
      </div>

      <!-- Comentarios comunes -->
      <div class="comentarios-comunes" *ngIf="comentariosComunes && comentariosComunes.length > 0">
        <h4>Comentarios Comunes</h4>
        <div class="chips-container">
          <ion-chip 
            *ngFor="let comentario of comentariosComunes"
            (click)="agregarComentarioComun(comentario)"
            color="primary"
            outline="true">
            {{ comentario }}
          </ion-chip>
        </div>
      </div>

      <!-- Área de texto para comentarios -->
      <h4>Comentarios Personalizados</h4>
      <ion-textarea
        [(ngModel)]="comentarios"
        placeholder="Ingrese comentarios para este criterio..."
        rows="6"
        fill="outline"
        [autoGrow]="true">
      </ion-textarea>

      <!-- Opción para guardar como comentario común -->
      <div class="guardar-comun">
        <ion-button 
          fill="clear" 
          size="small"
          (click)="marcarParaGuardar()"
          [color]="guardarComoComun ? 'primary' : 'medium'">
          <ion-icon name="add-circle-outline" slot="start"></ion-icon>
          {{ guardarComoComun ? 'Se guardará como común' : 'Guardar como comentario común' }}
        </ion-button>
      </div>

      <div class="modal-actions">
        <ion-button fill="clear" color="medium" (click)="cerrar()">
          Cancelar
        </ion-button>
        <ion-button color="primary" (click)="guardar()">
          <ion-icon name="save-outline" slot="start"></ion-icon>
          Guardar
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .puntaje-section {
      background: var(--ion-color-light);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .puntaje-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .puntaje-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .puntaje-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .puntaje-item .label {
      font-size: 13px;
      color: var(--ion-color-medium);
      min-width: 120px;
    }

    .puntaje-item .value {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .puntaje-item.total {
      border-top: 1px solid var(--ion-color-medium);
      padding-top: 12px;
      margin-top: 4px;
    }

    .puntaje-item.total .value.final {
      color: var(--ion-color-primary);
      font-size: 18px;
    }

    .ajuste-nota {
      margin: 12px 0 0 0;
      font-size: 12px;
      font-style: italic;
      color: var(--ion-color-medium);
    }

    .comentarios-comunes {
      margin-bottom: 24px;
    }

    .comentarios-comunes h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chips-container ion-chip {
      cursor: pointer;
      transition: transform 0.2s;
    }

    .chips-container ion-chip:hover {
      transform: scale(1.05);
    }

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .guardar-comun {
      margin-top: 8px;
      margin-bottom: 16px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-light);
    }

    ion-textarea {
      margin-bottom: 8px;
    }
  `]
})
export class ComentariosModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() criterioNombre: string = '';
  @Input() comentarios: string = '';
  @Input() puntajeOriginal?: number;
  @Input() ajustePuntaje: number = 0;
  @Input() comentariosComunes?: string[];

  guardarComoComun: boolean = false;

  constructor() {
    addIcons({ close, saveOutline, addCircleOutline });
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  guardar() {
    const resultado = {
      comentarios: this.comentarios,
      ajustePuntaje: this.ajustePuntaje,
      guardarComoComun: this.guardarComoComun
    };
    this.modalCtrl.dismiss(resultado, 'confirm');
  }

  calcularPuntajeFinal(): number {
    return Math.max(0, (this.puntajeOriginal || 0) + (this.ajustePuntaje || 0));
  }

  agregarComentarioComun(comentario: string): void {
    if (this.comentarios) {
      this.comentarios += '\n' + comentario;
    } else {
      this.comentarios = comentario;
    }
  }

  marcarParaGuardar(): void {
    this.guardarComoComun = !this.guardarComoComun;
  }
}

