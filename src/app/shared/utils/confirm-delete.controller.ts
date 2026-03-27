/**
 * Инкапсулирует состояние и логику confirm-диалога для удаления.
 * Используется как обычное поле класса в page-компонентах.
 */
export class ConfirmDeleteController {
  visible = false;
  title = '';
  message = '';
  private pendingAction: (() => Promise<void>) | null = null;

  open(title: string, message: string, action: () => Promise<void>): void {
    this.title = title;
    this.message = message;
    this.pendingAction = action;
    this.visible = true;
  }

  async confirm(): Promise<void> {
    if (!this.pendingAction) return;
    await this.pendingAction();
    this.cancel();
  }

  cancel(): void {
    this.visible = false;
    this.pendingAction = null;
  }
}
