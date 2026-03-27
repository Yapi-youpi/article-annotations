import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ArticlePayload } from '../../models/article.model';
import { AnnotationSelection } from '../../../annotations/models/annotation.model';

type ArticleFormGroup = FormGroup<{
  title: FormControl<string>;
  content: FormControl<string>;
}>;

const ARTICLE_TITLE_MAX_LENGTH = 120;
const ARTICLE_CONTENT_MAX_LENGTH = 10_000;

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleFormComponent {
  protected readonly titleMaxLength = ARTICLE_TITLE_MAX_LENGTH;
  protected readonly contentMaxLength = ARTICLE_CONTENT_MAX_LENGTH;
  private lastPointerPosition: { x: number; y: number } | null = null;

  readonly initialValue = input<ArticlePayload | null>(null);
  readonly submitLabel = input('Сохранить');
  readonly submitting = input(false);

  readonly submitted = output<ArticlePayload>();
  readonly annotationSelected = output<AnnotationSelection | null>();
  readonly contentChanged = output<string>();
  readonly cancel = output<void>();

  readonly form: ArticleFormGroup = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(ARTICLE_TITLE_MAX_LENGTH)],
    }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(ARTICLE_CONTENT_MAX_LENGTH)],
    }),
  });

  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.form.controls.content.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.contentChanged.emit(value);
    });

    effect(() => {
      const val = this.initialValue();
      this.form.reset(
        { title: val?.title ?? '', content: val?.content ?? '' },
        { emitEvent: false },
      );
      this.contentChanged.emit(this.form.controls.content.value);
      this.cdr.markForCheck();
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }

  emitSelectedAnnotation(contentField: HTMLTextAreaElement, event: MouseEvent): void {
    this.lastPointerPosition = { x: event.clientX, y: event.clientY };
    this.emitSelectionFromField(contentField);
  }

  emitSelectionFromField(contentField: HTMLTextAreaElement): void {
    const selectionStart = contentField.selectionStart ?? 0;
    const selectionEnd = contentField.selectionEnd ?? 0;
    if (selectionStart === selectionEnd) {
      this.annotationSelected.emit(null);
      return;
    }

    const rawSelected = contentField.value.slice(selectionStart, selectionEnd);
    const selectedText = rawSelected.trim();
    if (!selectedText) {
      this.annotationSelected.emit(null);
      return;
    }

    const leadingWhitespace = rawSelected.length - rawSelected.trimStart().length;

    this.annotationSelected.emit({
      selectedText,
      position: selectionStart + leadingWhitespace,
      anchorX: this.lastPointerPosition?.x ?? contentField.getBoundingClientRect().left + 24,
      anchorY: this.lastPointerPosition?.y ?? contentField.getBoundingClientRect().top + 24,
    });
  }
}
