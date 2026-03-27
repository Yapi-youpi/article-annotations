export interface Annotation {
  id: string;
  articleId: string;
  selectedText: string;
  text: string;
  color: string;
  position: number;
  createdAt: string;
}

export interface AnnotationSelection {
  selectedText: string;
  position: number;
  anchorX: number;
  anchorY: number;
}

export interface CreateAnnotationDto {
  selectedText: string;
  text: string;
  color: string;
  position: number;
}

export interface UpdateAnnotationDto {
  text: string;
  color: string;
}
