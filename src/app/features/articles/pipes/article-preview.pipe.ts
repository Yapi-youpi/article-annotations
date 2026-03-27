import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'articlePreview', standalone: true, pure: true })
export class ArticlePreviewPipe implements PipeTransform {
  transform(content: string, maxLength = 180): string {
    const normalized = content.replace(/\s+/g, ' ').trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}\u2026` : normalized;
  }
}
