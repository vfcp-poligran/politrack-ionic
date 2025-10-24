import { APP_CONSTANTS } from '../constants/app.constants';

export class HistoryService {
  private readonly MAX_HISTORY = APP_CONSTANTS.HISTORY.MAX_HISTORY;
  private historyBuffer: any[] = [];

  pushState(state: any) {
    if (this.historyBuffer.length > this.MAX_HISTORY) {
      this.historyBuffer.shift();
    }
    this.historyBuffer.push(state);
  }
}

// import-export.service.ts
export class ImportExportService {
  private readonly BACKUP_VERSION = APP_CONSTANTS.BACKUP.VERSION;

  private async gatherDataForExport() {
    return {
      version: this.BACKUP_VERSION,
      exportDate: new Date().toISOString(),
      // ...
    };
  }
}
