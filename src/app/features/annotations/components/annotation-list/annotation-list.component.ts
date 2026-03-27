import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Annotation } from '../../models/annotation.model';
import { ANNOTATION_COLOR_PRESETS, DEFAULT_ANNOTATION_COLOR } from '../../constants/colors';

interface UpdateAnnotationEvent {
  id: string;
  text: string;
  color: string;
}

@Component({
  selector: 'app-annotation-list',
  standalone: true,
  imports: [],
  templateUrl: './annotation-list.component.html',
  styleUrl: './annotation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationListComponent {
  readonly annotations = input.required<Annotation[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly updateAnnotation = output<UpdateAnnotationEvent>();
  readonly deleteAnnotation = output<string>();

  protected readonly colorPresets = ANNOTATION_COLOR_PRESETS;
  protected editingId: string | null = null;
  protected editText = '';
  protected editColor = DEFAULT_ANNOTATION_COLOR;

  protected startEditing(annotation: Annotation): void {
    this.editingId = annotation.id;
    this.editText = annotation.text;
    this.editColor = annotation.color;
  }

  protected cancelEditing(): void {
    this.editingId = null;
    this.editText = '';
    this.editColor = DEFAULT_ANNOTATION_COLOR;
  }

  protected onEditTextInput(event: Event): void {
    this.editText = (event.target as HTMLInputElement).value;
  }

  protected onEditColorInput(event: Event): void {
    this.editColor = (event.target as HTMLInputElement).value;
  }

  protected selectEditPresetColor(color: string): void {
    this.editColor = color;
  }

  protected saveEditing(id: string): void {
    const text = this.editText.trim();
    if (!text) {
      return;
    }

    this.updateAnnotation.emit({ id, text, color: this.editColor });
    this.cancelEditing();
  }

  protected resolveColor(id: string, defaultColor: string): string {
    if (this.editingId === id) {
      return this.editColor;
    }
    return defaultColor;
  }
}
