export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        expand(): void;
        close(): void;
        sendData(data: string): void;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
        isExpanded: boolean;
        isClosingConfirmationEnabled: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        expand(): void;
        close(): void;
        enableClosingConfirmation(): void;
        disableClosingConfirmation(): void;
        sendData(data: string): void;
        onEvent(eventType: string, eventHandler: Function): void;
        offEvent(eventType: string, eventHandler: Function): void;
        HapticFeedback: any;
      };
    };
  }
}
