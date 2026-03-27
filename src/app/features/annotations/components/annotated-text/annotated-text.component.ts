import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Annotation } from '../../models/annotation.model';

type TextSegment = {
  text: string;
  annotationText: string | null;
  color: string | null;
};

@Component({
  selector: 'app-annotated-text',
  standalone: true,
  imports: [],
  templateUrl: './annotated-text.component.html',
  styleUrl: './annotated-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotatedTextComponent {
  readonly content = input('');
  readonly annotations = input<Annotation[]>([]);

  readonly segments = computed<TextSegment[]>(() => {
    const content = this.content();
    if (!content) {
      return [];
    }

    const annotations = [...this.annotations()].sort((a, b) => a.position - b.position);
    const result: TextSegment[] = [];
    let cursor = 0;

    for (const annotation of annotations) {
      const selectedText = annotation.selectedText?.trim();
      if (!selectedText) {
        continue;
      }

      let start = annotation.position;
      const expected = content.slice(start, start + selectedText.length);
      if (expected !== selectedText) {
        const fallback = content.indexOf(selectedText, Math.max(cursor, annotation.position));
        if (fallback === -1) {
          continue;
        }
        start = fallback;
      }

      const end = start + selectedText.length;
      if (start < cursor || end > content.length) {
        continue;
      }

      if (start > cursor) {
        result.push({ text: content.slice(cursor, start), annotationText: null, color: null });
      }

      result.push({ text: content.slice(start, end), annotationText: annotation.text, color: annotation.color });
      cursor = end;
    }

    if (cursor < content.length) {
      result.push({ text: content.slice(cursor), annotationText: null, color: null });
    }

    return result;
  });
}
