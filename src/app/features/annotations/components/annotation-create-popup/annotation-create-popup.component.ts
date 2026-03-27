import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';

import { AnnotationSelection } from '../../models/annotation.model';
import { ANNOTATION_COLOR_PRESETS, DEFAULT_ANNOTATION_COLOR } from '../../constants/colors';

export interface AnnotationCreatePayload {
  selectedText: string;
  text: string;
  color: string;
  position: number;
}

@Component({
  selector: 'app-annotation-create-popup',
  standalone: true,
  imports: [],
  templateUrl: './annotation-create-popup.component.html',
  styleUrl: './annotation-create-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationCreatePopupComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** null means hidden; the component manages its own visibility */
  readonly selection = input<AnnotationSelection | null>(null);
  readonly x = input(0);
  readonly y = input(0);
  readonly colorPresets = input<string[]>(ANNOTATION_COLOR_PRESETS);

  readonly created = output<AnnotationCreatePayload>();
  readonly dismissed = output<void>();

  protected annotationText = '';
  protected annotationColor = DEFAULT_ANNOTATION_COLOR;

  protected onTextInput(event: Event): void {
    this.annotationText = (event.target as HTMLInputElement).value;
  }

  protected onColorInput(event: Event): void {
    this.annotationColor = (event.target as HTMLInputElement).value;
  }

  protected selectPreset(color: string): void {
    this.annotationColor = color;
  }

  protected create(sel: AnnotationSelection): void {
    const text = this.annotationText.trim();
    if (!text) return;

    this.created.emit({
      selectedText: sel.selectedText,
      text,
      color: this.annotationColor,
      position: sel.position,
    });

    this.annotationText = '';
    this.annotationColor = DEFAULT_ANNOTATION_COLOR;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.selection()) return;
    if (!(event.target instanceof Node) || !this.elementRef.nativeElement.contains(event.target)) {
      this.dismissed.emit();
    }
  }
}
